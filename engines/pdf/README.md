# engines/pdf

Browser-first PDF processing. Phase 1 starts with merging multiple PDFs into one, then converting JPG
images into a PDF. File bytes are the only "data" this engine touches — no DOM, no `File`/`Blob`, no
network, no server upload — selecting files, drag-and-drop, and downloading the result all belong in
`packages/ui`, once a tool exists.

| Operation | Purpose |
|---|---|
| `pdf.merge@1` | Combines multiple PDF files into one, in the order given |
| `pdf.jpgToPdf@1` | Combines one or more JPG images into a single PDF, one image per page, in order |

Error messages for every code are in `src/errors.ts`. Golden fixtures live next to each operation in
`src/operations/<operation>/fixtures/`, with binary test PDFs in a sibling `fixtures/files/` folder,
referenced from the fixture YAML as `{ path: 'name.pdf' }` and resolved to real bytes by
`scripts/lib/fixtures.ts`'s `resolveFixtureFiles` — the one small, generic addition this wave needed to
`schemas/src/fixture.ts` and the fixture loader, reusable by any future binary/file-based operation
(image, audio, video) without any further schema change.

## Why file-count and size limits are checked before parsing

`pdf.merge@1` checks the number of files, then each file's size and PDF signature, then the combined
total — all before a single byte reaches `pdf-lib`. A file that is simply too large or the wrong type
never gets as far as being parsed, which keeps the fast-fail path cheap and the slow, real work
(`PDFDocument.load`) reserved for files that already look like plausible, size-limited PDFs. The current
limits (25 MB per file, 75 MB combined, 20 files) are founder-approved starting points for Phase 1 and
may be revised after real-world testing.

## Why `pdf-lib`'s `EncryptedPDFError` is not used to detect encryption

`pdf-lib` compiles `class EncryptedPDFError extends Error` down to a form where `instanceof
EncryptedPDFError` does not reliably hold for the error it actually throws (a known limitation of how
`pdf-lib` extends the built-in `Error`, confirmed empirically against a real encrypted test fixture, not
assumed from documentation). Encryption is instead detected by loading with `{ ignoreEncryption: true }`
and then checking the document's own public `isEncrypted` property — a documented, stable part of
`pdf-lib`'s API that does not depend on exception identity. A genuinely corrupted or unparsable file
still throws and is still caught, just not attributed to encryption.

## What "merge failed" covers

After every input file individually loads and is confirmed not encrypted, copying its pages and saving
the final merged document are wrapped in their own typed-error fallback (`PDF_MERGE_FAILED`), covering
an unexpected `pdf-lib` failure at that stage — including the memory-exhaustion case a browser tab could
hit on a very large merge, which JavaScript has no distinct, catchable error type for. This path is
exercised in `merge.test.ts` by making a real, successfully-loaded document's `save()` call fail
(`vi.spyOn`), since a genuine, reproducible failure at this stage cannot otherwise be constructed from
valid input.

## Determinism

`pdf.merge@1`'s fixtures now run in the cross-browser determinism suite
(`tests/determinism/determinism.spec.ts`), now that a preset exists. Binary fixture input and output are
made JSON-safe by `@mangotools/core`'s `toJsonSafe`/`fromJsonSafe` (base64-encoded, chunked to avoid
call-stack limits on large arrays) — a generic pair usable by any future binary/file-based operation
(image, audio, video), not specific to PDFs. `scripts/generate/outputs.ts` encodes
`generated/determinism-fixtures.json`; the Node reference (`tests/determinism/determinism.spec.ts`) and
the browser harness (`apps/web/src/dev/DeterminismHarness.tsx`) both decode it back before calling the
operation.

**A real non-determinism was found and fixed by that suite, not assumed:** `pdf-lib` stamps a merged
document's `CreationDate`/`ModDate` with the current wall-clock time by default, so two merges of
identical input produced different bytes whenever they ran more than a second apart — invisible in a
same-process, same-second unit test, but caught immediately by comparing a Node run against a
separately-timed browser run. `PDFDocument.create({ updateMetadata: false })` does **not** suppress this
(confirmed empirically — the dates are still present in the saved output even with that option), so the
fix instead calls `setCreationDate`/`setModificationDate` explicitly with a fixed sentinel (the Unix
epoch) right after creating the merged document. The sentinel carries no meaning — a merge has no real
"creation moment" worth recording — and is deliberately not `ctx.clock()`, which would only reintroduce
the same non-determinism.

**A related trap when verifying this by reading the result back:** `PDFDocument.load()` also defaults
`updateMetadata: true`, so simply loading a just-saved PDF to inspect its dates re-stamps that loaded
copy's own in-memory `ModDate` to the current time as a side effect of the load itself — the *stored
bytes* are unaffected, but a naive `(await PDFDocument.load(bytes)).getModificationDate()` looks wrong
regardless. `merge.test.ts`'s own determinism test loads with `{ updateMetadata: false }` to read the
true stored value.

