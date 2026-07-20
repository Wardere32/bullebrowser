import type { Metadata } from 'next';
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';

export const metadata: Metadata = {
  title: 'Features',
  description: `What the ${product.name} agent can do: capabilities, preset skills, controls, and privacy.`,
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
    title: 'Page assistant',
    lede: 'Read and summarize what is on screen.',
    body: 'Give it a page or task. It reads the live tab and returns a concise answer with citations.',
  },
  {
    title: 'Site navigator',
    lede: 'Handle a task inside a live website.',
    body: 'Open a site, find the control, and complete the requested browser action.',
  },
  {
    title: 'Workflow automator',
    lede: 'Coordinate repeatable browser work.',
    body: 'Use it for multi-step sequences across tabs: compare pages, gather details, and return a clean summary.',
  },
];

const CONTROLS = [
  ['You stay in control', 'A live “Agent is working” indicator shows each step, and a Stop button cancels instantly.'],
  ['No runaways', 'Every task is hard-capped at 25 actions.'],
  ['Ask before acting', 'Form submissions and downloads require your explicit confirmation.'],
  ['Your model', 'Choose BulleBrowser Pro, Balanced, or Fastest per task.'],
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
      <section className="bg-surface-dark text-ink-inverse">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            An agent that operates the browser, so you don&apos;t have to.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-inverse/70">
            {product.name} pairs a real, full-featured browser with a
            BulleBrowser-powered agent. It works the web the way a person does,
            reading, clicking, typing, and extracting, all in a deterministic,
            stoppable loop you can trust.
          </p>
        </div>
      </section>

      <Section eyebrow="Capabilities" title="It works the live web, not a stale index.">
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-secondary">
          The agent acts on the active tab, with the same pages, same logins,
          and same data you&apos;d see, through a focused set of actions:
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

      <Section eyebrow="Skills" title="Three flagship skills, and a general agent for the rest.">
        <div className="grid gap-10 md:grid-cols-3">
          {SKILLS.map((s) => (
            <div key={s.title}>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-[15px] font-medium text-ink-primary">{s.lede}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-2xl text-[15px] leading-relaxed text-ink-secondary">
          These three lead the way, among many other tasks the agent will take
          on. Pick a preset for a guided workflow, or just describe what you
          need in plain language and it works the live tab.
        </p>
      </Section>

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

      <Section eyebrow="Privacy" title="Bring your own key. Keep your own data.">
        <ul className="max-w-2xl space-y-3 text-[15px] leading-relaxed text-ink-secondary">
          <li>Your prompts go directly through your configured provider from your device.</li>
          <li>Your API key is encrypted in your operating system&apos;s keychain.</li>
          <li>History, bookmarks, and conversations stay on your device.</li>
          <li>No analytics. No telemetry.</li>
        </ul>
      </Section>

      <section className="bg-surface-dark text-ink-inverse">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Put the agent to work.</h2>
          <p className="mt-4 text-ink-inverse/80">Available for macOS, Windows, and Linux.</p>
        </div>
      </section>
    </>
  );
}
