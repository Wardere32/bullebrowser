'use client';

import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { Reveal } from '@/components/Reveal';
import { useT } from '@/lib/i18n';

const TOOL_KEYS = ['navigate', 'read', 'click', 'extract', 'tabs', 'wait'];
const SKILL_KEYS = ['page', 'nav', 'flow'];
const CONTROL_KEYS = ['control', 'runaway', 'ask', 'model'];

// The Workflows page in the Bulle Consulting brand layout + motion: a dark hero
// with a drifting blob, white feature cards that lift on hover, the signature
// dark slate-card panel for the skills, and reveal-on-scroll throughout.
export default function FeaturesPage() {
  const t = useT();
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-dark text-ink-inverse">
        <div aria-hidden className="animate-blob pointer-events-none absolute -right-24 -top-16 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center md:py-28">
          <Reveal>
            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tighter sm:text-5xl">
              {t('features.h1')}
            </h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-inverse/80">
              {t('features.sub')}
            </p>
          </Reveal>
          <Reveal delay={180}>
            <Link
              href="/download"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-primary-hover"
            >
              {t('download.h1')} {product.name}
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Capabilities — white cards. */}
      <section className="bg-surface-light py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t('features.cap.eyebrow')}
            </div>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              {t('features.cap.title')}
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-secondary">
              {t('features.cap.body')}
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOL_KEYS.map((k, i) => (
              <Reveal key={k} delay={i * 60}>
                <div className="h-full rounded-2xl border border-line bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                  <div className="text-sm font-semibold text-ink-primary">{t(`features.tool.${k}.t`)}</div>
                  <div className="mt-1 text-sm text-ink-secondary">{t(`features.tool.${k}.d`)}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Skills — the signature dark slate-card panel. */}
      <section className="bg-surface-light pb-20 md:pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="rounded-3xl bg-surface-dark p-8 text-ink-inverse md:p-12">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t('features.skills.eyebrow')}
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {t('features.skills.title')}
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {SKILL_KEYS.map((k) => (
                  <div
                    key={k}
                    className="rounded-3xl border border-slate-700 bg-slate-800/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
                  >
                    <h3 className="text-lg font-semibold">{t(`skill.${k}.title`)}</h3>
                    <p className="mt-1 text-sm font-medium text-primary">{t(`skill.${k}.lede`)}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-ink-inverse/75">
                      {t(`skill.${k}.body`)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-ink-inverse/70">
                {t('features.skills.foot')}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Controls — white cards on a muted band. */}
      <section className="bg-surface-muted py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t('features.ctrl.eyebrow')}
            </div>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              {t('features.ctrl.title')}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {CONTROL_KEYS.map((k, i) => (
              <Reveal key={k} delay={i * 60}>
                <div className="h-full rounded-2xl border border-line bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                  <div className="text-sm font-semibold text-ink-primary">{t(`features.ctrl.${k}.t`)}</div>
                  <div className="mt-1 text-sm text-ink-secondary">{t(`features.ctrl.${k}.d`)}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy — white card with bullets. */}
      <section className="bg-surface-light py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <div className="rounded-3xl border border-line bg-white p-8 shadow-sm md:p-10">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t('features.priv.eyebrow')}
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {t('features.priv.title')}
              </h2>
              <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-ink-secondary">
                {['1', '2', '3', '4'].map((n) => (
                  <li key={n} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {t(`features.priv.${n}`)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA. */}
      <section className="relative overflow-hidden bg-surface-dark text-ink-inverse">
        <div aria-hidden className="animate-blob pointer-events-none absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('features.cta.h2')}</h2>
            <p className="mt-4 text-ink-inverse/80">{t('features.cta.sub')}</p>
            <Link
              href="/download"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-primary-hover"
            >
              {t('download.h1')} {product.name}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
