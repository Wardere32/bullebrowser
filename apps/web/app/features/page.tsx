'use client';

import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { useT } from '@/lib/i18n';

const TOOL_KEYS = ['navigate', 'read', 'click', 'extract', 'tabs', 'wait'];

const SKILL_KEYS = ['page', 'nav', 'flow'];

const CONTROL_KEYS = ['control', 'runaway', 'ask', 'model'];

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
  const t = useT();
  return (
    <>
      <section className="bg-surface-dark text-ink-inverse">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {t('features.h1')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-inverse/70">
            {t('features.sub')}
          </p>
        </div>
      </section>

      <Section eyebrow={t('features.cap.eyebrow')} title={t('features.cap.title')}>
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-secondary">
          {t('features.cap.body')}
        </p>
        <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {TOOL_KEYS.map((k) => (
            <div key={k}>
              <div className="text-sm font-semibold">{t(`features.tool.${k}.t`)}</div>
              <div className="mt-1 text-sm text-ink-secondary">{t(`features.tool.${k}.d`)}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow={t('features.skills.eyebrow')} title={t('features.skills.title')}>
        <div className="grid gap-10 md:grid-cols-3">
          {SKILL_KEYS.map((k) => (
            <div key={k}>
              <h3 className="text-lg font-semibold">{t(`skill.${k}.title`)}</h3>
              <p className="mt-1 text-[15px] font-medium text-ink-primary">{t(`skill.${k}.lede`)}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">{t(`skill.${k}.body`)}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-2xl text-[15px] leading-relaxed text-ink-secondary">
          {t('features.skills.foot')}
        </p>
      </Section>

      <Section eyebrow={t('features.ctrl.eyebrow')} title={t('features.ctrl.title')}>
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {CONTROL_KEYS.map((k) => (
            <div key={k}>
              <div className="text-sm font-semibold">{t(`features.ctrl.${k}.t`)}</div>
              <div className="mt-1 text-sm text-ink-secondary">{t(`features.ctrl.${k}.d`)}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow={t('features.priv.eyebrow')} title={t('features.priv.title')}>
        <ul className="max-w-2xl space-y-3 text-[15px] leading-relaxed text-ink-secondary">
          <li>{t('features.priv.1')}</li>
          <li>{t('features.priv.2')}</li>
          <li>{t('features.priv.3')}</li>
          <li>{t('features.priv.4')}</li>
        </ul>
      </Section>

      <section className="bg-surface-dark text-ink-inverse">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('features.cta.h2')}</h2>
          <p className="mt-4 text-ink-inverse/80">{t('features.cta.sub')}</p>
        </div>
      </section>
    </>
  );
}
