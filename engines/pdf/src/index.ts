import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { pdfMerge } from './operations/merge/operation.ts';

export const engine: EngineModule = {
  engineId: 'pdf',
  operations: [pdfMerge],
  messages,
};

export { pdfMerge };
