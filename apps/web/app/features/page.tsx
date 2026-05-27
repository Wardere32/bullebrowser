import type { Metadata } from 'next';
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { DownloadButton } from '@/components/DownloadButton';

export const metadata: Metadata = {
  title: 'Features',
  description: `What the ${product.name} agent can do — capabilities, preset skills, controls, and privacy.`,
};

const TOOLS = [
  ['Navigate', 'Open any URL in a live tab.'],
  ['Read', 'Pull clean, readable text from the page.'],
  ['Click & type', 'Operate forms and controls by label or selector.'],
  ['Extract', 'Lift structured data to a schema you define.'],
  ['Manage tabs', 'Open, switch, and coordinate across tabs.'],
  ['Wait', 'Pause for an element or the network to settle.'],
];

const SKILLS = [
  {
    title: 'Grant scanner',
    lede: 'Find funding without the tab-juggling.',
    body: 'Give it keywords. It searches SAM.gov and Grants.gov, follows listings into detail pages, and returns a comparison table sorted by deadline — with award ceilings and links.',
  },
  {
    title: 'RFP comparator',
    lede: 'Go/no-go in minutes, not hours.',
    body: 'Paste 2–4 RFP links. It reads each end to end and hands back a side-by-side of deadline, scope, eligibility, contract value, and evaluation criteria.',
  },
  {
    title: 'Compliance review',
    lede: 'Catch the gaps before review does.',
    body: 'Drop a document. It flags clauses against EEO, FERPA, and ADA — plus any checklist items you add — and quotes each clause with its section reference.',
  },
];

const CONTROLS = [
  ['You stay in control', 'A live “Agent is working” indicator shows each step, and a Stop button cancels instantly.'],
  ['No runaways', 'Every task is hard-capped at 25 actions.'],
  ['Ask before acting', 'Form submissions and downloads require your explicit confirmation.'],
  ['Your model', 'Choose Claude Opus, Sonnet, or Haiku per task.'],
];

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</div>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <>
      {/* Intro */}
      <section className="bg-surface-dark text-ink-inverse">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            An agent that operates the browser — so you don&apos;t have to.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-inverse/70">
            {product.name} pairs a real, full-featured browser with a
            Claude-powered agent. It works the web the way a person does —
            reading, clicking, typing, extracting — but in a deterministic,
            stoppable loop you can trust.
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <Section eyebrow="Capabilities" title="It works the live web, not a stale index.">
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-secondary">
          The agent acts on the active tab — same pages, same logins, same
          data you&apos;d see — through a focused set of actions:
        </p>
        <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map(([name, desc]) => (
            <div key={name}>
              <div className="text-sm font-semibold">{name}</div>
              <div className="mt-1 text-sm text-ink-secondary">{desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Skills */}
      <Section eyebrow="Three agentic skills" title="Native intelligence, built for grants, RFPs, and compliance.">
        <div className="grid gap-10 md:grid-cols-3">
          {SKILLS.map((s) => (
            <div key={s.title}>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-[15px] font-medium text-ink-primary">{s.lede}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Control & trust */}
      <Section eyebrow="Control & trust" title="Powerful, but never on autopilot.">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {CONTROLS.map(([t, d]) => (
            <div key={t}>
              <div className="text-sm font-semibold">{t}</div>
              <div className="mt-1 text-sm text-ink-secondary">{d}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Privacy */}
      <Section eyebrow="Privacy" title="Bring your own key. Keep your own data.">
        <ul className="max-w-2xl space-y-3 text-[15px] leading-relaxed text-ink-secondary">
          <li>Your prompts go straight to Anthropic — never to {product.vendor}.</li>
          <li>Your API key is encrypted in your operating system&apos;s keychain.</li>
          <li>History, bookmarks, and conversations stay on your device.</li>
          <li>No analytics. No telemetry.</li>
        </ul>
      </Section>

      {/* CTA */}
      <section className="border-t border-line bg-surface-muted">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Put the agent to work.</h2>
          <p className="mt-4 text-ink-secondary">Free download for macOS, Windows, and Linux.</p>
          <div className="mt-8 flex justify-center">
            <DownloadButton />
          </div>
          <div className="mt-4 text-sm">
            <Link href="/preview" className="text-primary underline-offset-4 hover:underline">
              See the app screens →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
