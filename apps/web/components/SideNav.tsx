'use client';

// The persistent left rail — a Comet-inspired vertical navigation that frames
// the whole site as a two-panel workspace (nav on the left, everything else on
// the right). The items are BulleBrowser's own, but each one maps onto an
// EXISTING route so no page or URL is lost in the redesign:
//
//   Home              → /            (landing + live agent panel)
//   Workflows         → /features    (the agentic skills / automations)
//   Guides & Tutorials→ /install     (getting-started walkthrough)
//   Projects          → /preview     (the agent at work on real screens)
//   Account & Settings→ /download    (get / manage the desktop app)
//   Help & Support    → /about       (who's behind it + contact)
//
// On desktop it's a fixed rail; below `lg` it collapses to a slide-over drawer
// opened by a hamburger, so the two-panel feel is preserved on big screens and
// degrades gracefully on small ones.

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { product } from '@bullebrowser/brand-tokens';
import { asset } from '@/lib/asset';

interface Item {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// Line icons, inlined so we pull in no icon dependency and stay inside the
// site's strict `default-src 'self'` CSP.
const I = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />
  ),
  workflow: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <path d="M10 6.5h4a3 3 0 0 1 3 3V14" />
    </>
  ),
  guide: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v4H6.5A2.5 2.5 0 0 1 4 19.5z" />
    </>
  ),
  projects: (
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h9a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19.5 19.5h-15A1.5 1.5 0 0 1 3 18z" />
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.6 1.3c0 1.7-2.1 2-2.1 3.2M12 17.2h.01" />
    </>
  ),
};

const ITEMS: Item[] = [
  { href: '/', label: 'Home', icon: I.home },
  { href: '/features', label: 'Workflows', icon: I.workflow },
  { href: '/install', label: 'Guides & Tutorials', icon: I.guide },
  { href: '/preview', label: 'Projects', icon: I.projects },
  { href: '/download', label: 'Account & Settings', icon: I.account },
  { href: '/about', label: 'Help & Support', icon: I.help },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);

  const list = (
    <nav className="flex flex-col gap-1 px-3">
      {ITEMS.map((it) => {
        const active = isActive(pathname, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={() => setOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={[
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-ink-secondary hover:bg-surface-muted hover:text-ink-primary',
            ].join(' ')}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {it.icon}
            </svg>
            <span className="truncate">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile: hamburger, fixed at the top-left, only below lg. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="fixed left-3 top-3 z-40 inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface-light/90 text-ink-primary backdrop-blur lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/* Desktop: fixed rail. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidenav-width)] flex-col border-r border-line bg-surface-light lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/" aria-label={product.name} className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset('/wordmark.png')} alt={product.name} className="h-11 w-auto select-none" draggable={false} />
          </Link>
        </div>
        <div className="mt-2 flex-1 overflow-y-auto pb-6">{list}</div>
        <div className="border-t border-line px-5 py-4 text-xs text-ink-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Agentic AI · {product.vendor}
          </span>
        </div>
      </aside>

      {/* Mobile drawer + scrim. */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-primary/30 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-[16rem] flex-col border-r border-line bg-surface-light shadow-xl">
            <div className="flex h-16 items-center justify-between px-5">
              <Link href="/" aria-label={product.name} onClick={() => setOpen(false)} className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset('/wordmark.png')} alt={product.name} className="h-10 w-auto select-none" draggable={false} />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-secondary hover:bg-surface-muted"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="mt-2 flex-1 overflow-y-auto pb-6">{list}</div>
          </div>
        </div>
      )}
    </>
  );
}
