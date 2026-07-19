// Project store. A project is a named, standing context — instructions plus a
// set of session files — that the user can attach to a run via the "+" menu so
// the agent knows the task belongs to that project. Metadata only; file bytes
// live in the session-file store, referenced by id.

import { randomUUID } from 'node:crypto';
import type { ProjectDetail, ProjectSummary } from '../../shared/ipc.js';
import { createStore } from './store.js';

interface ProjectsSchema extends Record<string, unknown> {
  projects: ProjectDetail[];
}

const toSummary = (p: ProjectDetail): ProjectSummary => ({
  id: p.id,
  name: p.name,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
  fileCount: p.fileIds.length,
});

class ProjectStore {
  private store = createStore<ProjectsSchema>('projects', { projects: [] });

  list(): ProjectSummary[] {
    return this.store
      .get('projects')
      .map(toSummary)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(id: string): ProjectDetail | null {
    return this.store.get('projects').find((p) => p.id === id) ?? null;
  }

  create(name: string): ProjectDetail {
    const now = Date.now();
    const project: ProjectDetail = {
      id: randomUUID(),
      name: name.trim() || 'Untitled project',
      createdAt: now,
      updatedAt: now,
      fileCount: 0,
      instructions: '',
      fileIds: [],
    };
    this.store.set('projects', [project, ...this.store.get('projects')]);
    return project;
  }

  private write(id: string, mutate: (p: ProjectDetail) => ProjectDetail): ProjectDetail | null {
    const all = this.store.get('projects');
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated = { ...mutate(all[idx]), updatedAt: Date.now() };
    updated.fileCount = updated.fileIds.length;
    const next = [...all];
    next[idx] = updated;
    this.store.set('projects', next);
    return updated;
  }

  update(id: string, patch: { name?: string; instructions?: string }): ProjectDetail | null {
    return this.write(id, (p) => ({
      ...p,
      ...(patch.name !== undefined ? { name: patch.name.trim() || p.name } : {}),
      ...(patch.instructions !== undefined ? { instructions: patch.instructions } : {}),
    }));
  }

  attachFiles(id: string, fileIds: string[]): ProjectDetail | null {
    return this.write(id, (p) => ({
      ...p,
      // De-dupe so re-attaching the same file is a no-op.
      fileIds: Array.from(new Set([...p.fileIds, ...fileIds])),
    }));
  }

  delete(id: string): void {
    this.store.set(
      'projects',
      this.store.get('projects').filter((p) => p.id !== id),
    );
  }
}

export const projectStore = new ProjectStore();
