'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { asset } from '@/lib/asset';
import { useT } from '@/lib/i18n';

// Deep navy, matching the dark band on the Workflows page, with white type.
// The mark is h-14, the same size as the header's, so the brand reads at one
// scale top and bottom. The link row is gone: the top bar already carries the
// navigation.
export function Footer() {
  const t = useT();
  return (
    <footer className="bg-surface-dark text-ink-inverse">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-12">
        <Link href="/" aria-label={product.name} className="flex items-center">
          <img
            src={asset('/wordmark-light.png')}
            alt={product.name}
            className="h-14 w-auto select-none"
            draggable={false}
          />
        </Link>
        <p className="max-w-xs text-sm text-ink-inverse/75">{t('footer.tagline')}.</p>
        <p className="mt-2 text-xs text-ink-inverse/65">
          © {new Date().getFullYear()} {product.vendor}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
