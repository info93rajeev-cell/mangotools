import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTestContext, executeOperation } from '@mangotools/core';
import { presetSchema, REQUIRED_SECTIONS } from '@mangotools/schemas';
import { stringify } from 'yaml';
import { findOperation, loadEngines } from '../lib/engines.ts';
import { readYaml } from '../lib/files.ts';

export interface ScaffoldOptions {
  slug: string;
  preset: string;
  category: string;
  tier: 'T1' | 'T2' | 'T3' | 'T4';
  archetype?: string;
  variantOf?: string;
  /** YYYY-MM-DD used for changelog and review dates. */
  today: string;
}

const SEO_DESCRIPTION =
  'TODO: write 120–160 characters that say what the tool does, who it helps and that it runs in the browser with no sign-up.';

function manifestText(o: ScaffoldOptions, archetype: string, sample: string | undefined): string {
  const professional = o.tier === 'T1' || o.tier === 'T2';
  const lines = [
    '# yaml-language-server: $schema=../../generated/schemas/manifest.json',
    'manifestVersion: 1',
    `id: ${o.slug}`,
    `slug: ${o.slug}`,
    'status: beta',
    `tier: ${o.tier}`,
    ...(o.variantOf ? [`variantOf: ${o.variantOf}`] : []),
    'version: 0.1.0',
    'changelog:',
    `  - { version: 0.1.0, date: ${o.today}, type: added, summary: "First beta." }`,
    'name: TODO tool name',
    'summary: "TODO: one sentence of 50–140 characters on what this tool does for the user."',
    `archetype: ${archetype}`,
    `preset: ${o.preset}`,
    ...(sample ? [`sample: ${sample}`] : []),
    'taxonomy:',
    `  category: ${o.category}`,
    '  tags: []',
    '  synonyms: []',
    'privacy: { dataClass: public, network: none }',
    `disclaimer: ${professional ? 'professional' : 'none'}`,
    'seo:',
    '  title: "TODO: 30–60 character title with the todo keyword"',
    `  description: "${SEO_DESCRIPTION}"`,
    '  primaryKeyword: todo keyword',
  ];
  if (professional) {
    lines.push(
      'quality:',
      '  verifiedAgainst:',
      '    - { citation: "TODO: the source used to verify results", locator: "TODO: section, table or fixture ids" }',
      `  lastVerified: ${o.today}`,
    );
  }
  return `${lines.join('\n')}\n`;
}

const SECTION_BODY: Record<string, string> = {
  'How to use': '1. TODO: first step.\n2. TODO: second step.\n3. TODO: read and copy the result.',
  Method: 'TODO: explain the formulas, the rounding rule and any assumptions.',
  'Worked example':
    'TODO: one sentence introducing the example (the table comes from fixture 001).',
  FAQ: '### TODO: first question?\n\nTODO: answer.\n\n### TODO: second question?\n\nTODO: answer.',
  References: '- TODO: cite the standard, textbook or official source.',
};

function contentText(o: ScaffoldOptions): string {
  const sections = REQUIRED_SECTIONS[o.tier];
  const example = sections.includes('Worked example') ? 'example: 001-sample\n' : '';
  const body = sections
    .map((title) => `## ${title}\n\n${SECTION_BODY[title] ?? 'TODO'}\n`)
    .join('\n');
  return `---\nlastReviewed: ${o.today}\n${example}---\n\n${body}`;
}

async function fixtureText(
  o: ScaffoldOptions,
  preset: ReturnType<typeof presetSchema.parse>,
): Promise<string> {
  const [sampleId, sample] = Object.entries(preset.samples ?? {})[0] ?? [];
  const input = sample?.input ?? {};
  const op = preset.operation ? findOperation(await loadEngines(), preset.operation) : undefined;
  const params = { ...(preset.params ?? {}), ...(sample?.params ?? {}) };
  const result = op ? await executeOperation(op, input, params, createTestContext()) : null;
  const expected = result?.ok ? { ...(result.value as Record<string, unknown>) } : {};
  delete expected.working;
  const fixture = {
    id: '001-sample',
    preset: o.preset,
    source: {
      type: 'hand-verified',
      citation: `TODO: verify these values by hand and cite how (from sample ${sampleId ?? 'none'})`,
    },
    ...(sample?.params ? { params: sample.params } : {}),
    input,
    expected,
  };
  return stringify(fixture, { lineWidth: 0 });
}

/** Creates tools/<slug>/ with a manifest, content and one fixture. Returns the files written. */
export async function scaffoldTool(root: string, o: ScaffoldOptions): Promise<string[]> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(o.slug))
    throw new Error(`"${o.slug}" is not a kebab-case slug.`);
  const dir = join(root, 'tools', o.slug);
  if (existsSync(dir)) throw new Error(`tools/${o.slug} already exists.`);
  const presetFile = join(root, 'presets', `${o.preset}.yaml`);
  if (!existsSync(presetFile))
    throw new Error(`Preset ${o.preset} not found (presets/${o.preset}.yaml).`);
  const preset = presetSchema.parse(readYaml(presetFile));
  const archetype = o.archetype ?? preset.ui?.archetypes[0] ?? 'A';
  const sample = Object.keys(preset.samples ?? {})[0];
  const files: [string, string][] = [
    ['manifest.yaml', manifestText(o, archetype, sample)],
    ['content.md', contentText(o)],
    ['fixtures/001-sample.yaml', await fixtureText(o, preset)],
  ];
  mkdirSync(join(dir, 'fixtures'), { recursive: true });
  for (const [name, text] of files) writeFileSync(join(dir, name), text, 'utf8');
  return files.map(([name]) => `tools/${o.slug}/${name}`);
}
