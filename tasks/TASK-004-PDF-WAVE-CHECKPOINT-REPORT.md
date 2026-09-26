# TASK-004 PDF Wave Checkpoint Report

Report date 2026-09-26 · coding agent: Claude (Claude Code, cloud session)

> **Status: checkpoint, wave paused pending founder direction.** TASK-004 opened the PDF & Documents
> category in four PRs, each merged after `pnpm verify`/`pnpm build`/`pnpm test:e2e` passed locally and
> GitHub CI passed on Node 24 with Chromium, Firefox and WebKit. No further PDF tool is started without
> explicit founder approval — see §10.

## 1. Summary

- **TASK-004A** planned the PDF / Document Tools foundation: candidate tools classified by risk and
  complexity, the first-tool recommendation (PDF Merge, then JPG to PDF as a low-risk second tool), all 15
  architecture questions answered, and 8 founder decisions flagged for approval before any code.
- **TASK-004B** added the `pdf.merge@1` engine foundation (PR 1) and the visible **PDF Merge** tool
  (PR 2) — the platform's first file-upload tool, requiring a new UI archetype.
- **TASK-004C** added the visible **JPG to PDF** tool, reusing and generalizing that same archetype for a
  second, differently-shaped file tool.
- **PDF & Documents is now a live category** with two tools, up from zero at the start of this wave.

## 2. Current status

- **Visible tools: 12**
- **Visible categories: 4** — Logistics (4), Business & Finance (3), Developer & Data (3), PDF & Documents (2)
- **PDF & Documents tools:** PDF Merge, JPG to PDF
- **No future PDF tools are exposed.** PDF Compress, PDF Split, PDF Editor, PDF to Image, PDF Metadata
  Remover, PDF Watermark and PDF Page Numbering do not exist as manifests, presets, routes, or links
  anywhere on the site — confirmed by a dedicated e2e test on the category page (see §7).

## 3. PR sequence

