/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { asset } from '@/lib/asset';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface-light/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label={product.name} className="flex items-center">
          {/* Trimmed to the mark, so the box height IS the logo height.
              36px in a 56px bar keeps the wordmark inside it legible. */}
          <img
            src={asset('/wordmark.png')}
            alt={product.name}
            height={36}
            className="h-9 w-auto select-none"
            draggable={false}
          />
        </Link>
        <nav className="flex items-center gap-4 text-sm sm:gap-6">
          <Link href="/features" className="hidden text-ink-secondary hover:text-ink-primary sm:inline">
            Features
          </Link>
          <Link href="/preview" className="text-ink-secondary hover:text-ink-primary">
            Preview
          </Link>
          <Link href="/install" className="hidden text-ink-secondary hover:text-ink-primary sm:inline">
            Install
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
