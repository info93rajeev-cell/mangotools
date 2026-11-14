/**
 * Types and interfaces for Construction Project Planner storage and project lifecycle.
 */

import type {
  ConstructionMemberInput,
  ConstructionPlannerEngineOutput,
} from '@mangotools/engine-civil';

export interface DrawingAttachment {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  base64Data: string;
  uploadedAt: string;
}

export interface ProjectRevision {
  revisionNumber: number;
  createdAt: string;
  comment: string;
  members: ConstructionMemberInput[];
  calculationOutput?: ConstructionPlannerEngineOutput;
}

export interface ConstructionProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentRevisionNumber: number;
  revisions: ProjectRevision[];
  drawings: DrawingAttachment[];
}

export interface ConstructionProjectSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentRevisionNumber: number;
  memberCount: number;
  drawingCount: number;
}

export interface ProjectExportBundle {
  schemaVersion: 1;
  exportedAt: string;
  project: ConstructionProject;
}

export interface ImportProjectOptions {
  existingProjectIds?: Iterable<string>;
  onConflict?: 'overwrite' | 'error';
}

export interface ImportProjectResult {
  project: ConstructionProject;
  isDuplicate: boolean;
  action: 'created' | 'updated';
}

export interface ProjectStore {
  getProject(id: string): Promise<ConstructionProject | null>;
  listProjects(): Promise<ConstructionProjectSummary[]>;
  saveProject(project: ConstructionProject): Promise<void>;
  deleteProject(id: string): Promise<boolean>;
  close(): void;
}
