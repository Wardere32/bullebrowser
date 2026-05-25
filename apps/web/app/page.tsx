/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { DownloadButton } from '@/components/DownloadButton';
import { BrowserMockup } from '@/components/BrowserMockup';
import { asset } from '@/lib/asset';

const SKILLS = [
  {
    title: 'Grant scanner',
    body: 'Keywords in. A deadline-sorted table of live SAM.gov and Grants.gov opportunities out.',
  },
  {
    title: 'RFP comparator',
    body: 'Drop 2–4 RFP links. Get deadline, scope, eligibility, value, and criteria, side by side.',
  },
  {
    title: 'Compliance review',
    body: 'Drop a document. Clauses flagged against EEO, FERPA, and ADA — quoted, with sections.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
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
              An AI agent that opens tabs, reads pages, and extracts what you
              need — for grants, RFPs, and compliance.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <DownloadButton />
              <a href="#see" className="text-sm text-ink-inverse/70 underline-offset-4 hover:underline">
                See how it works
              </a>
            </div>
          </div>
          <BrowserMockup />
        </div>
      </section>

      {/* Skills — one line each, lots of air */}
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
      </section>

      {/* See it in action — full-bleed screenshot */}
      <section id="see" className="border-t border-line bg-surface-muted">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">See it work.</h2>
            <Link href="/preview" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              All screens →
            </Link>
          </div>
          <Link
            href="/preview"
            className="mt-10 block overflow-hidden rounded-2xl border border-line shadow-sm transition-shadow hover:shadow-md"
          >
            <img
              src={asset('/screenshots/grant-scanner.png')}
              alt="BulleBrowser running the Grant scanner against SAM.gov"
              className="block w-full"
            />
          </Link>
        </div>
      </section>

      {/* Privacy — one statement */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
        <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Your data stays yours.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-secondary">
          Bring your own Anthropic key. Prompts go straight to your provider —
          never to {product.vendor}. No telemetry.
        </p>
        <div className="mt-10 flex justify-center">
          <DownloadButton />
        </div>
      </section>
    </>
  );
}
