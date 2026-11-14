/**
 * Project file export and import serializer with inline base64 drawing packaging
 * and 25 MB size limit enforcement.
 */

import type {
  ConstructionProject,
  ImportProjectOptions,
  ImportProjectResult,
  ProjectExportBundle,
} from './types.ts';

export const MAX_PROJECT_EXPORT_BYTES = 25 * 1024 * 1024; // 25 MB

export const EXPORT_SIZE_EXCEEDED_MESSAGE =
  'Project export size exceeds maximum limit of 25 MB — remove large drawings or export without drawing attachments';

function calculateUtf8Bytes(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  return str.length;
}

function validateProjectStructure(p: unknown): p is ConstructionProject {
  if (typeof p !== 'object' || p === null) return false;
  const cand = p as Record<string, unknown>;
  return (
    typeof cand.id === 'string' &&
    typeof cand.name === 'string' &&
    typeof cand.createdAt === 'string' &&
    typeof cand.updatedAt === 'string' &&
    typeof cand.currentRevisionNumber === 'number' &&
    Array.isArray(cand.revisions) &&
    Array.isArray(cand.drawings)
  );
}

/**
 * Serializes a construction project to an exportable JSON payload with inline base64 drawings.
 * Throws if the serialized payload exceeds the 25 MB limit.
 */
export function exportProject(project: ConstructionProject): string {
  if (!validateProjectStructure(project)) {
    throw new Error('Invalid project structure: cannot export invalid project');
  }

  const bundle: ProjectExportBundle = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    project,
  };

  const serialized = JSON.stringify(bundle);
  const sizeBytes = calculateUtf8Bytes(serialized);

  if (sizeBytes > MAX_PROJECT_EXPORT_BYTES) {
    throw new Error(EXPORT_SIZE_EXCEEDED_MESSAGE);
  }

  return serialized;
}

/**
 * Parses and validates an imported project file payload.
 * Checks for duplicate project IDs and enforces the 25 MB maximum limit.
 */
export function importProject(
  serialized: string,
  options?: ImportProjectOptions,
): ImportProjectResult {
  const byteLength = calculateUtf8Bytes(serialized);
  if (byteLength > MAX_PROJECT_EXPORT_BYTES) {
    throw new Error(EXPORT_SIZE_EXCEEDED_MESSAGE);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error('Invalid project file: corrupted or unparseable JSON');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid project file: unrecognized schema or missing required fields');
  }

  const bundle = parsed as Record<string, unknown>;
  if (bundle.schemaVersion !== 1 || !validateProjectStructure(bundle.project)) {
    throw new Error('Invalid project file: unrecognized schema or missing required fields');
  }

  const project = bundle.project;
  const existingSet = new Set(options?.existingProjectIds ?? []);
  const isExisting = existingSet.has(project.id);

  if (isExisting) {
    if (options?.onConflict === 'error') {
      throw new Error(`Project with ID '${project.id}' already exists`);
    }
    return { project, isDuplicate: true, action: 'updated' };
  }

  return { project, isDuplicate: false, action: 'created' };
}
