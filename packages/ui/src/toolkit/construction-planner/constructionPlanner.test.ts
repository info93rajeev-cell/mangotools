import { describe, expect, it } from 'vitest';
import { constructionPlannerStrings } from './constructionPlannerStrings.ts';
import { createSampleProject, SAMPLE_PROJECT_ID, SAMPLE_SHEETS } from './sampleData.ts';

describe('Construction Project Planner - Tab 1 (Project Setup)', () => {
  it('creates sample project with valid schema and expected 124 member count', () => {
    const sample = createSampleProject();
    expect(sample.id).toBe(SAMPLE_PROJECT_ID);
    expect(sample.schemaVersion).toBe(1);
    expect(sample.name).toBe('P01 · Residence + Office (G+3)');
    expect(sample.revisions).toHaveLength(1);

    const members = sample.revisions[0]?.members ?? [];
    expect(members).toHaveLength(4);

    const footings = members.find((m) => m.memberType === 'footing');
    const columns = members.find((m) => m.memberType === 'column');
    const beams = members.find((m) => m.memberType === 'beam');
    const slabs = members.find((m) => m.memberType === 'slab');

    expect(footings?.count.value).toBe(12);
    expect(columns?.count.value).toBe(28);
    expect(beams?.count.value).toBe(36);
    expect(slabs?.count.value).toBe(48);

    const totalCount =
      (footings?.count.value ?? 0) +
      (columns?.count.value ?? 0) +
      (beams?.count.value ?? 0) +
      (slabs?.count.value ?? 0);
    expect(totalCount).toBe(124);
  });

  it('includes 15 initial drawing sheets across all 4 categories', () => {
    expect(SAMPLE_SHEETS).toHaveLength(15);
    const arch = SAMPLE_SHEETS.filter((s) => s.category === 'architectural');
    const struct = SAMPLE_SHEETS.filter((s) => s.category === 'structural');
    const sec = SAMPLE_SHEETS.filter((s) => s.category === 'section-elevation');
    const details = SAMPLE_SHEETS.filter((s) => s.category === 'member-details');

    expect(arch).toHaveLength(3);
    expect(struct).toHaveLength(4);
    expect(sec).toHaveLength(2);
    expect(details).toHaveLength(6);
  });

  it('explicitly warns that DWG files are not supported locally', () => {
    expect(constructionPlannerStrings.dwgNotSupportedNotice).toContain(
      'DWG format is not supported locally',
    );
    expect(constructionPlannerStrings.dwgNotSupportedNotice).toContain(
      'Upload vector PDF or image drawings',
    );
  });

  it('includes clear safety disclaimer in strings and references', () => {
    expect(constructionPlannerStrings.toolTitle).toBe('Construction Project Planner');
    expect(constructionPlannerStrings.tabSetup).toBe('Project Setup');
    expect(constructionPlannerStrings.notBuiltYetBadge).toBe('Not built yet');
    expect(constructionPlannerStrings.storageUnavailableWarning).toContain(
      'IndexedDB storage is unavailable',
    );
  });
});
