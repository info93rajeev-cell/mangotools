/**
 * Project file export and import serializer with inline base64 drawing packaging,
 * 25 MB size limit enforcement, Zod schema validation, and conflict-safe import.
 */

import { CURRENT_SCHEMA_VERSION, projectExportBundleSchema } from './schemas.ts';
import type {
  ConstructionProject,
  DrawingAttachment,
  ExportProjectOptions,
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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] as number);
  }
  return btoa(binary);
}

/**
 * Serializes a construction project to an exportable JSON payload.
 * When includeDrawings is true (default), embeds drawings as inline Base64 data.
 * When includeDrawings is false, produces a lightweight bundle without binary drawings.
 */
export function exportProject(
  project: ConstructionProject,
  options?: ExportProjectOptions,
): string {
  const includeDrawings = options?.includeDrawings ?? true;

  const exportDrawings: DrawingAttachment[] = project.drawings.map((ref) => {
    if (!includeDrawings) {
      return {
        id: ref.id,
        fileName: ref.fileName,
        fileSizeBytes: ref.fileSizeBytes,
        mimeType: ref.mimeType,
        uploadedAt: ref.uploadedAt,
      };
    }

    let b64: string | undefined = (ref as DrawingAttachment).base64Data;
    if (!b64 && options?.drawingBinaries) {
      const binaries = options.drawingBinaries;
      const bin = binaries instanceof Map ? binaries.get(ref.id) : binaries[ref.id];
      if (bin instanceof ArrayBuffer) {
        b64 = arrayBufferToBase64(bin);
      }
    }

    return {
      id: ref.id,
      fileName: ref.fileName,
      fileSizeBytes: ref.fileSizeBytes,
      mimeType: ref.mimeType,
      uploadedAt: ref.uploadedAt,
      base64Data: b64,
    };
  });

  const bundle: ProjectExportBundle = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    project: {
      ...project,
      schemaVersion: project.schemaVersion ?? CURRENT_SCHEMA_VERSION,
      version: project.version ?? 1,
      drawings: exportDrawings,
    },
  };

  const serialized = JSON.stringify(bundle);
  const sizeBytes = calculateUtf8Bytes(serialized);

  if (sizeBytes > MAX_PROJECT_EXPORT_BYTES) {
    throw new Error(EXPORT_SIZE_EXCEEDED_MESSAGE);
  }

  return serialized;
}

/**
 * Parses and validates an imported project file payload using Zod.
 * Rejects unknown schema versions with a plain message.
 * Never silently overwrites existing projects: returns conflict result by default.
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

  const raw = parsed as Record<string, unknown>;
  const rawVersion = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : undefined;

  if (rawVersion !== undefined && rawVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported project schema version ${rawVersion}. Please update MangoTools to open this project.`,
    );
  }

  const parseResult = projectExportBundleSchema.safeParse(raw);
  if (!parseResult.success) {
    throw new Error('Invalid project file: unrecognized schema or missing required fields');
  }

  const bundle = parseResult.data;
  const project = bundle.project as unknown as ConstructionProject;
  const existingSet = new Set(options?.existingProjectIds ?? []);
  const isExisting = existingSet.has(project.id);

  if (isExisting) {
    if (options?.onConflict === 'replace') {
      return { status: 'success', action: 'replaced', project };
    }
    if (options?.onConflict === 'copy') {
      const copyId = `proj-copy-${Date.now()}`;
      const copiedProject: ConstructionProject = {
        ...project,
        id: copyId,
        name: `${project.name} (Copy)`,
        updatedAt: new Date().toISOString(),
        version: 1,
        drawings: project.drawings.map((d) => ({
          ...d,
          id: `dwg-${copyId}-${d.id}`,
        })),
      };
      return { status: 'success', action: 'copied', project: copiedProject };
    }
    // Default is conflict (never silently replace)
    return {
      status: 'conflict',
      existingProjectId: project.id,
      existingProjectName: project.name,
      importedProject: project,
    };
  }

  return { status: 'success', action: 'created', project };
}
