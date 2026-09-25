# @mangotools/runtime

Runs tools in the browser. The only package through which `packages/ui` and `apps/web` reach engines.

| Module | Purpose |
|---|---|
| `worker-host.ts` | One module worker per engine, created on first use. `run(operationId, input, params, signal)` → outcome. Aborting resolves `ABORTED` and tells the worker. |
| `engine.worker.ts` | Worker entry. Loads engines lazily through `generated/engine-loaders.ts`. |
| `worker-handler.ts` | The worker's message logic, testable in Node. |
| `context.ts` | Production `OperationContext` (clock, Web Crypto random bytes, abort signal). |
| `tool-input.ts` | Preset → form defaults, sample values, and the operation request (hidden fields left out, `₹1,00,000` normalised). |
| `tool-state.ts` | Store per tool island: `idle → editing → running → result | error`, live compute debounced 150 ms, new input aborts the run in flight. |
| `preferences.ts` | Theme and recent tools in `localStorage`, every access guarded, in-memory fallback. |
| `analytics.ts` | Event catalogue and validation. No network calls; the web app installs a `console.debug` sink in development only. |
| `search.ts` | Loads `/search-index.json` and queries it with `engines/search` on the main thread. |

Protocol: `{ id, type: 'run', operationId, input, params }` → `{ id, ok: true, value, warnings }` or `{ id, ok: false, error }`; `{ id, type: 'abort' }`.
