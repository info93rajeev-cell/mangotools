import { beforeAll, describe, expect, it } from 'vitest';
import { loadEngines } from '../lib/engines.ts';
import type { Issue } from './issues.ts';
import { runPipeline } from './pipeline.ts';
import { deepMerge, parsePresets, resolveExtends } from './presets.ts';
import { buildCategories } from './registry.ts';
import { expandSynonyms } from './search.ts';
import { loadSources, type Sources } from './sources.ts';

const engines = await loadEngines();
const { sources: real, issues: loadIssues } = loadSources();

// biome-ignore lint/suspicious/noExplicitAny: tests mutate loosely typed YAML data on purpose.
type Data = Record<string, any>;
const fresh = (): Sources => structuredClone(real);
const tool = (s: Sources, id: string) => {
  const t = s.tools.find((x) => x.folder === id);
  if (!t?.manifest) throw new Error(`missing tool ${id}`);
  return t;
};
const manifestOf = (s: Sources, id: string) => tool(s, id).manifest?.data as Data;
const presetOf = (s: Sources, id: string) =>
  s.presets.find((p) => p.file === `presets/${id}.yaml`)?.data as Data;

async function issuesFor(mutate: (s: Sources) => void): Promise<Issue[]> {
  const s = fresh();
  mutate(s);
  return (await runPipeline(s, engines)).issues;
}

const hasIssue = (issues: Issue[], file: string, text: string) =>
  issues.some((i) => i.file === file && `${i.path ?? ''} ${i.message}`.includes(text));

describe('registry pipeline — valid repository', () => {
  let result: Awaited<ReturnType<typeof runPipeline>>;
  beforeAll(async () => {
    result = await runPipeline(fresh(), engines);
  });

  it('loads every source file', () => expect(loadIssues).toEqual([]));
  it('reports no issues', () => expect(result.issues).toEqual([]));
  it('builds fourteen tools, fourteen presets and the five visible categories', () => {
    const registry = result.output?.registry;
    expect(registry?.tools.map((t) => t.id).sort()).toEqual([
      'base64-encode-decode',
      'cbm-calculator',
      'container-loading-calculator',
      'gst-calculator',
      'image-compress',
      'image-resize',
      'jpg-to-pdf',
      'json-formatter',
      'markup-calculator',
      'pallet-loading-calculator',
      'pdf-merge',
      'profit-margin-calculator',
      'url-encode-decode',
      'volumetric-weight-calculator',
    ]);
    expect(Object.keys(registry?.presets ?? {}).length).toBe(14);
    expect(registry?.categories.filter((c) => c.visible).map((c) => c.id)).toEqual([
      'logistics',
      'business',
      'developer',
      'pdf',
      'media',
    ]);
  });
  it('injects the worked example from the fixture', () => {
    const gst = result.output?.registry.tools.find((t) => t.id === 'gst-calculator');
    const primary = gst?.content.example?.rows.find((r) => r.primary);
    expect(primary).toMatchObject({ key: 'grossAmount', value: '1180.00', format: 'money' });
  });
  it('resolves tool: links to site paths', () => {
    const margin = result.output?.registry.tools.find((t) => t.id === 'profit-margin-calculator');
    expect(margin?.content.faq.map((f) => f.answerHtml).join('')).toContain(
      'href="/gst-calculator"',
    );
  });
  it('lists only the engines that presets use', () => {
    expect(result.output?.engineIds).toEqual(['data', 'estimate', 'image', 'logistics', 'pdf']);
  });
  it('excludes worker-only (non-Node) operations from the determinism suite', () => {
    const cases = result.output?.determinism ?? [];
    expect(cases.some((c) => c.operation.startsWith('image.'))).toBe(false);
    expect(cases.some((c) => c.operation.startsWith('pdf.'))).toBe(true);
  });
});

