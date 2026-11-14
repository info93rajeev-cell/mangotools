import { describe, expect, it } from 'vitest';
import { createIndexedDbProjectStore, DB_NAME, DB_VERSION, STORE_NAME } from './storage.ts';
import type { ConstructionProject } from './types.ts';

function createMockIdbFactory(): IDBFactory {
  const storeData = new Map<string, unknown>();
  let hasCreatedStore = false;

  const mockDb = {
    objectStoreNames: {
      contains(name: string) {
        return name === STORE_NAME && hasCreatedStore;
      },
    },
    createObjectStore(name: string) {
      if (name === STORE_NAME) hasCreatedStore = true;
      return {} as IDBObjectStore;
    },
    transaction(name: string, _mode: IDBTransactionMode) {
      if (name !== STORE_NAME) throw new Error(`Unknown store ${name}`);
      return {
        objectStore() {
          return {
            get(id: string) {
              const req: {
                result: unknown;
                error: Error | null;
                onsuccess: (() => void) | null;
                onerror: (() => void) | null;
              } = { result: storeData.get(id), error: null, onsuccess: null, onerror: null };
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
                result: Array.from(storeData.values()),
                error: null,
                onsuccess: null,
                onerror: null,
              };
              queueMicrotask(() => req.onsuccess?.());
              return req as unknown as IDBRequest;
            },
            put(val: { id: string }) {
              storeData.set(val.id, val);
              const req: {
                result: unknown;
                error: Error | null;
                onsuccess: (() => void) | null;
                onerror: (() => void) | null;
              } = { result: val.id, error: null, onsuccess: null, onerror: null };
              queueMicrotask(() => req.onsuccess?.());
              return req as unknown as IDBRequest;
            },
            delete(id: string) {
              storeData.delete(id);
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
      } as unknown as IDBTransaction;
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
    drawings: [],
  };
}

describe('createIndexedDbProjectStore', () => {
  it('opens IndexedDB database, creates object store, and saves/retrieves projects', async () => {
    const mockFactory = createMockIdbFactory();
    const store = createIndexedDbProjectStore(mockFactory);

    const project1 = makeDummyProject('idb-proj-1', 'Site 101');
    await store.saveProject(project1);

    const retrieved = await store.getProject('idb-proj-1');
    expect(retrieved).toEqual(project1);

    const list = await store.listProjects();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe('idb-proj-1');
    expect(list[0]?.name).toBe('Site 101');

    const deleted = await store.deleteProject('idb-proj-1');
    expect(deleted).toBe(true);

    const listAfterDelete = await store.listProjects();
    expect(listAfterDelete).toHaveLength(0);

    store.close();
  });

  it('throws error when factory is not provided and indexedDB global is missing', () => {
    expect(() => createIndexedDbProjectStore(undefined)).toThrow(
      'IndexedDB factory is not available',
    );
  });
});
