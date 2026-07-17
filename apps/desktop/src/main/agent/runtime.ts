// ToolRuntime implementation that drives the active WebContentsView via
// the Chrome DevTools Protocol (CDP). All of agent-core's tools are
// implemented here in terms of CDP commands and renderer evaluations.

import type { TabSummary, ToolRuntime } from '@bullebrowser/agent-core';
import type { WebContents } from 'electron';
import { tabManager } from '../tabs/manager.js';

export interface ConfirmDelegate {
  request(message: string): Promise<boolean>;
}

export class DesktopToolRuntime implements ToolRuntime {
  constructor(private confirmDelegate: ConfirmDelegate) {}

  private wcFor(tabId: string): WebContents {
    const view = tabManager.getView(tabId);
    if (!view) throw new Error(`Tab not found: ${tabId}`);
    return view.webContents;
  }

  async navigate(tabId: string, url: string) {
    const wc = this.wcFor(tabId);
    // Second line of defence behind the navigate schema's allowlist: the agent
    // drives a real browser holding the user's live sessions, so a file: or
    // data: URL reaching this point (from a future caller, or a tool that skips
    // validation) must still not open.
    let scheme: string;
    try {
      scheme = new URL(url).protocol;
    } catch {
      throw new Error(`Not a valid URL: ${url}`);
    }
    if (scheme !== 'http:' && scheme !== 'https:') {
      throw new Error(
        `Refusing to open a ${scheme} URL. The agent may only open http:// and https:// pages.`,
      );
    }
    // loadURL rejects with ERR_ABORTED (-3) on perfectly ordinary events: a
    // redirect, a client-side navigation, or a URL that turns into a download.
    // The rest of the codebase already ignores -3 (see tabs/manager.ts); this
    // path used to propagate it, so the tool reported failure while the page
    // sat loaded in the tab. Report what actually ended up on screen instead.
    await wc.loadURL(url).catch(() => {});
    return { url: wc.getURL(), title: wc.getTitle() };
  }

  async readPage(tabId: string) {
    const wc = this.wcFor(tabId);
    const result = (await wc.executeJavaScript(EXTRACT_READABLE_TEXT)) as
      | { text: string }
      | { error: string };
    if ('error' in result) {
      throw new Error(
        `${result.error} The read_page tool only supports HTML pages. ` +
          `For PDFs or other documents, ask the user to convert to HTML or paste the text directly.`,
      );
    }
    return { title: wc.getTitle(), url: wc.getURL(), text: result.text };
  }

  async click(tabId: string, target: string) {
    const wc = this.wcFor(tabId);
    const matched = (await wc.executeJavaScript(
      `(${CLICK_FN.toString()})(${JSON.stringify(target)})`,
    )) as string;
    return { matched };
  }

  async type(tabId: string, target: string, text: string) {
    const wc = this.wcFor(tabId);
    const matched = (await wc.executeJavaScript(
      `(${TYPE_FN.toString()})(${JSON.stringify(target)}, ${JSON.stringify(text)})`,
    )) as string;
    return { matched };
  }

  async extract(tabId: string, schema: Record<string, unknown>) {
    // Render-side best-effort extractor: returns the requested schema echo
    // plus a structured dump of the visible page (headings, links, tables,
    // and readable body text) so the agent can re-shape it without a
    // second navigation round-trip.
    const wc = this.wcFor(tabId);
    const structured = (await wc.executeJavaScript(EXTRACT_STRUCTURED)) as unknown;
    const readable = (await wc.executeJavaScript(EXTRACT_READABLE_TEXT)) as
      | { text: string }
      | { error: string };
    const text = 'text' in readable ? readable.text : '';
    return { data: { _schema: schema, _document: structured, _text: text } };
  }

  // These three are optional on ToolRuntime, but the tools are offered to the
  // model regardless, and their fallbacks fail *quietly* — getSelection returned
  // '' (model: "nothing is selected") and listLinks regexed URLs out of body
  // text, where hrefs never appear (model: "this page has no links"). Implement
  // them for real; the page already exposes everything they need.
  async getSelection(tabId: string): Promise<{ text: string }> {
    const wc = this.wcFor(tabId);
    const text = (await wc.executeJavaScript(
      `String(window.getSelection ? window.getSelection().toString() : '')`,
    )) as string;
    return { text };
  }

  async listLinks(tabId: string): Promise<{ text: string; href: string }[]> {
    const wc = this.wcFor(tabId);
    return (await wc.executeJavaScript(LIST_LINKS)) as { text: string; href: string }[];
  }

