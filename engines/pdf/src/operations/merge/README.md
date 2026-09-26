# pdf.merge@1

Combines multiple PDF files into a single PDF, in the order given. This is the whole operation — there
is no page-level reordering within a source file, no compression, and no editing of page content.

## Input

| Field | Type | Rule |
|---|---|---|
| `files` | array of `{ name: string, bytes: Uint8Array }` | The PDFs to merge, in merge order. `name` identifies a file in error details only; it does not affect the merge. |
| `outputFileName` | string, optional | User-entered output name, normalized by `sanitizeOutputFileName` (see below). |

No `params` are needed for this operation's first version — there is nothing to configure beyond the
input itself.

## Output

| Field | Meaning |
|---|---|
| `bytes` | The merged PDF's raw bytes. |
| `fileName` | The normalized output file name (`merged.pdf` by default). |
| `fileCount` | Number of files merged. |
| `totalPageCount` | Total pages across every input file, in the merged document. |

## Validation, in order

1. **File count.** Zero files is `PDF_NO_FILES_SELECTED`; more than 20 is `PDF_TOO_MANY_FILES`.
2. **Per file, in file order:** size over 25 MB is `PDF_FILE_TOO_LARGE`; no `%PDF-` signature within the
   first 1024 bytes is `PDF_INVALID_FILE_TYPE`. Both checks run before any file is parsed.
3. **Combined total** over 75 MB is `PDF_TOTAL_SIZE_EXCEEDED`, checked once every individual file has
   passed its own size and type check.
4. **Per file, while merging:** a file that fails to parse is `PDF_UNREADABLE`; a file that loads but is
   encrypted (`pdfDoc.isEncrypted`) is `PDF_ENCRYPTED_UNSUPPORTED` — see the engine README for why this is
   not detected by catching `pdf-lib`'s `EncryptedPDFError`. Neither case attempts a password.
5. **The merge and save step itself** falls back to `PDF_MERGE_FAILED` for any unexpected failure once
   every input file has already loaded successfully and been confirmed not encrypted.

Every error identifies which file caused it (`path: files.<index>`, `details.name`) except the three that
are not about any one file (`PDF_NO_FILES_SELECTED`, `PDF_TOO_MANY_FILES`, `PDF_TOTAL_SIZE_EXCEEDED`,
`PDF_MERGE_FAILED`).

## Warnings

Every successful result carries four standing notices, unconditionally (`warnings.ts`):
`PDF_MERGE_VERIFY_OUTPUT`, `PDF_MERGE_FEATURES_MAY_NOT_BE_PRESERVED`,
`PDF_MERGE_LARGE_OR_PROTECTED_MAY_FAIL`, `PDF_MERGE_AUTHORIZED_USE_ONLY`.

## Determinism: a fixed creation/modification date

`pdf-lib` stamps a newly created document's `CreationDate`/`ModDate` with the current wall-clock time by
default — not suppressed by `{ updateMetadata: false }`, confirmed empirically. Both are set explicitly
to the Unix epoch right after `PDFDocument.create()` so identical input always produces identical output
bytes; see the engine README for how this was found.

## Output file name normalization

`sanitizeOutputFileName` (in `file-name.ts`) never rejects a custom name — it only cleans one up or falls
back to `merged.pdf`:

1. Trim leading/trailing whitespace.
2. Remove characters unsafe across common filesystems (`\ / : * ? " < > |`) and control characters.
3. Strip a trailing `.pdf`/`.PDF`/etc. (case-insensitive), then re-add a single, lower-case `.pdf`.
4. Fall back to `merged.pdf` if step 3 leaves nothing, or leaves only `.` or `..`.

This is a pure function, tested directly and exhaustively in `merge.test.ts`, independent of any real
merge.

## Why no "usable area" or metadata-preservation options

Merging does not try to reconcile or copy metadata (title, author, etc.) from multiple different source
files into one result — none of it would meaningfully describe the merged document. The output carries
whatever minimal metadata `pdf-lib` sets by default; a tool built on this operation must say plainly that
bookmarks, form fields and metadata from the original files may not be preserved.

## Limits (founder-approved, `limits.ts`)

| Limit | Value |
|---|---|
| Maximum size per file | 25 MB |
| Maximum combined size | 75 MB |
| Maximum number of files | 20 |

These are Phase 1 starting points, stated honestly to the user by any tool built on this operation, and
may be revised after real-world testing — never silently enforced without being shown on the page.

## Fixtures

Binary test PDFs live in `fixtures/files/`, all generated for this engine, not real-world documents:
- `one-page.pdf`, `two-page.pdf` — tiny, valid PDFs built with `pdf-lib` itself (100×100 and 150×150 pages
  respectively, so a unit test can tell merged pages apart by size and confirm order).
- `corrupted.pdf` — `one-page.pdf` truncated to half its length: a valid signature, but unparsable.
- `encrypted.pdf` — `one-page.pdf` encrypted with a user password via `pypdf` (`pdf-lib` cannot write
  encrypted PDFs, so this file could not be generated with the engine's own dependency).
- `not-a-pdf.pdf` — a plain text file, to exercise the file-type check.

The YAML fixtures cover every case that reduces to a scalar comparison (`fileCount`, `totalPageCount`,
`fileName`) or a typed error. Cases that need a structural check on the merged bytes themselves (page
order, a forced save failure) are unit tests in `merge.test.ts` instead, since the fixture format's
`expected` can only assert scalar/subset values, not "page 2 has this size." Size- and count-limit cases
(`PDF_FILE_TOO_LARGE`, `PDF_TOTAL_SIZE_EXCEEDED`, `PDF_TOO_MANY_FILES`) are also unit tests, using small
in-memory byte arrays of the right length rather than committing real oversized PDF files to the repo —
these checks run before any parsing, so the array's content beyond its length and, where relevant, its
signature does not matter.
