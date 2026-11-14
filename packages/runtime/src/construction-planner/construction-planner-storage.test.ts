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
    schemaVersion: 1,
    version: 1,
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
      expect(imported.status).toBe('success');
      if (imported.status === 'success') {
        expect(imported.action).toBe('created');
        expect(imported.project).toEqual(original);
      }
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
    it('returns conflict by default and allows caller to choose replace or copy', async () => {
      const store = createMemoryProjectStore();
      const project = createSampleProject('proj-retry', 'Retry Test Site');
      const exportedJson = exportProject(project);

      // First import
      const result1 = importProject(exportedJson);
      expect(result1.status).toBe('success');
      if (result1.status === 'success') {
        expect(result1.action).toBe('created');
        await store.saveProject(result1.project);
      }

      const list1 = await store.listProjects();
      expect(list1).toHaveLength(1);

      // Second import: default is CONFLICT (never silently overwrites)
      const existingIds = new Set((await store.listProjects()).map((p) => p.id));
      const conflictResult = importProject(exportedJson, { existingProjectIds: existingIds });
      expect(conflictResult.status).toBe('conflict');
      if (conflictResult.status === 'conflict') {
        expect(conflictResult.existingProjectId).toBe('proj-retry');
        expect(conflictResult.existingProjectName).toBe('Retry Test Site');
      }

      // Caller chooses "replace" explicitly
      const replaceResult = importProject(exportedJson, {
        existingProjectIds: existingIds,
        onConflict: 'replace',
      });
      expect(replaceResult.status).toBe('success');
      if (replaceResult.status === 'success') {
        expect(replaceResult.action).toBe('replaced');
      }

      // Caller chooses "copy" explicitly (gets new unique ID and "(Copy)" in name)
      const copyResult = importProject(exportedJson, {
        existingProjectIds: existingIds,
        onConflict: 'copy',
      });
      expect(copyResult.status).toBe('success');
      if (copyResult.status === 'success') {
        expect(copyResult.action).toBe('copied');
        expect(copyResult.project.id).not.toBe('proj-retry');
        expect(copyResult.project.name).toContain('(Copy)');
      }
    });

    it('rejects duplicate import when onConflict is set to conflict', () => {
      const project = createSampleProject('proj-conflict', 'Conflict Test Site');
      const exportedJson = exportProject(project);
      const existingIds = new Set(['proj-conflict']);

      const res = importProject(exportedJson, { existingProjectIds: existingIds });
      expect(res.status).toBe('conflict');
    });
  });

  describe('Immutable Revision Snapshots (Fix 4)', () => {
    it('rejects saving a project when an existing revision has been altered or deleted', async () => {
      const store = createMemoryProjectStore();
      const project = createSampleProject('proj-immutable', 'Immutable Site');
      await store.saveProject(project);

      // Attempt to modify Revision 1 members
      const firstRev = project.revisions[0];
      expect(firstRev).toBeDefined();
      if (!firstRev) return;

      const tamperedProject: ConstructionProject = {
        ...project,
        revisions: [
          {
            ...firstRev,
            comment: 'Tampered comment',
          },
        ],
      };

      await expect(store.saveProject(tamperedProject)).rejects.toThrow(
        'Cannot modify existing revision: revisions are immutable snapshots',
      );
    });
  });

  describe('Concurrent Edit Conflict Detection (Fix 6)', () => {
    it('detects when two tabs attempt to save conflicting project versions', async () => {
      const store = createMemoryProjectStore();
      const project = createSampleProject('proj-concurrent', 'Tab Conflict Site');
      await store.saveProject(project);

      // Tab 1 loads project (version 1)
      const tab1Project = await store.getProject('proj-concurrent');
      expect(tab1Project).toBeDefined();

      // Tab 2 loads same project (version 1)
      const tab2Project = await store.getProject('proj-concurrent');
      expect(tab2Project).toBeDefined();
      if (!tab1Project || !tab2Project) return;

      // Tab 1 appends revision and saves -> store increments version to 2
      const tab1Updated: ConstructionProject = {
        ...tab1Project,
        updatedAt: '2026-11-15T01:00:00.000Z',
        revisions: [
          ...tab1Project.revisions,
          {
            revisionNumber: 2,
            createdAt: '2026-11-15T01:00:00.000Z',
            comment: 'Tab 1 revision',
            members: [],
          },
        ],
      };
      await store.saveProject(tab1Updated);

      // Tab 2 attempts to save with stale version 1 -> must throw concurrency conflict
      const tab2Updated: ConstructionProject = {
        ...tab2Project,
        updatedAt: '2026-11-15T01:05:00.000Z',
        revisions: [
          ...tab2Project.revisions,
          {
            revisionNumber: 2,
            createdAt: '2026-11-15T01:05:00.000Z',
            comment: 'Tab 2 conflicting revision',
            members: [],
          },
        ],
      };

      await expect(store.saveProject(tab2Updated)).rejects.toThrow(
        'Project was modified by another tab or session. Reload to see the latest changes.',
      );
    });
  });

  describe('Export without drawings option (Fix 7)', () => {
    it('exports project payload without drawing binaries when includeDrawings is false', () => {
      const project = createSampleProject('proj-no-dwgs', 'No Drawings Site');
      const exported = exportProject(project, { includeDrawings: false });
      const parsed = JSON.parse(exported);

      expect(parsed.project.drawings).toBeDefined();
      for (const d of parsed.project.drawings) {
        expect(d.base64Data).toBeUndefined();
      }
    });
  });

  describe('schemaVersion validation with Zod (Fix 5)', () => {
    it('rejects unknown or future project schema versions with plain message', () => {
      const project = createSampleProject('proj-v99', 'Future Project');
      const exported = exportProject(project);
      const futureBundle = JSON.parse(exported);
      futureBundle.schemaVersion = 99;

      expect(() => importProject(JSON.stringify(futureBundle))).toThrow(
        'Unsupported project schema version 99. Please update MangoTools to open this project.',
      );
    });
  });

  describe('No silent memory fallback in store (Fix 1)', () => {
    it('reports isAvailable: false and rejects operations when IndexedDB is unavailable', async () => {
      // Calling createProjectStore with driver: 'idb' when indexedDB is undefined
      const store = createProjectStore({ driver: 'idb', idb: undefined });
      expect(store.isAvailable).toBe(false);
      expect(store.unavailableReason).toBeDefined();

      const p = createSampleProject('proj-unavail', 'Unavailable Test');
      await expect(store.saveProject(p)).rejects.toThrow();
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
