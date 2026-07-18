/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { asset } from '@/lib/asset';

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          {/* Identical to the header logo: same 36px height, same wrapper, same
              link-home behavior, so the mark reads the same and sits on the
              same left gridline (both containers are mx-auto max-w-6xl px-6) in
              the top and bottom chrome. */}
          <Link href="/" aria-label={product.name} className="flex items-center">
            <img
              src={asset('/wordmark.png')}
              alt={product.name}
              height={36}
              className="h-9 w-auto select-none"
              draggable={false}
            />
          </Link>
          <p className="max-w-xs text-sm text-ink-secondary">{product.tagline}.</p>
          <p className="mt-2 text-xs text-ink-secondary">
            © {new Date().getFullYear()} {product.vendor}. All rights reserved.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-secondary">
          <Link href="/features" className="hover:text-ink-primary">
            Features
          </Link>
          <Link href="/preview" className="hover:text-ink-primary">
            Preview
          </Link>
          <Link href="/download" className="hover:text-ink-primary">
            Download
          </Link>
          <Link href="/install" className="hover:text-ink-primary">
            Install
          </Link>
          <Link href="/privacy" className="hover:text-ink-primary">
            Privacy
          </Link>
          <Link href="/about" className="hover:text-ink-primary">
            About
          </Link>
          <a href={`mailto:${product.contactEmail}`} className="hover:text-ink-primary">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
