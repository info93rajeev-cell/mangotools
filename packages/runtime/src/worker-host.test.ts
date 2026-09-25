import type { EngineModule } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { createBrowserContext } from './context.ts';
import type { WorkerLike, WorkerRequest, WorkerResponse } from './protocol.ts';
import { createRequestHandler } from './worker-handler.ts';
import { createWorkerHost } from './worker-host.ts';

const loaders: Record<string, () => Promise<EngineModule>> = {
  estimate: () => import('../../../engines/estimate/src/index.ts').then((m) => m.engine),
  data: () => import('../../../engines/data/src/index.ts').then((m) => m.engine),
};

/** Runs the real worker handler in-process, asynchronously like a Worker would. */
function fakeWorkerFactory(created: string[]) {
  return (engineId: string): WorkerLike => {
    created.push(engineId);
    const handle = createRequestHandler(loaders, (signal) => createBrowserContext({ signal }));
    const worker: WorkerLike = {
      onmessage: null,
      postMessage(message: WorkerRequest) {
        void handle(message).then((response: WorkerResponse | null) => {
          if (response) setTimeout(() => worker.onmessage?.({ data: response }), 0);
        });
      },
      terminate() {},
    };
    return worker;
  };
}

describe('worker host', () => {
  it('runs an operation through the worker protocol', async () => {
    const host = createWorkerHost(fakeWorkerFactory([]));
    const outcome = await host.run(
      'estimate.tax.gst@1',
      { amount: '1000.00', rate: 18, mode: 'add', supply: 'intra' },
      {},
    );
    expect(outcome.ok && (outcome.value as { grossAmount: string }).grossAmount).toBe('1180.00');
  });

  it('creates one worker per engine, on first use', async () => {
    const created: string[] = [];
    const host = createWorkerHost(fakeWorkerFactory(created));
    expect(created).toEqual([]);
    await host.run('data.url.transform@1', { text: 'a b' }, {});
    await host.run('data.base64.transform@1', { text: 'a' }, {});
    await host.run(
      'estimate.pricing.margin@1',
      { solve: 'from-cost-and-price', cost: '1', price: '2' },
      {},
    );
    expect(created).toEqual(['data', 'estimate']);
  });

  it('resolves ABORTED when the caller aborts', async () => {
    const host = createWorkerHost(fakeWorkerFactory([]));
    const controller = new AbortController();
    const pending = host.run('data.json.format@1', { text: '{"a":1}' }, {}, controller.signal);
    controller.abort();
    expect(await pending).toEqual({
      ok: false,
      error: { code: 'ABORTED', messageKey: 'errors.ABORTED' },
    });
  });

  it('returns engine errors and rejects unknown operations', async () => {
    const host = createWorkerHost(fakeWorkerFactory([]));
    const invalid = await host.run('data.json.format@1', { text: '{"a":1,}' }, {});
    expect(!invalid.ok && invalid.error.code).toBe('DATA_JSON_SYNTAX_ERROR');
    const unknown = await host.run('data.nothing.here@1', {}, {});
    expect(!unknown.ok && unknown.error.code).toBe('INTERNAL_ERROR');
  });
});
