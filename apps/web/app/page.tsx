import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { AgentPanel } from '@/components/AgentPanel';

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
      {/* Hero: copy alongside the live agent panel. */}
      <section className="border-b border-line bg-gradient-to-b from-surface-muted to-surface-light">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[1.05fr_1fr] md:py-28">
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
              whatever else you ask, right inside your browser.
            </p>
          </div>

          <AgentPanel />
        </div>
      </section>

      {/* Three agentic skills. */}
      <section className="bg-surface-dark text-ink-inverse">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            Agentic skills
          </div>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Native intelligence, built into the browser.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-inverse/80">
            Not a chatbot bolted onto a sidebar. {product.name} is purpose-built
            for general browser automation. Three flagship skills lead the way,
            and the agent takes on much more on request.
          </p>
          <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-3">
            {SKILLS.map((s) => (
              <div key={s.title}>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-[15px] font-medium text-ink-inverse">{s.lede}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-inverse/80">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Link
              href="/features"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Explore the features
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy. */}
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
        </div>
      </section>
    </>
  );
}