## `pdf.jpgToPdf@1`: page size and orientation

Each image becomes its own PDF page, sized to that image's own pixel dimensions (1 image pixel = 1 PDF
point) via `doc.addPage([image.width, image.height])` — the same pattern pdf-lib's own documentation
uses for embedding an image. This is deliberately the simplest option: no fit-to-page scaling, cropping,
or margin logic, and no ambiguity about what "fit" means for images of very different aspect ratios.

**Known limitation, disclosed rather than silently wrong:** `pdf-lib`'s JPEG embedder reads only the
image's raw pixel width and height from the JPEG's SOF marker. It does not read or apply the EXIF
`Orientation` tag that many phone cameras write instead of physically rotating the pixel data. A photo
that appears upright in a viewer because of that tag may appear in its raw, unrotated orientation in the
generated PDF. Adding EXIF-aware rotation would also require correctly re-deriving each rotated page's
own width/height and image placement, which is a real source of off-by-one and flipped-axis bugs; given
this tool's scope (a fast, dependency-free browser conversion, not a photo editor), that complexity was
judged not worth it for this version and is called out in the tool's content page instead of hidden.

## A real `pdf-lib` bug found while building `pdf.jpgToPdf@1`: JPEG embedding and `byteOffset`

`pdf-lib`'s `JpegEmbedder.for()` reads a JPEG's SOI marker via `new DataView(imageData.buffer)` — the
*entire* underlying `ArrayBuffer`, ignoring the `Uint8Array` view's own `byteOffset`/`byteLength`. A
`Uint8Array` that is itself a slice of a larger buffer (for example one returned by Node's
small-allocation buffer pool, which is exactly what a naive `fs.readFileSync` of a small JPEG fixture
produces in tests) then has its header read starting at the wrong offset in that larger buffer, and is
rejected with `"SOI not found in JPEG"` even though the image itself is completely valid. Confirmed
empirically: the same bytes, copied into a fresh zero-offset `Uint8Array`, embed successfully with
correct dimensions.

The fix lives entirely on our side (pdf-lib itself is not modified, per this engine's one-dependency
rule): `operation.ts`'s `toEmbeddableJpegBytes()` copies into a fresh `Uint8Array` whenever the input
isn't already a whole, zero-offset buffer, immediately before the `embedJpg` call. Browser `File` reads
via `readFileBytes`/`file.arrayBuffer()` already produce zero-offset buffers, so this only ever does real
work for the odd input that doesn't — it's a defensive, always-correct guard, not a special case for
tests.

## Standing warnings

Every successful merge or conversion carries four standing notices matching its own tool plan — for
`pdf.merge@1`: verify the output, some PDF features may not be preserved, very large/encrypted/corrupted
files may fail, and authorized use only. For `pdf.jpgToPdf@1`: verify the output, very large images or
too many images may fail, image quality and final size depend on the source images, and authorized use
only. `pdf.merge@1`'s warnings were missing from PR 1 (an oversight against the TASK-004A plan, not a
deliberate omission), added in 0.1.1 as a small, additive, disclosed exception to "no merge behavior
change": the merge algorithm, its limits, and every existing output value are unchanged; only the
`warnings` array gained four always-on entries on success.

## Changelog
- 0.2.0 — add (TASK-004C): `pdf.jpgToPdf@1`, combining one or more JPG images into a single PDF, one
  image per page sized to the image's own pixel dimensions. No change to `pdf.merge@1`.
- 0.1.2 — fix (TASK-004B PR 2): `pdf.merge@1` output was not byte-deterministic, because `pdf-lib`
  stamped the merged document's `CreationDate`/`ModDate` with the current wall-clock time by default,
  a behavior `{ updateMetadata: false }` does not suppress. Fixed by setting both dates to a fixed
  sentinel (the Unix epoch) explicitly. Found by the cross-browser determinism suite once a preset made
  this operation part of it; no change to page content, order, or any output field's meaning.
- 0.1.1 — additive (TASK-004B PR 2): four standing warnings added to every successful `pdf.merge@1`
  result (`PDF_MERGE_VERIFY_OUTPUT`, `PDF_MERGE_FEATURES_MAY_NOT_BE_PRESERVED`,
  `PDF_MERGE_LARGE_OR_PROTECTED_MAY_FAIL`, `PDF_MERGE_AUTHORIZED_USE_ONLY`), per the TASK-004A plan. No
  change to the merge algorithm, limits, or any existing output value.
- 0.1.0 — `pdf.merge@1` (TASK-004B PR 1). Foundation only: no preset, manifest, or visible tool. See
  `src/operations/merge/README.md` for the full operation contract.
