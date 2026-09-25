/**
 * Builds the static site for one environment, then runs the post-build checks.
 * Usage: tsx scripts/build/site.ts [--env development|production] [--out dist]
 * The environment defaults to MANGOTOOLS_ENV, then "development". Astro telemetry is disabled.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { runPostbuild } from '../check/postbuild.ts';
import { ROOT } from '../lib/paths.ts';

const WEB = join(ROOT, 'apps/web');

export function buildSite(env: string, outDir: string): void {
  const require = createRequire(join(WEB, 'package.json'));
  const astroBin = join(require.resolve('astro/package.json'), '..', 'bin', 'astro.mjs');
  const result = spawnSync(process.execPath, [astroBin, 'build', '--silent'], {
    cwd: WEB,
    stdio: 'inherit',
    env: {
      ...process.env,
      MANGOTOOLS_ENV: env,
      MANGOTOOLS_OUT_DIR: outDir,
      ASTRO_TELEMETRY_DISABLED: '1',
    },
  });
  if (result.status !== 0)
    throw new Error(`astro build failed for ${env} (exit ${result.status}).`);
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/build/site.ts');
if (isMain) {
  const { values } = parseArgs({
    options: { env: { type: 'string' }, out: { type: 'string', default: 'dist' } },
  });
  const env = values.env ?? process.env.MANGOTOOLS_ENV ?? 'development';
  const out = values.out ?? 'dist';
  const started = performance.now();
  try {
    buildSite(env, `./${out}`);
    const result = runPostbuild(join(WEB, out), env);
    if (result.problems.length > 0) {
      for (const p of result.problems) console.error(`✗ ${p}`);
      process.exit(1);
    }
    const kb = (b: number) => `${(b / 1024).toFixed(1)} KB`;
    const largest = Math.max(...Object.values(result.bundles));
    console.log(
      `build: ${result.pages} pages (${env}) in apps/web/${out}; checks passed; ` +
        `home JS ${kb(result.bundles['index.html'] ?? 0)}, largest page JS ${kb(largest)} (gzip); ` +
        `${Math.round((performance.now() - started) / 100) / 10} s`,
    );
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
