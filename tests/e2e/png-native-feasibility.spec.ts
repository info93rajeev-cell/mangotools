import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { ROOT } from '../../scripts/lib/paths.ts';
import { bundleTestEntry } from '../support/library-bundle.ts';
import { runOperationWorker } from '../support/operation-worker.ts';
import { inspectNativePng, normalizeNativePng } from '../support/png-native-prototype.ts';

interface Vector {
  id: string;
  base64: string;
  pixels?: number[];
  error?: string;
}
interface Observation {
  id: string;
  ok: boolean;
  error?: string;
  width?: number;
  pixels?: number[];
  pixelsAfter?: number[];
}
interface Probe {
  capabilities: { bitmap: boolean; canvas: boolean };
  observations: Observation[];
}
const vectors: Vector[] = JSON.parse(
  readFileSync(join(ROOT, 'tests/fixtures/png-native-feasibility.json'), 'utf8'),
).cases;
const cases = vectors.map(({ id, base64 }) => ({
  id,
  operation: 'test-only',
  input: base64,
  params: {},
}));

test('PNG native compressed-stream validation in Node 24; bitmap path is explicitly unsupported', async () => {
  expect(Number(process.versions.node.split('.')[0])).toBe(24);
  for (const vector of vectors) {
    const result = inspectNativePng(Buffer.from(vector.base64, 'base64'));
    if ('error' in vector) await expect(result, vector.id).rejects.toThrow(vector.error);
    else expect((await result).inflation.total).toBeGreaterThan(0);
  }
  await expect(
    normalizeNativePng(Buffer.from(vectors[0]?.base64 ?? '', 'base64'), 'worker'),
  ).rejects.toThrow('BITMAP_UNAVAILABLE');
});

for (const mode of ['window', 'worker'] as const) {
  test(`PNG native ${mode}: pixels, alpha/palette, corrupt rejection and bounded work`, async ({
    page,
  }, info) => {
    const module = join(ROOT, 'tests/support/png-native-prototype.ts').replaceAll('\\', '/');
    const bundle = await bundleTestEntry(
      '@mangotools/core',
      join(ROOT, 'packages/core'),
      `import { normalizeNativePng } from ${JSON.stringify(module)};
       export async function run(cases) {
         const observations = [];
         for (const item of cases) {
           const started = performance.now();
           try {
             const bytes = Uint8Array.from(atob(item.input), c => c.charCodeAt(0));
             observations.push({id:item.id,ok:true,...await normalizeNativePng(bytes, ${JSON.stringify(mode)}),elapsedMs:performance.now()-started});
           } catch(error) { observations.push({id:item.id,ok:false,error:error.message,elapsedMs:performance.now()-started}); }
         }
         return {capabilities:{bitmap:typeof createImageBitmap === 'function',canvas:typeof OffscreenCanvas === 'function'},observations};
       }`,
      'UnpublishedOperationHarness',
    );
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    let probe: Probe;
    if (mode === 'worker') probe = (await runOperationWorker(page, bundle, cases)) as Probe;
    else {
      await page.route('**/__png-native-feasibility__', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><title>PNG test only</title>',
        }),
      );
      await page.goto('/__png-native-feasibility__');
      await page.addScriptTag({ content: bundle });
      probe = await page.evaluate((input) => {
        const harness = globalThis as typeof globalThis & {
          UnpublishedOperationHarness: { run(cases: unknown[]): Promise<Probe> };
        };
        return harness.UnpublishedOperationHarness.run(input);
      }, cases);
    }
    const { observations } = probe;
    console.log(JSON.stringify({ project: info.project.name, mode, ...probe }));
    await info.attach(`png-${mode}-observations`, {
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(observations, null, 2)),
    });
    expect(requests.every((url) => /^((blob:)?http:\/\/127\.0\.0\.1:4321\/)/.test(url))).toBe(true);
    expect(observations).toHaveLength(vectors.length);
    for (const [index, vector] of vectors.entries()) {
      const observation = observations[index];
      if ('error' in vector) {
        expect(observation?.ok, vector.id).toBe(false);
        expect(observation?.error, vector.id).toContain(vector.error ?? '');
      } else if (mode === 'worker' && !probe.capabilities.canvas) {
        expect(observation, vector.id).toMatchObject({ ok: false, error: 'CANVAS_UNAVAILABLE' });
      } else {
        expect(observation?.ok, `${vector.id}: ${observation?.error}`).toBe(true);
        expect(observation?.pixels, vector.id).toEqual(vector.pixels);
        expect(observation?.pixelsAfter, vector.id).toEqual(vector.pixels);
      }
    }
  });
}
