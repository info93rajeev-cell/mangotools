import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { imageResize } from './operations/resize/operation.ts';
import { imageWatermark } from './operations/watermark/operation.ts';

export const engine: EngineModule = {
  engineId: 'image',
  operations: [imageResize, imageWatermark],
  messages,
};

export { imageResize, imageWatermark };
