import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { EngineModule } from '@mangotools/core';
import { engineFixtureFiles, loadFixture } from '../../scripts/lib/fixtures.ts';
import { ROOT } from '../../scripts/lib/paths.ts';
import { publicLibraryEntry } from './library-bundle.ts';

export interface UnpublishedTarget {
  packageName: string;
  directory: string;
  operation: string;
}

/** Deliberately independent of presets, registry engineIds and generated publication data. */
export function unpublishedFixtures(operation: string) {
  const selected = engineFixtureFiles()
    .map(loadFixture)
    .filter(({ fixture }) => fixture.operation === operation);
  if (selected.length === 0) throw new Error(`No approved fixtures: ${operation}`);
  return selected;
}

export async function loadUnpublishedEngine(target: UnpublishedTarget): Promise<EngineModule> {
  const entry = publicLibraryEntry(target.packageName, join(ROOT, target.directory));
  const library = await import(pathToFileURL(entry).href);
  const engine: EngineModule = library.engine;
  if (engine?.engineId !== target.operation.split('.')[0])
    throw new Error('Public engine entry does not match selected operation');
  return engine;
}
