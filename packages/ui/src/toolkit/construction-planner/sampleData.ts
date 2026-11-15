import type { ConstructionProject } from '@mangotools/runtime';
import type { SheetMetadata } from './types.ts';

export const SAMPLE_PROJECT_ID = 'sample-p01-residence';

export const SAMPLE_SHEETS: SheetMetadata[] = [
  {
    id: 'a-01',
    sheetNumber: 'A-01',
    name: 'Ground Floor Plan',
    category: 'architectural',
    revision: 'R1',
    uploadedAt: '2026-11-15T09:00:00Z',
  },
  {
    id: 'a-02',
    sheetNumber: 'A-02',
    name: 'First Floor Plan',
    category: 'architectural',
    revision: 'R1',
    uploadedAt: '2026-11-15T09:05:00Z',
  },
  {
    id: 'a-03',
    sheetNumber: 'A-03',
    name: 'Terrace Plan',
    category: 'architectural',
    revision: 'R1',
    uploadedAt: '2026-11-15T09:10:00Z',
  },
  {
    id: 's-01',
    sheetNumber: 'S-01',
    name: 'Foundation Plan',
    category: 'structural',
    revision: 'R1',
    uploadedAt: '2026-11-15T09:15:00Z',
  },
  {
    id: 's-02',
    sheetNumber: 'S-02',
    name: 'Typical Floor Framing',
    category: 'structural',
    revision: 'R2',
    uploadedAt: '2026-11-15T09:20:00Z',
  },
  {
    id: 's-03',
    sheetNumber: 'S-03',
    name: 'Roof Framing',
    category: 'structural',
    revision: 'R1',
    uploadedAt: '2026-11-15T09:25:00Z',
  },
  {
    id: 's-04',
    sheetNumber: 'S-04',
    name: 'Column Layout',
    category: 'structural',
    revision: 'R1',
    uploadedAt: '2026-11-15T09:30:00Z',
  },
  {
    id: 's-10',
    sheetNumber: 'S-10',
    name: 'Section A-A',
    category: 'section-elevation',
    revision: 'R1',
    uploadedAt: '2026-11-15T09:35:00Z',
  },
  {
    id: 's-11',
    sheetNumber: 'S-11',
    name: 'Section B-B',
    category: 'section-elevation',
    revision: 'R1',
    uploadedAt: '2026-11-15T09:40:00Z',
  },
  {
    id: 'd-01',
    sheetNumber: 'D-01',
    name: 'Column Details',
    category: 'member-details',
    revision: 'R1',
    uploadedAt: '2026-11-15T09:45:00Z',
  },
  {
    id: 'd-02',
    sheetNumber: 'D-02',
    name: 'Beam Details',
    category: 'member-details',
    revision: 'R1',
    uploadedAt: '2026-11-15T09:50:00Z',
  },
  {
    id: 'd-03',
    sheetNumber: 'D-03',
    name: 'Footing Details',
    category: 'member-details',
    revision: 'R1',
    uploadedAt: '2026-11-15T09:55:00Z',
  },
  {
    id: 'd-04',
    sheetNumber: 'D-04',
    name: 'Slab Details',
    category: 'member-details',
    revision: 'R1',
    uploadedAt: '2026-11-15T10:00:00Z',
  },
  {
    id: 'd-05',
    sheetNumber: 'D-05',
    name: 'Staircase Details',
    category: 'member-details',
    revision: 'R1',
    uploadedAt: '2026-11-15T10:05:00Z',
  },
  {
    id: 'd-06',
    sheetNumber: 'D-06',
    name: 'Retaining Wall Details',
    category: 'member-details',
    revision: 'R1',
    uploadedAt: '2026-11-15T10:10:00Z',
  },
];

function sampleFooting() {
  return {
    id: 'f1-footing-set',
    label: 'F1 - Footing Set (F1-F6)',
    memberType: 'footing' as const,
    count: { value: 12, origin: 'typed' as const, confirmedByUser: true },
    concreteGrade: { value: 'M25', origin: 'typed' as const, confirmedByUser: true },
    steelGrade: { value: 'Fe 500', origin: 'typed' as const, confirmedByUser: true },
    clearCoverMm: { value: 50, origin: 'typed' as const, confirmedByUser: true },
    cuttingMethod: {
      value: 'is2502-method-a' as const,
      origin: 'typed' as const,
      confirmedByUser: true,
    },
    is2502KFactor: { value: 3 as const, origin: 'typed' as const, confirmedByUser: true },
    lengthMm: { value: 2000, origin: 'typed' as const, confirmedByUser: true },
    widthMm: { value: 1500, origin: 'typed' as const, confirmedByUser: true },
    depthMm: { value: 400, origin: 'typed' as const, confirmedByUser: true },
    bottomMeshXBarDiameterMm: { value: 12, origin: 'typed' as const, confirmedByUser: true },
    bottomMeshXSpacingMm: { value: 150, origin: 'typed' as const, confirmedByUser: true },
    bottomMeshYBarDiameterMm: { value: 12, origin: 'typed' as const, confirmedByUser: true },
    bottomMeshYSpacingMm: { value: 150, origin: 'typed' as const, confirmedByUser: true },
  };
}

