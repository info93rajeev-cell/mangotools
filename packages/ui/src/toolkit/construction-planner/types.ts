export type PlannerTab = 'setup' | 'drawings' | 'concrete-rebar' | 'bbs' | 'revisions';

export type DrawingCategory =
  | 'architectural'
  | 'structural'
  | 'section-elevation'
  | 'member-details';

export type MemberType = 'footing' | 'column' | 'beam' | 'slab';

export interface SheetMetadata {
  id: string;
  name: string;
  category: DrawingCategory;
  sheetNumber: string;
  revision: string;
  sizeBytes?: number;
  uploadedAt: string;
  status: 'Uploaded' | 'Pending' | 'Draft';
}

export interface RecentWorkItem {
  id: string;
  name: string;
  memberType: MemberType;
  portion: string;
  lastUpdated: string;
  status: 'Calculated' | 'In Progress' | 'Draft' | 'Pending';
}

export interface ProjectOverviewState {
  projectName: string;
  location: string;
  projectType: string;
  floors: string;
  sitePortion: string;
  unitSystem: string;
  concreteStandard: string;
  rebarStandard: string;
}

export interface ProjectSummaryMetrics {
  totalMembers: number;
  pendingDrawings: number;
  lastRevision: string;
  status: 'In Progress' | 'Ready' | 'Draft';
  footingsCount: number;
  columnsCount: number;
  beamsCount: number;
  slabsCount: number;
}