  async queryDom(tabId: string, selector: string): Promise<{ matches: number }> {
    const wc = this.wcFor(tabId);
    const matches = (await wc.executeJavaScript(
      `(${QUERY_DOM_FN.toString()})(${JSON.stringify(selector)})`,
    )) as number;
    return { matches };
  }

  async screenshot(tabId: string) {
    const wc = this.wcFor(tabId);
    const image = await wc.capturePage();
    return { pngBase64: image.toPNG().toString('base64') };
  }

  async newTab(url?: string): Promise<TabSummary> {
    const tab = await tabManager.create(url);
    return { id: tab.id, title: tab.title, url: tab.url, active: tab.active };
  }

  async switchTab(tabId: string): Promise<TabSummary> {
    tabManager.activate(tabId);
    const list = tabManager.list();
    const tab = list.find((t) => t.id === tabId);
    if (!tab) throw new Error(`Tab not found: ${tabId}`);
    return { id: tab.id, title: tab.title, url: tab.url, active: tab.active };
  }

  async listTabs(): Promise<TabSummary[]> {
    return tabManager.list().map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
      active: t.active,
    }));
  }

  async closeTab(tabId: string): Promise<{ closed: boolean }> {
    if (!tabManager.getView(tabId)) return { closed: false };
    await tabManager.close(tabId);
    return { closed: true };
  }

  // goBack/goForward/reload are fire-and-forget in Electron: the history call
  // returns immediately and the navigation lands later. Reading getURL() right
  // after therefore returned the URL we just left, so the model saw an
  // unchanged URL, decided the step hadn't worked, and went back a second time.
  // Wait for the navigation to actually commit.
  private async afterNavigation(wc: WebContents, act: () => Promise<void>): Promise<{ url: string }> {
    const settled = new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        wc.off('did-navigate', done);
        wc.off('did-navigate-in-page', done);
        wc.off('did-fail-load', done);
        resolve();
      };
      // Cap the wait: a history entry that resolves from cache with no network
      // round-trip can complete before we attach, and nothing should hang.
      const timer = setTimeout(done, 5_000);
      wc.once('did-navigate', done);
      wc.once('did-navigate-in-page', done);
      wc.once('did-fail-load', done);
    });
    await act();
    await settled;
    return { url: wc.getURL() };
  }

  async goBack(tabId: string): Promise<{ url: string }> {
    const wc = this.wcFor(tabId);
    return this.afterNavigation(wc, () => tabManager.back(tabId));
  }

  async goForward(tabId: string): Promise<{ url: string }> {
    const wc = this.wcFor(tabId);
    return this.afterNavigation(wc, () => tabManager.forward(tabId));
  }

  async reload(tabId: string): Promise<{ url: string }> {
    const wc = this.wcFor(tabId);
    return this.afterNavigation(wc, () => tabManager.reload(tabId));
  }

  async scroll(
    tabId: string,
    options: { direction: 'up' | 'down' | 'top' | 'bottom'; amount?: number },
  ): Promise<{ scrolledTo: number }> {
    const wc = this.wcFor(tabId);
    const amount = options.amount ?? 600;
    const y = (await wc.executeJavaScript(
      `(${SCROLL_FN.toString()})(${JSON.stringify(options.direction)}, ${amount})`,
    )) as number;
    return { scrolledTo: y };
  }

  async pressKey(
    tabId: string,
    key:
      | 'Enter'
      | 'Tab'
      | 'Escape'
      | 'ArrowDown'
      | 'ArrowUp'
      | 'PageDown'
      | 'PageUp',
  ): Promise<{ pressed: string }> {
    const wc = this.wcFor(tabId);
    // sendInputEvent with both keyDown and keyUp; "char" event covers Enter
    // submitting forms in inputs that listen for keypress.
    wc.focus();
    wc.sendInputEvent({ type: 'keyDown', keyCode: key });
    if (key === 'Enter') wc.sendInputEvent({ type: 'char', keyCode: '\r' });
    wc.sendInputEvent({ type: 'keyUp', keyCode: key });
    return { pressed: key };
  }

  async waitFor(
    tabId: string,
    condition: { selector?: string; networkIdle?: boolean; timeoutMs?: number },
  ) {
    const wc = this.wcFor(tabId);
    const timeout = Math.min(condition.timeoutMs ?? 10_000, 10_000);
    if (condition.selector) {
      const matched = (await wc.executeJavaScript(
        `(${WAIT_FOR_SELECTOR.toString()})(${JSON.stringify(condition.selector)}, ${timeout})`,
      )) as boolean;
      return { matched };
    }
    if (condition.networkIdle) {
      const reachedIdle = await new Promise<boolean>((resolve) => {
        let settled = false;
        let inFlight = 0;
        let idleTimer: NodeJS.Timeout | null = null;
        const wr = wc.session.webRequest;
        // webRequest is session-wide, so without this every other tab's traffic
        // counts too. One background tab long-polling (mail, chat, any SPA
        // heartbeat) meant inFlight never hit zero and this always timed out.
        const ours = (d: { webContentsId?: number }) => d.webContentsId === wc.id;

        const finish = (idle: boolean) => {
          if (settled) return;
          settled = true;
          if (idleTimer) clearTimeout(idleTimer);
          clearTimeout(timeoutTimer);
          // Pass null to detach the handlers; otherwise they leak on the
          // session and intercept every subsequent request forever.
          wr.onBeforeRequest(null);
          wr.onCompleted(null);
          wr.onErrorOccurred(null);
          resolve(idle);
        };
        const armIdle = () => {
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => finish(true), 500);
        };
        const onStart = () => {
          inFlight += 1;
          if (idleTimer) clearTimeout(idleTimer);
        };
        const onEnd = () => {
          inFlight = Math.max(0, inFlight - 1);
          if (inFlight === 0) armIdle();
        };

        // Hard cap so we always clean up even if the page never goes idle.
        // Timing out is NOT idle — saying otherwise sent the model off to read
        // a half-rendered page believing it had settled.
        const timeoutTimer = setTimeout(() => finish(false), timeout);
        wr.onBeforeRequest({ urls: ['<all_urls>'] }, (d, cb) => {
          if (ours(d)) onStart();
          cb({});
        });
        wr.onCompleted({ urls: ['<all_urls>'] }, (d) => {
          if (ours(d)) onEnd();
        });
        wr.onErrorOccurred({ urls: ['<all_urls>'] }, (d) => {
          if (ours(d)) onEnd();
        });
        // Give the page a beat to actually start requesting before declaring
        // idle. Arming immediately meant a navigate whose subresources hadn't
        // begun within 500ms reported idle straight away.
        setTimeout(() => {
          if (inFlight === 0) armIdle();
        }, 750);
      });
      return { matched: reachedIdle };
    }
    return { matched: false };
  }

  async confirmDestructive(message: string): Promise<boolean> {
    return this.confirmDelegate.request(message);
  }
}

