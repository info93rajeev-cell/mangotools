import { loadEngines } from '../lib/engines.ts';
import { paths } from '../lib/paths.ts';
import { formatIssue } from './issues.ts';
import { writeOutputs } from './outputs.ts';
import { runPipeline } from './pipeline.ts';
import { loadSources } from './sources.ts';

const started = performance.now();
const { sources, issues: loadIssues } = loadSources();
const engines = await loadEngines();
const { output, issues } = await runPipeline(sources, engines);
const all = [...loadIssues, ...issues];

if (all.length > 0 || !output) {
  console.error(all.map(formatIssue).join('\n'));
  console.error(
    `\npnpm gen: ${all.length} problem${all.length === 1 ? '' : 's'} found. Nothing was written.`,
  );
  process.exit(1);
}

const written = writeOutputs(paths.generated, output);
const visible = output.registry.categories.filter((c) => c.visible).length;
console.log(
  `pnpm gen: ${output.registry.tools.length} tools, ${Object.keys(output.registry.presets).length} presets, ` +
    `${visible} visible categories → ${written.length} files in generated/ (${Math.round(performance.now() - started)} ms)`,
);
