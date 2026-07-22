'use client';

import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { AgentPanel } from '@/components/AgentPanel';
import { useT } from '@/lib/i18n';

const SKILL_KEYS = ['page', 'nav', 'flow'] as const;

export default function HomePage() {
  const t = useT();
  return (
    <>
      {/* Hero: copy alongside the live agent panel. */}
      <section className="border-b border-line bg-surface-light">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[1.05fr_1fr] md:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface-light px-3 py-1 text-xs tracking-wide text-ink-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t('home.badge')} {product.vendor}
            </div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              {t('home.h1')}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-secondary">
              {t('home.sub')}
            </p>
          </div>

          <AgentPanel />
        </div>
      </section>

      {/* Three agentic skills. */}
      <section className="bg-surface-dark text-ink-inverse">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t('home.skills.eyebrow')}
          </div>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('home.skills.h2')}
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-inverse/80">
            {t('home.skills.body')}
          </p>
          <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-3">
            {SKILL_KEYS.map((k) => (
              <div key={k}>
                <h3 className="text-lg font-semibold">{t(`skill.${k}.title`)}</h3>
                <p className="mt-1 text-[15px] font-medium text-ink-inverse">{t(`skill.${k}.lede`)}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-inverse/80">{t(`skill.${k}.body`)}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Link
              href="/features"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('home.skills.explore')}
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy. */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('home.privacy.h2')}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-secondary">
            {t('home.privacy.body')}
          </p>
        </div>
      </section>
    </>
  );
}
