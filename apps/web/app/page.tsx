import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { DownloadButton } from '@/components/DownloadButton';
import { AgentPanel } from '@/components/AgentPanel';
import { VideoGuide } from '@/components/VideoGuide';

const SKILLS = [
  {
    title: 'Page assistant',
    lede: 'Read and summarize what is on screen.',
    body: 'Ask it to read a page, lift the important points, and give you a concise answer with citations.',
  },
  {
    title: 'Site navigator',
    lede: 'Handle a task inside a live website.',
    body: 'Tell it where to go and what to do. It opens the page, finds the control, and completes the action.',
  },
  {
    title: 'Workflow automator',
    lede: 'Coordinate multi-step browser tasks.',
    body: 'Use it for repeatable sequences across tabs: compare pages, gather details, and return a clean summary.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* ---- Hero: copy + persistent live agent panel -------------------- */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-surface-muted to-surface-light">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-[1.05fr_1fr] md:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface-light px-3 py-1 text-xs tracking-wide text-ink-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Agentic AI · By {product.vendor}
            </div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              The browser that navigates for you.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-secondary">
              An AI agent that reads pages, completes browser tasks, and works
              whatever else you ask — right inside your browser.
            </p>

            {/* Allow Access is the first control, visible without scrolling. */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/install"
                className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Allow Access
              </Link>
              <DownloadButton />
            </div>
            <p className="mt-3 max-w-md text-xs text-ink-secondary">
              Allow Access shows exactly how BulleBrowser asks permission to act
              on your behalf — you stay in control the whole time.
            </p>
          </div>

          {/* The persistent agent panel — the site's main interaction area. */}
          <AgentPanel />
        </div>
      </section>

      {/* ---- Video guide, integrated right under the hero --------------- */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.3fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              Guided walkthrough
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              See it drive a real task, start to finish.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-secondary">
              Watch {product.name} take a plain-language request, open the right
              pages, work the controls, and hand back a clean result — the same
              visible cursor and live typing you see in the panel above.
            </p>
            <Link
              href="/preview"
              className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Browse the full walkthrough →
            </Link>
          </div>
          <VideoGuide />
        </div>
      </section>

      {/* ---- Three agentic skills -------------------------------------- */}
      <section className="border-t border-line bg-surface-muted">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            Agentic skills
          </div>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Native intelligence, built into the browser.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-secondary">
            Not a chatbot bolted onto a sidebar. {product.name} is purpose-built
            for general browser automation. Three flagship skills lead the way,
            and the agent takes on much more on request.
          </p>
          <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-3">
            {SKILLS.map((s) => (
              <div key={s.title}>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-[15px] font-medium text-ink-primary">{s.lede}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Link href="/features" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Explore the features →
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Privacy --------------------------------------------------- */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your data stays yours.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-secondary">
            Bring your own key if you want external synthesis. Prompts go
            directly through your configured AI provider account from your
            device. History and conversations stay on your device. No telemetry.
          </p>
          <div className="mt-10 flex justify-center">
            <DownloadButton />
          </div>
        </div>
      </section>
    </>
  );
}
