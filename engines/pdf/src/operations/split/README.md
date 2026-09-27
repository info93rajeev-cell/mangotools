# pdf.split@1

Extracts a page range from a single PDF into a new PDF. This is the whole operation for v1 — one input
file, one contiguous page range, one output file. There is no "split every page into its own file" mode,
no ZIP export, and no batch processing.

## Input

| Field | Type | Rule |
|---|---|---|
| `file` | `{ name: string, bytes: Uint8Array }`, optional | The PDF to split. Optional so a missing file is a normal validation error (`PDF_SPLIT_NO_FILE_SELECTED`), not a schema rejection. |
| `startPage`, `endPage` | number (1-based page numbers) | The inclusive page range to extract, counted the way a person counts pages in a document. Checked (positive integer, `endPage >= startPage`) in `validate.ts`, matching `image.crop@1`'s own hand-typed-numeric-field precedent. Converted to `pdf-lib`'s own 0-based page indices only inside `operation.ts`. |
| `outputFileName` | string, optional | User-entered output name, normalized by the shared `sanitizeOutputFileName` (see `lib/file-name.ts`). |

## Output

| Field | Meaning |
|---|---|
| `bytes` | The extracted pages' raw PDF bytes. |
| `fileName` | The normalized output file name — by default the original file's own base name plus the page range, e.g. `document-pages-3-7.pdf` (see "Output file name" below). |
| `originalFileName` | The source file's own name, echoed so a result view can show it without keeping the file queued. |
| `originalPageCount` | The decoded source PDF's own total page count. |
| `startPage`, `endPage` | Echo the resolved 1-based range, so a result view can show exactly what was extracted. |
| `extractedPageCount` | Always `endPage - startPage + 1` — the exact number of pages copied. |
| `outputFileSize` | The output PDF's byte size. |

## Validation, in order

1. **File presence.** No file is `PDF_SPLIT_NO_FILE_SELECTED`.
2. **Declared type, by signature** (not extension or claimed MIME type): no `%PDF-` signature within the
   first 1024 bytes is `PDF_SPLIT_INVALID_FILE_TYPE` — the same shared check `pdf.merge@1` uses
   (`lib/signature.ts`).
3. **File size** over 25 MB is `PDF_SPLIT_FILE_TOO_LARGE`.
4. **Page range shape:** `startPage` not a positive integer is `PDF_SPLIT_START_PAGE_INVALID`; `endPage`
   not a positive integer is `PDF_SPLIT_END_PAGE_INVALID`; an `endPage` before `startPage` is
   `PDF_SPLIT_RANGE_INVALID`. All three are checked before parsing, since none needs the real page count.
5. **Parse.** A file that looks like a PDF by signature but fails to load is `PDF_SPLIT_UNREADABLE`; a file
   that loads but is encrypted (`pdfDoc.isEncrypted`) is `PDF_SPLIT_ENCRYPTED_UNSUPPORTED` — see the engine
   README for why this is not detected by catching `pdf-lib`'s `EncryptedPDFError`. Neither case attempts a
   password.
6. **Range bounds:** `endPage` beyond the decoded document's own page count is
   `PDF_SPLIT_RANGE_EXCEEDS_PAGE_COUNT`, with the actual page count in the error's `details` so the message
   can state it plainly. Since step 4 already guarantees `endPage >= startPage`, this one check also covers
   a `startPage` beyond the page count (it can never be smaller than an out-of-range `endPage`). A "selected
   range has zero pages" case cannot occur by construction: `startPage` and `endPage` are both positive
   integers with `endPage >= startPage`, so the extracted range always has at least one page.
7. **Copy / save step** falls back to `PDF_SPLIT_FAILED` for any unexpected failure once the source has
   already loaded successfully, been confirmed not encrypted, and passed its range check.

## Extraction behavior

The source is never modified — `startPage`/`endPage` are converted to a 0-based, inclusive index list
(`Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i)`) and copied via
`PDFDocument.copyPages` into a fresh document, in order, exactly once each. `extractedPageCount` is always
`endPage - startPage + 1` by construction, never separately computed from the copy result.

**Determinism.** Same non-suppressible `pdf-lib` date-stamping behavior documented for `pdf.merge@1`: a
fixed sentinel date (`new Date(0)`) is set on the new document immediately after creation, so identical
input always produces identical output bytes — see the engine README's "Determinism" section for how this
was originally found.

**Feature preservation.** Same caveat as `pdf.merge@1`: bookmarks, form fields, annotations, and other
document-level features from the source are not specially reconciled into the extracted document — only
the requested pages' own content is copied.

## Output file name

Two pieces work together:

1. **`defaultSplitFileName`** (local to this operation, `file-name.ts`) computes what to fall back to: the
   original file's own base name (extension stripped, unsafe characters removed) plus the page range, e.g.
   `document-pages-3-7.pdf`. This is a genuinely new naming shape — unlike `pdf.merge@1`'s/
   `pdf.jpgToPdf@1`'s own fixed `merged.pdf`/`images.pdf` defaults, which don't derive from any input
   file's name — so it is not part of the shared `lib/file-name.ts`.
2. **`sanitizeOutputFileName`** (shared, `lib/file-name.ts`) does the actual user-override-or-fallback work
   unchanged: a user-entered name is trimmed, stripped of unsafe characters, and given a normalized `.pdf`
   extension; anything that leaves nothing usable falls back to the computed default from step 1.

## Limits (founder-approved, `limits.ts`)

| Limit | Value |
|---|---|
| Maximum file size | 25 MB |

Split works on a single PDF, so — unlike `pdf.merge@1`/`pdf.jpgToPdf@1` — there is no file-count or
combined-total-size limit to define.

## Fixtures

Binary test PDFs live in `fixtures/files/`:
- `five-page.pdf` — five blank 100×100 pages, generated with `pdf-lib` itself for this fixture, enough
  pages to distinguish "first," "middle," "last," and "full range" extractions by page count alone.
- `not-a-pdf.pdf`, `corrupted.pdf`, `encrypted.pdf` — copied unchanged from `pdf.merge@1`'s own fixtures,
  since the same three underlying files exercise the identical file-type/parse/encryption checks here.

The YAML fixtures cover every case that reduces to a scalar comparison (`fileName`, page counts) or a typed
error. Cases that need a structural check on the extracted bytes themselves (actual page count via
`PDFDocument.load`, a forced save failure, byte-for-byte determinism) are unit tests in `split.test.ts`
instead, since the fixture format's `expected` can only assert scalar/subset values.
