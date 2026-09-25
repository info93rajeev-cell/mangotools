import { defineOperation, err, ok } from '@mangotools/core';
import { MAX_INPUT_CHARS } from '../../errors.ts';
import { decodeUrl, encodeUrl } from './codec.ts';
import { urlInput, urlOutput, urlParams } from './schema.ts';

export const urlTransform = defineOperation({
  id: 'data.url.transform',
  major: 1,
  title: 'URL encode or decode',
  summary: 'Percent-encodes or decodes text as a URL component, a full URL or form data.',
  input: urlInput,
  params: urlParams,
  output: urlOutput,
  errors: ['DATA_URL_MALFORMED_ESCAPE', 'DATA_URL_INVALID_UTF8', 'DATA_INPUT_TOO_LARGE'],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    if (input.text.length > MAX_INPUT_CHARS)
      return err('DATA_INPUT_TOO_LARGE', { details: { limitMb: 50 } });
    const result =
      params.direction === 'encode'
        ? encodeUrl(input.text, params.mode)
        : decodeUrl(input.text, params.mode);
    if (!result.ok) {
      return err(result.code, {
        path: 'text',
        ...(result.offset !== undefined ? { details: { offset: result.offset } } : {}),
      });
    }
    return ok({ text: result.text, changedCount: result.changedCount });
  },
});
