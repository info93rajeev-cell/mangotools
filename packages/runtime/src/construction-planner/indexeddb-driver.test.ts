import { describe, expect, it } from 'vitest';
import { createIndexedDbProjectStore, DB_NAME, DB_VERSION, STORE_PROJECTS } from './storage.ts';
import type { ConstructionProject } from './types.ts';

function createMockIdbFactory(): IDBFactory {
  const projectStoreData = new Map<string, unknown>();
  const drawingStoreData = new Map<string, unknown>();
  const createdStores = new Set<string>();

  const toKey = (val: unknown): string => {
    if (Array.isArray(val)) return val.join('::');
    return String(val);
  };

  const mockDb = {
    objectStoreNames: {
      contains(name: string) {
        return createdStores.has(name);
      },
    },
    createObjectStore(name: string) {
      createdStores.add(name);
      return {
        createIndex() {},
      } as unknown as IDBObjectStore;
    },
    transaction(storeNames: string | string[], _mode: IDBTransactionMode) {
      const names = Array.isArray(storeNames) ? storeNames : [storeNames];
      const tx: {
        error: Error | null;
        oncomplete: (() => void) | null;
        onerror: (() => void) | null;
        objectStore(name: string): IDBObjectStore;
      } = {
        error: null,
        oncomplete: null,
        onerror: null,
        objectStore(name: string) {
          if (!names.includes(name)) throw new Error(`Unknown store ${name}`);
          const targetMap = name === STORE_PROJECTS ? projectStoreData : drawingStoreData;

          return {
            get(key: unknown) {
              const req: {
                result: unknown;
                error: Error | null;
                onsuccess: (() => void) | null;
                onerror: (() => void) | null;
              } = {
                result: targetMap.get(toKey(key)),
                error: null,
                onsuccess: null,
                onerror: null,
              };
              queueMicrotask(() => req.onsuccess?.());
              return req as unknown as IDBRequest;
            },
            getAll() {
              const req: {
                result: unknown;
                error: Error | null;
                onsuccess: (() => void) | null;
                onerror: (() => void) | null;
              } = {
                result: Array.from(targetMap.values()),
                error: null,
                onsuccess: null,
                onerror: null,
              };
              queueMicrotask(() => req.onsuccess?.());
              return req as unknown as IDBRequest;
            },
            put(val: { id?: string; projectId?: string; drawingId?: string }) {
              const k = val.id ? val.id : `${val.projectId}::${val.drawingId}`;
              targetMap.set(k, val);
              const req: {
                result: unknown;
                error: Error | null;
                onsuccess: (() => void) | null;
                onerror: (() => void) | null;
              } = { result: k, error: null, onsuccess: null, onerror: null };
              queueMicrotask(() => req.onsuccess?.());
              return req as unknown as IDBRequest;
            },
            delete(key: unknown) {
              targetMap.delete(toKey(key));
              const req: {
                result: unknown;
                error: Error | null;
                onsuccess: (() => void) | null;
                onerror: (() => void) | null;
              } = { result: undefined, error: null, onsuccess: null, onerror: null };
              queueMicrotask(() => req.onsuccess?.());
              return req as unknown as IDBRequest;
            },
          } as unknown as IDBObjectStore;
        },
      };

      queueMicrotask(() => tx.oncomplete?.());
      return tx as unknown as IDBTransaction;
    },
    close() {},
  } as unknown as IDBDatabase;

  return {
    open(name: string, version?: number) {
      expect(name).toBe(DB_NAME);
      expect(version).toBe(DB_VERSION);

      const req: {
        result: IDBDatabase;
        error: Error | null;
        onupgradeneeded: (() => void) | null;
        onsuccess: (() => void) | null;
        onerror: (() => void) | null;
      } = {
        result: mockDb,
        error: null,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
      };

      queueMicrotask(() => {
        req.onupgradeneeded?.();
        req.onsuccess?.();
      });

      return req as unknown as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;
}

function makeDummyProject(id: string, name: string): ConstructionProject {
  return {
    schemaVersion: 1,
    version: 1,
    id,
    name,
    createdAt: '2026-11-15T00:00:00.000Z',
    updatedAt: '2026-11-15T00:00:00.000Z',
    currentRevisionNumber: 1,
    revisions: [
      {
        revisionNumber: 1,
        createdAt: '2026-11-15T00:00:00.000Z',
        comment: 'Initial revision',
        members: [],
      },
    ],
    drawings: [
      {
        id: 'dwg-1',
        fileName: 'Sheet1.pdf',
        fileSizeBytes: 2048,
        mimeType: 'application/pdf',
        uploadedAt: '2026-11-15T00:00:00.000Z',
      },
    ],
  };
}

describe('createIndexedDbProjectStore', () => {
  it('opens IndexedDB database, creates object store, and saves/retrieves projects and drawings', async () => {
    const mockFactory = createMockIdbFactory();
    const store = createIndexedDbProjectStore(mockFactory);
    expect(store.isAvailable).toBe(true);

    const project1 = makeDummyProject('idb-proj-1', 'Site 101');
    await store.saveProject(project1);

    const retrieved = await store.getProject('idb-proj-1');
    expect(retrieved?.id).toBe(project1.id);
    expect(retrieved?.version).toBe(1);

    // Save and retrieve drawing binary
    const dummyData = new Uint8Array([1, 2, 3, 4]).buffer;
    await store.saveDrawing('idb-proj-1', 'dwg-1', dummyData);

    const retrievedDrawing = await store.getDrawing('idb-proj-1', 'dwg-1');
    expect(retrievedDrawing).toEqual(dummyData);

    // List projects
    const list = await store.listProjects();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe('idb-proj-1');
    expect(list[0]?.name).toBe('Site 101');

    // Deleting project also deletes its drawings
    const deleted = await store.deleteProject('idb-proj-1');
    expect(deleted).toBe(true);

    const listAfterDelete = await store.listProjects();
    expect(listAfterDelete).toHaveLength(0);

    const dwgAfterDelete = await store.getDrawing('idb-proj-1', 'dwg-1');
    expect(dwgAfterDelete).toBeNull();

    store.close();
  });

  it('reports isAvailable: false when factory is not available without crashing', () => {
    const store = createIndexedDbProjectStore(undefined);
    expect(store.isAvailable).toBe(false);
    expect(store.unavailableReason).toBe('IndexedDB is unavailable in this environment');
  });
});
