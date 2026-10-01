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

describe('tool fixtures (through each fixture-declared preset)', () => {
  it('every tool has fixtures', () => {
    for (const tool of sources.tools) expect(tool.fixtures.length, tool.folder).toBeGreaterThan(0);
  });

  it('every tool has a fixture for its active preset', () => {
    for (const tool of sources.tools) {
      const manifest = manifestSchema.parse(tool.manifest?.data);
      const presets = tool.fixtures.map((source) => fixtureSchema.parse(source.data).preset);
      expect(presets, tool.folder).toContain(manifest.preset);
    }
  });

  for (const tool of sources.tools) {
    for (const source of tool.fixtures) {
      it(source.file, async () => {
        const fixture = fixtureSchema.parse(source.data);
        if (!fixture.preset) throw new Error('Tool fixture must declare a preset.');
        const resolved = resolveExtends(fixture.preset, raw);
        if (!('preset' in resolved)) throw new Error(resolved.problem.message);
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
