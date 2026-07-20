/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { asset } from '@/lib/asset';
import { TranslationMenu } from './TranslationMenu';

// The site's only navigation. Home leads, then the sections, then Download,
// then the Translation picker. The tab labels stay constant across languages,
// as fixed section names, rather than translating with the page body.
//
// The bar is h-20 and the wordmark h-14, leaving 12px of clearance above and
// below so the mark sits centred and never crowds the hairline underneath. The
// footer mark uses the same h-14 so the two read as one brand size.
const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Workflows' },
  { href: '/install', label: 'Guides' },
  { href: '/download', label: 'Download' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface-light/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" aria-label={product.name} className="flex shrink-0 items-center">
          <img
            src={asset('/wordmark.png')}
            alt={product.name}
            className="h-14 w-auto select-none"
            draggable={false}
          />
        </Link>

        <nav className="flex items-center gap-4 text-sm sm:gap-6">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-ink-secondary transition-colors hover:text-ink-primary"
            >
              {l.label}
            </Link>
          ))}
          <TranslationMenu />
        </nav>
      </div>
    </header>
  );
}
