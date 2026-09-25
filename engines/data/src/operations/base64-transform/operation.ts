import { defineOperation, err, ok, warning } from '@mangotools/core';
import { MAX_INPUT_CHARS } from '../../errors.ts';
import { decodeUtf8Strict, hexPreview } from '../../lib/bytes.ts';
import { decodeBase64, encodeBase64 } from './codec.ts';
import { base64Input, base64Output, base64Params } from './schema.ts';

export const base64Transform = defineOperation({
  id: 'data.base64.transform',
  major: 1,
  title: 'Base64 encode or decode',
  summary: 'Encodes UTF-8 text as Base64 or decodes Base64 back to text (RFC 4648).',
  input: base64Input,
  params: base64Params,
  output: base64Output,
  errors: ['DATA_BASE64_INVALID_CHARACTER', 'DATA_BASE64_INVALID_LENGTH', 'DATA_INPUT_TOO_LARGE'],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    if (input.text.length > MAX_INPUT_CHARS)
      return err('DATA_INPUT_TOO_LARGE', { details: { limitMb: 50 } });
    if (params.direction === 'encode') {
      const bytes = new TextEncoder().encode(input.text);
      const text = encodeBase64(bytes, {
        urlSafe: params.variant === 'url-safe',
        padding: params.padding,
        lineLength: Number(params.lineLength),
      });
      return ok({ text, byteLength: bytes.length, isUtf8: true });
    }
    const decoded = decodeBase64(input.text, params.variant);
    if (!decoded.ok) {
      const f = decoded.failure;
      return f.code === 'DATA_BASE64_INVALID_CHARACTER'
        ? err(f.code, { path: 'text', details: { offset: f.offset } })
        : err(f.code, { path: 'text' });
    }
    const text = decodeUtf8Strict(decoded.bytes);
    if (text === null) {
      return ok(
        {
          text: '',
          byteLength: decoded.bytes.length,
          isUtf8: false,
          hexPreview: hexPreview(decoded.bytes),
        },
        [warning('DATA_BASE64_NOT_UTF8', { details: { byteLength: decoded.bytes.length } })],
      );
    }
    return ok({ text, byteLength: decoded.bytes.length, isUtf8: true });
  },
});