| PR | Title | Lane(s) | Head → merged as |
|---|---|---|---|
| [#28](https://github.com/info93rajeev-cell/mangotools/pull/28) | docs(tasks): add TASK-004A PDF tools foundation plan | docs (planning only, no code) | `2091548` → `7df1a05` |
| [#29](https://github.com/info93rajeev-cell/mangotools/pull/29) | feat(engine-pdf): add pdf.merge@1 foundation | engine-pdf (new engine) | `39de557` → `d2070e6` |
| [#30](https://github.com/info93rajeev-cell/mangotools/pull/30) | TASK-004B PR 2: add visible PDF Merge tool | tools, ui (new archetype D), engine-pdf (disclosed fix), platform (binary-JSON codec) | `cc6b843` → `c2414c5` |
| [#31](https://github.com/info93rajeev-cell/mangotools/pull/31) | TASK-004C: add visible JPG to PDF tool | engine-pdf, ui, tools | `ec9a3a8` → `3e340a6` |

All four PRs were opened, reviewed and merged in this order with no reverts, no follow-up hotfixes, and no
out-of-scope tool ever added or exposed.

## 4. Platform foundation added

This wave added infrastructure the platform had none of before, reusable by any future file-based tool:

- **File-tool UI archetype D** (`packages/ui/src/archetypes/`) — the platform's first multi-file,
  binary-output UI pattern. Deliberately bypasses the existing text/boolean-field `ToolStore`/`buildRequest`
  model (which coerces every field to a string and cannot hold `File`/`Uint8Array` data); archetypes A and
  B are untouched. Built once for PDF Merge (PR #30), then generalized for a second tool (PR #31): tool
  wording and output labels moved from hardcoded global strings into `preset.strings`/`preset.outputs` (the
  same mechanism archetypes A/B already use), and a new `preset.ui.fileAccept` field lets each file tool
  declare its own accepted file type.
- **Binary-JSON / JSON-safe binary fixture handling** — `@mangotools/core`'s `toJsonSafe`/`fromJsonSafe`
  (base64-encoded, chunked to avoid call-stack limits) make `Uint8Array` input/output survive the
  determinism suite's JSON boundary (`generated/determinism-fixtures.json`, the Node reference, and the
  browser harness). Generic, not PDF-specific — reusable by any future image/audio/video operation.
- **Deterministic binary output handling** — `pdf-lib` stamps a document's `CreationDate`/`ModDate` with
  the current wall-clock time by default, which `{ updateMetadata: false }` does **not** suppress (confirmed
  empirically, not assumed from documentation). Both operations in this wave set a fixed sentinel date
  (the Unix epoch) explicitly right after document creation, so identical input always produces
  byte-identical output — a real, found-not-assumed defect, first caught by the cross-browser determinism
  suite the moment a preset made `pdf.merge@1` part of it.
- **Browser-first file processing pattern** — every file is read, processed and downloaded entirely on
  the user's device; no upload, no server round-trip, `privacy: { dataClass: public, network: none }` on
  both tools, verified by the shared network-privacy e2e test.
- **File queue / reorder / remove / clear pattern** (`FileDropZone`, `FileQueue`, `useFileTool`) — drag-and-
  drop or click-to-browse multi-file selection, keyboard-operable move-up/move-down/remove, and a clear-all
  action, shared by both tools without duplication.
- **Download helper** — `downloadBytes`/`readFileBytes` (`packages/ui/src/toolkit/actions.ts`), the
  binary counterpart to the existing text download helper archetype A already used.
- **PDF category launch** — `taxonomy/categories.yaml`'s `pdf` category, scaffolded but empty before this
  wave, is now live with real copy, SEO text and an FAQ naming both tools.

## 5. PDF Merge summary

- **What it does:** combines multiple PDF files into one, in the order the user chooses.
- **Browser-first, no upload required:** every file is read and merged in the browser; nothing is sent to
  a server.
- **Deterministic metadata fix:** `setCreationDate`/`setModificationDate` are set to a fixed sentinel (the
  Unix epoch) right after `PDFDocument.create()`, working around `pdf-lib`'s non-suppressible wall-clock
  date stamping.
- **Warnings** on every successful merge: verify the output before sending/printing/filing/publishing;
  bookmarks, forms, annotations, signatures, attachments and layers may not be preserved; very large,
  encrypted, password-protected or corrupted files may fail; authorized use only.
- **Limits:** 25 MB per file, 75 MB combined, up to 20 files.
- **Encrypted/corrupted/password-protected PDF handling:** each is a specific, typed error
  (`PDF_ENCRYPTED_UNSUPPORTED`, `PDF_UNREADABLE`) rather than a generic failure or a silent attempt to
  process the file. No password is ever requested or attempted.

## 6. JPG to PDF summary

- **What it does:** converts one or more JPG/JPEG images into a single PDF.
- **One image per page**, each page sized to that image's own pixel dimensions — no cropping, no
  fit-to-page scaling, the simplest deterministic layout.
- **Preserves selected order:** pages appear in the order the user arranges the image queue, exactly like
  PDF Merge's file queue.
- **Default filename:** `images.pdf`, normalized the same way as PDF Merge's `merged.pdf` (trim, strip
  unsafe characters, single lower-case `.pdf` extension, fall back to the default rather than reject).
- **Limits:** 15 MB per image, 75 MB combined, up to 50 images.
- **Deterministic PDF metadata handling:** the same fixed-sentinel-date fix as PDF Merge.
- **`pdf-lib` JPEG `Uint8Array` offset bug workaround:** `pdf-lib`'s `JpegEmbedder` reads a JPEG's SOI
  marker from the *entire* underlying `ArrayBuffer`, ignoring the `Uint8Array` view's own `byteOffset` —
  so a sliced buffer (for example one from Node's small-allocation buffer pool, which is exactly what a
  plain `fs.readFileSync` of a small JPEG produces) is misread and rejected as invalid even though the
  image itself is fine. Fixed on this platform's side with a defensive zero-offset copy immediately before
  every `embedJpg` call, documented in `engines/pdf/README.md` and the operation's own README. `pdf-lib`
  itself was not modified.
- **Disclosed limitation:** EXIF camera-orientation metadata is not read or applied — images are placed at
  their raw pixel dimensions, so a photo whose upright appearance depends only on that metadata (not on
  the pixels themselves) may appear unrotated on the page. Stated plainly in the tool's content page rather
  than silently producing a surprising result.

## 7. Tests and CI

| Check | PR #29 (engine foundation) | PR #30 (visible PDF Merge) | PR #31 (JPG to PDF) |
|---|---|---|---|
| `pnpm verify` (local) | ✅ 431 tests; 10 tools/10 presets (operation not yet exposed) | ✅ **450 tests**; 11 tools/11 presets/4 visible categories; 197 architecture files, no violations | ✅ **491 tests**; 12 tools/12 presets/4 visible categories; 205 architecture files, no violations |
| `pnpm build` (local) | ✅ 18 pages, unchanged | ✅ **20 pages** | ✅ **21 pages** |
| `pnpm test:e2e` (local, Chromium) | not run — no route existed yet | ✅ **171 passed**, including the cross-browser determinism suite and every new PDF Merge/category test | ✅ Chromium + determinism-chromium **66/66**, a11y+seo **88/88**, screenshots **30/30** (Firefox/WebKit unavailable in this sandbox — missing browser binaries, unrelated to the change) |
| GitHub CI (Node 24; Chromium, Firefox, WebKit) | ✅ [run 36237387261](https://github.com/info93rajeev-cell/mangotools/actions/runs/36237387261), [run 36237404581](https://github.com/info93rajeev-cell/mangotools/actions/runs/36237404581) | ✅ [run 36243176479](https://github.com/info93rajeev-cell/mangotools/actions/runs/36243176479), [run 36243178721](https://github.com/info93rajeev-cell/mangotools/actions/runs/36243178721) | ✅ [run 36247245324](https://github.com/info93rajeev-cell/mangotools/actions/runs/36247245324), [run 36247277656](https://github.com/info93rajeev-cell/mangotools/actions/runs/36247277656) |

GitHub CI passed on every PR before merge, including PR #28 (planning-only, CI unchanged at 403 tests).
No CI failure, flake, or post-merge fix was needed anywhere in this wave.

## 8. Safety / privacy positioning

Both tools, and the PDF & Documents category page, are worded consistently with this platform's
privacy-first positioning:

- **Browser-first**, stated plainly on both tool pages and in their content.
- **No upload required for these tools** — every file is read, processed and downloaded on the user's own
  device.
- **Overclaims avoided by design**, per this wave's own content review: no "100% secure," no "HIPAA
  compliant," no "enterprise-grade privacy," no "works with all files/images," and no claim that this
  platform "never sees" a file beyond what the browser-only architecture itself already guarantees
  (`network: none` in both manifests, checked by the shared network-privacy e2e test on every run).
- **Verify output before use** — both tools carry a standing warning to verify the result before sending,
  printing, filing, or publishing it.
- **User responsibility stated explicitly** — both tools' standing warnings and content state plainly that
  the tool must not be used for documents or images the user is not authorized to process.

## 9. Kept for future, not implemented

Per the founder's roadmap note, these remain candidates only — none were started, and none have a
manifest, preset, engine operation, or route in the codebase:

- **PDF Compress** — higher risk of overpromising; real compression needs image recompression, font
  handling and object optimization, with user expectations that must be controlled carefully.
- **PDF Editor / Simple PDF Editor** — too complex for the current stage; editing, page manipulation,
  annotations, forms, text editing and layout preservation need separate planning.
- **PDF to Image** — needs a PDF renderer library, not just `pdf-lib`; would add heavier dependencies and
  raise browser-performance questions.
- **PDF Metadata Remover** — useful and likely simpler than the above, but lower public search demand than
  JPG to PDF; kept for later.
- **PDF Split** — a still-possible future candidate, not yet planned in detail.
- **PDF Watermark / PDF Page Numbering** — future candidates, not yet planned in detail.

## 10. Recommendation

**Pause PDF tools after this checkpoint.** PDF & Documents now has two tools (Merge, JPG to PDF), matching
the TASK-004A plan's own recommended sequencing exactly, and both share a proven, generalized file-tool
UI foundation. Rather than continuing immediately into a third PDF tool, consider opening the next wave in
one of:

- **Image tools** — resizing, format conversion, background removal or similar, a category this platform
  has scaffolded but not yet built, and a natural next step given the file-tool archetype this wave already
  built and generalized.
- **Quantity Survey / Civil calculators** — a distinct professional user base with no current coverage,
  consistent with this platform's calculator-first categories (Logistics, Business & Finance).
- **One more simple PDF tool** — only if the founder explicitly approves a specific tool from §9 (most
  likely PDF Split or Metadata Remover, the two lowest-risk remaining candidates per the TASK-004A plan's
  own risk classification).

This is a recommendation only. Per this session's standing instructions, no new tool, engine operation, or
task is started without explicit founder direction.
