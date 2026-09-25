import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AnyOperation, EngineModule } from '@mangotools/core';
import { listDirs } from './files.ts';
import { paths } from './paths.ts';

/** Engines that expose operations (have src/operations); library engines such as numeric are skipped. */
export function operationalEngineIds(): string[] {
  return listDirs(paths.engines).filter((id) =>
    existsSync(join(paths.engines, id, 'src', 'operations')),
  );
}

export async function loadEngines(): Promise<Map<string, EngineModule>> {
  const engines = new Map<string, EngineModule>();
  for (const id of operationalEngineIds()) {
    const mod = (await import(pathToFileURL(join(paths.engines, id, 'src', 'index.ts')).href)) as {
      engine?: EngineModule;
    };
    if (!mod.engine || mod.engine.engineId !== id) {
      throw new Error(`engines/${id}/src/index.ts must export "engine" with engineId "${id}".`);
    }
    engines.set(id, mod.engine);
  }
  return engines;
}

export function findOperation(
  engines: Map<string, EngineModule>,
  ref: string,
): AnyOperation | undefined {
  const [id, major] = ref.split('@');
  const engineId = (id ?? '').split('.')[0] ?? '';
  return engines.get(engineId)?.operations.find((op) => op.id === id && String(op.major) === major);
}
