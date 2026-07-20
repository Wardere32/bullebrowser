'use client';

// The persistent right-hand agent panel, BulleBrowser's answer to Comet's
// main interaction area. It mirrors the real app: a browser sub-pane the agent
// "drives" (a visible cursor that moves, types into the address bar, and
// clicks) above a conversation the agent fills in, character by character, the
// same way the shipping app streams. Not a recorded video, a scripted,
// self-playing in-page animation that stays crisp at any size and loops.
//
// What is genuinely interactive here (works on the static site, no backend):
//   • the halo ring that circles the composer while the agent is composing or
//     the visitor focuses the field (CSS `.halo` in globals.css);
//   • the "jump to latest" pointer button, shown whenever the conversation is
//     scrolled up from the newest message;
//   • the "+" attachment menu (Upload / Screenshot / Projects / Control
//     Browser), a real popover whose items honestly point to where each
//     capability runs, the desktop app;
//   • the BulleBrowser mark, a real link home.
//
// Deliberately omitted on the marketing site: live voice / soundwave input.
// It needs the running agent to hear and act, so it belongs to the in-product
// UI phase rather than a static page that could only fake it.
//
// Honors prefers-reduced-motion by holding a finished, readable state.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { asset } from '@/lib/asset';

type Page = 'blank' | 'results' | 'article' | 'notes';

interface Cursor {
  x: number;
  y: number;
}

// One conversation entry. Activities collapse to a checked step once the next
// entry arrives; the latest activity shows a live pulsing dot.
type Feed =
  | { kind: 'user'; text: string }
  | { kind: 'activity'; text: string; done: boolean }
  | { kind: 'answer'; html: 'fuji' | 'notes' };

interface State {
  address: string;
  page: Page;
  cursor: Cursor;
  click: boolean;
  composer: string; // text currently being typed into the composer
  typing: boolean; // agent is actively composing → halo on
  feed: Feed[];
}

const START: State = {
  address: '',
  page: 'blank',
  cursor: { x: 82, y: 86 },
  click: false,
  composer: '',
  typing: false,
  feed: [],
};

