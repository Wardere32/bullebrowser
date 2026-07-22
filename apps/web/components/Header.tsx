'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { product } from '@bullebrowser/brand-tokens';
import { asset } from '@/lib/asset';
import { TranslationMenu } from './TranslationMenu';

// The site's only navigation. Home leads, then the sections, then Download,
// then the Translation picker. The tab labels stay constant across languages,
// as fixed section names, rather than translating with the page body. The item
// for the page you're on is highlighted with the same teal box the Download
// button uses, so the active section is obvious.
//
// The bar is h-20 and the wordmark h-12 — a middle size between the original
// and the larger trial — leaving 16px of clearance above and below so the mark
// sits centred and never crowds the hairline underneath. The footer mark uses
// the same h-12 so the two read as one brand size.
const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Workflows' },
  { href: '/install', label: 'Guides' },
  { href: '/download', label: 'Download' },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface-light/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" aria-label={product.name} className="flex shrink-0 items-center">
          <img
            src={asset('/wordmark.png')}
            alt={product.name}
            className="h-12 w-auto select-none"
            draggable={false}
          />
        </Link>

        <nav className="flex items-center gap-1 text-[15px] sm:gap-2">
          {LINKS.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  active
                    ? 'bg-primary font-semibold text-white shadow-sm hover:bg-primary-hover'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <TranslationMenu />
        </nav>
      </div>
    </header>
  );
}
