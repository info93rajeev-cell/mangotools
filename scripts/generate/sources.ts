import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { listDirs, listFiles, walkFiles } from '../lib/files.ts';
import { engineFixtureFiles } from '../lib/fixtures.ts';
import { ROOT } from '../lib/paths.ts';
import { type Issue, issue } from './issues.ts';

/** A parsed data file. `file` is repository-relative with forward slashes. */
export interface SourceFile {
  file: string;
  data: unknown;
}

export interface ToolSource {
  folder: string;
  manifest: SourceFile | null;
  content: { file: string; text: string } | null;
  fixtures: SourceFile[];
}

export interface Sources {
  siteConfig: SourceFile;
  taxonomy: {
    categories: SourceFile;
    professions: SourceFile;
    tags: SourceFile;
    synonyms: SourceFile;
    reserved: SourceFile;
  };
  presets: SourceFile[];
  tools: ToolSource[];
  /** Engine fixtures, read only to learn which working-step formula keys an operation emits. */
  engineFixtures: SourceFile[];
}

const toRel = (root: string, path: string) => relative(root, path).split('\\').join('/');

function readYamlFile(root: string, path: string, issues: Issue[]): SourceFile {
  const file = toRel(root, path);
  if (!existsSync(path)) {
    issues.push(issue(file, 'File is missing.'));
    return { file, data: undefined };
  }
  try {
    return { file, data: parse(readFileSync(path, 'utf8'), { version: '1.2' }) };
  } catch (error) {
    issues.push(issue(file, `YAML syntax error: ${(error as Error).message.split('\n')[0]}`));
    return { file, data: undefined };
  }
}

function loadTool(root: string, folder: string, issues: Issue[]): ToolSource {
  const dir = join(root, 'tools', folder);
  const manifestPath = join(dir, 'manifest.yaml');
  const contentPath = join(dir, 'content.md');
  return {
    folder,
    manifest: existsSync(manifestPath) ? readYamlFile(root, manifestPath, issues) : null,
    content: existsSync(contentPath)
      ? { file: toRel(root, contentPath), text: readFileSync(contentPath, 'utf8') }
      : null,
    fixtures: listFiles(join(dir, 'fixtures'), '.yaml').map((f) => readYamlFile(root, f, issues)),
  };
}

/** Reads every data file the registry is built from. Nothing here validates content. */
export function loadSources(root: string = ROOT): { sources: Sources; issues: Issue[] } {
  const issues: Issue[] = [];
  const yaml = (path: string) => readYamlFile(root, join(root, path), issues);
  const sources: Sources = {
    siteConfig: yaml('site.config.yaml'),
    taxonomy: {
      categories: yaml('taxonomy/categories.yaml'),
      professions: yaml('taxonomy/professions.yaml'),
      tags: yaml('taxonomy/tags.yaml'),
      synonyms: yaml('taxonomy/synonyms.yaml'),
      reserved: yaml('taxonomy/reserved-slugs.yaml'),
    },
    presets: walkFiles(join(root, 'presets'), '.yaml').map((f) => readYamlFile(root, f, issues)),
    tools: listDirs(join(root, 'tools')).map((folder) => loadTool(root, folder, issues)),
    engineFixtures: engineFixtureFiles().map((f) => readYamlFile(ROOT, f, issues)),
  };
  return { sources, issues };
}
