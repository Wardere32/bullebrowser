import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { DownloadButton } from '@/components/DownloadButton';
import { AgentDemo } from '@/components/AgentDemo';

const SKILLS = [
  { title: 'Grant scanner', body: 'Open opportunities from SAM.gov and Grants.gov, sorted by deadline.' },
  { title: 'RFP comparator', body: 'Two to four RFPs, broken down side by side in one pass.' },
  { title: 'Compliance review', body: 'Clauses flagged against EEO, FERPA, and ADA — quoted and sourced.' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero — text left, live agent demo on the right */}
      <section className="bg-surface-dark text-ink-inverse">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 md:grid-cols-[1.05fr_1fr] md:py-32">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Agentic AI · By {product.vendor}
            </div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              The browser that does the work.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-inverse/70">
              An AI agent that researches grants, compares RFPs, and reviews
              compliance — right inside your browser.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <DownloadButton />
              <Link href="/preview" className="text-sm text-ink-inverse/70 underline-offset-4 hover:underline">
                See it in action →
              </Link>
            </div>
          </div>
          <AgentDemo />
        </div>
      </section>

      {/* What it does — three crisp lines */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          One prompt replaces an afternoon of tabs.
        </h2>
        <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-3">
          {SKILLS.map((s) => (
            <div key={s.title}>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <Link href="/features" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            Explore the features →
          </Link>
        </div>
      </section>

      {/* Privacy — one statement */}
      <section className="border-t border-line bg-surface-muted">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your data stays yours.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-secondary">
            Bring your own key. Prompts go straight to your provider — never to{' '}
            {product.vendor}. No telemetry.
          </p>
          <div className="mt-10 flex justify-center">
            <DownloadButton />
          </div>
        </div>
      </section>
    </>
  );
}
