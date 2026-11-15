import type { ConstructionProject } from '@mangotools/runtime';
import { useCallback, useMemo, useState } from 'preact/hooks';
import { SAMPLE_SHEETS } from './sampleData.ts';
import type {
  DrawingCategory,
  PlannerTab,
  ProjectOverviewState,
  ProjectSummaryMetrics,
  RecentWorkItem,
  SheetMetadata,
} from './types.ts';
import { usePlannerStorage } from './usePlannerStorage.ts';

const DEFAULT_OVERVIEW: ProjectOverviewState = {
  projectName: 'P01 · Residence + Office (G+3)',
  location: 'Bengaluru, KA',
  projectType: 'Mixed Use (House + Office)',
  floors: '3 (G + 3)',
  sitePortion: 'Site A / Block 1',
  unitSystem: 'Metric (m, mm, kg, m³)',
  concreteStandard: 'IS 456 : 2000',
  rebarStandard: 'IS 1786 : 2008 (Fe 500)',
};

const STATIC_RECENT_WORK: RecentWorkItem[] = [
  {
    id: 'f1',
    name: 'F1 - Footing Set (F1-F6)',
    memberType: 'footing',
    portion: 'Site A',
    lastUpdated: '26 Nov 2026, 09:58',
    status: 'Calculated',
  },
  {
    id: 'c3',
    name: 'C3 - Column Cage',
    memberType: 'column',
    portion: 'Site A',
    lastUpdated: '26 Nov 2026, 09:41',
    status: 'Calculated',
  },
  {
    id: 'b7',
    name: 'B7 - Beam Design (3.6 m)',
    memberType: 'beam',
    portion: 'Site A',
    lastUpdated: '25 Nov 2026, 17:22',
    status: 'Calculated',
  },
  {
    id: 's2',
    name: 'S2 - Slab Zone (120 m²)',
    memberType: 'slab',
    portion: 'Site A',
    lastUpdated: '25 Nov 2026, 16:37',
    status: 'In Progress',
  },
];

function sumMemberCounts(members: ConstructionProject['revisions'][0]['members']) {
  const counts = { footing: 0, column: 0, beam: 0, slab: 0 };
  for (const m of members) {
    counts[m.memberType] += m.count.value;
  }
  return counts;
}

function calculateMetrics(project: ConstructionProject | null): ProjectSummaryMetrics {
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
  const [overview, setOverview] = useState<ProjectOverviewState>(DEFAULT_OVERVIEW);
  const [sheets, setSheets] = useState<SheetMetadata[]>(SAMPLE_SHEETS);
  const modals = usePlannerModals();

  const storage = usePlannerStorage(
    (name) => setOverview((prev) => ({ ...prev, projectName: name })),
    notify,
  );

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

  return {
    activeTab,
    setActiveTab,
    project: storage.project,
    overview,
    setOverviewField,
    sheets,
    addSheet,
    metrics: useMemo(() => calculateMetrics(storage.project), [storage.project]),
    recentWork: STATIC_RECENT_WORK,
    saveStatus: storage.saveStatus,
    isStorageAvailable: storage.isStorageAvailable,
    loadSample: storage.loadSample,
    handlePrint: () => window.print(),
    ...modals,
  };
}
