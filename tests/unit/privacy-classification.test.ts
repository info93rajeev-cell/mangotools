import { describe, expect, it } from 'vitest';
import { runPipeline } from '../../scripts/generate/pipeline.ts';
import { loadSources } from '../../scripts/generate/sources.ts';
import { loadEngines } from '../../scripts/lib/engines.ts';

const { output } = await runPipeline(loadSources().sources, await loadEngines());
if (!output) throw new Error('pnpm gen pipeline failed; run pnpm gen for details.');
const tools = output.registry.tools;
const presets = output.registry.presets;
const atLeastPersonal = new Set(['personal', 'sensitive']);

/**
 * Founder-approved rule (Round 1): `personal` for every tool that accepts uploaded files,
 * documents, images or unrestricted text/data; `public` only for calculators and generators whose
 * inputs are ordinary non-sensitive parameters. dataClass is sensitivity, not processing evidence.
 */
describe('privacy.dataClass classification', () => {
  it('file tools (archetype D) are at least personal', () => {
    const wrong = tools.filter(
      (t) => t.archetype === 'D' && !atLeastPersonal.has(t.privacy.dataClass),
    );
    expect(wrong.map((t) => t.id)).toEqual([]);
  });

  it('document generators (export engine) are at least personal', () => {
    const wrong = tools.filter(
      (t) => presets[t.preset]?.engineId === 'export' && !atLeastPersonal.has(t.privacy.dataClass),
    );
    expect(wrong.map((t) => t.id)).toEqual([]);
  });

  it('matches the reviewed classification of every current tool', () => {
    const personal = [
      'base64-encode-decode',
      'csv-to-json',
      'export-commercial-invoice-generator',
      'export-packing-list-generator',
      'favicon-generator',
      'image-compress',
      'image-crop',
      'image-format-converter',
      'image-metadata-remover',
      'image-resize',
      'image-watermark',
      'jpg-to-pdf',
      'json-formatter',
      'json-to-csv',
      'pdf-merge',
      'pdf-split',
      'url-encode-decode',
    ];
    const actual = tools
      .filter((t) => t.privacy.dataClass === 'personal')
      .map((t) => t.id)
      .sort();
    expect(actual).toEqual(personal);
    expect(tools.filter((t) => t.privacy.dataClass === 'sensitive')).toEqual([]);
  });
});
