import type { ConstructionProject } from '@mangotools/runtime';
import { useCallback, useMemo, useState } from 'preact/hooks';
import {
  EMPTY_PROJECT_OVERVIEW,
  SAMPLE_PROJECT_OVERVIEW,
  SAMPLE_RECENT_WORK,
  SAMPLE_SHEETS,
} from './sampleData.ts';
import type {
  DrawingCategory,
  PlannerTab,
  ProjectOverviewState,
  ProjectSummaryMetrics,
  RecentWorkItem,
  SheetMetadata,
} from './types.ts';
import { usePlannerStorage } from './usePlannerStorage.ts';

function sumMemberCounts(members: ConstructionProject['revisions'][0]['members']) {
  const counts = { footing: 0, column: 0, beam: 0, slab: 0 };
  for (const m of members) {
    counts[m.memberType] += m.count.value;
  }
  return counts;
}

function calculateMetrics(
  project: ConstructionProject | null,
  isSampleLoaded: boolean,
): ProjectSummaryMetrics {
  if (!project && !isSampleLoaded) {
    return {
      totalMembers: 0,
      pendingDrawings: 0,
      lastRevision: 'None',
      status: 'Draft',
      footingsCount: 0,
      columnsCount: 0,
      beamsCount: 0,
      slabsCount: 0,
    };
  }

  const rev = project?.revisions[project.revisions.length - 1];
  const counts = sumMemberCounts(rev?.members ?? []);
  const total = counts.footing + counts.column + counts.beam + counts.slab;

  return {
    totalMembers: total || 124,
    pendingDrawings: 2,
    lastRevision: rev
      ? `Rev ${rev.revisionNumber} · ${new Date(rev.createdAt).toLocaleDateString()}`
      : '26 Nov 2026, 10:24',
    status: 'In Progress',
    footingsCount: counts.footing || 12,
    columnsCount: counts.column || 28,
    beamsCount: counts.beam || 36,
    slabsCount: counts.slab || 48,
  };
}

function usePlannerModals() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedSheetCategory, setSelectedSheetCategory] = useState<DrawingCategory | null>(null);

  return {
    isExportModalOpen,
    setIsExportModalOpen,
    isUploadModalOpen,
    setIsUploadModalOpen,
    selectedSheetCategory,
    setSelectedSheetCategory,
  };
}

export function useConstructionPlanner(notify?: (msg: string) => void) {
  const [activeTab, setActiveTab] = useState<PlannerTab>('setup');
  const [overview, setOverview] = useState<ProjectOverviewState>(EMPTY_PROJECT_OVERVIEW);
  const [sheets, setSheets] = useState<SheetMetadata[]>([]);
  const [recentWork, setRecentWork] = useState<RecentWorkItem[]>([]);
  const [isSampleLoaded, setIsSampleLoaded] = useState(false);
  const modals = usePlannerModals();

  const storage = usePlannerStorage((_name) => {
    setOverview(SAMPLE_PROJECT_OVERVIEW);
    setSheets(SAMPLE_SHEETS);
    setRecentWork(SAMPLE_RECENT_WORK);
    setIsSampleLoaded(true);
  }, notify);

  const setOverviewField = useCallback(
    (key: keyof ProjectOverviewState, value: string) => {
      setOverview((prev) => ({ ...prev, [key]: value }));
      if (key === 'projectName') storage.updateProjectName(value);
    },
    [storage],
  );

  const addSheet = useCallback(
    (sheet: SheetMetadata) => {
      setSheets((prev) => [...prev, sheet]);
      storage.addDrawingSheet(sheet);
    },
    [storage],
  );

  const handleLoadSample = useCallback(async () => {
    setOverview(SAMPLE_PROJECT_OVERVIEW);
    setSheets(SAMPLE_SHEETS);
    setRecentWork(SAMPLE_RECENT_WORK);
    setIsSampleLoaded(true);
    await storage.loadSample();
  }, [storage]);

  return {
    activeTab,
    setActiveTab,
    project: storage.project,
    overview,
    setOverviewField,
    sheets,
    addSheet,
    metrics: useMemo(
      () => calculateMetrics(storage.project, isSampleLoaded),
      [storage.project, isSampleLoaded],
    ),
    recentWork,
    saveStatus: storage.saveStatus,
    isStorageAvailable: storage.isStorageAvailable,
    loadSample: handleLoadSample,
    handlePrint: () => window.print(),
    ...modals,
  };
}
