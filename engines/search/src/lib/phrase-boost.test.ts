import { describe, expect, it } from 'vitest';
import { directionalPattern, normalizePhrase, phraseBoost } from './phrase-boost.ts';

const csvToJson = {
  name: 'CSV to JSON',
  shortName: 'CSV to JSON',
  synonyms:
    'convert csv to json · csv json converter · csv to json online · csv to json array · csv to json objects',
  summary: 'Convert CSV to a JSON array of objects.',
};

const jsonToCsv = {
  name: 'JSON to CSV',
  shortName: 'JSON to CSV',
  synonyms:
    'convert json to csv · json csv converter · json to csv online · json array to csv · json object to csv',
  summary: 'Convert a JSON array of objects, or a single object, into CSV.',
};

describe('normalizePhrase', () => {
  it('lowercases, strips punctuation and collapses whitespace, keeping "to"', () => {
    expect(normalizePhrase('  CSV to JSON!  ')).toBe('csv to json');
    expect(normalizePhrase('JSON Formatter & Validator')).toBe('json formatter validator');
  });
});

describe('directionalPattern', () => {
  it('extracts x/y from a bare "X to Y" phrase', () => {
    expect(directionalPattern('csv to json')).toEqual({ x: 'csv', y: 'json' });
  });

  it('extracts x/y from "convert X to Y"', () => {
    expect(directionalPattern('convert json to csv')).toEqual({ x: 'json', y: 'csv' });
  });

  it('extracts x/y from "X into Y"', () => {
    expect(directionalPattern('csv into json')).toEqual({ x: 'csv', y: 'json' });
  });

  it('returns null when there is no to/into', () => {
    expect(directionalPattern('csv json converter')).toBeNull();
    expect(directionalPattern('json formatter')).toBeNull();
  });
});

describe('phraseBoost', () => {
  it('gives the highest tier to an exact normalized title match', () => {
    const boost = phraseBoost('CSV to JSON', csvToJson);
    expect(boost).toBeGreaterThanOrEqual(1000);
  });

  it('boosts a directional query only for the tool matching that exact order', () => {
    const forward = phraseBoost('csv to json', csvToJson);
    const reverse = phraseBoost('csv to json', jsonToCsv);
    expect(forward).toBeGreaterThan(reverse);
    expect(reverse).toBe(0);
  });

  it('flips the winner when the query direction flips', () => {
    const forward = phraseBoost('json to csv', jsonToCsv);
    const reverse = phraseBoost('json to csv', csvToJson);
    expect(forward).toBeGreaterThan(reverse);
    expect(reverse).toBe(0);
  });

  it('boosts "convert X to Y" the same way as bare "X to Y"', () => {
    expect(phraseBoost('convert csv to json', csvToJson)).toBeGreaterThan(
      phraseBoost('convert csv to json', jsonToCsv),
    );
    expect(phraseBoost('convert json to csv', jsonToCsv)).toBeGreaterThan(
      phraseBoost('convert json to csv', csvToJson),
    );
  });

  it('resolves an exact-phrase converter query decisively to the tool that has it verbatim', () => {
    const csvWins = phraseBoost('csv json converter', csvToJson);
    const jsonLoses = phraseBoost('csv json converter', jsonToCsv);
    expect(csvWins).toBeGreaterThanOrEqual(500);
    expect(jsonLoses).toBe(0);

    const jsonWins = phraseBoost('json csv converter', jsonToCsv);
    const csvLoses = phraseBoost('json csv converter', csvToJson);
    expect(jsonWins).toBeGreaterThanOrEqual(500);
    expect(csvLoses).toBe(0);
  });

  it('gives no boost for an empty or unrelated query', () => {
    expect(phraseBoost('', csvToJson)).toBe(0);
    expect(phraseBoost('gst calculator', csvToJson)).toBe(0);
  });
});
