import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { imageResize } from './operations/resize/operation.ts';

export const engine: EngineModule = {
  engineId: 'image',
  operations: [imageResize],
  messages,
};

export { imageResize };
