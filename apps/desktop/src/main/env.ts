// Development convenience: load KEY=VALUE pairs from the nearest `.env` into
// process.env so a locally-configured ANTHROPIC_API_KEY "just works" without
// re-entering it in Settings. Packaged builds skip this entirely and rely on
// the OS-keychain key (safeStorage) entered in Settings — the secure path.
//
// Zero dependencies (no dotenv) so the frozen pnpm lockfile is untouched.
// Never overwrites an already-set environment variable.

import { app } from 'electron';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function applyEnvFile(file: string): void {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key || key in process.env) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

/**
 * Walk up from each start directory looking for a `.env` file and load it.
 * No-op in packaged builds.
 */
export function loadDotEnv(startDirs: string[]): void {
  if (app.isPackaged) return;
  const loaded = new Set<string>();
  for (const start of startDirs) {
    let dir = start;
    for (let depth = 0; depth < 6; depth++) {
      const file = join(dir, '.env');
      if (!loaded.has(file) && existsSync(file)) {
        loaded.add(file);
        applyEnvFile(file);
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
}
