import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { imageCrop } from './operations/crop/operation.ts';
import { imageFavicon } from './operations/favicon/operation.ts';
import { imageResize } from './operations/resize/operation.ts';
import { imageWatermark } from './operations/watermark/operation.ts';

export const engine: EngineModule = {
  engineId: 'image',
  operations: [imageResize, imageWatermark, imageCrop, imageFavicon],
  messages,
};

export { imageCrop, imageFavicon, imageResize, imageWatermark };
