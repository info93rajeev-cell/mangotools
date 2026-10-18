import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../../scripts/lib/paths.ts';

interface BundleOutput {
  output: { type: string; code?: string }[];
}

/** Resolve package exports, including self-reference, without guessing src/index.ts. */
export function publicLibraryEntry(packageName: string, packageDirectory: string): string {
  return createRequire(join(packageDirectory, 'package.json')).resolve(packageName);
}

export async function bundlePublicLibrary(packageName: string, packageDirectory: string) {
  const runner = join(ROOT, 'tests/support/library-observation.ts').replaceAll('\\', '/');
  return bundleTestEntry(
    packageName,
    packageDirectory,
    `import * as library from ${JSON.stringify(packageName)};
     import { runLibraryCases } from ${JSON.stringify(runner)};
     export const run = cases => runLibraryCases(library, cases);`,
    'PublicLibraryHarness',
  );
}

/** Shared in-memory test bundler; never writes or publishes a route/asset. */
export async function bundleTestEntry(
  packageName: string,
  packageDirectory: string,
  source: string,
  globalName: string,
) {
  const entry = publicLibraryEntry(packageName, packageDirectory);
  // Reuse Astro's build dependency without importing app code or adding a dependency.
  const webRequire = createRequire(join(ROOT, 'apps/web/package.json'));
  const buildRequire = createRequire(webRequire.resolve('astro/package.json'));
  const { build } = (await import(pathToFileURL(buildRequire.resolve('vite')).href)) as {
    build(options: unknown): Promise<BundleOutput | BundleOutput[]>;
  };
  const virtual = 'virtual:public-library-test';
  const result = await build({
    configFile: false,
    publicDir: false,
    logLevel: 'error',
    resolve: { alias: { [packageName]: entry } },
    plugins: [
      {
        name: 'public-library-test',
        resolveId: (id: string) => (id === virtual ? virtual : undefined),
        load: (id: string) => (id === virtual ? source : undefined),
      },
    ],
    build: {
      write: false,
      minify: false,
      target: 'es2023',
      rolldownOptions: { input: virtual },
      lib: { entry: virtual, formats: ['iife'], name: globalName },
    },
  });
  const chunks = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output);
  const chunk = chunks.find((item) => item.type === 'chunk');
  if (!chunk?.code) throw new Error('Missing public-library browser bundle');
  return chunk.code;
}
