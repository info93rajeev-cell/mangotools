# engines/image — lane rules

- **A disclosed, founder-approved runtime exception — read this before touching this engine.** Unlike
  every other engine (`numeric`, `data`, `estimate`, `logistics`, `pdf`), this engine's operations declare
  `runtimes: ['worker']` only — **never `'node'`**. Image decoding and encoding depends on
  `OffscreenCanvas`/`createImageBitmap`, browser and worker APIs that do not exist in plain Node and have
  no polyfill anywhere in this repository. This is a deliberate exception to AGENTS.md's general "engines
  are pure" rule, approved by the founder for TASK-005B specifically — **do not treat this engine as
  equivalent to the calculator/logistics/PDF engines**, and do not assume a future engine gets the same
  exception without asking first. See `README.md`'s "Runtime" and "Determinism" sections for the full
  rationale.
- The browser/worker-only globals this engine depends on (`Blob`, `ImageBitmap`, `createImageBitmap`,
  `OffscreenCanvas`) live in `src/browser-globals.d.ts`, kept separate from
  `packages/core/src/platform-globals.d.ts` (reserved for globals identical across Node, browsers and
  workers). Do not move these declarations into the shared file, and do not add anything here that isn't
  already used by an operation in this engine.
- **Never assert byte-identical encoded output**, across browsers or against a Node reference. Canvas image
  encoders (JPEG/PNG/WebP) and resize-interpolation quality are implementation-defined per browser engine,
  not spec-guaranteed identical. Fixtures and tests assert dimensions, format, size bounds, warnings and
  error codes instead — see `README.md`'s "Determinism" section.
- File bytes are plain data (`Uint8Array`) at the operation boundary, never `File`. An operation may
  construct a `Blob` internally to call `createImageBitmap`, but selecting files, rendering a preview, and
  triggering a download are all `packages/ui` concerns, not this engine's.
- Validate file size, declared/detected type, and requested dimensions **before** decoding — validation
  must never depend on a successful decode. Validate the *decoded* image's own pixel count, and the
  *computed output* pixel count, before allocating a canvas at that size.
- No AI/ML model, no server call, no third-party image-processing dependency of any kind. Only browser-
  native canvas APIs plus `zod` and `@mangotools/core`.
