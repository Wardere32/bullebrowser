/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { product } from '@bullebrowser/brand-tokens';
import { asset } from '@/lib/asset';

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <img
            src={asset('/wordmark.png')}
            alt={product.name}
            height={40}
            className="h-10 w-auto select-none"
            draggable={false}
          />
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