describe('registry pipeline — invalid inputs fail with file and path', () => {
  it('manifest: SEO title too long', async () => {
    const issues = await issuesFor((s) => {
      manifestOf(s, 'gst-calculator').seo.title = `GST Calculator ${'x'.repeat(60)}`;
    });
    expect(hasIssue(issues, 'tools/gst-calculator/manifest.yaml', 'seo.title')).toBe(true);
  });
  it('manifest: unknown category and tag', async () => {
    const issues = await issuesFor((s) => {
      const m = manifestOf(s, 'json-formatter');
      m.taxonomy.category = 'nowhere';
      m.taxonomy.tags = ['no-such-tag'];
    });
    expect(hasIssue(issues, 'tools/json-formatter/manifest.yaml', 'Unknown category')).toBe(true);
    expect(hasIssue(issues, 'tools/json-formatter/manifest.yaml', 'Unknown tag')).toBe(true);
  });
  it('manifest: unknown related tool', async () => {
    const issues = await issuesFor((s) => {
      manifestOf(s, 'gst-calculator').graph.related = ['no-such-tool'];
    });
    expect(hasIssue(issues, 'tools/gst-calculator/manifest.yaml', 'graph.related.0')).toBe(true);
  });
  it('slug collision between tools', async () => {
    const issues = await issuesFor((s) => {
      const m = manifestOf(s, 'url-encode-decode');
      m.id = 'base64-encode-decode';
      m.slug = 'base64-encode-decode';
    });
    expect(issues.some((i) => i.message.includes('already used'))).toBe(true);
  });
  it('slug collision with a category or reserved word', async () => {
    const issues = await issuesFor((s) => {
      const a = manifestOf(s, 'json-formatter');
      a.id = 'business';
      a.slug = 'business';
      const b = manifestOf(s, 'url-encode-decode');
      b.id = 'pricing';
      b.slug = 'pricing';
    });
    expect(hasIssue(issues, 'tools/json-formatter/manifest.yaml', 'collides with a category')).toBe(
      true,
    );
    expect(hasIssue(issues, 'tools/url-encode-decode/manifest.yaml', 'is reserved')).toBe(true);
  });
  it('preset: unknown key', async () => {
    const issues = await issuesFor((s) => {
      presetOf(s, 'data/url').colour = 'orange';
    });
    expect(hasIssue(issues, 'presets/data/url.yaml', 'colour')).toBe(true);
  });
  it('preset: params rejected by the operation', async () => {
    const issues = await issuesFor((s) => {
      presetOf(s, 'data/json.format').params.indent = '3';
    });
    expect(hasIssue(issues, 'presets/data/json.format.yaml', 'params.indent')).toBe(true);
  });
  it('preset: missing string for a label', async () => {
    const issues = await issuesFor((s) => {
      delete presetOf(s, 'estimate/gst.india').strings.en['gst.out.cgst'];
    });
    expect(hasIssue(issues, 'presets/estimate/gst.india.yaml', 'gst.out.cgst')).toBe(true);
  });
  it('preset: missing working-step template', async () => {
    const issues = await issuesFor((s) => {
      delete presetOf(s, 'estimate/gst.india').strings.en['work.gst.remove.igst'];
    });
    expect(hasIssue(issues, 'presets/estimate/gst.india.yaml', 'work.gst.remove.igst')).toBe(true);
  });
  it('preset: working-step template with an unknown variable', async () => {
    const issues = await issuesFor((s) => {
      presetOf(s, 'estimate/gst.india').strings.en['work.gst.add.cgst'] = 'CGST = {amount:money}';
    });
    expect(
      hasIssue(issues, 'presets/estimate/gst.india.yaml', '"{amount}" is not a variable'),
    ).toBe(true);
  });
  it('preset: sample execution failure is reported', async () => {
    const issues = await issuesFor((s) => {
      presetOf(s, 'estimate/gst.india').samples['invoice-18'].input.amount = 'ten';
    });
    expect(hasIssue(issues, 'presets/estimate/gst.india.yaml', 'Sample "invoice-18" fails')).toBe(
      true,
    );
  });
  it('preset: condition on an unknown field', async () => {
    const issues = await issuesFor((s) => {
      presetOf(s, 'estimate/gst.india').outputs.cgst.visibleWhen = { region: ['north'] };
    });
    expect(
      hasIssue(issues, 'presets/estimate/gst.india.yaml', 'unknown field or option "region"'),
    ).toBe(true);
  });
  it('fixture: invalid id and failing expectation', async () => {
    const issues = await issuesFor((s) => {
      const [first, second] = tool(s, 'gst-calculator').fixtures as { data: Data }[];
      if (first) first.data.expected.cgst = '91.00';
      if (second) second.data.id = 'five';
    });
    expect(
      hasIssue(issues, 'tools/gst-calculator/fixtures/001-add-18-intra.yaml', 'Fixture fails'),
    ).toBe(true);
    expect(
      hasIssue(issues, 'tools/gst-calculator/fixtures/005-remove-18-odd-paisa.yaml', 'id'),
    ).toBe(true);
  });
  it('content: missing section, unknown tool link and raw HTML', async () => {
    const issues = await issuesFor((s) => {
      const content = tool(s, 'profit-margin-calculator').content;
      if (!content) return;
      content.text = content.text
        .replace('## Method', '## Methods')
        .replace('tool:gst-calculator', 'tool:vat-calculator')
        .concat('\n<div>hi</div>\n');
    });
    const file = 'tools/profit-margin-calculator/content.md';
    expect(hasIssue(issues, file, 'Missing required section "## Method"')).toBe(true);
    expect(hasIssue(issues, file, 'Unknown tool reference')).toBe(true);
    expect(hasIssue(issues, file, 'Raw HTML')).toBe(true);
  });
  it('content: missing front matter', async () => {
    const issues = await issuesFor((s) => {
      const content = tool(s, 'json-formatter').content;
      if (content) content.text = content.text.replace(/^---[\s\S]*?---\n/, '');
    });
    expect(hasIssue(issues, 'tools/json-formatter/content.md', 'Missing front matter')).toBe(true);
  });
  it('taxonomy: category SEO description too short', async () => {
    const issues = await issuesFor((s) => {
      (s.taxonomy.categories.data as Data).categories[4].seo.description = 'Too short.';
    });
    expect(hasIssue(issues, 'taxonomy/categories.yaml', 'categories.4.seo.description')).toBe(true);
  });
  it('taxonomy: duplicate tag', async () => {
    const issues = await issuesFor((s) => {
      (s.taxonomy.tags.data as Data).tags.push({ id: 'json', label: 'JSON again' });
    });
    expect(hasIssue(issues, 'taxonomy/tags.yaml', 'Duplicate tag')).toBe(true);
  });
  it('site config: home refers to an unknown tool', async () => {
    const issues = await issuesFor((s) => {
      (s.siteConfig.data as Data).home.popular.push('no-such-tool');
    });
    expect(hasIssue(issues, 'site.config.yaml', 'home.popular.5')).toBe(true);
  });
  it('site config: schema violation', async () => {
    const issues = await issuesFor((s) => {
      delete (s.siteConfig.data as Data).environments.production;
    });
    expect(hasIssue(issues, 'site.config.yaml', 'production')).toBe(true);
  });
});

