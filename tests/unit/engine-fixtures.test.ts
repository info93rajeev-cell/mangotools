import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { findOperation, loadEngines } from '../../scripts/lib/engines.ts';
import { checkFixture, engineFixtureFiles, loadFixture } from '../../scripts/lib/fixtures.ts';
import { rel } from '../../scripts/lib/paths.ts';

const engines = await loadEngines();
const fixtures = engineFixtureFiles().map(loadFixture);

describe('engine golden fixtures', () => {
  it('found fixtures', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const { file, fixture } of fixtures) {
    it(rel(file), async () => {
      const ref = fixture.operation ?? '';
      const op = findOperation(engines, ref);
      expect(op, `operation ${ref} not found`).toBeDefined();
      if (!op) return;
      const result = await executeOperation(
        op,
        fixture.input,
        fixture.params ?? {},
        createTestContext(),
      );
      expect(checkFixture(fixture, result)).toBeNull();
    });
  }
});
