import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listDirs, walkFiles } from '../lib/files.ts';
import { ROOT, rel } from '../lib/paths.ts';
import {
  checkBigJs,
  checkEngineSource,
  checkLength,
  checkNoDirectEngineImport,
  checkRelativeEscape,
  checkScriptsLayer,
  FORBIDDEN_FOLDERS,
  type Violation,
} from './rules.ts';

const violations: Violation[] = [];
const warnings: Violation[] = [];
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8');
const sources = (dir: string, ext: string[]) =>
  ext
    .flatMap((e) => walkFiles(join(ROOT, dir), e))
    .map(rel)
    .filter((f) => !f.includes('/dist/') && !f.includes('/.astro/'));
const isTest = (file: string) => /\.(test|spec)\.tsx?$/.test(file);

for (const folder of FORBIDDEN_FOLDERS) {
  if (existsSync(join(ROOT, folder))) {
    violations.push({
      file: folder,
      rule: 'phase-1-scope',
      message: 'This folder is deferred beyond Phase 1 and must not exist.',
    });
  }
}

for (const engineId of listDirs(join(ROOT, 'engines'))) {
  const root = `engines/${engineId}`;
  for (const file of sources(`${root}/src`, ['.ts'])) {
    const text = read(file);
    violations.push(...checkRelativeEscape(file, root, text));
    if (!isTest(file)) violations.push(...checkEngineSource(file, engineId, text));
  }
}

const code = [
  ...sources('engines', ['.ts']),
  ...sources('packages', ['.ts', '.tsx']),
  ...sources('apps', ['.ts', '.tsx', '.astro']),
  ...sources('scripts', ['.ts']),
  ...sources('tests', ['.ts']),
];
for (const file of code) {
  const text = read(file);
  violations.push(...checkBigJs(file, text));
  if (file.startsWith('packages/ui/') || file.startsWith('apps/web/'))
    violations.push(...checkNoDirectEngineImport(file, text));
  if (file.startsWith('scripts/')) violations.push(...checkScriptsLayer(file, text));
  const length = checkLength(file, text);
  if (length.violation) violations.push(length.violation);
  if (length.warning) warnings.push(length.warning);
}
for (const file of [...sources('tools', ['manifest.yaml']), ...sources('presets', ['.yaml'])]) {
  const length = checkLength(file, read(file));
  if (length.violation) violations.push(length.violation);
}

const show = (v: Violation) => `${v.file}${v.line ? `:${v.line}` : ''}  [${v.rule}] ${v.message}`;
for (const w of warnings) console.warn(`⚠ ${show(w)}`);
if (violations.length > 0) {
  for (const v of violations) console.error(`✗ ${show(v)}`);
  console.error(`\narchitecture: ${violations.length} violation(s).`);
  process.exit(1);
}
console.log(
  `architecture: ${code.length} source files checked, no violations${warnings.length ? `, ${warnings.length} warning(s)` : ''}.`,
);
