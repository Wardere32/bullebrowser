// Download metadata is baked into a static manifest at build time so the
// site does not depend on the browser hitting the unauthenticated GitHub API.
// We still keep a live API fallback for local/dev cases where the manifest
// is missing.

import { basePath } from '@/lib/asset';

export type Platform =
  | 'mac-universal'
  | 'mac-arm64'
  | 'mac-x64'
  | 'win-x64'
  | 'win-arm64'
  | 'linux-x64'
  | 'linux-arm64';

export interface ReleaseAsset {
  name: string;
  browserDownloadUrl: string;
  size: number;
  /** Tag of the release this asset came from. */
  tag: string;
}

export interface Downloads {
  /** Newest published release tag (for display). */
  latestTag: string | null;
  publishedAt: string | null;
  /** Best available installer per platform, newest-first across releases. */
  forPlatform: Partial<Record<Platform, ReleaseAsset>>;
  /** checksums.txt from the newest release that has one. */
  checksumsUrl: string | null;
  /** True when the newest release is at or above the agentic AI baseline. */
  agentReady: boolean;
  /** Minimum tag expected for the production agentic AI foundation. */
  agentMinTag: string;
  /** HTML page URL for the newest published release. */
  latestReleaseUrl: string | null;
  /** True only if the GitHub API could not be reached at all. */
  apiUnavailable: boolean;
}

export const REPO_OWNER =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_REPO_OWNER) ||
  'wardere83';
export const REPO_NAME =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_REPO_NAME) ||
  'bullebrowser';
export const RELEASES_PAGE = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;
export const AGENT_MIN_TAG = 'v0.2.0';
const LOCAL_MANIFEST_PATH = `${basePath}/releases-manifest.json`;

interface RawAsset {
  name: string;
  browser_download_url: string;
  size: number;
}
interface RawRelease {
  tag_name: string;
  published_at: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  assets: RawAsset[];
}

interface ReleaseManifest {
  generatedAt: string;
  releases: RawRelease[];
}

function semverParts(tag: string): [number, number, number] | null {
  const match = tag.trim().match(/^v?(\d+)\.(\d+)\.(\d+)/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function semverGte(tag: string, minimum: string): boolean {
  const t = semverParts(tag);
  const m = semverParts(minimum);
  if (!t || !m) return false;
  if (t[0] !== m[0]) return t[0] > m[0];
  if (t[1] !== m[1]) return t[1] > m[1];
  return t[2] >= m[2];
}

function classify(name: string): Platform | null {
  const n = name.toLowerCase();
  if (n.endsWith('.dmg') || n.endsWith('.zip')) {
    if (n.includes('universal')) return 'mac-universal';
    return n.includes('arm64') ? 'mac-arm64' : 'mac-x64';
  }
  if (n.endsWith('.exe')) return n.includes('arm64') ? 'win-arm64' : 'win-x64';
  if (n.endsWith('.appimage')) return n.includes('arm64') ? 'linux-arm64' : 'linux-x64';
  return null;
}

function downloadsFromReleases(releases: RawRelease[], apiUnavailable: boolean): Downloads {
  const published = releases
    .filter((r) => !r.draft)
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );

  const latest = published[0] ?? null;
  const latestTag = latest?.tag_name ?? null;
  const forPlatform: Downloads['forPlatform'] = {};
  const checksumsUrl =
    latest?.assets.find((asset) => /checksum/i.test(asset.name))?.browser_download_url ?? null;

  for (const rel of published) {
    for (const a of rel.assets) {
      const platform = classify(a.name);
      if (platform && !forPlatform[platform]) {
        forPlatform[platform] = {
          name: a.name,
          browserDownloadUrl: a.browser_download_url,
          size: a.size,
          tag: rel.tag_name,
        };
      }
    }
  }

  return {
    latestTag,
    publishedAt: latest?.published_at ?? null,
    forPlatform,
    checksumsUrl,
    agentReady: latestTag ? semverGte(latestTag, AGENT_MIN_TAG) : false,
    agentMinTag: AGENT_MIN_TAG,
    latestReleaseUrl: latest?.html_url ?? null,
    apiUnavailable,
  };
}

export async function fetchDownloads(): Promise<Downloads> {
  try {
    const manifestRes = await fetch(LOCAL_MANIFEST_PATH, { cache: 'no-store' });
    if (manifestRes.ok) {
      const manifest = (await manifestRes.json()) as ReleaseManifest;
      if (Array.isArray(manifest.releases)) {
        return downloadsFromReleases(manifest.releases, false);
      }
    }
  } catch {
    // Fall through to the live API.
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=15`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );
    if (!res.ok) {
      return downloadsFromReleases([], res.status >= 500 || res.status === 403);
    }
    return downloadsFromReleases((await res.json()) as RawRelease[], false);
  } catch {
    return downloadsFromReleases([], true);
  }
}

export function detectPlatform(userAgent: string): Platform {
  const ua = userAgent.toLowerCase();
  // macOS user-agents report "Intel" even on Apple Silicon, so we can't tell
  // the arch from UA. Default to Apple Silicon (the common case today) and let
  // the UI surface the Intel option alongside it.
  if (ua.includes('mac')) return 'mac-arm64';
  if (ua.includes('win')) return ua.includes('arm') ? 'win-arm64' : 'win-x64';
  if (ua.includes('linux') && ua.includes('aarch64')) return 'linux-arm64';
  if (ua.includes('android')) return 'linux-arm64'; // best-effort; mobile unsupported
  return 'linux-x64';
}

export function platformFamily(p: Platform): 'mac' | 'win' | 'linux' {
  if (p.startsWith('mac')) return 'mac';
  if (p.startsWith('win')) return 'win';
  return 'linux';
}

export function isMobileUA(userAgent: string): boolean {
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}
