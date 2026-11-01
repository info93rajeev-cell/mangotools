import { defineOperation, err, ok } from '@mangotools/core';
import { MAX_INPUT_CHARS } from '../../errors.ts';
import { type CodecResult, decodeUrl, encodeUrl } from './codec.ts';
import { parseQuery, readPairs } from './query.ts';
import { type UrlParams, urlInput, urlOutput, urlParams } from './schema.ts';

function encodeOne(text: string, params: UrlParams): CodecResult {
  const prepared = params.crlf ? text.replace(/\r\n|\r|\n/g, '\r\n') : text;
  return encodeUrl(prepared, params.mode, params);
}

function decodeOne(text: string, params: UrlParams): CodecResult {
  return decodeUrl(text, params.mode, params.mode === 'form' || params.space === 'plus');
}

/** Runs the codec on the whole text, or on each line keeping the line breaks. */
function transform(text: string, params: UrlParams): CodecResult {
  const one = params.direction === 'encode' ? encodeOne : decodeOne;
  if (!params.perLine) return one(text, params);
  const lines = text.split(/(\r\n|\n|\r)/);
  let out = '';
  let changed = 0;
  for (let i = 0; i < lines.length; i++) {
    const part = lines[i] ?? '';
    if (i % 2 === 1) {
      out += part;
      continue;
    }
    const r = one(part, { ...params, crlf: false });
    if (!r.ok) return r;
    out += r.text;
    changed += r.changedCount;
  }
  return { ok: true, text: out, changedCount: changed };
}

/** Encodes [key, value] pairs into `k=v&k2=v2`, each part encoded on its own. */
function encodePairs(pairs: [string, string][], params: UrlParams): CodecResult {
  const mode = params.mode === 'full-url' ? 'component' : params.mode;
  const parts: string[] = [];
  let changed = 0;
  for (const [key, value] of pairs) {
    const k = encodeUrl(key, mode, params);
    const v = encodeUrl(value, mode, params);
    if (!k.ok) return k;
    if (!v.ok) return v;
    parts.push(`${k.text}=${v.text}`);
    changed += k.changedCount + v.changedCount;
  }
  return { ok: true, text: parts.join('&'), changedCount: changed };
}

function run(text: string, params: UrlParams): CodecResult | 'bad-pairs' {
  if (params.source === 'pairs' && params.direction === 'encode') {
    const pairs = readPairs(text);
    return pairs ? encodePairs(pairs, params) : 'bad-pairs';
  }
  return transform(text, params);
}

export const urlTransform = defineOperation({
  id: 'data.url.transform',
  major: 1,
  title: 'URL encode or decode',
  summary: 'Percent-encodes or decodes text as a URL component, a full URL or form data.',
  input: urlInput,
  params: urlParams,
  output: urlOutput,
  errors: [
    'DATA_URL_MALFORMED_ESCAPE',
    'DATA_URL_INVALID_UTF8',
    'DATA_URL_INVALID_PAIRS',
    'DATA_INPUT_TOO_LARGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    if (input.text.length > MAX_INPUT_CHARS)
      return err('DATA_INPUT_TOO_LARGE', { details: { limitMb: 50 } });
    const result = run(input.text, params);
    if (result === 'bad-pairs') return err('DATA_URL_INVALID_PAIRS', { path: 'text' });
    if (!result.ok) {
      return err(result.code, {
        path: 'text',
        ...(result.offset !== undefined ? { details: { offset: result.offset } } : {}),
      });
    }
    const encodedSide = params.direction === 'encode' ? result.text : input.text;
    return ok({
      text: result.text,
      changedCount: result.changedCount,
      params: parseQuery(encodedSide),
    });
  },
});