// --- in-page helpers (stringified and injected) ---

const EXTRACT_READABLE_TEXT = `
  (function () {
    const ct = (document.contentType || '').toLowerCase();
    if (ct && !ct.includes('html') && !ct.includes('xml') && !ct.includes('text/plain')) {
      return { error: 'Page content type is ' + ct + ' (not HTML).' };
    }
    if (!document.body) {
      return { error: 'Document has no body to read.' };
    }
    // Read innerText off the LIVE document, not a clone. innerText is defined in
    // terms of rendered output, so on a detached clone (which is never rendered)
    // it silently degrades to textContent: every word boundary collapses
    // ("Sign inRegisterPricing") and display:none content — mega-menus, cookie
    // banners, unrendered SPA routes — gets pulled in. Reading the live node
    // fixes both, and makes the old script/style/noscript stripping redundant:
    // those aren't rendered, so innerText already skips them. Nothing is
    // mutated, so the user's page is untouched.
    const main = document.querySelector('main, article, [role="main"]') || document.body;
    const text = (main.innerText || main.textContent || '').replace(/\\n{3,}/g, '\\n\\n').trim();
    if (!text) {
      return { error: 'Page is empty or rendered entirely client-side.' };
    }
    return { text: text.slice(0, 50_000) };
  })();
`;

const EXTRACT_STRUCTURED = `
  (function () {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3'))
      .slice(0, 50)
      .map((h) => ({ level: h.tagName, text: (h.innerText || '').trim() }));
    const links = Array.from(document.querySelectorAll('a[href]'))
      .slice(0, 200)
      .map((a) => ({ text: (a.innerText || '').trim().slice(0, 120), href: a.href }));
    const tables = Array.from(document.querySelectorAll('table'))
      .slice(0, 10)
      .map((t) => Array.from(t.rows).slice(0, 50).map((r) => Array.from(r.cells).map((c) => (c.innerText || '').trim())));
    return { url: location.href, title: document.title, headings, links, tables };
  })();
`;

