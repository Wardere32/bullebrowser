import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repoOwner = process.env.NEXT_PUBLIC_REPO_OWNER || 'wardere83';
const repoName = process.env.NEXT_PUBLIC_REPO_NAME || 'bullebrowser';
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

const headers = {
  Accept: 'application/vnd.github+json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const url = `https://api.github.com/repos/${repoOwner}/${repoName}/releases?per_page=15`;
const outDir = path.resolve('public');
const outFile = path.join(outDir, 'releases-manifest.json');

async function main() {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch releases: ${res.status} ${res.statusText}`);
  }

  const releases = await res.json();
  await mkdir(outDir, { recursive: true });
  await writeFile(
    outFile,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), releases }, null, 2)}\n`,
    'utf8',
  );
  console.log(`Wrote ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});