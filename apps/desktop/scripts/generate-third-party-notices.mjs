#!/usr/bin/env node
/**
 * Builds the third-party-notices.json consumed by the in-app About page.
 *
 * The list reflects the open-source libraries that actually ship inside the
 * BulleBrowser binary — the renderer libraries and workspace packages that
 * Vite bundles plus the externalized main-process runtime deps. Pure build
 * tooling (Vite, electron-builder, TypeScript, ESLint, type stubs, etc.)
 * does not ship and is excluded.
 *
 * We read the *declared direct dependencies* from each workspace package.json
 * (not the full transitive tree) so the "Built with" list stays meaningful,
 * then resolve each package's installed version + license from node_modules.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const desktopDir = resolve(__dirname, '..');
const repoRoot = resolve(desktopDir, '../..');
const outPath = resolve(desktopDir, 'out/renderer/third-party-notices.json');
const require = createRequire(import.meta.url);

// package.json files whose declared dependencies contribute shipped code.
const manifests = [
  resolve(desktopDir, 'package.json'),
  resolve(repoRoot, 'packages/agent-core/package.json'),
  resolve(repoRoot, 'packages/brand-tokens/package.json'),
];

// Direct build-tooling deps that never ship in the binary.
const BUILD_TOOLING = new Set([
  'electron',
  'electron-builder',
  'electron-vite',
  'vite',
  'vitest',
  '@vitejs/plugin-react',
  '@vitest/coverage-v8',
  'typescript',
  'license-checker',
  'postcss',
  'autoprefixer',
  'tailwindcss',
]);

const isExcluded = (name) =>
  BUILD_TOOLING.has(name) ||
  name.startsWith('@types/') ||
  name.startsWith('@bullebrowser/'); // first-party, not third-party

const declared = new Set();
for (const manifestPath of manifests) {
  if (!existsSync(manifestPath)) continue;
  const pkg = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
    if (!isExcluded(dep)) declared.add(dep);
  }
}

function readPkgMeta(name) {
  // Resolve the package.json by direct filesystem path first — many ESM-only
  // packages restrict their "exports" map and block require.resolve of
  // ./package.json, so we look it up where pnpm links it.
  const candidates = [
    resolve(desktopDir, 'node_modules', name, 'package.json'),
    resolve(repoRoot, 'node_modules', name, 'package.json'),
    resolve(repoRoot, 'packages/agent-core/node_modules', name, 'package.json'),
    resolve(repoRoot, 'packages/brand-tokens/node_modules', name, 'package.json'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf-8'));
  }
  // Fall back to resolving the package entry, then walking up to its root.
  try {
    const entry = require.resolve(name, { paths: [desktopDir, repoRoot] });
    let dir = dirname(entry);
    for (let i = 0; i < 6; i++) {
      const p = resolve(dir, 'package.json');
      if (existsSync(p)) {
        const meta = JSON.parse(readFileSync(p, 'utf-8'));
        if (meta.name === name) return meta;
      }
      dir = dirname(dir);
    }
  } catch {
    /* not resolvable */
  }
  return null;
}

function licenseFor(name) {
  const meta = readPkgMeta(name);
  if (!meta) return { version: '', license: 'UNKNOWN' };
  const license =
    typeof meta.license === 'string'
      ? meta.license
      : meta.license?.type ??
        (Array.isArray(meta.licenses) ? meta.licenses[0]?.type : undefined) ??
        'SEE LICENSE';
  return { version: meta.version ?? '', license };
}

const notices = [...declared]
  .map((name) => ({ name, ...licenseFor(name) }))
  .sort((a, b) => a.name.localeCompare(b.name));

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(notices, null, 2));
console.log(`[notices] wrote ${notices.length} shipped-dependency entries to ${outPath}`);
