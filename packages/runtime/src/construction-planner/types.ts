/**
 * Types and interfaces for Construction Project Planner storage, drawings,
 * revisions, and export/import lifecycle.
 */

import type {
  ConstructionMemberInput,
  ConstructionPlannerEngineOutput,
} from '@mangotools/engine-civil';

export interface DrawingReference {
  id: string; // sheetId
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
}

export interface DrawingAttachment extends DrawingReference {
  base64Data?: string; // used only inside the export bundle
}

export interface DrawingBinaryRecord {
  projectId: string;
  drawingId: string;
  data: Blob | ArrayBuffer;
}

export interface ProjectRevision {
  revisionNumber: number;
  createdAt: string;
  comment: string;
  members: ConstructionMemberInput[];
  calculationOutput?: ConstructionPlannerEngineOutput;
}

export interface ConstructionProject {
  schemaVersion: number;
  version: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentRevisionNumber: number;
  revisions: ProjectRevision[];
  drawings: DrawingReference[];
}

export interface ConstructionProjectSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentRevisionNumber: number;
  version: number;
  memberCount: number;
  drawingCount: number;
}

export interface ProjectExportBundle {
  schemaVersion: number;
  exportedAt: string;
  project: ConstructionProject & {
    drawings: DrawingAttachment[];
  };
}

export interface ExportProjectOptions {
  includeDrawings?: boolean;
  drawingBinaries?: Map<string, Blob | ArrayBuffer> | Record<string, Blob | ArrayBuffer>;
}

export interface ImportProjectOptions {
  existingProjectIds?: Iterable<string>;
  onConflict?: 'conflict' | 'replace' | 'copy';
}

export type ImportProjectResult =
  | {
      status: 'success';
      action: 'created' | 'replaced' | 'copied';
      project: ConstructionProject;
      drawingBinaries?: Map<string, ArrayBuffer>;
    }
  | {
      status: 'conflict';
      existingProjectId: string;
      existingProjectName: string;
      importedProject: ConstructionProject;
    };

export interface ProjectStore {
  readonly isAvailable: boolean;
  readonly unavailableReason?: string;
  getProject(id: string): Promise<ConstructionProject | null>;
  listProjects(): Promise<ConstructionProjectSummary[]>;
  saveProject(project: ConstructionProject): Promise<void>;
  deleteProject(id: string): Promise<boolean>;
  saveDrawing(projectId: string, drawingId: string, data: Blob | ArrayBuffer): Promise<void>;
  getDrawing(projectId: string, drawingId: string): Promise<Blob | ArrayBuffer | null>;
  deleteDrawing(projectId: string, drawingId: string): Promise<boolean>;
  close(): void;
}
