import { parseArgs } from 'node:util';
import { ROOT } from '../lib/paths.ts';
import { scaffoldTool } from './scaffold.ts';

const usage = `Usage: pnpm new:tool <slug> --preset <engine/name> --category <id> [--tier T1|T2|T3|T4] [--archetype A-E] [--variant-of <tool-id>]

Creates tools/<slug>/ with manifest.yaml, content.md and fixtures/001-sample.yaml.
Every "TODO" is text for you to write; pnpm gen fails until all of them are replaced.`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    preset: { type: 'string' },
    category: { type: 'string' },
    tier: { type: 'string', default: 'T3' },
    archetype: { type: 'string' },
    'variant-of': { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
});

const slug = positionals[0];
const tier = values.tier as 'T1' | 'T2' | 'T3' | 'T4';
if (
  values.help ||
  !slug ||
  !values.preset ||
  !values.category ||
  !['T1', 'T2', 'T3', 'T4'].includes(tier)
) {
  console.log(usage);
  process.exit(values.help ? 0 : 1);
}

try {
  const files = await scaffoldTool(ROOT, {
    slug,
    preset: values.preset,
    category: values.category,
    tier,
    ...(values.archetype ? { archetype: values.archetype } : {}),
    ...(values['variant-of'] ? { variantOf: values['variant-of'] } : {}),
    today: new Date().toISOString().slice(0, 10),
  });
  console.log(
    `Created:\n${files.map((f) => `  ${f}`).join('\n')}\n\nNext: replace every TODO, verify the fixture by hand, then run pnpm gen.`,
  );
} catch (error) {
  console.error(`new:tool: ${(error as Error).message}`);
  process.exit(1);
}
