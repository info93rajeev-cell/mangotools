/**
 * The build command for Cloudflare Pages deployments: `pnpm build:deploy` → apps/web/dist.
 *
 * MANGOTOOLS_ENV must be set explicitly in the Pages project: `production` for the production
 * environment, `development` for preview deployments. It is never defaulted, so a production
 * deployment with a missing variable fails instead of shipping the development (noindex) build.
 * After the normal post-build checks, the output is checked for the environment it will serve.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { deployEnvironment, deployProblems } from '../check/deploy-rules.ts';
import { runPostbuild } from '../check/postbuild.ts';
import { walkFiles } from '../lib/files.ts';
import { ROOT } from '../lib/paths.ts';
import { buildSite } from './site.ts';

const env = deployEnvironment(process.env.MANGOTOOLS_ENV);
if (!env) {
  console.error(
    'build:deploy: set MANGOTOOLS_ENV to "production" (production environment) or "development" ' +
      '(preview deployments). It is never defaulted for deployments.',
  );
  process.exit(1);
}

const dist = join(ROOT, 'apps/web/dist');
const registry = JSON.parse(readFileSync(join(ROOT, 'generated/registry.json'), 'utf8')) as {
  site: { environments: Record<string, { url: string }> };
};
const siteUrl = (registry.site.environments[env]?.url ?? '').replace(/\/$/, '');

try {
  buildSite(env, './dist');
  const result = runPostbuild(dist, env);
  const reader = {
    files: walkFiles(dist, '').map((f) => relative(dist, f).split('\\').join('/')),
    read: (file: string) => {
      const path = join(dist, file);
      return existsSync(path) ? readFileSync(path, 'utf8') : null;
    },
  };
  const problems = [...result.problems, ...deployProblems(reader, env, siteUrl)];
  if (problems.length > 0) {
    for (const p of problems) console.error(`✗ ${p}`);
    process.exit(1);
  }
  const commit = process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) ?? 'local';
  console.log(
    `build:deploy: ${env} build for ${siteUrl} (${result.pages} pages, commit ${commit}) is ready in apps/web/dist.`,
  );
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
