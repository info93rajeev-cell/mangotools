import {
  createTestContext,
  type EngineModule,
  executeOperation,
  parseOperationRef,
} from '@mangotools/core';
import {
  fixtureSchema,
  type Registry,
  type RegistryTool,
  type ResolvedPreset,
  type SearchIndexFile,
  type SiteConfig,
  siteConfigSchema,
} from '@mangotools/schemas';
import { findOperation } from '../lib/engines.ts';
import { parseContent } from './content.ts';
import { type Issue, issue, zodIssues } from './issues.ts';
import { type LoadedTool, validateManifests } from './manifests.ts';
import {
  checkPresetAgainstOperation,
  collectWorkingSteps,
  type FormulaUse,
  runSamples,
  templateProblems,
  toResolvedPreset,
} from './preset-checks.ts';
import { parsePresets, type RawPreset, resolveExtends } from './presets.ts';
import { buildCategories, exampleRows, fillRelated, toRegistryTool } from './registry.ts';
import { searchDocuments } from './search.ts';
import type { Sources } from './sources.ts';
import { type Taxonomy, validateTaxonomy } from './taxonomy.ts';
import { runToolFixtures } from './tool-fixtures.ts';

/** An engine fixture as run by the cross-browser determinism check (dev builds only). */
export interface DeterminismCase {
  id: string;
  operation: string;
  input: unknown;
  params: unknown;
}

export interface PipelineOutput {
  registry: Registry;
  searchIndex: SearchIndexFile;
  determinism: DeterminismCase[];
  /** Engines referenced by presets; the runtime worker loads only these. */
  engineIds: string[];
}

interface PresetState {
  resolved: Map<string, ResolvedPreset>;
  files: Map<string, string>;
  abstract: Set<string>;
  formulaKeys: Map<string, FormulaUse>;
}

type Engines = Map<string, EngineModule>;

async function buildOnePreset(
  id: string,
  raw: Map<string, RawPreset>,
  engines: Engines,
  state: PresetState,
): Promise<Issue[]> {
  const entry = raw.get(id);
  const merged = resolveExtends(id, raw);
  if (!entry || 'problem' in merged) return 'problem' in merged ? [merged.problem] : [];
  if (merged.preset.abstract) {
    state.abstract.add(id);
    return [];
  }
  const op = merged.preset.operation ? findOperation(engines, merged.preset.operation) : undefined;
  if (!op)
    return [
      issue(entry.file, `Unknown operation "${merged.preset.operation ?? '(none)'}".`, {
        path: 'operation',
      }),
    ];
  if (!merged.preset.ui)
    return [issue(entry.file, 'Concrete presets need ui.archetypes.', { path: 'ui' })];
  const engine = engines.get(
    parseOperationRef(merged.preset.operation ?? '').engineId,
  ) as EngineModule;
  const resolved = toResolvedPreset(merged.preset, engine);
  const samples = await runSamples(entry.file, resolved, op);
  state.resolved.set(id, resolved);
  state.files.set(id, entry.file);
  state.formulaKeys.set(id, samples.formulaKeys);
  return [...checkPresetAgainstOperation(entry.file, resolved, op), ...samples.issues];
}

async function buildPresets(
  sources: Sources,
  engines: Engines,
  issues: Issue[],
): Promise<PresetState> {
  const state: PresetState = {
    resolved: new Map(),
    files: new Map(),
    abstract: new Set(),
    formulaKeys: new Map(),
  };
  const { raw, issues: parseIssues } = parsePresets(sources.presets);
  issues.push(...parseIssues);
  for (const id of raw.keys()) issues.push(...(await buildOnePreset(id, raw, engines, state)));
  return state;
}

/** Working steps emitted by an operation's own engine fixtures (covers paths samples miss). */
async function engineFormulaUse(
  sources: Sources,
  engines: Engines,
  operation: string,
  into: FormulaUse,
) {
  const op = findOperation(engines, operation);
  if (!op) return;
  for (const source of sources.engineFixtures) {
    const parsed = fixtureSchema.safeParse(source.data);
    if (!parsed.success || parsed.data.operation !== operation || !parsed.data.expected) continue;
    const result = await executeOperation(
      op,
      parsed.data.input,
      parsed.data.params ?? {},
      createTestContext(),
    );
    if (result.ok) collectWorkingSteps(result.value, into);
  }
}

async function checkFormulaStrings(
  sources: Sources,
  engines: Engines,
  presets: PresetState,
  issues: Issue[],
) {
  for (const [id, preset] of presets.resolved) {
    const use = presets.formulaKeys.get(id) ?? new Map<string, Set<string>>();
    await engineFormulaUse(sources, engines, preset.operation, use);
    const file = presets.files.get(id) ?? id;
    for (const [key, variables] of [...use].sort(([a], [b]) => (a < b ? -1 : 1))) {
      const template = preset.strings[`work.${key}`];
      const path = `strings.en.work.${key}`;
      if (template === undefined) {
        const hint = 'Write the formula with {variable} or {variable:money} placeholders.';
        issues.push(issue(file, `Missing working-step template "work.${key}".`, { path, hint }));
        continue;
      }
      for (const problem of templateProblems(template, variables))
        issues.push(issue(file, problem, { path }));
    }
  }
}

