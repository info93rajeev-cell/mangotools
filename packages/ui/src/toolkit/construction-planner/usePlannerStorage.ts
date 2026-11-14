import {
  type ConstructionProject,
  createIndexedDbProjectStore,
  StorageUnavailableError,
} from '@mangotools/runtime';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { createSampleProject, SAMPLE_PROJECT_ID } from './sampleData.ts';
import type { SheetMetadata } from './types.ts';

type ProjectStore = ReturnType<typeof createIndexedDbProjectStore>;

function useStoreLoader(store: ProjectStore, onProjectLoaded: (name: string) => void) {
  const [project, setProject] = useState<ConstructionProject | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unavailable'>(
    'saved',
  );
  const [isStorageAvailable, setIsStorageAvailable] = useState<boolean>(store.isAvailable);

  useEffect(() => {
    if (!store.isAvailable) {
      setIsStorageAvailable(false);
      setSaveStatus('unavailable');
      return;
    }
    void store
      .getProject(SAMPLE_PROJECT_ID)
      .then((existing) => {
        if (existing) {
          setProject(existing);
          onProjectLoaded(existing.name);
        }
      })
      .catch((err) => {
        if (err instanceof StorageUnavailableError) {
          setIsStorageAvailable(false);
          setSaveStatus('unavailable');
        }
      });
  }, [store, onProjectLoaded]);

  return { project, setProject, saveStatus, setSaveStatus, isStorageAvailable };
}

function useProjectSaveActions(
  store: ProjectStore,
  project: ConstructionProject | null,
  setProject: (p: ConstructionProject | null) => void,
  setSaveStatus: (s: 'saved' | 'saving' | 'error' | 'unavailable') => void,
  notify?: (msg: string) => void,
) {
  const saveTimeoutRef = useRef<number | null>(null);

  const scheduleSave = useCallback(
    (updated: ConstructionProject) => {
      if (!store.isAvailable) {
        setSaveStatus('unavailable');
        return;
      }
      setSaveStatus('saving');
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(() => {
        store
          .saveProject(updated)
          .then(() => {
            setProject(updated);
            setSaveStatus('saved');
          })
          .catch(() => setSaveStatus('error'));
      }, 400);
    },
    [store, setProject, setSaveStatus],
  );

  const updateProjectName = useCallback(
    (name: string) => {
      if (project) scheduleSave({ ...project, name });
    },
    [project, scheduleSave],
  );

  const addDrawingSheet = useCallback(
    (sheet: SheetMetadata) => {
      if (!project) return;
      const drawings = [
        ...project.drawings,
        {
          id: sheet.id,
          fileName: `${sheet.sheetNumber} ${sheet.name}.pdf`,
          mimeType: 'application/pdf',
          fileSizeBytes: sheet.sizeBytes ?? 1024,
          uploadedAt: sheet.uploadedAt,
        },
      ];
      scheduleSave({ ...project, drawings });
    },
    [project, scheduleSave],
  );

  const loadSample = useCallback(async () => {
    const sample = createSampleProject();
    if (store.isAvailable) {
      try {
        await store.saveProject(sample);
        setProject(sample);
        setSaveStatus('saved');
      } catch {
        setProject(sample);
      }
    } else {
      setProject(sample);
      setSaveStatus('unavailable');
    }
    notify?.('Sample project loaded.');
  }, [store, notify, setProject, setSaveStatus]);

  return { updateProjectName, addDrawingSheet, loadSample };
}

export function usePlannerStorage(
  onProjectLoaded: (name: string) => void,
  notify?: (msg: string) => void,
) {
  const store = useMemo(() => createIndexedDbProjectStore(), []);
  const { project, setProject, saveStatus, setSaveStatus, isStorageAvailable } = useStoreLoader(
    store,
    onProjectLoaded,
  );
  const actions = useProjectSaveActions(store, project, setProject, setSaveStatus, notify);

  return {
    project,
    saveStatus,
    isStorageAvailable,
    ...actions,
  };
}
