/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface-light/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label={product.name} className="flex items-center">
          <img
            src="/wordmark.png"
            alt={product.name}
            height={28}
            className="h-7 w-auto select-none"
            draggable={false}
          />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/features" className="text-ink-secondary hover:text-ink-primary">
            Features
          </Link>
          <Link href="/privacy" className="text-ink-secondary hover:text-ink-primary">
            Privacy
          </Link>
          <Link href="/about" className="text-ink-secondary hover:text-ink-primary">
            About
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
