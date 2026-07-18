'use client';

// A self-playing loop that mirrors the real BulleBrowser experience: the app's
// two-pane layout (browser on the left, AI agent panel on the right), an agent
// cursor that moves around the page, types into fields, and clicks — the same
// visible-cursor + character-by-character typing the app itself does. Not a
// recorded video; a scripted in-page animation so it stays crisp at any size.
// Honors prefers-reduced-motion by holding the finished state.

import { useEffect, useRef, useState } from 'react';

// Cursor positions are percentages of the browser pane, so the overlay scales
// with the mockup.
interface Beat {
  ms: number;
  cursor?: { x: number; y: number };
  click?: boolean;
  address?: string; // typed into the address bar, character by character
  page?: 'blank' | 'results' | 'article';
  prompt?: string; // typed into the chat composer, character by character
  activity?: string; // the agent's current action, shown in the feed
  answer?: boolean; // reveal the assistant's answer
}

// One full run. Each beat is applied in order, then it loops.
const SCRIPT: Beat[] = [
  { ms: 400, cursor: { x: 78, y: 88 }, page: 'blank' },
  { ms: 1400, prompt: 'Find the tallest mountain in Japan and its height' },
  { ms: 500, activity: 'Starting…', cursor: { x: 40, y: 8 } },
  { ms: 1000, address: 'duckduckgo.com/?q=tallest mountain in japan', activity: 'Opening duckduckgo.com' },
  { ms: 700, page: 'results', activity: 'Reading the results' },
  { ms: 900, cursor: { x: 30, y: 42 }, activity: 'Reading the results' },
  { ms: 500, cursor: { x: 30, y: 42 }, click: true, activity: 'Opening the top result' },
  { ms: 800, page: 'article', address: 'en.wikipedia.org/wiki/Mount_Fuji', activity: 'Reading the page' },
  { ms: 900, cursor: { x: 55, y: 55 }, activity: 'Reading the page' },
  { ms: 900, activity: 'Writing the answer', answer: true },
  { ms: 2600, cursor: { x: 78, y: 88 } },
];

interface State {
  cursor: { x: number; y: number };
  click: boolean;
  address: string;
  page: 'blank' | 'results' | 'article';
  prompt: string;
  activity: string;
  answer: boolean;
}

const START: State = {
  cursor: { x: 78, y: 88 },
  click: false,
  address: '',
  page: 'blank',
  prompt: '',
  activity: '',
  answer: false,
};

const FINAL_STATE: State = {
  cursor: { x: 78, y: 88 },
  click: false,
  address: 'en.wikipedia.org/wiki/Mount_Fuji',
  page: 'article',
  prompt: 'Find the tallest mountain in Japan and its height',
  activity: 'Done',
  answer: true,
};

