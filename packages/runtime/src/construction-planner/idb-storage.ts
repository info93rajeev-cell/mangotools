/**
 * IndexedDB operations and store implementation for Construction Project Planner.
 */

import { CURRENT_SCHEMA_VERSION } from './schemas.ts';
import {
  assertRevisionsImmutable,
  cloneVal,
  DB_NAME,
  DB_VERSION,
  STORE_DRAWINGS,
  STORE_PROJECTS,
  StorageUnavailableError,
  toProjectSummary,
} from './storage.ts';
import type {
  ConstructionProject,
  ConstructionProjectSummary,
  DrawingReference,
  ProjectStore,
} from './types.ts';

function createUnavailableStore(reason: string): ProjectStore {
  const err = new StorageUnavailableError(reason);
  const reject = async () => {
    throw err;
  };
  return {
    isAvailable: false,
    unavailableReason: reason,
    getProject: reject,
    listProjects: reject,
    saveProject: reject,
    deleteProject: reject,
    saveDrawing: reject,
    getDrawing: reject,
    deleteDrawing: reject,
    close: () => {},
  };
}

function openIdbDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = factory.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_DRAWINGS)) {
        const dwgStore = db.createObjectStore(STORE_DRAWINGS, {
          keyPath: ['projectId', 'drawingId'],
        });
        dwgStore.createIndex('by_project', 'projectId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new StorageUnavailableError());
  });
}

function idbGetProject(db: IDBDatabase, id: string): Promise<ConstructionProject | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const req = tx.objectStore(STORE_PROJECTS).get(id);
    req.onsuccess = () => {
      const res = req.result as ConstructionProject | undefined;
      resolve(res ? cloneVal(res) : null);
    };
    req.onerror = () => reject(req.error ?? new Error(`Failed to get project ${id}`));
  });
}

function idbListProjects(db: IDBDatabase): Promise<ConstructionProjectSummary[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const req = tx.objectStore(STORE_PROJECTS).getAll();
    req.onsuccess = () => {
      const list = (req.result as ConstructionProject[]) || [];
      resolve(list.map(toProjectSummary).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    };
    req.onerror = () => reject(req.error ?? new Error('Failed to list projects'));
  });
}

function idbPutProject(db: IDBDatabase, toSave: ConstructionProject): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const req = tx.objectStore(STORE_PROJECTS).put(toSave);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error(`Failed to save project ${toSave.id}`));
  });
}

function idbDeleteProject(
  db: IDBDatabase,
  id: string,
  drawings: DrawingReference[],
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PROJECTS, STORE_DRAWINGS], 'readwrite');
    tx.objectStore(STORE_PROJECTS).delete(id);
    const dwgStore = tx.objectStore(STORE_DRAWINGS);
    for (const dwg of drawings) {
      dwgStore.delete([id, dwg.id]);
    }
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error ?? new Error(`Failed to delete project ${id}`));
  });
}

function idbSaveDrawing(
  db: IDBDatabase,
  pId: string,
  dId: string,
  data: Blob | ArrayBuffer,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAWINGS, 'readwrite');
    const req = tx.objectStore(STORE_DRAWINGS).put({ projectId: pId, drawingId: dId, data });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to save drawing binary'));
  });
}

function idbGetDrawing(
  db: IDBDatabase,
  pId: string,
  dId: string,
): Promise<Blob | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAWINGS, 'readonly');
    const req = tx.objectStore(STORE_DRAWINGS).get([pId, dId]);
    req.onsuccess = () => {
      const res = req.result as { data: Blob | ArrayBuffer } | undefined;
      resolve(res ? res.data : null);
    };
    req.onerror = () => reject(req.error ?? new Error('Failed to get drawing binary'));
  });
}

/**
 * Creates a browser IndexedDB-backed project store with two object stores:
 * 'projects' and 'drawing_binaries'.
 */
export function createIndexedDbProjectStore(idb?: IDBFactory): ProjectStore {
  const factory = idb ?? (typeof indexedDB !== 'undefined' ? indexedDB : undefined);
  if (!factory) {
    return createUnavailableStore('IndexedDB is unavailable in this environment');
  }

  let dbPromise: Promise<IDBDatabase> | null = null;
  const getDb = () => {
    if (!dbPromise) dbPromise = openIdbDatabase(factory);
    return dbPromise;
  };

  return {
    isAvailable: true,
    async getProject(id: string): Promise<ConstructionProject | null> {
      return idbGetProject(await getDb(), id);
    },
    async listProjects(): Promise<ConstructionProjectSummary[]> {
      return idbListProjects(await getDb());
    },
    async saveProject(project: ConstructionProject): Promise<void> {
      const existing = await this.getProject(project.id);
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
      return idbPutProject(await getDb(), toSave);
    },
    async deleteProject(id: string): Promise<boolean> {
      const existing = await this.getProject(id);
      if (!existing) return false;
      return idbDeleteProject(await getDb(), id, existing.drawings);
    },
    async saveDrawing(pId: string, dId: string, data: Blob | ArrayBuffer): Promise<void> {
      return idbSaveDrawing(await getDb(), pId, dId, data);
    },
    async getDrawing(pId: string, dId: string): Promise<Blob | ArrayBuffer | null> {
      return idbGetDrawing(await getDb(), pId, dId);
    },
    async deleteDrawing(pId: string, dId: string): Promise<boolean> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DRAWINGS, 'readwrite');
        const req = tx.objectStore(STORE_DRAWINGS).delete([pId, dId]);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error ?? new Error('Failed to delete drawing binary'));
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
