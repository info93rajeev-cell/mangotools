/**
 * Builds the production and development variants used by the Playwright suites, then runs
 * Playwright. Extra arguments are passed through: pnpm test:e2e --project=e2e-chromium
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { buildSite } from '../build/site.ts';
import { runPostbuild } from '../check/postbuild.ts';
import { ROOT } from '../lib/paths.ts';

const variants = [
  { env: 'production', out: 'dist-prod' },
  { env: 'development', out: 'dist-dev' },
] as const;

for (const { env, out } of variants) {
  buildSite(env, `./${out}`);
  const result = runPostbuild(join(ROOT, 'apps/web', out), env);
  if (result.problems.length > 0) {
    for (const p of result.problems) console.error(`✗ ${p}`);
    process.exit(1);
  }
  console.log(`test:e2e: built apps/web/${out} (${env}), post-build checks passed.`);
}

const require = createRequire(join(ROOT, 'package.json'));
const cli = require.resolve('@playwright/test/cli');
const run = spawnSync(process.execPath, [cli, 'test', ...process.argv.slice(2)], {
  cwd: ROOT,
  stdio: 'inherit',
});
process.exit(run.status ?? 1);
