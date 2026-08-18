import type { Metadata } from 'next';
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Install & setup',
  description: `How to install ${product.name} and turn on the AI agent.`,
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white">
        {n}
      </div>
      <div className="pb-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="mt-1 text-sm text-ink-secondary [&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px]">
          {children}
        </div>
      </div>
    </div>
  );
}

// The Guides page in the Bulle Consulting brand layout: a dark hero with a
// drifting blob, then the setup steps as cards that lift on hover, revealing on
// scroll. All the instructional copy is unchanged.
export default function InstallPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-surface-dark text-ink-inverse">
        <div aria-hidden className="animate-blob pointer-events-none absolute -left-20 -top-16 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
          <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">Install {product.name}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-inverse/80">
            From download to a working AI agent in a few minutes. No technical
            background needed.
          </p>
        </div>
      </section>

      <section className="bg-surface-light py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-5">
            <Reveal>
              <Step n={1} title="Open the installer">
                <p>
                  <strong>macOS:</strong> open the <code>.dmg</code>, drag
                  BulleBrowser into Applications, and double-click to launch. Official
                  releases are Developer ID-signed and notarized by Apple, so they open
                  normally. (Building from source? A dev build isn’t notarized, so
                  right-click → Open → Open, or run{' '}
                  <code>xattr -dr com.apple.quarantine /Applications/BulleBrowser.app</code>.)
                </p>
                <p className="mt-2">
                  <strong>Windows:</strong> run the <code>.exe</code>; if SmartScreen
                  appears, click <strong>More info → Run anyway</strong>.
                </p>
                <p className="mt-2">
                  <strong>Linux:</strong> <code>chmod +x BulleBrowser-*.AppImage</code>{' '}
                  then run it.
                </p>
              </Step>
            </Reveal>

            <Reveal delay={80}>
              <Step n={2} title="Add your BulleBrowser AI key">
                <p>
                  BulleBrowser is bring-your-own-key, so your prompts go straight to
                  your configured provider account from your device. Add a supported
                  key (current format starts with <code>sk-ant-</code>), then in BulleBrowser open the
                  profile menu → <strong>Settings</strong> → paste it → Save. It’s
                  stored encrypted in your OS keychain.
                </p>
              </Step>
            </Reveal>

            <Reveal delay={160}>
              <Step n={3} title="Open the AI panel and pick a skill">
                <p>
                  Press <code>Ctrl/Cmd + Shift + A</code> (or click <strong>AI</strong>),
                  choose a preset Skill (Grant scanner, RFP comparator, or
                  Compliance review), and describe your task. The agent drives the
                  tabs and hands back a results table.
                </p>
              </Step>
            </Reveal>
          </div>

          <Reveal>
            <div className="mt-10 rounded-2xl border border-line bg-surface-muted p-5 text-sm">
              <div className="font-semibold">Why the safety prompt?</div>
              <p className="mt-1 text-ink-secondary">
                The installers are currently unsigned (no paid developer
                certificate yet), so macOS and Windows show a one-time warning. The
                steps above are the standard way to launch unsigned apps.
              </p>
            </div>
          </Reveal>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/features" className="font-medium text-primary underline">
              What the agent can do
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
