import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { pdfJpgToPdf } from './operations/jpg-to-pdf/operation.ts';
import { pdfMerge } from './operations/merge/operation.ts';

export const engine: EngineModule = {
  engineId: 'pdf',
  operations: [pdfMerge, pdfJpgToPdf],
  messages,
};

export { pdfJpgToPdf, pdfMerge };