export function AgentPanel() {
  const [s, setS] = useState<State>(START);
  const timers = useRef<number[]>([]);

  // ---- Conversation auto-scroll + "jump to latest" -------------------------
  const feedRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);

  const onFeedScroll = () => {
    const el = feedRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setAtBottom(near);
  };

  const jumpToLatest = () => {
    const el = feedRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  // Keep the newest message in view as the agent streams, but only if the
  // viewer hasn't scrolled up to read (then the pointer button takes over).
  useEffect(() => {
    const el = feedRef.current;
    if (el && atBottom) el.scrollTop = el.scrollHeight;
  }, [s.feed, atBottom]);

  // ---- The self-playing script ---------------------------------------------
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setS({
        address: 'en.wikipedia.org/wiki/Mount_Fuji',
        page: 'article',
        cursor: { x: 82, y: 86 },
        click: false,
        composer: '',
        typing: false,
        feed: [
          { kind: 'user', text: 'Find the tallest mountain in Japan and its height' },
          { kind: 'activity', text: 'Read en.wikipedia.org/wiki/Mount_Fuji', done: true },
          { kind: 'answer', html: 'fuji' },
        ],
      });
      return;
    }

    let cancelled = false;
    const clearAll = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    const at = (t: number, fn: () => void) => {
      timers.current.push(window.setTimeout(() => !cancelled && fn(), t));
    };

    // Append a feed entry, marking any earlier activity as complete.
    const push = (item: Feed) =>
      setS((p) => ({
        ...p,
        feed: [
          ...p.feed.map((f) => (f.kind === 'activity' ? { ...f, done: true } : f)),
          item,
        ],
      }));

    // Reveal `text` into a string field one character at a time.
    const typeField = (
      key: 'address' | 'composer',
      text: string,
      startAt: number,
      totalMs: number,
    ) => {
      const per = Math.max(18, totalMs / Math.max(1, text.length));
      for (let i = 1; i <= text.length; i++) {
        at(startAt + i * per, () => setS((p) => ({ ...p, [key]: text.slice(0, i) })));
      }
      return startAt + text.length * per;
    };

    const run = () => {
      clearAll();
      setS(START);
      // The feed is emptied on each loop, so re-pin to the bottom. Without this
      // a visitor who scrolled up once left atBottom false forever: the panel
      // never auto-followed again and the "jump to latest" arrow stuck around
      // on a conversation that had already restarted.
      setAtBottom(true);
      let t = 300;

      // ---- Turn 1: research -------------------------------------------------
      at(t, () => setS((p) => ({ ...p, typing: true })));
      t = typeField('composer', 'Find the tallest mountain in Japan and its height', t, 1600) + 200;
      at(t, () => {
        push({ kind: 'user', text: 'Find the tallest mountain in Japan and its height' });
        setS((p) => ({ ...p, composer: '', typing: false }));
      });
      t += 400;

      at(t, () => {
        push({ kind: 'activity', text: 'Starting…', done: false });
        setS((p) => ({ ...p, cursor: { x: 42, y: 9 } }));
      });
      t += 600;
      typeField('address', 'duckduckgo.com/?q=tallest mountain in japan', t, 900);
      at(t, () => push({ kind: 'activity', text: 'Opening duckduckgo.com', done: false }));
      t += 1100;
      at(t, () => {
        setS((p) => ({ ...p, page: 'results' }));
        push({ kind: 'activity', text: 'Reading the results', done: false });
      });
      t += 800;
      at(t, () => setS((p) => ({ ...p, cursor: { x: 30, y: 44 } })));
      t += 500;
      at(t, () => setS((p) => ({ ...p, click: true })));
      at(t + 220, () => setS((p) => ({ ...p, click: false })));
      t += 500;
      at(t, () => {
        setS((p) => ({ ...p, page: 'article', address: 'en.wikipedia.org/wiki/Mount_Fuji' }));
        push({ kind: 'activity', text: 'Reading en.wikipedia.org/wiki/Mount_Fuji', done: false });
      });
      t += 900;
      at(t, () => setS((p) => ({ ...p, cursor: { x: 58, y: 56 } })));
      t += 700;
      at(t, () => push({ kind: 'activity', text: 'Writing the answer', done: false }));
      t += 700;
      at(t, () => push({ kind: 'answer', html: 'fuji' }));
      t += 2200;

      // ---- Turn 2: a follow-up, so the conversation grows and scrolls -------
      at(t, () => setS((p) => ({ ...p, typing: true, cursor: { x: 82, y: 86 } })));
      t = typeField('composer', 'Add it to my trip notes', t, 900) + 200;
      at(t, () => {
        push({ kind: 'user', text: 'Add it to my trip notes' });
        setS((p) => ({ ...p, composer: '', typing: false }));
      });
      t += 400;
      at(t, () => {
        setS((p) => ({ ...p, page: 'notes', address: 'notes.local/trip' }));
        push({ kind: 'activity', text: 'Opening Trip notes', done: false });
      });
      t += 900;
      at(t, () => push({ kind: 'activity', text: 'Adding the entry', done: false }));
      t += 900;
      at(t, () => push({ kind: 'answer', html: 'notes' }));
      t += 2600;

      at(t, run); // loop
    };

    run();
    return () => {
      cancelled = true;
      clearAll();
    };
  }, []);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface-light shadow-xl ring-1 ring-black/5">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-primary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('/logo.svg')} alt="" className="h-5 w-5 rounded" draggable={false} />
          BulleBrowser Agent
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            style={{ animation: 'soft-pulse 1.8s ease-in-out infinite' }}
          />
          Live
        </span>
      </div>

      {/* Browser sub-pane the agent drives */}
      <div className="border-b border-line">
        <div className="flex items-center gap-1.5 bg-surface-dark px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400/80" />
          <span className="h-2 w-2 rounded-full bg-yellow-300/80" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          <div className="ml-2 flex h-5 flex-1 items-center truncate rounded bg-white/10 px-2 text-[10px] text-white/80">
            {s.address || 'Search or enter address'}
            {s.address && s.page === 'blank' && <span className="ml-0.5 animate-pulse">|</span>}
          </div>
        </div>
        <div className="relative h-[148px] overflow-hidden p-3 text-[11px]">
          <PageContent page={s.page} />
          {/* the agent cursor moving across the page */}
          <div
            className="pointer-events-none absolute z-10 transition-all duration-500 ease-out"
            style={{ left: `${s.cursor.x}%`, top: `${s.cursor.y}%` }}
          >
            {s.click && (
              <span className="absolute -left-2 -top-2 h-5 w-5 animate-ping rounded-full bg-primary/40" />
            )}
            <svg viewBox="0 0 24 24" className="h-4 w-4 drop-shadow" fill="none">
              <path d="M5 3l14 8.5-6.2 1.4L9.8 19 5 3z" fill="#fff" stroke="#111" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Conversation feed */}
      <div className="relative">
        <div
          ref={feedRef}
          onScroll={onFeedScroll}
          className="h-[224px] space-y-2 overflow-y-auto px-4 py-3 text-[12px] leading-relaxed"
        >
          {s.feed.length === 0 && (
            <p className="text-ink-secondary">Ask BulleBrowser to do something…</p>
          )}
          {s.feed.map((f, i) => (
            <FeedRow key={i} item={f} />
          ))}
          {s.typing && s.composer && (
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-1.5 text-white">
              {s.composer}
              <span className="ml-0.5 animate-pulse">|</span>
            </div>
          )}
        </div>

        {/* Pointer arrow → jump to the latest message. */}
        {!atBottom && (
          <button
            type="button"
            onClick={jumpToLatest}
            aria-label="Jump to latest message"
            className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-light text-ink-primary shadow-md transition-transform hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Composer with halo + attachment menu + brand mark */}
      <Composer typing={s.typing} />
    </div>
  );
}

