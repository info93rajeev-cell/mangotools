# engines/image

Browser-first image processing. Phase 1 starts with resizing a single JPG, PNG, or WebP image. File bytes
are the only "data" this engine touches at its boundary — no `File`/`Blob` in the input/output schema, no
network, no server upload — selecting files, previews, and downloading the result all belong in
`packages/ui`, once a tool exists.

| Operation | Purpose |
|---|---|
| `image.resize@1` | Resizes a JPG, PNG, or WebP image to the requested dimensions |
| `image.watermark@1` | Draws a text watermark onto a JPG, PNG, or WebP image at a chosen position |
| `image.crop@1` | Crops a JPG, PNG, or WebP image to a pixel rectangle |

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
- 0.2.0 — `image.resize@1` reused by the visible Image Resize tool (TASK-005B PR 2). No operation
  behavior change.
- 0.3.0 — Small, directly-required foundation additions for Image Compress (TASK-005C), which reuses
  `image.resize@1` at the source's own dimensions rather than a new operation:
  - `params.outputFileNameSuffix`/`outputFileNameFallback` let a preset pick its own output-name wording
    (`deriveOutputFileName`'s new optional `style` argument) — Image Resize's own default ("-resized",
    `resized-image`) is unchanged when a preset sets neither.
  - `output.sizeDifferenceBytes`/`sizeChangePercent` (`size-change.ts`) compare the output's byte size
    against the original's; always populated, for any preset to surface.
  - `IMAGE_OUTPUT_LARGER_THAN_INPUT` warning, raised whenever the output file is larger than the input,
    regardless of which preset requested the resize.
- 0.4.0 — Small, directly-required foundation additions for Image Format Converter (TASK-007B), which
  reuses `image.resize@1` at the source's own dimensions with an *explicit* output format (never `'same'`),
  the same reuse pattern Image Compress already established:
  - `output.originalFormat` — the source's own detected format, so a preset can show "converted from X to
    Y" without a separate lookup. Populated for every preset, not converter-specific.
  - `IMAGE_SAME_FORMAT_REENCODED` warning, raised only when an *explicit* requested format equals the
    detected source format; never raised for Image Resize's or Image Compress's own `'same'`-format
    default, which is a different, already-shipped path. No other operation behavior change.
- 0.5.0 — `image.watermark@1` added (TASK-007D): a new, small operation (not a reuse of `image.resize@1`,
  which cannot draw text) for adding a text watermark at one of five anchor positions. Retroactively noted
  here — this entry was missed when TASK-007D shipped and is being added now, alongside 0.6.0, rather than
  left permanently absent. Before adding it, the genuinely shared pieces of `image.resize@1` (signature
  detection, decode/encode, output-file-name derivation, size-change math, shared file/source limits) were
  extracted into `src/lib/`, so both operations use the same code instead of duplicating it — a pure move,
  verified against Image Resize's own existing fixtures/tests with zero behavior change before
  `image.watermark@1` was built on top. See `src/operations/watermark/README.md` for the full contract.
- 0.6.0 — `image.crop@1` added (TASK-007E): another new, small operation (cropping a pixel rectangle is not
  something `image.resize@1` can do either — it always draws the *whole* source image, scaled). Reuses
  `src/lib/`'s shared decode/encode/file-name/size-change/limits code unchanged. `src/lib/decode-source.ts`
  is new: the decode-and-check-pixel-count step duplicated identically across Resize and Watermark was
  extracted once this became the third occurrence, again with zero behavior change to either existing
  operation (re-verified against both their own test suites before Crop was built). `browser-globals.d.ts`
  gained the 9-argument `drawImage` overload (source-rectangle-to-destination-rectangle), the one canvas
  capability no prior operation in this engine needed. See `src/operations/crop/README.md` for the full
  contract.
