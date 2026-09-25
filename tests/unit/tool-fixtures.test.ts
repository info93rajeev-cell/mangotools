import { createTestContext, executeOperation } from '@mangotools/core';
import { fixtureSchema, manifestSchema } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import { parsePresets, resolveExtends } from '../../scripts/generate/presets.ts';
import { loadSources } from '../../scripts/generate/sources.ts';
import { findOperation, loadEngines } from '../../scripts/lib/engines.ts';
import { checkFixture } from '../../scripts/lib/fixtures.ts';

const engines = await loadEngines();
const { sources } = loadSources();
const { raw } = parsePresets(sources.presets);

describe('tool fixtures (through each tool preset)', () => {
  it('every tool has fixtures', () => {
    for (const tool of sources.tools) expect(tool.fixtures.length, tool.folder).toBeGreaterThan(0);
  });

  for (const tool of sources.tools) {
    const manifest = manifestSchema.parse(tool.manifest?.data);
    const resolved = resolveExtends(manifest.preset, raw);
    for (const source of tool.fixtures) {
      it(source.file, async () => {
        if (!('preset' in resolved)) throw new Error(resolved.problem.message);
        const fixture = fixtureSchema.parse(source.data);
        expect(fixture.preset).toBe(manifest.preset);
        const op = findOperation(engines, resolved.preset.operation ?? '');
        expect(op).toBeDefined();
        if (!op) return;
        const params = { ...resolved.preset.params, ...(fixture.params ?? {}) };
        const result = await executeOperation(op, fixture.input, params, createTestContext());
        expect(checkFixture(fixture, result)).toBeNull();
      });
    }
  }
});
