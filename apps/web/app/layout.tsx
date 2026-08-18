import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
// Self-hosted rather than fetched from Google at build time: next/font/google
// downloads the family during `next build`, which makes the build depend on
// reaching fonts.googleapis.com. @fontsource ships the files in the package.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { product } from '@bullebrowser/brand-tokens';
import { LocaleProvider } from '@/lib/i18n';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

// Content-Security-Policy enforced in the browser via <meta http-equiv>.
// (GitHub Pages can't set HTTP response headers, and only CSP is widely
// honored as a meta directive, X-Content-Type-Options and
// Permissions-Policy are HTTP-header-only and would need a CDN proxy
// like Cloudflare to be effective.)
//
// 'unsafe-inline' for script-src/style-src is required by Next's static
// export hydration; everything else is restricted.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // connect-src must include api.github.com so the Download button can
  // resolve the latest release; github.com for any other XHR to releases.
  "connect-src 'self' https://api.github.com https://github.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Kept so the intent travels with the policy, but note: browsers are
  // REQUIRED to ignore frame-ancestors (along with sandbox and report-uri)
  // when the policy is delivered via <meta http-equiv>, it only bites as a
  // real HTTP response header. So this is not clickjacking protection today;
  // that needs response headers from a CDN proxy in front of Pages.
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

export const metadata: Metadata = {
  title: { default: product.name, template: `%s · ${product.name}` },
  description: product.tagline,
  metadataBase: new URL(`https://${product.domain}`),
  openGraph: {
    title: product.name,
    description: product.tagline,
    url: `https://${product.domain}`,
    siteName: product.name,
    type: 'website',
  },
  robots: { index: true, follow: true },
  // Renders as <meta name="referrer">, the W3C-standard way for this one
  // header (browsers honor it via that name).
  referrer: 'strict-origin-when-cross-origin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrains.variable}`}>
      <head>
        {/* http-equiv (not name), this is what browsers actually enforce. */}
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
      </head>
      <body className="bg-surface-light text-ink-primary antialiased">
        <LocaleProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