function FeedRow({ item }: { item: Feed }) {
  if (item.kind === 'user') {
    return (
      <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-1.5 text-white">
        {item.text}
      </div>
    );
  }
  if (item.kind === 'activity') {
    return (
      <div className="flex items-center gap-2 text-ink-secondary">
        {item.done ? (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5 9 17.5 20 6.5" />
          </svg>
        ) : (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" style={{ animation: 'soft-pulse 1.2s ease-in-out infinite' }} />
        )}
        <span className="truncate">{item.text}</span>
      </div>
    );
  }
  // answer
  return (
    <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-sm bg-surface-muted px-3 py-2 text-ink-primary">
      {item.html === 'fuji' ? (
        <>
          The tallest mountain in Japan is <span className="font-semibold">Mount Fuji</span>, at{' '}
          <span className="font-semibold">3,776&nbsp;m</span> (12,388&nbsp;ft).
          <span className="mt-1 block text-[10px] text-ink-secondary">Source: en.wikipedia.org/wiki/Mount_Fuji</span>
        </>
      ) : (
        <>
          Added <span className="font-semibold">“Mount Fuji, 3,776&nbsp;m”</span> to your Trip notes.
        </>
      )}
    </div>
  );
}

// ---- Composer ---------------------------------------------------------------

const ATTACH: { key: string; label: string; note: string; icon: React.ReactNode }[] = [
  {
    key: 'upload',
    label: 'Upload your file',
    note: 'Session files are retained for 8 days',
    icon: <path d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" />,
  },
  {
    key: 'screenshot',
    label: 'Screenshot',
    note: 'Capture the current page for the agent',
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <circle cx="12" cy="12.5" r="3.2" />
        <path d="M8.5 6 10 3.5h4L15.5 6" />
      </>
    ),
  },
  {
    key: 'projects',
    label: 'Projects',
    note: 'Attach a project folder so the agent knows the task',
    icon: <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h9A1.5 1.5 0 0 1 21 10v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" />,
  },
  {
    key: 'control',
    label: 'Control Browser',
    note: 'Let the agent drive tabs and complete tasks',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18M3.2 9h17.6M3.2 15h17.6" />
      </>
    ),
  },
];