const LIST_LINKS = `
  (function () {
    const out = [];
    const seen = new Set();
    for (const a of Array.from(document.querySelectorAll('a[href]'))) {
      // Skip links the user cannot see and non-navigational hrefs, so the
      // model isn't handed a mega-menu it can't act on.
      const href = a.href;
      if (!href || !/^https?:/i.test(href)) continue;
      if (seen.has(href)) continue;
      const rect = a.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      seen.add(href);
      out.push({ text: (a.innerText || a.textContent || '').trim().slice(0, 120), href });
      if (out.length >= 200) break;
    }
    return out;
  })();
`;

function QUERY_DOM_FN(selector: string): number {
  try {
    return document.querySelectorAll(selector).length;
  } catch {
    throw new Error(`Invalid CSS selector: ${selector}`);
  }
}

function CLICK_FN(target: string): string {
  let el: Element | null = null;
  try {
    el = document.querySelector(target);
  } catch {
    /* not a selector */
  }
  if (!el) {
    const tl = target.toLowerCase();
    const candidates = Array.from(
      document.querySelectorAll('a, button, [role="button"], input[type="submit"]'),
    );
    el =
      candidates.find((n) => (n as HTMLElement).innerText?.trim().toLowerCase() === tl) ??
      candidates.find((n) => (n as HTMLElement).innerText?.toLowerCase().includes(tl)) ??
      null;
  }
  if (!el) throw new Error(`No element matched: ${target}`);
  (el as HTMLElement).scrollIntoView({ block: 'center' });
  (el as HTMLElement).click();
  return (el as HTMLElement).outerHTML.slice(0, 200);
}

function TYPE_FN(target: string, text: string): string {
  let el: Element | null = null;
  try {
    el = document.querySelector(target);
  } catch {
    /* not a selector */
  }
  if (!el) {
    const tl = target.toLowerCase();
    const labels = Array.from(document.querySelectorAll('label'));
    const labelMatch = labels.find((l) =>
      (l.innerText || '').toLowerCase().includes(tl),
    );
    if (labelMatch) {
      const forId = labelMatch.getAttribute('for');
      el = forId ? document.getElementById(forId) : labelMatch.querySelector('input, textarea');
    }
    if (!el) {
      const inputs = Array.from(
        document.querySelectorAll('input, textarea, [contenteditable=""], [contenteditable="true"]'),
      );
      el =
        inputs.find((i) => {
          const ph = (i as HTMLInputElement).placeholder?.toLowerCase() ?? '';
          const aria = i.getAttribute('aria-label')?.toLowerCase() ?? '';
          const labelledBy = i.getAttribute('aria-labelledby');
          let labelledText = '';
          if (labelledBy) {
            labelledText = labelledBy
              .split(/\s+/)
              .map((id) => document.getElementById(id)?.innerText?.toLowerCase() ?? '')
              .join(' ');
          }
          const name = (i as HTMLInputElement).name?.toLowerCase() ?? '';
          return (
            ph.includes(tl) ||
            aria.includes(tl) ||
            labelledText.includes(tl) ||
            name.includes(tl)
          );
        }) ?? null;
    }
  }
  if (!el) throw new Error(`No input matched: ${target}`);
  const html = el as HTMLElement;
  html.focus();
  const isCE = html.isContentEditable;
  if (isCE) {
    html.textContent = text;
    html.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
  } else {
    const input = el as HTMLInputElement | HTMLTextAreaElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value',
    )?.set;
    if (nativeSetter) nativeSetter.call(input, text);
    else input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  return html.outerHTML.slice(0, 200);
}

function SCROLL_FN(
  direction: 'up' | 'down' | 'top' | 'bottom',
  amount: number,
): number {
  const doc = document.scrollingElement || document.documentElement;
  switch (direction) {
    case 'down':
      window.scrollBy({ top: amount });
      break;
    case 'up':
      window.scrollBy({ top: -amount });
      break;
    case 'top':
      window.scrollTo({ top: 0 });
      break;
    case 'bottom':
      window.scrollTo({ top: doc.scrollHeight });
      break;
  }
  return doc.scrollTop;
}

function WAIT_FOR_SELECTOR(selector: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      try {
        if (document.querySelector(selector)) return resolve(true);
      } catch {
        return resolve(false);
      }
      if (Date.now() - start > timeoutMs) return resolve(false);
      setTimeout(tick, 100);
    };
    tick();
  });
}
