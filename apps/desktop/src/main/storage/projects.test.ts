import { beforeEach, describe, expect, it, vi } from 'vitest';

// Projects reference session files by id; the project store asks the file store
// whether each one is still alive. Stub that relationship so we can age files
// out without touching a real filesystem.
const liveFiles = new Set<string>();

vi.mock('./session-files.js', () => ({
  sessionFileStore: {
    get: (id: string) => (liveFiles.has(id) ? { id } : null),
  },
}));

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

const { projectStore } = await import('./projects.js');

beforeEach(() => {
  liveFiles.clear();
  (projectStore as unknown as { store: { _reset(): void } }).store._reset();
});

describe('projectStore.create', () => {
  it('creates a project with an empty context', () => {
    const p = projectStore.create('Acme redesign');
    expect(p.name).toBe('Acme redesign');
    expect(p.fileIds).toEqual([]);
    expect(p.fileCount).toBe(0);
    expect(p.instructions).toBe('');
  });

  it('falls back to a placeholder name when given blank input', () => {
    expect(projectStore.create('   ').name).toBe('Untitled project');
  });
});

describe('projectStore.update / attachFiles', () => {
  it('records standing instructions', () => {
    const p = projectStore.create('Acme');
    const updated = projectStore.update(p.id, { instructions: 'Always cite sources.' });
    expect(updated?.instructions).toBe('Always cite sources.');
    expect(projectStore.get(p.id)?.instructions).toBe('Always cite sources.');
  });

  it('de-dupes so re-attaching the same file is a no-op', () => {
    const p = projectStore.create('Acme');
    liveFiles.add('f1');
    projectStore.attachFiles(p.id, ['f1']);
    const after = projectStore.attachFiles(p.id, ['f1']);
    expect(after?.fileIds).toEqual(['f1']);
    expect(after?.fileCount).toBe(1);
  });

  it('returns null for an unknown project instead of throwing', () => {
    expect(projectStore.update('nope', { name: 'x' })).toBeNull();
    expect(projectStore.attachFiles('nope', ['f1'])).toBeNull();
    expect(projectStore.get('nope')).toBeNull();
  });
});

// Session files expire after 8 days while the project keeps referencing them,
// so the count the UI shows must reflect what the agent can actually read.
describe('projectStore reconciles expired files', () => {
  it('counts only files that still exist', () => {
    const p = projectStore.create('Acme');
    liveFiles.add('f1');
    liveFiles.add('f2');
    projectStore.attachFiles(p.id, ['f1', 'f2']);
    expect(projectStore.get(p.id)?.fileCount).toBe(2);

    // f2's bytes get swept.
    liveFiles.delete('f2');

    const got = projectStore.get(p.id);
    expect(got?.fileIds).toEqual(['f1']);
    expect(got?.fileCount).toBe(1);
    expect(projectStore.list()[0]!.fileCount).toBe(1);
  });

  it('leaves the stored list intact so reconciliation is read-side only', () => {
    const p = projectStore.create('Acme');
    liveFiles.add('f1');
    projectStore.attachFiles(p.id, ['f1']);

    liveFiles.delete('f1');
    expect(projectStore.get(p.id)?.fileIds).toEqual([]);

    // The file comes back (e.g. re-uploaded under the same id) — the reference
    // was never destroyed, so it reappears.
    liveFiles.add('f1');
    expect(projectStore.get(p.id)?.fileIds).toEqual(['f1']);
  });
});

describe('projectStore.list / delete', () => {
  it('sorts newest-updated first', () => {
    // Date.now() is millisecond-resolution, so without advancing the clock all
    // three writes share a timestamp and the sort has nothing to order by.
    vi.useFakeTimers();
    try {
      vi.setSystemTime(1_000);
      const a = projectStore.create('A');
      vi.setSystemTime(2_000);
      projectStore.create('B');
      // B is newest, so it leads.
      expect(projectStore.list().map((p) => p.name)).toEqual(['B', 'A']);

      // Touching A makes it the most recently updated, so it overtakes B.
      vi.setSystemTime(3_000);
      projectStore.update(a.id, { instructions: 'touch' });
      expect(projectStore.list().map((p) => p.name)).toEqual(['A', 'B']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('deletes a project', () => {
    const p = projectStore.create('Gone');
    projectStore.delete(p.id);
    expect(projectStore.get(p.id)).toBeNull();
    expect(projectStore.list()).toHaveLength(0);
  });
});
