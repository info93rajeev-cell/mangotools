import { readFileSync } from 'node:fs';
import { defaultValues } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import {
  lineColumn,
  messageFor,
  outputRows,
  reconcileOptions,
  visibleOptionValues,
} from './presentation.ts';
import { textStats } from './textStats.ts';

const preset = (id: string): ResolvedPreset =>
  JSON.parse(
    readFileSync(new URL(`../../../../generated/presets/${id}.json`, import.meta.url), 'utf8'),
  );

const gst = preset('estimate/gst.india');
const base64 = preset('data/base64');

describe('tool presentation', () => {
  it('puts the primary output first and hides outputs for the other supply type', () => {
    const value = {
      taxableValue: '100.00',
      cgst: '9.00',
      sgst: '9.00',
      igst: '0.00',
      totalTax: '18.00',
      grossAmount: '118.00',
    };
    const add = outputRows(gst, value, { ...defaultValues(gst), mode: 'add' });
    expect(add.map((r) => r.key)).toEqual([
      'grossAmount',
      'taxableValue',
      'cgst',
      'sgst',
      'totalTax',
    ]);
    expect(add[0]).toMatchObject({ primary: true, value: '₹118.00' });
    const remove = outputRows(gst, value, {
      ...defaultValues(gst),
      mode: 'remove',
      supply: 'inter',
    });
    expect(remove.map((r) => r.key)).toEqual(['taxableValue', 'grossAmount', 'igst', 'totalTax']);
  });

  it('offers Auto only when decoding and resets it when switching to encode', () => {
    const decode = { ...defaultValues(base64), direction: 'decode', variant: 'auto' };
    expect(visibleOptionValues(base64, 'variant', decode).map(([v]) => v)).toEqual([
      'standard',
      'url-safe',
      'auto',
    ]);
    const encode = reconcileOptions(base64, { ...decode, direction: 'encode' });
    expect(encode.variant).toBe('standard');
  });

  it('fills engine messages from error details', () => {
    const error = { code: 'DATA_BASE64_INVALID_CHARACTER', details: { offset: 4 } };
    expect(messageFor(base64, error)).toBe('Invalid Base64 character at position 4.');
    expect(messageFor(base64, { code: 'NOPE' })).toContain('Something went wrong');
  });

  it('locates offsets and counts characters and UTF-8 bytes', () => {
    expect(lineColumn('ab\ncd\nef', 4)).toEqual({ line: 2, column: 2 });
    expect(textStats('₹ a😀')).toEqual({ chars: 4, bytes: 3 + 1 + 1 + 4 });
  });
});
