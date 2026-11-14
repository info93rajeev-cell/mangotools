/**
 * Zod validation schemas for Construction Project Planner storage and export files.
 */

import { z } from 'zod';

export const CURRENT_SCHEMA_VERSION = 1;

export const drawingReferenceSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSizeBytes: z.number().nonnegative(),
  mimeType: z.string(),
  uploadedAt: z.string(),
});

export const drawingAttachmentSchema = drawingReferenceSchema.extend({
  base64Data: z.string().optional(),
});

export const projectRevisionSchema = z.object({
  revisionNumber: z.number().int().positive(),
  createdAt: z.string(),
  comment: z.string(),
  members: z.array(z.record(z.string(), z.unknown())),
  calculationOutput: z.record(z.string(), z.unknown()).optional(),
});

export const constructionProjectSchema = z.object({
  schemaVersion: z.number().int().positive(),
  version: z.number().int().positive().default(1),
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  currentRevisionNumber: z.number().int().positive(),
  revisions: z.array(projectRevisionSchema),
  drawings: z.array(drawingReferenceSchema),
});

export const projectExportBundleSchema = z.object({
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  project: constructionProjectSchema.extend({
    drawings: z.array(drawingAttachmentSchema),
  }),
});