function Composer({ typing }: { typing: boolean }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Close the popover on any outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="border-t border-line p-3">
      {/* The halo rides on this wrapper: active while the agent composes
          (`is-active`) or the visitor focuses the field (`:focus-within`). */}
      <div className={`halo rounded-xl ${typing ? 'is-active' : ''}`}>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-light px-2 py-1.5">
          <input
            type="text"
            readOnly
            aria-label="Ask BulleBrowser"
            placeholder="Ask BulleBrowser to do something…"
            className="min-w-0 flex-1 bg-transparent px-1 text-[12px] text-ink-primary outline-none placeholder:text-ink-secondary"
          />
        </div>
      </div>

      {/* Control row: "+" menu, brand mark, and a send affordance. */}
      <div ref={wrapRef} className="relative mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Add attachment"
          aria-expanded={open}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
            open ? 'border-primary bg-primary/10 text-primary' : 'border-line text-ink-secondary hover:text-ink-primary'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {/* Brand mark → home. */}
        <Link
          href="/"
          aria-label="BulleBrowser home"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line hover:border-primary/40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('/logo.svg')} alt="" className="h-5 w-5 rounded" draggable={false} />
        </Link>

        <div className="ml-auto text-[11px] text-ink-secondary">{note}</div>

        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>

        {/* "+" popover, Comet-style attachment menu. Each item names where the
            capability actually runs; the whole panel links into the app. */}
        {open && (
          <div className="absolute bottom-11 left-0 z-20 w-64 overflow-hidden rounded-xl border border-line bg-surface-light p-1 shadow-xl">
            {ATTACH.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => {
                  setNote(a.label);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-surface-muted"
              >
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  {a.icon}
                </svg>
                <span className="min-w-0">
                  <span className="block text-[12px] font-medium text-ink-primary">{a.label}</span>
                  <span className="block text-[11px] text-ink-secondary">{a.note}</span>
                </span>
              </button>
            ))}
            <Link
              href="/download"
              className="mt-1 block rounded-lg bg-surface-muted px-2.5 py-2 text-center text-[11px] font-medium text-primary hover:bg-primary/10"
            >
              These run in the BulleBrowser app, get it →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Browser page mock ------------------------------------------------------

function PageContent({ page }: { page: Page }) {
  if (page === 'blank') {
    return (
      <div className="flex h-full items-center justify-center text-ink-secondary/60">
        <div className="text-center">
          <div className="mx-auto mb-1 h-6 w-6 rounded-full border-2 border-primary/40" />
          <div className="text-[10px]">New tab</div>
        </div>
      </div>
    );
  }
  if (page === 'results') {
    return (
      <div className="space-y-2">
        <div className="h-4 w-1/2 rounded bg-surface-muted" />
        {['Mount Fuji - Wikipedia', 'List of mountains of Japan', 'Tallest peaks in Japan'].map((r, i) => (
          <div key={r} className={`rounded px-1 py-0.5 ${i === 0 ? 'bg-primary/5' : ''}`}>
            <div className="text-[10px] font-medium text-primary">{r}</div>
            <div className="text-[9px] text-ink-secondary">en.wikipedia.org, a concise overview and key facts…</div>
          </div>
        ))}
      </div>
    );
  }
  if (page === 'notes') {
    return (
      <div className="space-y-1.5">
        <div className="text-[12px] font-bold text-ink-primary">Trip notes</div>
        <div className="h-2 w-3/4 rounded bg-surface-muted" />
        <div className="rounded border border-primary/30 bg-primary/5 px-2 py-1 text-[9.5px] text-ink-primary">
          Mount Fuji, 3,776 m (12,388 ft)
        </div>
        <div className="h-2 w-2/3 rounded bg-surface-muted" />
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="text-[13px] font-bold text-ink-primary">Mount Fuji</div>
      <div className="h-2 w-full rounded bg-surface-muted" />
      <div className="h-2 w-11/12 rounded bg-surface-muted" />
      <div className="rounded border border-line bg-surface-muted/40 px-2 py-1 text-[9.5px]">
        <span className="text-ink-secondary">Elevation:</span>{' '}
        <span className="font-semibold text-ink-primary">3,776 m (12,388 ft)</span>
      </div>
      <div className="h-2 w-10/12 rounded bg-surface-muted" />
    </div>
  );
}
