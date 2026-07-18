// Reference backend for the BulleBrowser embed widget (apps/web/public/widget.js).
//
// WHY THIS EXISTS: an API key must never live in page JavaScript, so the model
// loop runs here, on a server you host. The widget executes the agent's tool
// calls against the CRM page (in the user's own logged-in session) and streams
// results back. This file is a runnable reference — adapt auth, storage, and
// hosting to your infrastructure. It has no framework dependencies beyond
// @bullebrowser/agent-core and Node's built-in http.
//
//   ANTHROPIC_API_KEY=sk-ant-… node services/widget-backend/server.mjs
//
// Endpoints (the contract the widget speaks):
//   POST /start        { sessionId, prompt, url, title }  -> begins a run
//   GET  /stream?sessionId=…   Server-Sent Events: activity | tool_call | text | done | error
//   POST /tool-result  { sessionId, id, result | error }  -> resumes the run
//
// The agent's tools run in the browser, so this server's ToolRuntime is a
// PROXY: each tool call is pushed to the widget over the SSE stream, and the
// method awaits the matching /tool-result before returning.

import http from 'node:http';
import { runAgent } from '@bullebrowser/agent-core';

const PORT = process.env.PORT || 8787;
const MODEL = 'claude-opus-4-7';

// Teach the agent your CRM. Replace this with the guide produced by exploring
// Bulle Cloud (sections, key pages, how to find/create/update records, exact
// button and menu labels). The better this is, the less the agent has to
// rediscover each time.
const CRM_SYSTEM = [
  'You are the BulleBrowser assistant embedded in a CRM. You operate the page',
  'the user is on, in their own logged-in session, by calling browser tools',
  '(navigate within the app by clicking, read_page, click, type, scroll,',
  'wait_for, extract). Never leave the CRM origin. Confirm before any',
  'destructive action (delete, send, submit that commits data). When done, give',
  'a short, clear answer and cite what you did.',
  '',
  '## CRM guide',
  '(paste the architecture/process guide here)',
].join('\n');

/** @typedef {{ res: import('node:http').ServerResponse, pending: Map<string,{resolve:Function,reject:Function}>, seq: number, aborted: boolean }} Session */
/** @type {Map<string, Session>} */
const sessions = new Map();

function send(session, event) {
  if (session.res.writableEnded) return;
  session.res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// One tool call: push it to the widget, await the browser's result.
function callBrowserTool(session, name, input) {
  const id = `t${session.seq++}`;
  return new Promise((resolve, reject) => {
    session.pending.set(id, { resolve, reject });
    send(session, { type: 'tool_call', id, name, input });
    // Safety timeout so a lost page can't hang the run forever.
    setTimeout(() => {
      if (session.pending.has(id)) {
        session.pending.delete(id);
        reject(new Error(`The page did not respond to ${name} in time.`));
      }
    }, 30_000);
  });
}

// A ToolRuntime whose page-level tools proxy to the browser, and whose
// tab-level tools degrade to the single embedded page.
function makeRuntime(session) {
  const tab = () => ({ id: 'page', title: '', url: '', active: true });
  const call = (name, input) => callBrowserTool(session, name, input);
  return {
    navigate: (_i, url) => call('navigate', { url }),
    readPage: () => call('read_page', {}),
    click: (_i, target) => call('click', { target }),
    type: (_i, target, text) => call('type', { target, text }),
    extract: (_i, schema) => call('extract', { schema }),
    scroll: (_i, options) => call('scroll', options),
    pressKey: (_i, key) => call('press_key', { key }),
    waitFor: (_i, condition) => call('wait_for', condition),
    getSelection: () => call('getSelection', {}),
    listLinks: async () => (await call('listLinks', {})).links ?? [],
    queryDom: (_i, selector) => call('queryDom', { selector }),
    screenshot: async () => {
      throw new Error('Screenshots are not available in the embedded widget.');
    },
    newTab: async () => tab(),
    switchTab: async () => tab(),
    listTabs: async () => [tab()],
    closeTab: async () => ({ closed: false }),
    goBack: () => call('go_back', {}),
    goForward: () => call('go_forward', {}),
    reload: () => call('reload', {}),
    confirmDestructive: async () => true, // wire to a real user confirm in production
  };
}

async function start(session, prompt, url, title) {
  const controller = new AbortController();
  session.abort = () => controller.abort();
  try {
    const answer = await runAgent({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: MODEL,
      systemPrompt: `${CRM_SYSTEM}\n\nThe user is currently on: ${title} — ${url}`,
      history: [],
      userMessage: prompt,
      context: { activeTabId: 'page', signal: controller.signal, runtime: makeRuntime(session) },
      onStep: (step) => {
        if (step.type === 'tool_call' && step.detail) send(session, { type: 'activity', text: step.detail });
        else if (step.type === 'thinking' && step.detail) send(session, { type: 'activity', text: step.detail });
        else if (step.type === 'text' && step.detail) send(session, { type: 'text', text: step.detail });
      },
    });
    if (answer) send(session, { type: 'text', text: answer });
    send(session, { type: 'done' });
  } catch (err) {
    send(session, { type: 'error', message: err?.message || 'The assistant hit an error.' });
  } finally {
    session.res.end();
    sessions.delete(session.id);
  }
}

function body(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(b || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

http
  .createServer(async (req, res) => {
    // CORS — lock the origin down to your CRM in production.
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (req.method === 'OPTIONS') return res.writeHead(204).end();

    const u = new URL(req.url, 'http://x');

    if (u.pathname === '/stream') {
      const id = u.searchParams.get('sessionId');
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      });
      sessions.set(id, { id, res, pending: new Map(), seq: 0, abort: () => {} });
      req.on('close', () => {
        const s = sessions.get(id);
        if (s) s.abort();
        sessions.delete(id);
      });
      return;
    }

    if (u.pathname === '/start' && req.method === 'POST') {
      const { sessionId, prompt, url, title } = await body(req);
      res.writeHead(200).end('ok');
      // Give the EventSource a tick to connect, then run.
      setTimeout(() => {
        const s = sessions.get(sessionId);
        if (s) void start(s, prompt, url, title);
      }, 150);
      return;
    }

    if (u.pathname === '/tool-result' && req.method === 'POST') {
      const { sessionId, id, result, error } = await body(req);
      const s = sessions.get(sessionId);
      const p = s?.pending.get(id);
      if (p) {
        s.pending.delete(id);
        error ? p.reject(new Error(error)) : p.resolve(result);
      }
      res.writeHead(200).end('ok');
      return;
    }

    res.writeHead(404).end('not found');
  })
  .listen(PORT, () => console.log(`BulleBrowser widget backend on :${PORT}`));
