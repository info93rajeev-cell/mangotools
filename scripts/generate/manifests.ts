import { type Manifest, manifestSchema, type ResolvedPreset } from '@mangotools/schemas';
import { type Issue, issue, zodIssues } from './issues.ts';
import type { ToolSource } from './sources.ts';
import type { Taxonomy } from './taxonomy.ts';

export interface LoadedTool {
  source: ToolSource;
  file: string;
  manifest: Manifest;
}

export interface ManifestContext {
  taxonomy: Taxonomy;
  presets: Map<string, ResolvedPreset>;
  abstractPresets: Set<string>;
}

/** Finds text the scaffolder leaves for the author ("TODO: …"). */
export function findTodos(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return /\bTODO\b/.test(value) ? [path || '(root)'] : [];
  if (Array.isArray(value))
    return value.flatMap((v, i) => findTodos(v, path ? `${path}.${i}` : `${i}`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => findTodos(v, path ? `${path}.${k}` : k));
  }
  return [];
}

function checkTaxonomyRefs(file: string, m: Manifest, t: Taxonomy): Issue[] {
  const issues: Issue[] = [];
  if (!t.categories.some((c) => c.id === m.taxonomy.category)) {
    issues.push(
      issue(file, `Unknown category "${m.taxonomy.category}".`, {
        path: 'taxonomy.category',
        hint: 'Use an id from taxonomy/categories.yaml.',
      }),
    );
  }
  m.taxonomy.tags?.forEach((tag, i) => {
    if (!t.tags.has(tag))
      issues.push(
        issue(file, `Unknown tag "${tag}".`, {
          path: `taxonomy.tags.${i}`,
          hint: 'Add it to taxonomy/tags.yaml or use an existing tag.',
        }),
      );
  });
  m.taxonomy.professions?.forEach((p, i) => {
    if (!t.professions.has(p))
      issues.push(issue(file, `Unknown profession "${p}".`, { path: `taxonomy.professions.${i}` }));
  });
  if (t.reserved.has(m.slug)) {
    issues.push(
      issue(file, `Slug "${m.slug}" is reserved.`, {
        path: 'slug',
        hint: 'See taxonomy/reserved-slugs.yaml.',
      }),
    );
  }
  if (t.categories.some((c) => c.slug === m.slug)) {
    issues.push(issue(file, `Slug "${m.slug}" collides with a category.`, { path: 'slug' }));
  }
  return issues;
}

function checkPresetRef(file: string, m: Manifest, ctx: ManifestContext): Issue[] {
  if (ctx.abstractPresets.has(m.preset)) {
    return [issue(file, `Preset "${m.preset}" is abstract.`, { path: 'preset' })];
  }
  const preset = ctx.presets.get(m.preset);
  if (!preset) return [issue(file, `Unknown or invalid preset "${m.preset}".`, { path: 'preset' })];
  const issues: Issue[] = [];
  if (m.sample && !(m.sample in preset.samples)) {
    issues.push(issue(file, `Preset ${m.preset} has no sample "${m.sample}".`, { path: 'sample' }));
  }
  if (!preset.ui.archetypes.includes(m.archetype)) {
    issues.push(
      issue(file, `Archetype ${m.archetype} is not supported by preset ${m.preset}.`, {
        path: 'archetype',
      }),
    );
  }
  return issues;
}

function loadOne(source: ToolSource, ctx: ManifestContext, issues: Issue[]): LoadedTool | null {
  const folderFile = `tools/${source.folder}`;
  if (!source.manifest) {
    issues.push(
      issue(folderFile, 'manifest.yaml is missing.', {
        hint: 'Run pnpm new:tool to scaffold a tool.',
      }),
    );
    return null;
  }
  if (!source.content) issues.push(issue(folderFile, 'content.md is missing.'));
  const { file, data } = source.manifest;
  if (data === undefined) return null;
  const parsed = manifestSchema.safeParse(data);
  if (!parsed.success) {
    issues.push(...zodIssues(file, parsed.error));
    return null;
  }
  const m = parsed.data;
  if (m.id !== source.folder) {
    issues.push(
      issue(file, `id "${m.id}" must match the folder name "${source.folder}".`, { path: 'id' }),
    );
  }
  for (const path of findTodos(m)) {
    issues.push(
      issue(file, 'Placeholder text left by the scaffolder.', {
        path,
        hint: 'Replace the TODO text.',
      }),
    );
  }
  issues.push(...checkTaxonomyRefs(file, m, ctx.taxonomy), ...checkPresetRef(file, m, ctx));
  return { source, file, manifest: m };
}

function checkKeywords(tools: Map<string, LoadedTool>): Issue[] {
  const owners = new Map<string, string>();
  const issues: Issue[] = [];
  for (const { file, manifest: m } of tools.values()) {
    const keyword = m.seo.primaryKeyword.toLowerCase();
    const owner = owners.get(keyword);
    if (owner)
      issues.push(
        issue(file, `Primary keyword "${keyword}" is already used by ${owner}.`, {
          path: 'seo.primaryKeyword',
        }),
      );
    else owners.set(keyword, m.id);
  }
  return issues;
}

function checkGraph(tools: Map<string, LoadedTool>): Issue[] {
  const issues: Issue[] = [];
  for (const { file, manifest: m } of tools.values()) {
    const refs = [
      ...(m.graph?.related ?? []).map((id, i) => ({ id, path: `graph.related.${i}` })),
      ...(m.graph?.next ?? []).map((id, i) => ({ id, path: `graph.next.${i}` })),
      ...(m.variantOf ? [{ id: m.variantOf, path: 'variantOf' }] : []),
    ];
    for (const ref of refs) {
      if (ref.id === m.id)
        issues.push(issue(file, 'A tool cannot refer to itself.', { path: ref.path }));
      else if (!tools.has(ref.id))
        issues.push(issue(file, `Unknown tool "${ref.id}".`, { path: ref.path }));
    }
  }
  return issues;
}

/** Validates every manifest on its own and against taxonomy, presets and the other tools. */
export function validateManifests(sources: ToolSource[], ctx: ManifestContext) {
  const issues: Issue[] = [];
  const tools = new Map<string, LoadedTool>();
  const slugs = new Map<string, string>();
  for (const source of sources) {
    const loaded = loadOne(source, ctx, issues);
    if (!loaded) continue;
    const { slug } = loaded.manifest;
    const owner = slugs.get(slug);
    if (owner) {
      issues.push(
        issue(loaded.file, `Slug "${slug}" is already used by ${owner}.`, { path: 'slug' }),
      );
      continue;
    }
    slugs.set(slug, loaded.file);
    tools.set(loaded.manifest.id, loaded);
  }
  issues.push(...checkGraph(tools), ...checkKeywords(tools));
  return { tools, issues };
}
