import { describe, expect, it } from 'vitest';
import {
  decodeTransferHash,
  encodeTransferHash,
  filterTransferValues,
  hasTransferHash,
  pickTransferValues,
} from './transfer.ts';

describe('transfer hash', () => {
  it('round-trips a flat string map', () => {
    const values = { exporterName: 'Sunrise Handicrafts Exports', destinationCountry: 'India' };
    const hash = encodeTransferHash(values);
    expect(hasTransferHash(hash)).toBe(true);
    expect(decodeTransferHash(hash)).toEqual(values);
  });

  it('never includes a query string or plain-text form of the values', () => {
    const hash = encodeTransferHash({ buyerAddress: '500 Market Street, San Francisco' });
    expect(hash.startsWith('#transfer=')).toBe(true);
    expect(hash).not.toContain('500 Market Street');
  });

  it('returns null for a hash with no transfer payload', () => {
    expect(decodeTransferHash('')).toBeNull();
    expect(decodeTransferHash('#something-else')).toBeNull();
    expect(hasTransferHash('')).toBe(false);
  });

  it('returns null for malformed or non-object payloads, without throwing', () => {
    expect(decodeTransferHash('#transfer=not-json')).toBeNull();
    expect(decodeTransferHash(`#transfer=${encodeURIComponent('null')}`)).toBeNull();
    expect(decodeTransferHash(`#transfer=${encodeURIComponent('[1,2]')}`)).toBeNull();
    expect(decodeTransferHash(`#transfer=${encodeURIComponent('"just a string"')}`)).toBeNull();
  });

  it('drops non-string values rather than passing them through', () => {
    const hash = `#transfer=${encodeURIComponent(JSON.stringify({ a: 'ok', b: 42, c: null }))}`;
    expect(decodeTransferHash(hash)).toEqual({ a: 'ok' });
  });
});

describe('filterTransferValues', () => {
  it('keeps only keys the destination tool actually declares', () => {
    const values = { exporterName: 'Acme', itemQuantity: '500', packageCount: '10' };
    expect(filterTransferValues(values, ['exporterName', 'buyerName'])).toEqual({
      exporterName: 'Acme',
    });
  });

  it('never lets an unknown key through, even with an empty allow-list', () => {
    expect(filterTransferValues({ a: '1' }, [])).toEqual({});
  });
});

describe('pickTransferValues', () => {
  it('picks only the requested keys and drops blanks and non-strings', () => {
    const values = { exporterName: 'Acme', exporterContact: '', print: true };
    expect(
      pickTransferValues(values, ['exporterName', 'exporterContact', 'print', 'missing']),
    ).toEqual({
      exporterName: 'Acme',
    });
  });
});
