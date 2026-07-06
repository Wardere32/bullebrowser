/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { asset } from '@/lib/asset';
import { DownloadButton } from '@/components/DownloadButton';

export const metadata: Metadata = {
  title: 'Preview',
  description: `See ${product.name}'s actual screens — the browser chrome and the AI agent at work.`,
};

const SHOTS = [
  {
    src: '/screenshots/first-open.png',
    title: 'First launch',
    caption:
      'A fresh tab on the start page with the assistant panel open — the welcome state introduces the three flagship skills, and the composer is ready for any task you type.',
  },
  {
    src: '/screenshots/grant-scanner.png',
    title: 'The agent at work — Page assistant',
    caption:
      'The agent running live against a page: your prompt, its plan, the step-by-step tool feed (navigate → type → click → wait_for → extract), and an in-progress results table — with a Stop button always available.',
  },
];

export default function PreviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold">Inside {product.name}</h1>
      <p className="mt-2 max-w-2xl text-ink-secondary">
        These are the actual application screens — the browser chrome on the
        left, the AI agent panel on the right. This is what you see once the
        app is installed and open.
      </p>

      <div className="mt-10 space-y-14">
        {SHOTS.map((s) => (
          <figure key={s.src}>
            <div className="overflow-hidden rounded-xl border border-line shadow-sm">
              <img src={asset(s.src)} alt={s.title} className="block w-full" />
            </div>
            <figcaption className="mt-3">
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="mt-1 max-w-3xl text-sm text-ink-secondary">{s.caption}</div>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-14 rounded-lg border border-line bg-surface-muted p-6">
        <div className="text-lg font-semibold">Ready to try it yourself?</div>
        <p className="mt-1 text-sm text-ink-secondary">
          Free download for macOS, Windows, and Linux. Bring your own AI key if
          you want external synthesis later.
        </p>
        <div className="mt-4">
          <DownloadButton />
        </div>
        <div className="mt-3 text-sm">
          <Link href="/install" className="text-primary underline">
            Read the install &amp; setup guide
          </Link>
        </div>
      </div>
    </div>
  );
}
