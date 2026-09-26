# engines/image

Browser-first image processing. Phase 1 starts with resizing a single JPG, PNG, or WebP image. File bytes
are the only "data" this engine touches at its boundary — no `File`/`Blob` in the input/output schema, no
network, no server upload — selecting files, previews, and downloading the result all belong in
`packages/ui`, once a tool exists.

| Operation | Purpose |
|---|---|
| `image.resize@1` | Resizes a JPG, PNG, or WebP image to the requested dimensions |

## Runtime: this engine is browser/worker-only, by design and by necessity

**Read this before assuming this engine works like `numeric`, `data`, `estimate`, `logistics`, or `pdf`.**
Every operation here declares `runtimes: ['worker']` — never `'node'`. This is a deliberate, disclosed,
founder-approved exception to AGENTS.md's general "engines are pure, no DOM" rule
(`tasks/TASK-005A-IMAGE-TOOLS-WAVE-PLANNER.md` §3 Q11), not an oversight:

- Image decode/encode needs `OffscreenCanvas` and `createImageBitmap` — real, worker-safe (not
  `window`-scoped) browser APIs, but ones that **do not exist in plain Node**, with no polyfill anywhere in
  this repository.
- Concretely, this means: **`image.resize@1` cannot be executed by `executeOperation` in a plain Node
  process for any input that reaches the actual decode step.** Only the pure, pre-decode validation logic
  (file presence, declared type, size, requested-dimension validity) can run in Node — see
  `src/operations/resize/README.md`'s "Fixtures and what they can and cannot cover".
- `scripts/validate/rules.ts`'s `ENGINE_BANNED` check (which forbids literal `document.`/`window`
  references) does not and cannot catch this — `OffscreenCanvas`/`createImageBitmap` are not `window`-scoped,
  so this engine passes that automated check while still being Node-incompatible in practice. The real
  boundary here is enforced by `runtimes: ['worker']` and by what this README documents, not by tooling.
- The ambient type declarations for these APIs live in `src/browser-globals.d.ts`, kept deliberately
  separate from `packages/core/src/platform-globals.d.ts` (reserved for globals identical across Node,
  browsers, *and* workers — these are not).

## Determinism: byte-identical output is not a requirement for this engine

Every other engine's fixtures are verified byte-for-byte identical across Node, Chromium, Firefox and WebKit
by this platform's determinism suite. **That bar does not apply here, and is not required to apply here —
this is a founder-approved, explicit exception** (`tasks/TASK-005A-IMAGE-TOOLS-WAVE-PLANNER.md` §3 Q15/§10
Founder Decision 4), not a silently lowered bar:

- `image.resize@1` cannot run in Node at all (see "Runtime" above), so there is no Node reference to hash
  against in the first place.
- Even browser-to-browser, canvas image encoders (JPEG/PNG/WebP) and resize-interpolation quality are
  implementation-defined per engine, not spec-guaranteed identical — two browsers given the exact same
  input and requested output size are not expected to produce byte-identical encoded output, and this
  engine does not claim they do.
- **The generic exclusion mechanism:** `scripts/generate/pipeline.ts`'s `determinismCases()` now excludes
  any fixture whose operation does not declare `'node'` in its `runtimes` — a minimal, explicit,
  documented exception (not specific to this engine by name; it would apply identically to any future
  `runtimes: ['worker']`-only operation). Non-image engines are unaffected: every existing operation still
  declares `runtimes: ['worker', 'node']` and is still verified byte-for-byte as before.
- **What is still required and tested:** output dimensions, output format, warnings, error codes, and
  filename normalization — all deterministic, stable, and asserted, just not by byte hash. See
  `src/operations/resize/README.md`'s "Fixtures and what they can and cannot cover".

## Why file size and pixel-area limits are checked separately

`image.resize@1` checks the raw file size, then (after decoding) the *decoded* pixel count, then the
*computed output* pixel count — three separate checks, not one. A highly-compressed but very-high-resolution
image can be only a few MB on disk yet decode to a multi-gigabyte in-memory bitmap (`width × height × 4`
bytes for RGBA), so file size alone is not a safe proxy for memory risk — a finding made during
TASK-005A's own planning pass, not discovered mid-implementation. See `src/operations/resize/README.md`'s
"Validation, in order" for the exact sequence and codes.

## Changelog

- 0.1.0 — `image.resize@1` foundation (TASK-005B PR 1). No preset used by a manifest yet; no visible tool.
  See `src/operations/resize/README.md` for the full operation contract.
