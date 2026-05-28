import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { product } from '@bullebrowser/brand-tokens';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

// Security headers for a static site on GitHub Pages.
// GitHub Pages doesn't let us set HTTP response headers, so the meaningful
// ones go in via <meta http-equiv>. HTTPS itself is handled by GitHub's
// Let's Encrypt cert + the "Enforce HTTPS" toggle in Pages settings.
//
// CSP is strict but allows what Next's static export actually needs:
// inline scripts/styles for hydration, fonts/CSS bundled under /_next, and
// the GitHub Releases API the Download button fetches at runtime.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.github.com https://github.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
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
  referrer: 'strict-origin-when-cross-origin',
  other: {
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Permissions-Policy':
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-screen flex-col bg-surface-light text-ink-primary antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