async function buildTool(
  tool: LoadedTool,
  presets: PresetState,
  engines: Engines,
  toolUrls: Map<string, string>,
  issues: Issue[],
) {
  const preset = presets.resolved.get(tool.manifest.preset);
  const op = preset ? findOperation(engines, preset.operation) : undefined;
  if (!preset || !op || !tool.source.content) return null;
  const fixtures = await runToolFixtures(tool, preset, op);
  issues.push(...fixtures.issues);
  const use = presets.formulaKeys.get(preset.id);
  for (const [key, names] of fixtures.formulaKeys) {
    const merged = use?.get(key) ?? new Set<string>();
    for (const name of names) merged.add(name);
    use?.set(key, merged);
  }
  const ctx = { file: tool.source.content.file, tier: tool.manifest.tier, toolUrls };
  const parsed = await parseContent(tool.source.content.text, ctx);
  issues.push(...parsed.issues);
  if (!parsed.content) return null;
  const exampleId = parsed.content.frontMatter.example;
  const hasExampleSection = parsed.content.sections.some((s) => s.id === 'worked-example');
  if (hasExampleSection && !exampleId) {
    issues.push(
      issue(ctx.file, 'Worked example needs front matter "example: <fixture id>".', {
        path: 'example',
      }),
    );
  }
  const run = exampleId ? fixtures.runs.get(exampleId) : undefined;
  if (exampleId && !run) {
    issues.push(
      issue(ctx.file, `Example fixture "${exampleId}" is missing or does not pass.`, {
        path: 'example',
      }),
    );
  }
  const example =
    run && exampleId ? { fixtureId: exampleId, rows: exampleRows(preset, run) } : null;
  return toRegistryTool(tool, parsed.content, example);
}

function checkHome(
  file: string,
  site: SiteConfig,
  folders: Set<string>,
  tools: RegistryTool[],
  issues: Issue[],
) {
  const built = new Map(tools.map((t) => [t.id, t]));
  for (const [key, ids] of Object.entries(site.home)) {
    ids.forEach((id, i) => {
      const path = `home.${key}.${i}`;
      if (!folders.has(id)) issues.push(issue(file, `Unknown tool "${id}".`, { path }));
      else if (built.get(id)?.listed === false)
        issues.push(issue(file, `"${id}" is not beta or stable.`, { path }));
    });
  }
}

async function buildSearchIndex(
  registry: Registry,
  taxonomy: Taxonomy,
  engines: Engines,
): Promise<SearchIndexFile> {
  const op = findOperation(engines, 'search.index.build@1');
  if (!op) throw new Error('engines/search must provide search.index.build@1.');
  const documents = searchDocuments(registry.tools, registry.categories, taxonomy);
  const result = await executeOperation(op, { documents }, {}, createTestContext());
  if (!result.ok) throw new Error(`Search index build failed: ${result.error.code}`);
  const categoryName = new Map(registry.categories.map((c) => [c.id, c.name]));
  return {
    searchIndexVersion: 1,
    index: (result.value as { index: string }).index,
    tools: registry.tools
      .filter((t) => t.listed)
      .map((t) => ({
        id: t.id,
        name: t.name,
        summary: t.summary,
        url: t.url,
        category: categoryName.get(t.category) ?? t.category,
      })),
  };
}

/** Fixtures for engines the site loads in workers, excluding non-Node-runtime operations — see `engines/image/README.md`'s "Determinism" section. */
function determinismCases(
  sources: Sources,
  engines: Engines,
  engineIds: Set<string>,
): DeterminismCase[] {
  return sources.engineFixtures.flatMap((source) => {
    const parsed = fixtureSchema.safeParse(source.data);
    const operation = parsed.success ? parsed.data.operation : undefined;
    if (!parsed.success || !operation || !engineIds.has(operation.split('.')[0] ?? '')) return [];
    if (!findOperation(engines, operation)?.runtimes.includes('node')) return [];
    return [
      { id: source.file, operation, input: parsed.data.input, params: parsed.data.params ?? {} },
    ];
  });
}

/** Validates every data file and, when there are no issues, builds the generated outputs. */
export async function runPipeline(
  sources: Sources,
  engines: Engines,
): Promise<{ output: PipelineOutput | null; issues: Issue[] }> {
  const issues: Issue[] = [];
  const siteParsed = siteConfigSchema.safeParse(sources.siteConfig.data);
  if (!siteParsed.success) issues.push(...zodIssues(sources.siteConfig.file, siteParsed.error));
  const { taxonomy, issues: taxonomyIssues } = validateTaxonomy(sources.taxonomy);
  issues.push(...taxonomyIssues);
  const presets = await buildPresets(sources, engines, issues);
  if (!taxonomy || !siteParsed.success) return { output: null, issues };
  const ctx = { taxonomy, presets: presets.resolved, abstractPresets: presets.abstract };
  const { tools: loaded, issues: manifestIssues } = validateManifests(sources.tools, ctx);
  issues.push(...manifestIssues);
  const toolUrls = new Map([...loaded.values()].map((t) => [t.manifest.id, `/${t.manifest.slug}`]));
  const tools: RegistryTool[] = [];
  for (const tool of loaded.values()) {
    const built = await buildTool(tool, presets, engines, toolUrls, issues);
    if (built) tools.push(built);
  }
  await checkFormulaStrings(sources, engines, presets, issues);
  const folders = new Set(sources.tools.map((t) => t.folder));
  checkHome(sources.siteConfig.file, siteParsed.data, folders, tools, issues);
  if (issues.length > 0) return { output: null, issues };
  const categories = buildCategories(taxonomy, tools, siteParsed.data);
  fillRelated(tools, categories);
  const registry: Registry = {
    registryVersion: 1,
    site: siteParsed.data,
    categories,
    tools,
    presets: Object.fromEntries(presets.resolved),
  };
  const engineIds = [...new Set([...presets.resolved.values()].map((p) => p.engineId))].sort();
  const determinism = determinismCases(sources, engines, new Set(engineIds));
  const searchIndex = await buildSearchIndex(registry, taxonomy, engines);
  return { output: { registry, searchIndex, determinism, engineIds }, issues };
}
