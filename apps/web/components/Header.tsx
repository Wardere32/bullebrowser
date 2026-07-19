/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { asset } from '@/lib/asset';

// The top bar of the main column. It sits to the RIGHT of the fixed left rail
// on desktop, so the wordmark here only appears below `lg` (where the rail is
// a hidden drawer and the logo would otherwise vanish). On desktop the bar
// carries the secondary links and the primary Download CTA; the rail owns the
// brand mark. The bar is taller (h-16) and the logo larger (h-11) than before,
// per the site-wide logo bump.
export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface-light/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Mobile-only wordmark, centered clear of the fixed hamburger. */}
        <Link
          href="/"
          aria-label={product.name}
          className="flex items-center pl-11 lg:hidden"
        >
          <img
            src={asset('/wordmark.png')}
            alt={product.name}
            className="h-11 w-auto select-none"
            draggable={false}
          />
        </Link>

        {/* Desktop spacer keeps the CTA cluster right-aligned. */}
        <div className="hidden lg:block" />

        <nav className="flex items-center gap-4 text-sm sm:gap-6">
          <Link href="/features" className="hidden text-ink-secondary hover:text-ink-primary sm:inline">
            Workflows
          </Link>
          <Link href="/preview" className="hidden text-ink-secondary hover:text-ink-primary sm:inline">
            Projects
          </Link>
          <Link href="/install" className="hidden text-ink-secondary hover:text-ink-primary sm:inline">
            Guides
          </Link>
          <Link
            href="/download"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Download
          </Link>
        </nav>
      </div>
    </header>
  );
}
