import {
  type ExampleFormat,
  type ExampleRow,
  isShown,
  matchesConditions,
  type PresetField,
  type RegistryCategory,
  type RegistryTool,
  type ResolvedPreset,
  type SiteConfig,
  type ToolContent,
} from '@mangotools/schemas';
import type { ParsedContent } from './content.ts';
import type { LoadedTool } from './manifests.ts';
import type { Taxonomy } from './taxonomy.ts';
import type { FixtureRun } from './tool-fixtures.ts';

const LISTED = new Set(['beta', 'stable']);

function fieldFormat(field: PresetField): ExampleFormat {
  if (field.kind === 'money') return 'money';
  if (field.kind === 'percent' || field.unit === '%') return 'percent';
  if (field.kind === 'number' || field.kind === 'enum-or-number') return 'number';
  return 'text';
}

/** Rows of the worked-example table: visible inputs, then visible outputs, from a passing fixture. */
export function exampleRows(preset: ResolvedPreset, run: FixtureRun): ExampleRow[] {
  const input = run.fixture.input;
  const state = { ...run.params, ...input };
  const label = (key: string) => preset.strings[key] ?? key;
  const rows: ExampleRow[] = [];
  const fields = Object.entries(preset.fields).sort(([, a], [, b]) => a.order - b.order);
  for (const [key, field] of fields) {
    if (!(key in input) || !isShown(field, state)) continue;
    const raw = String(input[key]);
    const option = field.options?.find((o) => String(o.value) === raw);
    const value = option?.labelKey ? label(option.labelKey) : raw;
    const format = option?.labelKey ? 'text' : fieldFormat(field);
    rows.push({ key, role: 'input', label: label(field.labelKey), value, format, primary: false });
  }
  const output = run.value as Record<string, unknown>;
  const outputs = Object.entries(preset.outputs).sort(([, a], [, b]) => a.order - b.order);
  for (const [key, out] of outputs) {
    const value = output[key];
    if (value === null || value === undefined || !isShown(out, state)) continue;
    const primary =
      out.primary === true || (out.primaryWhen ? matchesConditions(out.primaryWhen, state) : false);
    rows.push({
      key,
      role: 'output',
      label: label(out.labelKey),
      value: String(value),
      format: out.format,
      primary,
    });
  }
  return rows;
}

/** Orders a category's tools: site "popular" order first, then by name. */
function categoryOrder(ids: string[], names: Map<string, string>, popular: string[]): string[] {
  const rank = (id: string) => {
    const i = popular.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...ids].sort(
    (a, b) => rank(a) - rank(b) || (names.get(a) ?? a).localeCompare(names.get(b) ?? b, 'en'),
  );
}

export function buildCategories(
  taxonomy: Taxonomy,
  tools: RegistryTool[],
  site: SiteConfig,
): RegistryCategory[] {
  const names = new Map(tools.map((t) => [t.id, t.name]));
  return taxonomy.categories.map((c) => {
    const ids = tools.filter((t) => t.listed && t.category === c.id).map((t) => t.id);
    return {
      ...c,
      url: `/${c.slug}`,
      visible: ids.length >= site.navigation.minToolsPerCategory,
      toolIds: categoryOrder(ids, names, site.home.popular),
    };
  });
}

/** Explicit related tools, or up to four listed tools from the same category. */
export function fillRelated(tools: RegistryTool[], categories: RegistryCategory[]): void {
  for (const tool of tools) {
    if (tool.related.length > 0) continue;
    const category = categories.find((c) => c.id === tool.category);
    tool.related = (category?.toolIds ?? []).filter((id) => id !== tool.id).slice(0, 4);
  }
}

export function toRegistryTool(
  loaded: LoadedTool,
  content: ParsedContent,
  example: ToolContent['example'],
): RegistryTool {
  const m = loaded.manifest;
  return {
    id: m.id,
    slug: m.slug,
    url: `/${m.slug}`,
    listed: LISTED.has(m.status),
    status: m.status,
    tier: m.tier,
    version: m.version,
    changelog: m.changelog,
    name: m.name,
    shortName: m.shortName ?? m.name,
    summary: m.summary,
    archetype: m.archetype,
    preset: m.preset,
    sample: m.sample ?? null,
    category: m.taxonomy.category,
    tags: m.taxonomy.tags ?? [],
    synonyms: m.taxonomy.synonyms ?? [],
    capabilities: m.capabilities ?? {},
    privacy: m.privacy,
    disclaimer: m.disclaimer,
    seo: m.seo,
    related: m.graph?.related ?? [],
    next: m.graph?.next ?? [],
    quality: m.quality ?? null,
    content: {
      lastReviewed: content.frontMatter.lastReviewed,
      sections: content.sections,
      faq: content.faq,
      example,
    },
  };
}
