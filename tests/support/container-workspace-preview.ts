import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../../scripts/lib/paths.ts';

interface PreviewServer {
  listen(): Promise<void>;
  close(): Promise<void>;
}
/** Local test-only surface. Does not publish a route or modify a tool manifest. */
export async function startContainerPreview(port = 4350) {
  const webRequire = createRequire(join(ROOT, 'apps/web/package.json'));
  const astroRequire = createRequire(webRequire.resolve('astro/package.json'));
  const { createServer } = (await import(pathToFileURL(astroRequire.resolve('vite')).href)) as {
    createServer: (options: unknown) => Promise<PreviewServer>;
  };
  const uiRequire = createRequire(join(ROOT, 'packages/ui/package.json'));
  const alias = [
    'preact/jsx-dev-runtime',
    'preact/jsx-runtime',
    'preact/hooks',
    'preact/compat',
    'preact',
  ].map((name) => ({ find: name, replacement: uiRequire.resolve(name) }));
  const server = await createServer({
    resolve: { alias },
    configFile: false,
    oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
    root: ROOT,
    logLevel: 'error',
    server: { host: '127.0.0.1', port, strictPort: true },
    plugins: [
      {
        name: 'container-workspace-preview',
        configureServer(host: {
          middlewares: {
            use: (
              fn: (
                req: { url?: string },
                res: {
                  setHeader: (name: string, value: string) => void;
                  end: (text: string) => void;
                },
                next: () => void,
              ) => void,
            ) => void;
          };
        }) {
          host.middlewares.use((req, res, next) => {
            if (req.url !== '/') return next();
            res.setHeader('Content-Type', 'text/html');
            res.end(
              '<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Container Loading workspace preview</title></head><body><div id="workspace-preview"></div><script type="module" src="/tests/support/container-workspace-harness.tsx"></script></body></html>',
            );
          });
        },
      },
    ],
  });
  await server.listen();
  return server;
}
