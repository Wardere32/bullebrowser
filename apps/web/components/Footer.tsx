'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { asset } from '@/lib/asset';
import { useT } from '@/lib/i18n';

// Dark footer (dark-gray #142127) in the Bulle Consulting style: the light
// wordmark and tagline on the left, a quick-links column on the right, and the
// copyright on a hairline below.
export function Footer() {
  const t = useT();
  return (
    <footer className="bg-surface-dark text-ink-inverse">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-xs">
            <Link href="/" aria-label={product.name} className="flex items-center">
              <img
                src={asset('/wordmark-light.png')}
                alt={product.name}
                className="h-11 w-auto select-none"
                draggable={false}
              />
            </Link>
            <p className="mt-4 text-sm text-ink-inverse/70">{t('footer.tagline')}.</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm text-ink-inverse/70">
            <Link href="/features" className="transition-colors hover:text-white">Workflows</Link>
            <Link href="/install" className="transition-colors hover:text-white">Guides</Link>
            <Link href="/download" className="transition-colors hover:text-white">Download</Link>
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
          </nav>
        </div>
        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-ink-inverse/55">
          © {new Date().getFullYear()} {product.vendor}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
