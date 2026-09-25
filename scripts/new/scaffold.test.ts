import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { runPipeline } from '../generate/pipeline.ts';
import { loadSources } from '../generate/sources.ts';
import { loadEngines } from '../lib/engines.ts';
import { ROOT } from '../lib/paths.ts';
import { scaffoldTool } from './scaffold.ts';

const root = mkdtempSync(join(tmpdir(), 'mangotools-scaffold-'));
for (const entry of ['site.config.yaml', 'taxonomy', 'presets', 'tools']) {
  cpSync(join(ROOT, entry), join(root, entry), { recursive: true });
}
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('pnpm new:tool', () => {
  it('writes a tool that fails only on text left for the author', async () => {
    const files = await scaffoldTool(root, {
      slug: 'demo-gst-tool',
      preset: 'estimate/gst.india',
      category: 'business',
      tier: 'T2',
      today: '2026-09-25',
    });
    expect(files).toEqual([
      'tools/demo-gst-tool/manifest.yaml',
      'tools/demo-gst-tool/content.md',
      'tools/demo-gst-tool/fixtures/001-sample.yaml',
    ]);
    const { sources, issues: loadIssues } = loadSources(root);
    expect(loadIssues).toEqual([]);
    const { issues } = await runPipeline(sources, await loadEngines());
    expect(issues.length).toBeGreaterThan(0);
    for (const i of issues) {
      expect(i.file.startsWith('tools/demo-gst-tool/'), `${i.file}: ${i.message}`).toBe(true);
      expect(i.message).toBe('Placeholder text left by the scaffolder.');
    }
    const flagged = new Set(issues.map((i) => i.file));
    expect(flagged).toEqual(new Set(files));
  });

  it('refuses unknown presets and existing folders', async () => {
    const base = { category: 'developer', tier: 'T3' as const, today: '2026-09-25' };
    await expect(
      scaffoldTool(root, { ...base, slug: 'x-tool', preset: 'data/nothing' }),
    ).rejects.toThrow('not found');
    await expect(
      scaffoldTool(root, { ...base, slug: 'json-formatter', preset: 'data/url' }),
    ).rejects.toThrow('already exists');
  });
});
