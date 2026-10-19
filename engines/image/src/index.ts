import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { imageCompress } from './operations/compress/operation.ts';
import { imageCrop } from './operations/crop/operation.ts';
import { imageFavicon } from './operations/favicon/operation.ts';
import { imagePrepareUpload } from './operations/prepare-upload/operation.ts';
import { imageResize } from './operations/resize/operation.ts';
import { imageWatermark } from './operations/watermark/operation.ts';

export const engine: EngineModule = {
  engineId: 'image',
  operations: [
    imageCompress,
    imageResize,
    imageWatermark,
    imageCrop,
    imageFavicon,
    imagePrepareUpload,
  ],
  messages,
};

export { imageCompress, imageCrop, imageFavicon, imagePrepareUpload, imageResize, imageWatermark };
