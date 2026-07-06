// Static SVG-style mockup of the BulleBrowser window with the AI panel
// completing a general page task. Pure HTML/CSS so it renders crisp and stays
// under the LCP budget.

export function BrowserMockup() {
  return (
    <div className="rounded-xl border border-white/10 bg-white shadow-2xl ring-1 ring-black/5">
      <div className="flex items-center gap-2 rounded-t-xl bg-surface-dark px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-300/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <div className="ml-3 flex h-5 flex-1 items-center rounded-md bg-white/10 px-2 text-[10px] text-white/70">
          example.com/docs
        </div>
        <div className="rounded bg-primary px-2 py-0.5 text-[10px] text-white">AI</div>
      </div>
      <div className="grid grid-cols-[1fr_180px] text-[11px]">
        <div className="border-r border-line p-3 text-ink-primary">
          <div className="mb-2 font-semibold">Browser page</div>
          <ul className="space-y-1.5">
            {[
              'Overview — concise summary',
              'Details — extracted main points',
              'Action — recommended next step',
              'Status — completed with citations',
            ].map((row) => (
              <li
                key={row}
                className="rounded border border-line px-2 py-1.5 text-[10px] text-ink-secondary"
              >
                {row}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-surface-muted p-2 text-[10px]">
          <div className="font-semibold text-ink-primary">AI agent</div>
          <div className="mt-1 rounded bg-white p-2 text-ink-secondary">
            Reading page and preparing a summary…
          </div>
          <div className="mt-1 rounded bg-white p-2">
            <div className="font-semibold text-ink-primary">Ready</div>
            <div className="mt-1 text-ink-secondary">
              The browser handled the page and returned the answer.
            </div>
          </div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-accent">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            extract(summary)
          </div>
        </div>
      </div>
    </div>
  );
}