export function AgentDemo() {
  const [s, setS] = useState<State>(START);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setS(FINAL_STATE);
      return;
    }

    let cancelled = false;
    const clearAll = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    // Reveal a target string one character at a time into a field of `state`,
    // the way the app types into a field rather than pasting it whole.
    const typeInto = (key: 'address' | 'prompt', text: string, startAt: number, totalMs: number) => {
      const per = Math.max(16, totalMs / Math.max(1, text.length));
      for (let i = 1; i <= text.length; i++) {
        timers.current.push(
          window.setTimeout(() => {
            if (!cancelled) setS((prev) => ({ ...prev, [key]: text.slice(0, i) }));
          }, startAt + i * per),
        );
      }
    };

    const run = () => {
      clearAll();
      setS(START);
      let t = 0;
      for (const beat of SCRIPT) {
        const at = t;
        timers.current.push(
          window.setTimeout(() => {
            if (cancelled) return;
            setS((prev) => ({
              ...prev,
              ...(beat.cursor ? { cursor: beat.cursor } : {}),
              click: !!beat.click,
              ...(beat.page ? { page: beat.page } : {}),
              ...(beat.activity ? { activity: beat.activity } : {}),
              ...(beat.answer ? { answer: true } : {}),
            }));
          }, at),
        );
        if (beat.address !== undefined) typeInto('address', beat.address, at, Math.min(1000, beat.ms));
        if (beat.prompt !== undefined) typeInto('prompt', beat.prompt, at, Math.min(1400, beat.ms));
        t += beat.ms;
      }
      timers.current.push(window.setTimeout(run, t + 400)); // loop
    };

    run();
    return () => {
      cancelled = true;
      clearAll();
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl ring-1 ring-black/5">
      <div className="grid grid-cols-[1fr_190px]">
        {/* ---- Browser pane ---- */}
        <div className="relative border-r border-line">
          <div className="flex items-center gap-2 bg-surface-dark px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <div className="ml-2 flex h-5 flex-1 items-center truncate rounded-md bg-white/10 px-2 text-[10px] text-white/80">
              {s.address || 'Search or enter address'}
              {s.address && s.page === 'blank' && <span className="ml-0.5 animate-pulse">|</span>}
            </div>
          </div>

          <div className="relative h-[190px] overflow-hidden p-3 text-[11px]">
            <PageContent page={s.page} />
            {/* the agent cursor moving over the page */}
            <div
              className="pointer-events-none absolute z-10 transition-all duration-500 ease-out"
              style={{ left: `${s.cursor.x}%`, top: `${s.cursor.y}%` }}
            >
              {s.click && (
                <span className="absolute -left-2 -top-2 h-5 w-5 animate-ping rounded-full bg-primary/40" />
              )}
              <svg viewBox="0 0 24 24" className="h-4 w-4 drop-shadow" fill="none">
                <path
                  d="M5 3l14 8.5-6.2 1.4L9.8 19 5 3z"
                  fill="#fff"
                  stroke="#111"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ---- AI agent panel (mirrors the app) ---- */}
        <div className="flex flex-col bg-surface-light">
          <div className="px-3 py-2 text-[11px] font-semibold text-ink-primary">BulleBrowser Agent</div>
          <div className="flex-1 space-y-2 overflow-hidden px-3 text-[10px]">
            {s.prompt && (
              <div className="ml-auto max-w-[92%] rounded-lg rounded-br-sm bg-primary px-2 py-1 text-white">
                {s.prompt}
                {!s.answer && !s.activity && <span className="ml-0.5 animate-pulse">|</span>}
              </div>
            )}
            {s.activity && !s.answer && (
              <div className="flex items-center gap-1.5 rounded-md border border-line/60 bg-surface-muted/40 px-2 py-1 text-ink-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                <span className="truncate">{s.activity}</span>
              </div>
            )}
            {s.answer && (
              <div className="text-ink-primary">
                The tallest mountain in Japan is{' '}
                <span className="font-semibold">Mount Fuji</span>, at{' '}
                <span className="font-semibold">3,776&nbsp;m</span> (12,388&nbsp;ft).
                <div className="mt-1 text-[9px] text-ink-secondary">
                  Source: en.wikipedia.org/wiki/Mount_Fuji
                </div>
              </div>
            )}
          </div>
          <div className="m-2 rounded-lg border border-primary/30 px-2 py-1.5 text-[9.5px] text-ink-secondary">
            Ask BulleBrowser to do something…
          </div>
        </div>
      </div>
    </div>
  );
}

function PageContent({ page }: { page: State['page'] }) {
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
        {['Mount Fuji - Wikipedia', 'List of mountains of Japan', 'Tallest peaks in Japan'].map(
          (r, i) => (
            <div key={r} className={`rounded px-1 py-0.5 ${i === 0 ? 'bg-primary/5' : ''}`}>
              <div className="text-[10px] font-medium text-primary">{r}</div>
              <div className="text-[9px] text-ink-secondary">
                en.wikipedia.org — a concise overview and key facts…
              </div>
            </div>
          ),
        )}
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
      <div className="h-2 w-3/4 rounded bg-surface-muted" />
    </div>
  );
}
