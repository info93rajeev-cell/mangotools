# engines/pdf

Browser-first PDF processing. Phase 1 starts with merging multiple PDFs into one. File bytes are the
only "data" this engine touches — no DOM, no `File`/`Blob`, no network, no server upload — selecting
files, drag-and-drop, and downloading the result all belong in `packages/ui`, once a tool exists.

| Operation | Purpose |
|---|---|
| `pdf.merge@1` | Combines multiple PDF files into one, in the order given |

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

## Standing warnings

Every successful merge carries four standing notices — verify the output, some PDF features may not be
preserved, very large/encrypted/corrupted files may fail, and authorized use only — matching the
TASK-004A plan's own PDF Merge tool plan. These were missing from PR 1 (an oversight against that plan,
not a deliberate omission), added here as a small, additive, disclosed exception to "no merge behavior
change": the merge algorithm, its limits, and every existing output value are unchanged; only the
`warnings` array gains four always-on entries on success.

## Changelog
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
