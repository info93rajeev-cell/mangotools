# @mangotools/runtime

Runs tools in the browser. The only package through which `packages/ui` and `apps/web` reach engines.

| Module | Purpose |
|---|---|
| `worker-host.ts` | One module worker per engine, created on first use. `run(operationId, input, params, signal)` → outcome. Aborting resolves `ABORTED` and tells the worker. |
| `engine.worker.ts` | Worker entry. Loads engines lazily through `generated/engine-loaders.ts`. |
| `worker-handler.ts` | The worker's message logic, testable in Node. |
| `context.ts` | Production `OperationContext` (clock, Web Crypto random bytes, abort signal). |
| `tool-input.ts` | Preset → form defaults, engine-backed sample input plus optional validated UI-only sample state, and the operation request (`uiOnly` fields excluded, `₹1,00,000` normalised). |
| `tool-state.ts` | Store per tool island: `idle → editing → running → result | error`, live compute debounced 150 ms, new input aborts the run in flight. |
| `preferences.ts` | Theme and recent tools in `localStorage`, every access guarded, in-memory fallback. |
| `rows.ts` | Generic `kind: 'rows'` fields: initial/default rows, deterministic JSON form value, add/remove within `minRows`/`maxRows`, and the engine payload (blank rows skipped, empty cells omitted, numbers normalised but kept as decimal strings). |
| `tool-presets.ts` | User-defined tool presets saved explicitly in `localStorage` (see below). |
| `analytics.ts` | Event catalogue and validation. No network calls; the web app installs a `console.debug` sink in development only. |
| `search.ts` | Loads `/search-index.json` and queries it with `engines/search` on the main thread. |

Protocol: `{ id, type: 'run', operationId, input, params }` → `{ id, ok: true, value, warnings }` or `{ id, ok: false, error }`; `{ id, type: 'abort' }`.

## Repeatable rows (`kind: 'rows'`)

A preset field with `kind: 'rows'` and a `rows` spec (`schemas/src/preset-rows.ts`) holds an ordered
list of strict rows whose columns are primitive only: `text`, `number`, `money`, `percent` or
`enum`. Rows never contain rows. `minRows` (default 0) and `maxRows` (at most 50) bound the list;
`defaultRows` seeds a fresh or reset form. The form value is one JSON string; `buildRequest` sends an
array of row objects to the engine. Row identity for rendering is the UI's concern and is never part
of the value. Rendering and add/remove controls are UI work (`packages/ui`).

## User tool presets (`mt.toolPresets`)

`createToolPresetStore()` saves named sets of form values per tool, explicitly (no autosave).

- Storage: one `localStorage` key, `mt.toolPresets`, holding `{ version: 1, tools: { [toolId]:
  [{ id, name, values }] } }`. Theme and recent-tool keys are untouched.
- Identity: the tool's manifest `id`. Preset ids are opaque, random (Web Crypto), unique per tool.
  No timestamps; list order is save order.
- API: `list`, `get`, `save` (new, or replace values and name of an existing id), `rename`,
  `remove` (one preset), `clear` (every preset of one tool). Each write returns
  `{ ok: true, value } | { ok: false, error }` and never throws.
- Limits: 20 presets per tool, names 1–60 characters (trimmed), 16,000 characters of serialized
  values. Values are JSON objects of strings, booleans, null, arrays and objects; numbers are
  rejected so decimal strings are never coerced. Load with `restoreValues(preset, values)`, which
  keeps only known keys of the right type.
- Corruption and versions: unreadable or wrongly shaped data reads as empty and is replaced on the
  next save; a document from a newer version reads as empty and every write is refused
  (`UNSUPPORTED_VERSION`). Unavailable storage gives `STORAGE_UNAVAILABLE`; a failed write
  (for example quota) gives `WRITE_FAILED`.
- Privacy: values stay in this browser. No network request, analytics event or URL parameter.
- Reset vs delete: resetting a form (`ToolStore.reset`) returns it to its defaults and never touches
  saved presets. Deleting one preset (`remove`) and deleting all of a tool's presets (`clear`) are
  separate, explicit actions.
