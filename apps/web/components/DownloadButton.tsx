'use client';

// Client component: detects the visitor's OS from navigator.userAgent and
// links to the matching installer from the latest GitHub Release. Falls
// back to the download page / releases page when nothing is published yet.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  detectPlatform,
  fetchLatestRelease,
  formatBytes,
  RELEASES_PAGE,
  type LatestRelease,
  type Platform,
} from '@/lib/releases';

const PLATFORM_LABEL: Record<Platform, string> = {
  'mac-arm64': 'Download for macOS (Apple Silicon)',
  'mac-x64': 'Download for macOS (Intel)',
  'win-x64': 'Download for Windows',
  'win-arm64': 'Download for Windows (ARM)',
  'linux-x64': 'Download for Linux',
  'linux-arm64': 'Download for Linux (ARM)',
};

export function DownloadButton({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  const [release, setRelease] = useState<LatestRelease | null>(null);
  const [platform, setPlatform] = useState<Platform>('mac-arm64');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform(navigator.userAgent));
    fetchLatestRelease()
      .then(setRelease)
      .finally(() => setLoaded(true));
  }, []);

  const cls =
    size === 'lg'
      ? 'rounded-md bg-primary px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-hover'
      : 'rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover';

  const asset = release?.downloadFor?.[platform];

  if (asset) {
    return (
      <div className="flex flex-col items-start gap-1">
        <a href={asset.browserDownloadUrl} className={cls}>
          {PLATFORM_LABEL[platform]}
        </a>
        <div className="text-xs text-ink-secondary">
          {release?.tagName} · {formatBytes(asset.size)} ·{' '}
          <Link href="/download" className="underline">
            all platforms
          </Link>
        </div>
      </div>
    );
  }

  // No matching asset: either nothing published yet, or this OS has no build.
  return (
    <div className="flex flex-col items-start gap-1">
      <Link href="/download" className={cls}>
        Download BulleBrowser
      </Link>
      <div className="text-xs text-ink-secondary">
        {loaded && !release ? (
          <>
            No public release yet —{' '}
            <a href={RELEASES_PAGE} className="underline">
              watch the releases page
            </a>
          </>
        ) : (
          <Link href="/download" className="underline">
            see all platforms
          </Link>
        )}
      </div>
    </div>
  );
}
