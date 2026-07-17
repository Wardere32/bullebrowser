'use client';

// Resolves the right installer for the visitor's OS from the GitHub
// Releases API (scanning recent releases so a partial release never leaves
// anyone without a download), and always falls back to a working link.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  detectPlatform,
  fetchDownloads,
  formatBytes,
  isMobileUA,
  platformFamily,
  RELEASES_PAGE,
  type Downloads,
  type Platform,
} from '@/lib/releases';

const LABEL: Record<Platform, string> = {
  'mac-universal': 'Download for macOS · Universal',
  'mac-arm64': 'Download for macOS · Apple Silicon',
  'mac-x64': 'Download for macOS · Intel',
  'win-x64': 'Download for Windows',
  'win-arm64': 'Download for Windows · ARM',
  'linux-x64': 'Download for Linux',
  'linux-arm64': 'Download for Linux · ARM',
};

export function DownloadButton({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  const [dl, setDl] = useState<Downloads | null>(null);
  const [platform, setPlatform] = useState<Platform>('mac-arm64');
  const [mobile, setMobile] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform(navigator.userAgent));
    setMobile(isMobileUA(navigator.userAgent));
    fetchDownloads()
      .then(setDl)
      .finally(() => setLoaded(true));
  }, []);

  const effectivePlatform: Platform =
    platformFamily(platform) === 'mac' && dl?.forPlatform?.['mac-universal']
      ? 'mac-universal'
      : platform;

  const primary = dl?.forPlatform?.[effectivePlatform];
  const macAlt =
    platformFamily(platform) === 'mac' && effectivePlatform !== 'mac-universal'
      ? dl?.forPlatform?.[platform === 'mac-arm64' ? 'mac-x64' : 'mac-arm64']
      : undefined;

  const cls =
    size === 'lg'
      ? 'inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover'
      : 'inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover';

  if (mobile) {
    return (
      <div className="flex flex-col items-start gap-1">
        <Link href="/download" className={cls}>
          See desktop downloads
        </Link>
        <div className="text-xs text-ink-secondary">
          BulleBrowser is a desktop app (macOS, Windows, Linux). Open this page
          on your computer to install.
        </div>
      </div>
    );
  }

  if (primary) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <a href={primary.browserDownloadUrl} className={cls} target="_blank" rel="noopener noreferrer">
          {LABEL[effectivePlatform]}
        </a>
        <div className="text-xs text-ink-secondary">
          {primary.tag} · {formatBytes(primary.size)}
          {dl && (
            <>
              {' · '}
              <span className={dl.agentReady ? 'text-emerald-700' : 'text-amber-700'}>
                {dl.agentReady
                  ? 'Agentic browser ready'
                  : `Agentic browser baseline ${dl.agentMinTag}+`}
              </span>
            </>
          )}
          {macAlt && (
            <>
              {' · '}
              <a href={macAlt.browserDownloadUrl} className="underline" target="_blank" rel="noopener noreferrer">
                {platform === 'mac-arm64' ? 'Intel Mac' : 'Apple Silicon'}
              </a>
            </>
          )}
          {' · '}
          <Link href="/download" className="underline">
            all platforms
          </Link>
          {' · '}
          <Link href="/install" className="underline">
            install help
          </Link>
        </div>
      </div>
    );
  }

  // No matching asset / API issue: always give a working path forward.
  return (
    <div className="flex flex-col items-start gap-1.5">
      <a href={RELEASES_PAGE} className={cls} target="_blank" rel="noopener noreferrer">
        Download BulleBrowser
      </a>
      <div className="text-xs text-ink-secondary">
        {loaded && dl?.apiUnavailable
          ? 'Live version check is busy; '
          : loaded && !dl?.latestTag
            ? 'Preparing the first public release; '
            : ''}
          {loaded && dl?.latestTag && !dl.agentReady ? `Latest is ${dl.latestTag}; ` : ''}
        <a href={RELEASES_PAGE} className="underline" target="_blank" rel="noopener noreferrer">
          all releases on GitHub
        </a>
        {' · '}
        <Link href="/download" className="underline">
          platforms &amp; checksums
        </Link>
      </div>
    </div>
  );
}
