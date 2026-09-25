/**
 * Module worker entry. One instance runs per engine (see worker-host.ts); engines load lazily
 * through the generated loader map, so a worker only ever downloads the engine it serves.
 */
import { engineLoaders } from '../../../generated/engine-loaders.ts';
import { createBrowserContext } from './context.ts';
import type { WorkerRequest, WorkerResponse } from './protocol.ts';
import { createRequestHandler } from './worker-handler.ts';

interface WorkerScope {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
}

const scope = self as unknown as WorkerScope;
const handle = createRequestHandler(engineLoaders, (signal) => createBrowserContext({ signal }));

scope.onmessage = (event) => {
  const request = event.data;
  handle(request)
    .then((response) => {
      if (response) scope.postMessage(response);
    })
    .catch(() => {
      scope.postMessage({
        id: request.id,
        ok: false,
        error: { code: 'INTERNAL_ERROR', messageKey: 'errors.INTERNAL_ERROR' },
      });
    });
};
