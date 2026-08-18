'use client';

import { product } from '@bullebrowser/brand-tokens';
import { DownloadTable } from '@/components/DownloadTable';
import { Reveal } from '@/components/Reveal';
import { useT } from '@/lib/i18n';

// The Download page in the Bulle Consulting brand layout: a dark hero with a
// drifting blob, then the download table inside a clean white card.
export default function DownloadPage() {
  const t = useT();
  return (
    <>
      <section className="relative overflow-hidden bg-surface-dark text-ink-inverse">
        <div aria-hidden className="animate-blob pointer-events-none absolute -right-20 -top-16 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center md:py-24">
          <Reveal>
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
              {t('download.h1')} {product.name}
            </h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-inverse/80">{t('download.sub')}</p>
          </Reveal>
        </div>
      </section>

      <section className="bg-surface-light py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm md:p-8">
              <DownloadTable />
            </div>
          </Reveal>
          <p className="mt-6 text-center text-xs text-ink-secondary">{t('download.signed')}</p>
        </div>
      </section>
    </>
  );
}
