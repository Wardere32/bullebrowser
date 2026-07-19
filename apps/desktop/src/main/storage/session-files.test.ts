import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// A real temp userData dir, so the retention sweep is exercised against actual
// files on disk rather than a mock of the filesystem.
let userData: string;

vi.mock('electron', () => ({
  app: { getPath: () => userData },
}));

// electron-store, reduced to the get/set pair this store actually uses, backed
// by a plain object that resets between tests.
vi.mock('./store.js', () => ({
  createStore: <T extends Record<string, unknown>>(_name: string, defaults: T) => {
    let data: Record<string, unknown> = { ...defaults };
    return {
      get: (k: string) => data[k],
      set: (k: string, v: unknown) => {
        data[k] = v;
      },
      _reset: () => {
        data = { ...defaults };
      },
    };
  },
}));

// Imported after the mocks so the module picks them up.
const { sessionFileStore, RETENTION_MS } = await import('./session-files.js');

function makeSource(name: string, body = 'hello'): string {
  const dir = mkdtempSync(join(tmpdir(), 'bb-src-'));
  const p = join(dir, name);
  writeFileSync(p, body);
  return p;
}

beforeEach(() => {
  userData = mkdtempSync(join(tmpdir(), 'bb-userdata-'));
  mkdirSync(join(userData, 'session-files'), { recursive: true });
  // Clear the registry between tests.
  (sessionFileStore as unknown as { store: { _reset(): void } }).store._reset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('sessionFileStore.add', () => {
  it('copies the bytes in and records metadata with an 8-day expiry', () => {
    const [meta] = sessionFileStore.add([makeSource('notes.md', 'body')]);
    expect(meta).toBeDefined();
    expect(meta!.name).toBe('notes.md');
    expect(meta!.isText).toBe(true);
    expect(meta!.expiresAt - meta!.addedAt).toBe(RETENTION_MS);
    expect(sessionFileStore.excerpt(meta!.id)).toBe('body');
  });

  it('classifies a dotfile as text (extname(".env") is empty)', () => {
    const [meta] = sessionFileStore.add([makeSource('.env', 'KEY=1')]);
    expect(meta!.isText).toBe(true);
    expect(sessionFileStore.excerpt(meta!.id)).toBe('KEY=1');
  });

  it('treats an unknown/binary extension as non-text and gives no excerpt', () => {
    const [meta] = sessionFileStore.add([makeSource('image.png', 'notreallypng')]);
    expect(meta!.isText).toBe(false);
    expect(sessionFileStore.excerpt(meta!.id)).toBe('');
  });

  it('skips an unreadable path without sinking the rest of the selection', () => {
    const added = sessionFileStore.add([
      join(tmpdir(), 'definitely-does-not-exist-bb'),
      makeSource('ok.txt'),
    ]);
    expect(added).toHaveLength(1);
    expect(added[0]!.name).toBe('ok.txt');
  });
});

describe('sessionFileStore retention', () => {
  it('keeps a file that is inside the 8-day window', () => {
    const [meta] = sessionFileStore.add([makeSource('keep.txt')]);
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + RETENTION_MS - 60_000);
    expect(sessionFileStore.list()).toHaveLength(1);
    expect(sessionFileStore.get(meta!.id)).not.toBeNull();
  });

  it('sweeps a file past 8 days, deleting metadata AND the bytes on disk', () => {
    const [meta] = sessionFileStore.add([makeSource('old.txt')]);
    const onDisk = join(userData, 'session-files', meta!.id);
    expect(existsSync(onDisk)).toBe(true);

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + RETENTION_MS + 60_000);

    expect(sessionFileStore.list()).toHaveLength(0);
    expect(sessionFileStore.get(meta!.id)).toBeNull();
    expect(existsSync(onDisk)).toBe(false);
    expect(sessionFileStore.excerpt(meta!.id)).toBe('');
  });
});

// The id is renderer-supplied over IPC and is the only value that reaches the
// filesystem, so a non-UUID must never be turned into a path.
describe('sessionFileStore id validation', () => {
  it('refuses a traversal id instead of deleting an arbitrary file', () => {
    const victim = join(userData, 'session-files', 'victim.txt');
    writeFileSync(victim, 'precious');

    sessionFileStore.remove('../../../../etc/hosts');
    sessionFileStore.remove('../session-files/victim.txt');

    // Nothing outside the store was touched, and the decoy survives.
    expect(existsSync(victim)).toBe(true);
  });

  it('still removes a legitimate file by its real id', () => {
    const [meta] = sessionFileStore.add([makeSource('bye.txt')]);
    const onDisk = join(userData, 'session-files', meta!.id);
    expect(existsSync(onDisk)).toBe(true);

    sessionFileStore.remove(meta!.id);

    expect(existsSync(onDisk)).toBe(false);
    expect(sessionFileStore.get(meta!.id)).toBeNull();
    expect(readdirSync(join(userData, 'session-files'))).not.toContain(meta!.id);
  });

  it('returns null / empty for a bogus id rather than throwing', () => {
    expect(sessionFileStore.get('not-a-uuid')).toBeNull();
    expect(sessionFileStore.excerpt('not-a-uuid')).toBe('');
  });
});

describe('sessionFileStore.excerpt', () => {
  it('truncates a very large text file so one log cannot blow the prompt', () => {
    const huge = 'x'.repeat(20_000);
    const [meta] = sessionFileStore.add([makeSource('big.log', huge)]);
    const out = sessionFileStore.excerpt(meta!.id);
    expect(out.length).toBeLessThan(huge.length);
    expect(out).toContain('[truncated]');
  });
});
