import type { Page } from '@playwright/test';
import type { OperationCase } from './operation-observation.ts';

/** Intercepted test document and disposable worker, never a built/deployed route. */
export async function runOperationWorker(page: Page, bundle: string, cases: OperationCase[]) {
  await page.route('**/__unpublished-operation-test__', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Operation determinism test</title>',
    }),
  );
  await page.goto('/__unpublished-operation-test__');
  return page.evaluate(
    ({ code, input }) =>
      new Promise((resolve, reject) => {
        const source =
          code +
          `
          self.onmessage = async ({ data }) => {
            try { self.postMessage({ ok: true, value: await UnpublishedOperationHarness.run(data) }); }
            catch (error) { self.postMessage({ ok: false, error: String(error) }); }
          };`;
        const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        const worker = new Worker(url);
        const cleanup = () => {
          worker.terminate();
          URL.revokeObjectURL(url);
        };
        worker.onerror = (event) => {
          cleanup();
          reject(new Error(event.message));
        };
        worker.onmessage = ({ data }) => {
          cleanup();
          if (data.ok) resolve(data.value);
          else reject(new Error(data.error));
        };
        worker.postMessage(input);
      }),
    { code: bundle, input: cases },
  );
}
