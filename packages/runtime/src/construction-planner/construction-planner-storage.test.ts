import type { ColumnMemberInput, FootingMemberInput, TrackedValue } from '@mangotools/engine-civil';
import { describe, expect, it } from 'vitest';
import {
  type ConstructionProject,
  createMemoryProjectStore,
  createProjectStore,
  type DrawingAttachment,
  diffProjectRevisions,
  exportProject,
  importProject,
  MAX_PROJECT_EXPORT_BYTES,
  type ProjectRevision,
} from './index.ts';

function tracked<T>(value: T): TrackedValue<T> {
  return { value, origin: 'typed', confirmedByUser: true };
}

function makeFooting(id: string, label: string): FootingMemberInput {
  return {
    id,
    label,
    memberType: 'footing',
    count: tracked(2),
    concreteGrade: tracked('M25'),
    steelGrade: tracked('Fe500'),
    clearCoverMm: tracked(50),
    cuttingMethod: tracked('is2502-method-a'),
    is2502KFactor: tracked(3),
    lengthMm: tracked(1800),
    widthMm: tracked(1500),
    depthMm: tracked(400),
    bottomMeshXBarDiameterMm: tracked(12),
    bottomMeshXSpacingMm: tracked(150),
    bottomMeshYBarDiameterMm: tracked(12),
    bottomMeshYSpacingMm: tracked(150),
  };
}

function makeColumn(id: string, label: string): ColumnMemberInput {
  return {
    id,
    label,
    memberType: 'column',
    count: tracked(4),
    concreteGrade: tracked('M30'),
    steelGrade: tracked('Fe500'),
    clearCoverMm: tracked(40),
    cuttingMethod: tracked('site-practice-method-b'),
    widthMm: tracked(300),
    depthMm: tracked(450),
    heightMm: tracked(3000),
    mainBarDiameterMm: tracked(16),
    mainBarCount: tracked(6),
    tieDiameterMm: tracked(8),
    tieSpacingMm: tracked(150),
    tieHookAngle: tracked(135),
    methodBStirrupHookMm: tracked(100),
  };
}

function createSampleProject(id: string, name: string): ConstructionProject {
  const drawing: DrawingAttachment = {
    id: `dwg-${id}-1`,
    fileName: 'Structural_Footing_Layout.pdf',
    fileSizeBytes: 1024,
    mimeType: 'application/pdf',
    base64Data: 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFI...',
    uploadedAt: '2026-11-15T00:00:00.000Z',
  };

  const rev1: ProjectRevision = {
    revisionNumber: 1,
    createdAt: '2026-11-15T00:00:00.000Z',
    comment: 'Initial foundation draft',
    members: [makeFooting(`${id}-f1`, 'F1'), makeFooting(`${id}-f2`, 'F2')],
  };

  return {
    id,
    name,
    createdAt: '2026-11-15T00:00:00.000Z',
    updatedAt: '2026-11-15T00:00:00.000Z',
    currentRevisionNumber: 1,
    revisions: [rev1],
    drawings: [drawing],
  };
}

