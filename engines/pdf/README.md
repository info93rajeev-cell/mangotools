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

## Determinism note for the eventual tool PR

`pdf.merge@1`'s fixtures are not yet part of the cross-browser determinism suite
(`tests/determinism/determinism.spec.ts`): that suite only includes fixtures for engines with at least
one preset (`scripts/generate/pipeline.ts`'s `determinismCases`), and this engine has none yet. Once a
preset exists, `generated/determinism-fixtures.json` will need its `Uint8Array` fixture input and output
made JSON-safe (for example base64-encoded and decoded back on both sides of the comparison) before that
suite can include this operation — flagged here so it is not discovered as a surprise in the tool PR.
Manual testing (`merge.test.ts`'s "gives the same bytes for the same input, run twice") confirms
`pdf-lib`'s `save()` is byte-identical for identical input within a single Node process; this has not
yet been confirmed across Chromium, Firefox and WebKit.

## Changelog
- 0.1.0 — `pdf.merge@1` (TASK-004B PR 1). Foundation only: no preset, manifest, or visible tool. See
  `src/operations/merge/README.md` for the full operation contract.
