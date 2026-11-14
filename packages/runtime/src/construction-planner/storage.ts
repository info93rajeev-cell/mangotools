/**
 * Primary storage entrypoint and in-memory store driver for Construction Project Planner.
 * Supports single database 'mangotools_construction_planner' with:
 * 1. 'projects' (keyPath: 'id') — holds project metadata and drawing references
 * 2. 'drawing_binaries' (keyPath: ['projectId', 'drawingId']) — holds drawing Blob/ArrayBuffer data
 */

import { createIndexedDbProjectStore } from './idb-storage.ts';
import { CURRENT_SCHEMA_VERSION } from './schemas.ts';
import type { ConstructionProject, ConstructionProjectSummary, ProjectStore } from './types.ts';

export const DB_NAME = 'mangotools_construction_planner';
export const STORE_PROJECTS = 'projects';
export const STORE_DRAWINGS = 'drawing_binaries';
export const DB_VERSION = 1;

export class StorageUnavailableError extends Error {
  readonly code = 'STORAGE_UNAVAILABLE';
  constructor(message = 'IndexedDB is unavailable in this environment') {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}

export function toProjectSummary(project: ConstructionProject): ConstructionProjectSummary {
  const currentRev = project.revisions.find(
    (r) => r.revisionNumber === project.currentRevisionNumber,
  );
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    currentRevisionNumber: project.currentRevisionNumber,
    version: project.version ?? 1,
    memberCount: currentRev?.members.length ?? 0,
    drawingCount: project.drawings.length,
  };
}

export function cloneVal<T>(val: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(val);
  }
  return JSON.parse(JSON.stringify(val));
}

export function assertRevisionsImmutable(
  existing: ConstructionProject,
  candidate: ConstructionProject,
): void {
  for (const oldRev of existing.revisions) {
    const candidateRev = candidate.revisions.find(
      (r) => r.revisionNumber === oldRev.revisionNumber,
    );
    if (!candidateRev) {
      throw new Error('Cannot modify existing revision: revisions are immutable snapshots');
    }
    const oldStr = JSON.stringify({
      num: oldRev.revisionNumber,
      comment: oldRev.comment,
      members: oldRev.members,
    });
    const newStr = JSON.stringify({
      num: candidateRev.revisionNumber,
      comment: candidateRev.comment,
      members: candidateRev.members,
    });
    if (oldStr !== newStr) {
      throw new Error('Cannot modify existing revision: revisions are immutable snapshots');
    }
  }
}

/**
 * Creates an in-memory project store for unit tests.
 */
export function createMemoryProjectStore(): ProjectStore {
  const projectMap = new Map<string, ConstructionProject>();
  const drawingMap = new Map<string, Blob | ArrayBuffer>();
  const drawingKey = (pId: string, dId: string) => `${pId}::${dId}`;

  return {
    isAvailable: true,

    async getProject(id: string): Promise<ConstructionProject | null> {
      const proj = projectMap.get(id);
      return proj ? cloneVal(proj) : null;
    },

    async listProjects(): Promise<ConstructionProjectSummary[]> {
      const summaries = Array.from(projectMap.values()).map(toProjectSummary);
      return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async saveProject(project: ConstructionProject): Promise<void> {
      const existing = projectMap.get(project.id);
      if (existing) {
        if (project.version !== existing.version) {
          throw new Error(
            'Project was modified by another tab or session. Reload to see the latest changes.',
          );
        }
        assertRevisionsImmutable(existing, project);
      }

      const toSave: ConstructionProject = {
        ...cloneVal(project),
        schemaVersion: project.schemaVersion ?? CURRENT_SCHEMA_VERSION,
        version: existing ? existing.version + 1 : (project.version ?? 1),
      };
      projectMap.set(toSave.id, toSave);
    },

    async deleteProject(id: string): Promise<boolean> {
      const existed = projectMap.delete(id);
      if (existed) {
        for (const k of Array.from(drawingMap.keys())) {
          if (k.startsWith(`${id}::`)) drawingMap.delete(k);
        }
      }
      return existed;
    },

    async saveDrawing(pId: string, dId: string, data: Blob | ArrayBuffer): Promise<void> {
      drawingMap.set(drawingKey(pId, dId), data);
    },

    async getDrawing(pId: string, dId: string): Promise<Blob | ArrayBuffer | null> {
      return drawingMap.get(drawingKey(pId, dId)) ?? null;
    },

    async deleteDrawing(pId: string, dId: string): Promise<boolean> {
      return drawingMap.delete(drawingKey(pId, dId));
    },

    close(): void {
      projectMap.clear();
      drawingMap.clear();
    },
  };
}

/**
 * Creates the project store. Defaults to IndexedDB.
 * If IndexedDB is unavailable, reports isAvailable: false (does NOT silently fall back to memory).
 * Use driver: 'memory' explicitly for unit tests.
 */
export function createProjectStore(options?: {
  driver?: 'idb' | 'memory';
  preferMemory?: boolean;
  idb?: IDBFactory;
}): ProjectStore {
  if (options?.driver === 'memory' || options?.preferMemory) {
    return createMemoryProjectStore();
  }
  return createIndexedDbProjectStore(options?.idb);
}

export { createIndexedDbProjectStore } from './idb-storage.ts';
