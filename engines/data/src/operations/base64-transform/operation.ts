import { defineOperation, err, ok, warning } from '@mangotools/core';
import { MAX_INPUT_CHARS } from '../../errors.ts';
import { decodeUtf8Strict, hexPreview } from '../../lib/bytes.ts';
import { decodeBase64, encodeBase64 } from './codec.ts';
import { type Base64Params, base64Input, base64Output, base64Params } from './schema.ts';
import { bytesToLatin1, latin1Bytes, sniffMime, splitDataUri } from './sniff.ts';

function encode(text: string, params: Base64Params) {
  const bytes = params.charset === 'latin1' ? latin1Bytes(text) : new TextEncoder().encode(text);
  if (bytes === null) return err('DATA_BASE64_NOT_LATIN1', { path: 'text' });
  const body = encodeBase64(bytes, {
    urlSafe: params.variant === 'url-safe',
    padding: params.padding,
    lineLength: params.dataUriMime ? 0 : Number(params.lineLength),
  });
  const out = params.dataUriMime ? `data:${params.dataUriMime};base64,${body}` : body;
  return ok({ text: out, byteLength: bytes.length, isUtf8: true, inputByteLength: bytes.length });
}

function decode(text: string, params: Base64Params) {
  const split = params.stripDataUri ? splitDataUri(text) : { payload: text };
  const decoded = decodeBase64(split.payload, params.variant);
  if (!decoded.ok) {
    const f = decoded.failure;
    return f.code === 'DATA_BASE64_INVALID_CHARACTER'
      ? err(f.code, { path: 'text', details: { offset: f.offset } })
      : err(f.code, { path: 'text' });
  }
  const bytes = decoded.bytes;
  const base = { byteLength: bytes.length, inputByteLength: text.length };
  const mime = split.mime ?? sniffMime(bytes);
  const withMime = mime ? { mime } : {};
  if (params.charset === 'latin1') {
    const binary = bytesToLatin1(bytes);
    return ok({ ...base, ...withMime, text: binary, isUtf8: false, binary });
  }
  const utf8 = decodeUtf8Strict(bytes);
  if (utf8 === null) {
    return ok(
      {
        ...base,
        ...withMime,
        text: '',
        isUtf8: false,
        hexPreview: hexPreview(bytes),
        binary: bytesToLatin1(bytes),
      },
      [warning('DATA_BASE64_NOT_UTF8', { details: { byteLength: bytes.length } })],
    );
  }
  return ok({ ...base, ...withMime, text: utf8, isUtf8: true });
}

export const base64Transform = defineOperation({
  id: 'data.base64.transform',
  major: 1,
  title: 'Base64 encode or decode',
  summary: 'Encodes UTF-8 text as Base64 or decodes Base64 back to text (RFC 4648).',
  input: base64Input,
  params: base64Params,
  output: base64Output,
  errors: [
    'DATA_BASE64_INVALID_CHARACTER',
    'DATA_BASE64_INVALID_LENGTH',
    'DATA_BASE64_NOT_LATIN1',
    'DATA_INPUT_TOO_LARGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    if (input.text.length > MAX_INPUT_CHARS)
      return err('DATA_INPUT_TOO_LARGE', { details: { limitMb: 50 } });
    return params.direction === 'encode' ? encode(input.text, params) : decode(input.text, params);
  },
});