describe('preset extends', () => {
  const files = [
    {
      file: 'presets/demo/base.yaml',
      data: {
        presetVersion: 1,
        id: 'demo/base',
        version: '0.1.0',
        abstract: true,
        operation: 'data.url.transform@1',
        params: { direction: 'encode', mode: 'component' },
        fields: { text: { labelKey: 'f.text', kind: 'text', order: 10 } },
        outputs: {
          text: { labelKey: 'o.text', format: 'code', order: 10, primary: true },
          changedCount: { labelKey: 'o.count', format: 'number', order: 20 },
        },
        ui: { archetypes: ['A'], density: 'comfortable' },
        strings: { en: { 'f.text': 'Text', 'o.text': 'Result', 'o.count': 'Changed' } },
      },
    },
    {
      file: 'presets/demo/child.yaml',
      data: {
        presetVersion: 1,
        id: 'demo/child',
        version: '0.2.0',
        extends: 'demo/base',
        params: { mode: 'form' },
        outputs: { changedCount: { visible: false } },
        ui: { archetypes: ['A', 'B'] },
      },
    },
    {
      file: 'presets/demo/grandchild.yaml',
      data: {
        presetVersion: 1,
        id: 'demo/grandchild',
        version: '0.3.0',
        extends: 'demo/child',
        strings: { en: { 'o.text': 'Encoded' } },
      },
    },
  ];

  it('merges keyed maps deeply, replaces arrays and keeps visible: false', () => {
    const { raw, issues } = parsePresets(
      files.map((f) => ({
        ...f,
        data: { ...f.data, outputs: f.data.outputs as unknown },
      })),
    );
    // Partial outputs in a child are not valid alone; schema allows them only when merged.
    expect(issues.filter((i) => i.file !== 'presets/demo/child.yaml')).toEqual([]);
    const merged = deepMerge(files[0]?.data, files[1]?.data) as Data;
    expect(merged.params).toEqual({ direction: 'encode', mode: 'form' });
    expect(merged.outputs.changedCount).toMatchObject({
      visible: false,
      format: 'number',
      order: 20,
    });
    expect(merged.ui.archetypes).toEqual(['A', 'B']);
    expect(merged.ui.density).toBe('comfortable');
    const resolved = resolveExtends('demo/grandchild', raw);
    if (raw.has('demo/child')) {
      expect('preset' in resolved && resolved.preset.strings?.en['o.text']).toBe('Encoded');
      expect('preset' in resolved && resolved.preset.abstract).toBeFalsy();
    }
  });

  it('detects cycles and chains deeper than three', () => {
    const chain = ['a', 'b', 'c', 'd', 'e'].map((name, i, all) => ({
      file: `presets/demo/${name}.yaml`,
      data: {
        presetVersion: 1,
        id: `demo/${name}`,
        version: '0.1.0',
        ...(i < all.length - 1 ? { extends: `demo/${all[i + 1]}` } : {}),
      },
    }));
    const { raw } = parsePresets(chain);
    const deep = resolveExtends('demo/a', raw);
    expect('problem' in deep && deep.problem.message).toContain('deeper than 3');
    const cyclic = parsePresets([
      {
        file: 'presets/demo/x.yaml',
        data: { presetVersion: 1, id: 'demo/x', version: '0.1.0', extends: 'demo/y' },
      },
      {
        file: 'presets/demo/y.yaml',
        data: { presetVersion: 1, id: 'demo/y', version: '0.1.0', extends: 'demo/x' },
      },
    ]);
    const cycle = resolveExtends('demo/x', cyclic.raw);
    expect('problem' in cycle && cycle.problem.message).toContain('Circular extends');
  });
});

