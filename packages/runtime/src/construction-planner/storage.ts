/**
 * Single-store IndexedDB persistence driver and in-memory fallback for Construction Project Planner.
 * Operates on database 'mangotools_construction_planner' with object store 'projects' (keyPath: 'id').
 */

import type { ConstructionProject, ConstructionProjectSummary, ProjectStore } from './types.ts';

export const DB_NAME = 'mangotools_construction_planner';
export const STORE_NAME = 'projects';
export const DB_VERSION = 1;

function toProjectSummary(project: ConstructionProject): ConstructionProjectSummary {
  const currentRev = project.revisions.find(
    (r) => r.revisionNumber === project.currentRevisionNumber,
  );
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    currentRevisionNumber: project.currentRevisionNumber,
    memberCount: currentRev?.members.length ?? 0,
    drawingCount: project.drawings.length,
  };
}

function cloneProject<T>(val: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(val);
  }
  return JSON.parse(JSON.stringify(val));
}

/**
 * Creates an in-memory project store.
 * Fully isolated; used for Node unit tests and as browser storage fallback.
 */
export function createMemoryProjectStore(): ProjectStore {
  const store = new Map<string, ConstructionProject>();

  return {
    async getProject(id: string): Promise<ConstructionProject | null> {
      const proj = store.get(id);
      return proj ? cloneProject(proj) : null;
    },

    async listProjects(): Promise<ConstructionProjectSummary[]> {
      const summaries: ConstructionProjectSummary[] = [];
      for (const proj of store.values()) {
        summaries.push(toProjectSummary(proj));
      }
      return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async saveProject(project: ConstructionProject): Promise<void> {
      store.set(project.id, cloneProject(project));
    },

    async deleteProject(id: string): Promise<boolean> {
      return store.delete(id);
    },

    close(): void {
      store.clear();
    },
  };
}

/**
 * Creates a browser IndexedDB-backed project store.
 */
export function createIndexedDbProjectStore(idb?: IDBFactory): ProjectStore {
  const factory = idb ?? (typeof indexedDB !== 'undefined' ? indexedDB : undefined);
  if (!factory) {
    throw new Error('IndexedDB factory is not available');
  }
  const idbFactory = factory;

  let dbPromise: Promise<IDBDatabase> | null = null;

  function getDb(): Promise<IDBDatabase> {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = idbFactory.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
      });
    }
    return dbPromise;
  }

  return {
    async getProject(id: string): Promise<ConstructionProject | null> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const st = tx.objectStore(STORE_NAME);
        const req = st.get(id);
        req.onsuccess = () => {
          const res = req.result as ConstructionProject | undefined;
          resolve(res ? cloneProject(res) : null);
        };
        req.onerror = () => reject(req.error ?? new Error(`Failed to get project ${id}`));
      });
    },

    async listProjects(): Promise<ConstructionProjectSummary[]> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const st = tx.objectStore(STORE_NAME);
        const req = st.getAll();
        req.onsuccess = () => {
          const projects = (req.result as ConstructionProject[]) || [];
          const summaries = projects.map(toProjectSummary);
          resolve(summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
        };
        req.onerror = () => reject(req.error ?? new Error('Failed to list projects'));
      });
    },

    async saveProject(project: ConstructionProject): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const st = tx.objectStore(STORE_NAME);
        const req = st.put(cloneProject(project));
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error ?? new Error(`Failed to save project ${project.id}`));
      });
    },

    async deleteProject(id: string): Promise<boolean> {
      const db = await getDb();
      const existing = await this.getProject(id);
      if (!existing) return false;

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const st = tx.objectStore(STORE_NAME);
        const req = st.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error ?? new Error(`Failed to delete project ${id}`));
      });
    },

    close(): void {
      if (dbPromise) {
        dbPromise.then((db) => db.close()).catch(() => {});
        dbPromise = null;
      }
    },
  };
}

/**
 * Creates the primary project store. Defaults to IndexedDB in browsers,
 * falling back gracefully to memory store in Node/unsupported environments.
 */
export function createProjectStore(options?: {
  preferMemory?: boolean;
  idb?: IDBFactory;
}): ProjectStore {
  if (options?.preferMemory) {
    return createMemoryProjectStore();
  }

  const factory = options?.idb ?? (typeof indexedDB !== 'undefined' ? indexedDB : undefined);
  if (factory) {
    try {
      return createIndexedDbProjectStore(factory);
    } catch {
      return createMemoryProjectStore();
    }
  }

  return createMemoryProjectStore();
}