function sampleColumn() {
  return {
    id: 'c3-column-cage',
    label: 'C3 - Column Cage',
    memberType: 'column' as const,
    count: { value: 28, origin: 'typed' as const, confirmedByUser: true },
    concreteGrade: { value: 'M25', origin: 'typed' as const, confirmedByUser: true },
    steelGrade: { value: 'Fe 500', origin: 'typed' as const, confirmedByUser: true },
    clearCoverMm: { value: 40, origin: 'typed' as const, confirmedByUser: true },
    cuttingMethod: {
      value: 'is2502-method-a' as const,
      origin: 'typed' as const,
      confirmedByUser: true,
    },
    is2502KFactor: { value: 3 as const, origin: 'typed' as const, confirmedByUser: true },
    widthMm: { value: 300, origin: 'typed' as const, confirmedByUser: true },
    depthMm: { value: 450, origin: 'typed' as const, confirmedByUser: true },
    heightMm: { value: 3600, origin: 'typed' as const, confirmedByUser: true },
    mainBarDiameterMm: { value: 20, origin: 'typed' as const, confirmedByUser: true },
    mainBarCount: { value: 8, origin: 'typed' as const, confirmedByUser: true },
    tieDiameterMm: { value: 8, origin: 'typed' as const, confirmedByUser: true },
    tieSpacingMm: { value: 150, origin: 'typed' as const, confirmedByUser: true },
    tieHookAngle: { value: 135 as const, origin: 'typed' as const, confirmedByUser: true },
  };
}

function sampleBeam() {
  return {
    id: 'b7-beam-design',
    label: 'B7 - Beam Design (3.6 m)',
    memberType: 'beam' as const,
    count: { value: 36, origin: 'typed' as const, confirmedByUser: true },
    concreteGrade: { value: 'M25', origin: 'typed' as const, confirmedByUser: true },
    steelGrade: { value: 'Fe 500', origin: 'typed' as const, confirmedByUser: true },
    clearCoverMm: { value: 30, origin: 'typed' as const, confirmedByUser: true },
    cuttingMethod: {
      value: 'is2502-method-a' as const,
      origin: 'typed' as const,
      confirmedByUser: true,
    },
    is2502KFactor: { value: 3 as const, origin: 'typed' as const, confirmedByUser: true },
    lengthMm: { value: 3600, origin: 'typed' as const, confirmedByUser: true },
    widthMm: { value: 230, origin: 'typed' as const, confirmedByUser: true },
    depthMm: { value: 450, origin: 'typed' as const, confirmedByUser: true },
    topBarDiameterMm: { value: 16, origin: 'typed' as const, confirmedByUser: true },
    topBarCount: { value: 2, origin: 'typed' as const, confirmedByUser: true },
    bottomBarDiameterMm: { value: 16, origin: 'typed' as const, confirmedByUser: true },
    bottomBarCount: { value: 3, origin: 'typed' as const, confirmedByUser: true },
    stirrupDiameterMm: { value: 8, origin: 'typed' as const, confirmedByUser: true },
    stirrupSpacingMm: { value: 150, origin: 'typed' as const, confirmedByUser: true },
    stirrupHookAngle: { value: 135 as const, origin: 'typed' as const, confirmedByUser: true },
  };
}

function sampleSlab() {
  return {
    id: 's2-slab-zone',
    label: 'S2 - Slab Zone (120 m²)',
    memberType: 'slab' as const,
    count: { value: 48, origin: 'typed' as const, confirmedByUser: true },
    concreteGrade: { value: 'M25', origin: 'typed' as const, confirmedByUser: true },
    steelGrade: { value: 'Fe 500', origin: 'typed' as const, confirmedByUser: true },
    clearCoverMm: { value: 20, origin: 'typed' as const, confirmedByUser: true },
    cuttingMethod: {
      value: 'is2502-method-a' as const,
      origin: 'typed' as const,
      confirmedByUser: true,
    },
    is2502KFactor: { value: 3 as const, origin: 'typed' as const, confirmedByUser: true },
    lengthMm: { value: 4000, origin: 'typed' as const, confirmedByUser: true },
    widthMm: { value: 3000, origin: 'typed' as const, confirmedByUser: true },
    thicknessMm: { value: 150, origin: 'typed' as const, confirmedByUser: true },
    mainBarDiameterMm: { value: 10, origin: 'typed' as const, confirmedByUser: true },
    mainBarSpacingMm: { value: 150, origin: 'typed' as const, confirmedByUser: true },
    distBarDiameterMm: { value: 8, origin: 'typed' as const, confirmedByUser: true },
    distBarSpacingMm: { value: 200, origin: 'typed' as const, confirmedByUser: true },
  };
}

export function createSampleProject(): ConstructionProject {
  const members = [sampleFooting(), sampleColumn(), sampleBeam(), sampleSlab()];
  return {
    schemaVersion: 1,
    id: SAMPLE_PROJECT_ID,
    name: 'P01 · Residence + Office (G+3)',
    version: 1,
    currentRevisionNumber: 1,
    createdAt: '2026-11-15T08:00:00.000Z',
    updatedAt: '2026-11-15T10:24:00.000Z',
    revisions: [
      {
        revisionNumber: 1,
        createdAt: '2026-11-15T08:00:00.000Z',
        comment: 'Initial structural design intake',
        members,
      },
    ],
    drawings: SAMPLE_SHEETS.map((s) => ({
      id: s.id,
      fileName: `${s.sheetNumber} ${s.name}.pdf`,
      mimeType: 'application/pdf',
      fileSizeBytes: 102400,
      uploadedAt: s.uploadedAt,
    })),
  };
}