describe('category visibility threshold', () => {
  it('hides categories with fewer tools than navigation.minToolsPerCategory', async () => {
    const { output } = await runPipeline(fresh(), engines);
    if (!output) throw new Error('pipeline failed');
    const { registry } = output;
    const taxonomy = { categories: registry.categories } as never;
    const visibleAt = (min: number) =>
      buildCategories(taxonomy, registry.tools, {
        ...registry.site,
        navigation: { minToolsPerCategory: min },
      })
        .filter((c) => c.visible)
        .map((c) => c.id);
    // logistics has four tools; business and developer have three each; pdf and media have two each.
    expect(visibleAt(1)).toEqual(['logistics', 'business', 'developer', 'pdf', 'media']);
    expect(visibleAt(2)).toEqual(['logistics', 'business', 'developer', 'pdf', 'media']);
    expect(visibleAt(3)).toEqual(['logistics', 'business', 'developer']);
    expect(visibleAt(4)).toEqual(['logistics']);
    expect(visibleAt(5)).toEqual([]);
  });
});

describe('search synonyms', () => {
  it('adds the other terms of a matching group', () => {
    expect(expandSynonyms(['Base64 Encode & Decode'], [['base64', 'b64', 'base 64']])).toEqual([
      'base64',
      'b64',
      'base 64',
    ]);
    expect(expandSynonyms(['GST Calculator'], [['margin', 'gross margin']])).toEqual([]);
  });
});