describe('Construction Project Planner Storage & Lifecycle', () => {
  describe('Round-trip export and import', () => {
    it('exports a project with drawings and revisions, and imports back preserving all fields', () => {
      const original = createSampleProject('proj-roundtrip', 'Residential Villa Site 12');
      const exportedJson = exportProject(original);

      expect(typeof exportedJson).toBe('string');
      expect(exportedJson.length).toBeGreaterThan(0);

      const imported = importProject(exportedJson);
      expect(imported.isDuplicate).toBe(false);
      expect(imported.action).toBe('created');
      expect(imported.project).toEqual(original);
    });
  });

  describe('Cross-project isolation', () => {
    it('ensures operations on Project A never mutate or delete Project B', async () => {
      const store = createMemoryProjectStore();
      const projectA = createSampleProject('proj-a', 'Project Alpha');
      const projectB = createSampleProject('proj-b', 'Project Beta');

      await store.saveProject(projectA);
      await store.saveProject(projectB);

      const listAfterSave = await store.listProjects();
      expect(listAfterSave).toHaveLength(2);
      expect(listAfterSave.map((p) => p.id).sort()).toEqual(['proj-a', 'proj-b']);

      // Mutate Project A
      const updatedA: ConstructionProject = {
        ...projectA,
        name: 'Project Alpha - Updated Name',
        updatedAt: '2026-11-15T01:00:00.000Z',
      };
      await store.saveProject(updatedA);

      // Verify Project B remains identical
      const fetchedB = await store.getProject('proj-b');
      expect(fetchedB).toEqual(projectB);
      expect(fetchedB?.name).toBe('Project Beta');

      // Delete Project A
      const deleted = await store.deleteProject('proj-a');
      expect(deleted).toBe(true);

      // Verify Project B is still intact
      const fetchedBAfterDelete = await store.getProject('proj-b');
      expect(fetchedBAfterDelete).toEqual(projectB);

      const remainingList = await store.listProjects();
      expect(remainingList).toHaveLength(1);
      expect(remainingList[0]?.id).toBe('proj-b');
    });
  });

  describe('Historical revision preservation', () => {
    it('preserves older revision snapshots intact when a new revision is appended', async () => {
      const store = createMemoryProjectStore();
      const project = createSampleProject('proj-revisions', 'Commercial G+2');
      await store.saveProject(project);

      const rev1Members = project.revisions[0]?.members ?? [];
      const baseFooting = rev1Members[0] as FootingMemberInput;
      const rev2Footing: FootingMemberInput = {
        ...baseFooting,
        depthMm: tracked(500),
      };
      const rev2Column = makeColumn('col-1', 'C1');

      const rev2: ProjectRevision = {
        revisionNumber: 2,
        createdAt: '2026-11-15T02:00:00.000Z',
        comment: 'Revision 2 - Increased footing depth and added columns',
        members: [rev2Footing, rev1Members[1] ?? rev2Footing, rev2Column],
      };

      await store.saveProject({
        ...project,
        currentRevisionNumber: 2,
        updatedAt: '2026-11-15T02:00:00.000Z',
        revisions: [...project.revisions, rev2],
      });

      const loaded = await store.getProject('proj-revisions');
      expect(loaded?.revisions).toHaveLength(2);

      const r1 = loaded?.revisions[0];
      const r2 = loaded?.revisions[1];
      expect(r1?.revisionNumber).toBe(1);
      expect(r1?.members).toHaveLength(2);
      expect((r1?.members[0] as FootingMemberInput)?.depthMm.value).toBe(400);

      expect(r2?.revisionNumber).toBe(2);
      expect(r2?.members).toHaveLength(3);
      expect((r2?.members[0] as FootingMemberInput)?.depthMm.value).toBe(500);

      const diff = diffProjectRevisions(r1?.members ?? [], r2?.members ?? []);
      expect(diff.added.map((m) => m.id)).toEqual(['col-1']);
      expect(diff.removed).toEqual([]);
      expect(diff.changed.map((m) => m.memberId)).toEqual([r1?.members[0]?.id]);
      expect(diff.unchanged.map((m) => m.id)).toEqual([r1?.members[1]?.id]);
    });
  });

  describe('No duplicate project on retry', () => {
    it('handles repeated import of existing project idempotently without creating duplicates', async () => {
      const store = createMemoryProjectStore();
      const project = createSampleProject('proj-retry', 'Retry Test Site');
      const exportedJson = exportProject(project);

      // First import
      const result1 = importProject(exportedJson);
      expect(result1.isDuplicate).toBe(false);
      expect(result1.action).toBe('created');
      await store.saveProject(result1.project);

      const list1 = await store.listProjects();
      expect(list1).toHaveLength(1);

      // Second import (simulating user retrying the import of the same file)
      const existingIds = new Set((await store.listProjects()).map((p) => p.id));
      const result2 = importProject(exportedJson, { existingProjectIds: existingIds });

      expect(result2.isDuplicate).toBe(true);
      expect(result2.action).toBe('updated');
      await store.saveProject(result2.project);

      // Total count in store MUST remain 1 (no duplicate project created)
      const list2 = await store.listProjects();
      expect(list2).toHaveLength(1);
      expect(list2[0]?.id).toBe('proj-retry');
    });

    it('rejects duplicate import when onConflict is set to error', () => {
      const project = createSampleProject('proj-conflict', 'Conflict Test Site');
      const exportedJson = exportProject(project);
      const existingIds = new Set(['proj-conflict']);

      expect(() =>
        importProject(exportedJson, {
          existingProjectIds: existingIds,
          onConflict: 'error',
        }),
      ).toThrow("Project with ID 'proj-conflict' already exists");
    });
  });

  describe('Export size limit enforcement (25 MB)', () => {
    it('throws clear typed error when total project payload exceeds 25 MB', () => {
      const project = createSampleProject('proj-oversized', 'Mega Project');

      // Create a drawing exceeding 25 MB
      const oversizedBytes = MAX_PROJECT_EXPORT_BYTES + 1024;
      const oversizedDrawing: DrawingAttachment = {
        id: 'dwg-huge',
        fileName: 'Uncompressed_Scan_Sheet.pdf',
        fileSizeBytes: oversizedBytes,
        mimeType: 'application/pdf',
        base64Data: 'A'.repeat(oversizedBytes),
        uploadedAt: '2026-11-15T00:00:00.000Z',
      };

      project.drawings.push(oversizedDrawing);

      expect(() => exportProject(project)).toThrow(
        'Project export size exceeds maximum limit of 25 MB — remove large drawings or export without drawing attachments',
      );
    });

    it('rejects importing a raw payload exceeding 25 MB', () => {
      const oversizedRaw = 'x'.repeat(MAX_PROJECT_EXPORT_BYTES + 50);
      expect(() => importProject(oversizedRaw)).toThrow(
        'Project export size exceeds maximum limit of 25 MB — remove large drawings or export without drawing attachments',
      );
    });
  });

  describe('Import schema validation', () => {
    it('rejects corrupted or unparseable JSON', () => {
      expect(() => importProject('{ not valid json')).toThrow(
        'Invalid project file: corrupted or unparseable JSON',
      );
    });

    it('rejects missing or unrecognized schema structure', () => {
      expect(() => importProject(JSON.stringify({ someOtherField: 123 }))).toThrow(
        'Invalid project file: unrecognized schema or missing required fields',
      );
    });
  });

  describe('createProjectStore factory fallback', () => {
    it('falls back to memory store when preferMemory is true', async () => {
      const store = createProjectStore({ preferMemory: true });
      const p = createSampleProject('proj-mem', 'Memory Project');
      await store.saveProject(p);
      const loaded = await store.getProject('proj-mem');
      expect(loaded?.id).toBe('proj-mem');
    });
  });
});
