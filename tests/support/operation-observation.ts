import {
  createTestContext,
  type EngineModule,
  executeOperation,
  fromJsonSafe,
} from '@mangotools/core';
import { observe } from './library-observation.ts';

export interface OperationCase {
  id: string;
  operation: string;
  input: unknown;
  params: unknown;
}

/** Same public descriptor/Core semantics in Node and an isolated browser worker. */
export async function runOperationCases(
  engine: EngineModule,
  approved: readonly string[],
  cases: OperationCase[],
) {
  if (cases.length === 0) throw new Error('No operation cases');
  const results = [];
  for (const item of cases) {
    if (!approved.includes(item.operation)) throw new Error('Unapproved operation');
    const operation = engine.operations.find((op) => `${op.id}@${op.major}` === item.operation);
    if (!operation) throw new Error('Missing operation');
    if (!operation.runtimes.includes('node') || !operation.runtimes.includes('worker'))
      throw new Error('Operation must support Node and worker');
    const result = await executeOperation(
      operation,
      fromJsonSafe(item.input),
      fromJsonSafe(item.params),
      createTestContext(),
    );
    results.push({ id: item.id, ...(await observe(result)) });
  }
  return results;
}
