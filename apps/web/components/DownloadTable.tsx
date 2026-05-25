'use client';

import { useEffect, useState } from 'react';
import {
  fetchLatestRelease,
  formatBytes,
  RELEASES_PAGE,
  type LatestRelease,
  type Platform,
} from '@/lib/releases';

const PLATFORMS: { key: Platform; label: string; req: string }[] = [
  { key: 'mac-arm64', label: 'macOS · Apple Silicon (.dmg)', req: 'macOS 12 or newer' },
  { key: 'mac-x64', label: 'macOS · Intel (.dmg)', req: 'macOS 12 or newer' },
  { key: 'win-x64', label: 'Windows 10/11 · x64 (.exe)', req: 'Windows 10 or newer' },
  { key: 'win-arm64', label: 'Windows · ARM64 (.exe)', req: 'Windows 11 ARM' },
  { key: 'linux-x64', label: 'Linux · x64 (.AppImage)', req: 'glibc 2.31+' },
  { key: 'linux-arm64', label: 'Linux · ARM64 (.AppImage)', req: 'glibc 2.31+' },
];

export function DownloadTable() {
  const [release, setRelease] = useState<LatestRelease | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchLatestRelease()
      .then(setRelease)
      .finally(() => setLoaded(true));
  }, []);

  return (
    <>
      <p className="mt-2 text-ink-secondary">
        {!loaded
          ? 'Checking for the latest release…'
          : release
            ? `Latest release: ${release.tagName} · published ${new Date(
                release.publishedAt,
              ).toLocaleDateString()}`
            : 'No public release has been published yet. '}
        {loaded && !release && (
          <a href={RELEASES_PAGE} className="text-primary underline">
            Watch the releases page
          </a>
        )}
      </p>
      <div className="mt-8 overflow-hidden rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-secondary">
            <tr>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Requirements</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">SHA-256</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {PLATFORMS.map((p) => {
              const asset = release?.downloadFor?.[p.key];
              return (
                <tr key={p.key} className="border-t border-line">
                  <td className="px-4 py-3">{p.label}</td>
                  <td className="px-4 py-3 text-ink-secondary">{p.req}</td>
                  <td className="px-4 py-3 text-ink-secondary">
                    {asset ? formatBytes(asset.size) : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">
                    {release?.checksumsAsset ? (
                      <a
                        href={release.checksumsAsset.browserDownloadUrl}
                        className="text-primary underline"
                      >
                        checksums.txt
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {asset ? (
                      <a
                        href={asset.browserDownloadUrl}
                        className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-ink-secondary">Unavailable</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
