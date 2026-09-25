import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { base64Transform } from './operations/base64-transform/operation.ts';
import { jsonFormat } from './operations/json-format/operation.ts';
import { urlTransform } from './operations/url-transform/operation.ts';

export const engine: EngineModule = {
  engineId: 'data',
  operations: [jsonFormat, base64Transform, urlTransform],
  messages,
};

export { base64Transform, jsonFormat, urlTransform };
