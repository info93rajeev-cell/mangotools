# TASK-004A — PDF / Document Tools Foundation (plan only)

> **Planning document. No code has been written, no schema, engine, preset, manifest or content file has
> been created, no dependency added, and no existing tool has been touched.** This plans the first wave
> of PDF/Document tools, the fifth category to gain tools after Developer & Data, Business & Finance,
> Logistics, and (per this plan's recommendation) ahead of Media & Images and Privacy & Compliance. It
> also refines the original Phase 1 build plan's own `TASK-004` slot (`docs/phase-1/PHASE-1-BUILD-PLAN.md`
> §4/§14/§15: PDF engine, archetype D, 7 tools) into the same per-tool, plan → PR → PR → report lifecycle
> this session has used for every tool since TASK-002.

## Context

- **Current platform:** 10 live tools — Developer & Data (3: JSON Formatter, Base64, URL Encode/Decode),
  Business & Finance (3: GST, Profit Margin, Markup), Logistics (4: CBM, Volumetric Weight, Container
  Loading, Pallet Loading). TASK-003D is fully closed.
- **Taxonomy already scaffolds a `pdf` category** (`taxonomy/categories.yaml`, id/slug `pdf`, name
  "Documents & PDF", icon `file-text`, order 70) with no tools yet — this plan fills it, not creates it.
- `site.config.yaml`'s `navigation.minToolsPerCategory` is currently **1** ("set to 3 before public
  launch"), so the first PDF tool will make "Documents & PDF" **immediately visible** in navigation, All
  Tools, and the homepage with just one tool. This is expected under the current config, not a bug — flagged
  for founder awareness in §7 and §15.
- **Target public direction:** MangoTools / "Beyond the AI Tools" — professional tools for work that
  should not depend on AI. PDF tools must be deterministic, browser-first where practical, privacy-safe,
  and honest about limits, exactly like every tool shipped so far.

## Why this planning task exists

PDF tools are a real step up in risk from every tool built so far. Every existing engine
(`numeric`, `data`, `estimate`, `logistics`) operates on plain text/decimal input the user types — nothing
is ever *un-parseable*, there is no such thing as a "corrupted GST rate." PDF tools take an arbitrary,
possibly-hostile binary file the user did not author, and must:

- handle real file I/O (selection, drag-and-drop, binary read) — a genuinely new UI surface, not just a
  new preset;
- work within browser memory limits, since Phase 1 has no server or chunked/streaming engine
  (`docs/phase-1/PHASE-1-BUILD-PLAN.md` §3: "Large-file streaming engine (1–5 GB) — M3, Phase 1 uses
  honest in-memory limits");
- get download behaviour right (binary `Blob`, not the existing `downloadText` string helper);
- make privacy/no-upload claims that must be literally true, not just implied;
- fail cleanly and specifically on large, corrupted, or encrypted/password-protected files, instead of
  hanging the tab or showing a generic error;
- set up shared infrastructure (a new UI archetype, a new engine, a fixture strategy for binary input)
  that every future split/compress/watermark/editor tool will build on — get this wrong once, and every
  later PDF tool inherits the mistake;
- choose a client-side library with the right licence and the right capabilities, without over- or
  under-buying (a library that renders pages is a different, heavier thing than one that only edits PDF
  structure — see §5, question 11).

This is why a planning document comes before any code, exactly as it did for TASK-003A–D.

## 1. Plan scope — candidate tools, classified

| # | Tool | Class | Why |
|---|---|---|---|
| 1 | **PDF Merge** | **Medium** | Must *parse* arbitrary existing PDFs (the riskiest new surface — encrypted, corrupted, malformed structure all show up here), copy pages into a new document, and build the full multi-file UI (queue, reorder, remove, download) from nothing. No rendering, no compression, no image codec work. |
| 2 | **PDF Split** | **Medium** | Same PDF-parsing risk as Merge (one input file, but still an arbitrary existing PDF), **plus** a harder output-side problem Merge doesn't have: the result is *multiple* files, which needs either a zip dependency (a new dependency to evaluate) or an awkward one-at-a-time download flow. Net: same input risk as Merge, worse output complexity. |
| 3 | **PDF Compress** | **Complex** | "Compress" implies a guaranteed size reduction the underlying library may not actually deliver — `pdf-lib` (§5 Q11) does not do real image recompression, font subsetting, or stream optimisation. A first attempt here risks a visible, embarrassing failure mode ("my file got bigger"), not just an engineering risk. Needs its own investigation into what a *client-side, deterministic, honest* PDF compression tool can promise before it is even planned as a tool. |
| 4 | **JPG to PDF** | **Simple–Medium** | Needs the *same* full multi-file UI as Merge (add, reorder, remove images, download), but the input side is far safer: `pdf-lib`'s `embedJpg`/`embedPng` are simple, well-understood primitives, and a bad image just fails to decode — there is no encrypted-JPG or malformed-JPG-structure analogue to an encrypted or corrupted PDF. No existing-PDF parsing at all. |
| 5 | **PDF to Image** | **Complex** | `pdf-lib` cannot rasterise a page to an image — this needs a genuine PDF *renderer* (`pdf.js` or similar), a materially heavier and different dependency from anything else in this wave, plus canvas-based rendering and multi-image output packaging (same output problem as Split). Best treated as its own, later investigation, not part of the first wave. |
| 6 | **PDF Watermark** | **Medium** | Parses an existing PDF (Merge/Split's input risk), then draws text (and optionally an image) on every page — needs font embedding and per-page content-stream editing, which `pdf-lib` supports directly. Single file in, single file out; no reorder UI needed. |
| 7 | **PDF Page Numbering** | **Simple–Medium** | The same per-page text-drawing mechanism as Watermark, with a much smaller options surface (position, starting number, format) and no image overlay. Meaningfully simpler than Watermark once the drawing primitive exists. |
| 8 | **PDF Metadata Remover** | **Simple** | The lowest engineering risk of the whole list: one file in, one file out, no visual drawing, no font embedding, no multi-file UI at all — just clearing the info dictionary/XMP metadata `pdf-lib` already exposes. Belongs in **Privacy & Compliance**, not Documents & PDF, matching the original Phase 1 plan's own placement (§4 there: `pdf-metadata-remover` → category `privacy-tools`). |
| 9 | **Simple PDF Editor / Organiser** | **Complex (later)** | Needs page thumbnails (a renderer, like PDF to Image), drag-reorder *within* one document, delete/rotate/insert pages — strictly more UI and engine surface than every tool above combined. Explicitly a later-wave tool, not part of this foundation. |

## 2. First tool recommendation

The founder's expected first tool is **PDF Merge**. This plan checks that against PDF Split, JPG to PDF,
PDF Compress, and Metadata Remover, on the two axes that actually matter for a first PDF tool: **engineering
risk** (can it fail badly or unpredictably) and **infrastructure value** (does building it also build the
foundation every later PDF tool needs).

| Tool | Must parse an existing PDF? | New UI surface built? | Output complexity | Search demand |
|---|---|---|---|---|
| **PDF Merge** | Yes — full risk (encrypted, corrupted, malformed) | Full archetype D (queue, reorder, remove, download) | One file out — simplest possible | Very high ("merge pdf", "combine pdf") |
| PDF Split | Yes — same risk as Merge | Partial (single file in; still needs a page-range or "split every N" control) | **Harder than Merge** — multiple files out, likely a zip dependency | High |
| JPG to PDF | **No** — inputs are images, not existing PDFs; no encrypted/corrupted-PDF analogue | Full archetype D, same as Merge | One file out — simplest possible | High ("jpg to pdf") |
| PDF Compress | Yes — same risk as Merge | Minimal (single file) | One file out, but the *result itself* can disappoint (§1) | High, but see risk below |
| Metadata Remover | Yes — same parsing risk as Merge, but the least a tool can do with it | **None** — single-file in/out, no queue, no reorder, no drag-and-drop of multiple files | One file out — simplest possible | Lower ("remove pdf metadata") |

**Honest finding:** Metadata Remover is the single lowest-risk tool to *build*, but it teaches the platform
almost nothing about the multi-file UI (archetype D) that Merge, Split, JPG to PDF, and the eventual PDF
Organiser all need — and it still carries the same "parse an arbitrary existing PDF" risk as Merge, just
with a smaller blast radius if something goes wrong. It does not avoid the hard problem, it just does less
with it. JPG to PDF is the tool that most cleanly *isolates* archetype D from the PDF-parsing risk — it
builds the exact same file-queue/reorder/download UI as Merge with none of the encrypted/corrupted/malformed
PDF exposure, because its inputs are images. PDF Split is strictly harder than Merge on both axes (same
input risk, harder output). PDF Compress is the correct **Complex** classification and a poor first choice
regardless — the risk there is reputational (a tool named "Compress" that doesn't reliably compress), not
just technical.

**Recommendation: confirm PDF Merge as the first tool**, for three reasons that outweigh the alternative:
it has the highest search demand and clearest "flagship" positioning of anything in this list; it forces
the platform to solve the encrypted/corrupted/malformed-PDF problem *now*, properly, with real tests —
and every other PDF tool in this wave (Split, Watermark, Page Numbering, Metadata Remover) needs that exact
same problem solved regardless of which tool ships first, so deferring it only delays proving it works; and
it builds the complete multi-file UI foundation in one pass. **JPG to PDF is recommended as the strong,
low-risk second tool** in this same wave — not instead of Merge, but immediately after it — because it
reuses 100% of archetype D with close to none of Merge's parsing risk, and gives an early, cheap way to
confirm the shared UI foundation is solid before Split, Watermark, and the rest build on it. This sequencing
question is Founder Decision 1 in §11.

## 3. Architecture questions

**1. Should PDF processing be browser-only for the first wave?**
Yes. No `apps/api` exists in Phase 1 (`AGENTS.md` Phase 1 notes: `apps/api` deliberately not created), and
server-side processing would break the platform's whole privacy-first positioning for its first
file-handling category. Everything happens in the browser, in a Web Worker.

**2. What should be the maximum default file size?**
Recommend **30 MB per PDF file**, and **a 150 MB combined total** for a multi-file merge. Rationale: the
platform's one existing file-size precedent, `MAX_FILE_BYTES` in `packages/ui/src/toolkit/actions.ts`, caps
text-file reads at 50 MB — but a PDF held by `pdf-lib` is parsed into an in-memory object graph that can be
several times the raw byte size, and a merge holds *every* input buffer plus the output buffer
simultaneously, so a lower per-file cap and an explicit combined cap are both needed to keep worst-case
memory bounded and the tab responsive. Both limits must be **stated on the page**, not silently enforced
(Phase 1 build plan §16: "File tools state their size limit honestly and fail gracefully above it").

**3. Should we process multiple files entirely in browser memory?**
Yes, for Phase 1 — there is no alternative yet (`docs/phase-1/PHASE-1-BUILD-PLAN.md` §3 explicitly defers a
streaming engine to M3). All queued files are held as `Uint8Array` in memory, the merge itself runs in a Web
Worker so the main thread stays responsive, and buffers are released once the result is produced or the
queue is cleared.

**4. How should we handle encrypted PDFs?**
`pdf-lib`'s `PDFDocument.load` fails (or requires an explicit `ignoreEncryption` flag that does not actually
decrypt) on an encrypted file. Phase 1 does **not** attempt password entry or decryption. Detect the load
failure's specific cause and return a dedicated typed error (`PDF_ENCRYPTED_UNSUPPORTED`) with copy that
says plainly the file is password-protected and cannot be processed here — never a generic "merge failed."

**5. How should we handle corrupted PDFs?**
Also a `PDFDocument.load` failure, but a different cause (malformed structure, truncated file, not a PDF at
all despite the extension). Return a distinct typed error (`PDF_UNREADABLE`) with copy like "This file could
not be read as a PDF" — the two failure modes (encrypted vs. corrupted) must not share one vague message,
so the user knows whether the problem is a password or a broken file.

**6. How should we handle password-protected PDFs?**
Identical treatment to encrypted PDFs (§ Q4) — in the PDF specification, "password-protected" and
"encrypted" are the same underlying mechanism (an owner and/or user password gates access). No
password-entry UI, no decryption library, in this wave. This is stated explicitly as out of scope in §9.

**7. Should we ever upload files to a server in Phase 1?**
No. Never. This is a hard product commitment, not a per-tool choice — PDF tools must not become the first
exception to a platform-wide promise every existing tool already keeps.

**8/9. Safe wording, and wording to avoid** — see §6 (Privacy / Trust), which answers both in full with
exact copy.

**10. Should we create a new PDF engine package or put logic in existing app code?**
**A new engine, `engines/pdf`**, following the exact structure of `engines/logistics` — this is also where
the original Phase 1 plan already reserved it (`docs/phase-1/PHASE-1-BUILD-PLAN.md` §5's folder tree lists
`engines/pdf/ # TASK-004`). One important nuance, new to this wave: a PDF operation's input/output is
**binary data** (`Uint8Array`), not the decimal strings every existing engine uses — but a `Uint8Array` is
plain data, not a DOM or browser API, so an operation that takes bytes in and returns bytes out is still a
**pure** engine per AGENTS.md rule 2 (no DOM, no network, no `Date`/`Math.random`). What must **not** go in
the engine is file *selection*: drag-and-drop, the `<input type="file">` element, the reorder list, and
triggering a download are all DOM/browser concerns that belong in `packages/ui`'s new archetype D, not in
`engines/pdf`. The engine's contract stays exactly as narrow as every other operation: bytes and params in,
bytes and stats out, typed errors, no throws for bad user input.

**11. Which PDF library approach is best for deterministic client-side PDF Merge?**
Recommend **`pdf-lib`** (MIT licence — compliant with AGENTS.md rule 7; pure JavaScript/TypeScript, no WASM
or native binary; already the library named in the original Phase 1 plan for this exact task). It supports
loading a PDF, copying pages between documents (`copyPages`), embedding JPG/PNG images, drawing text with
its bundled standard fonts, and saving — sufficient for Merge, JPG to PDF, Watermark, Page Numbering, and
Metadata Remover. It explicitly does **not** rasterise pages to images (ruling it out, alone, for PDF to
Image) and does not perform real stream/image compression (confirming why Compress needs separate
investigation, not reuse of `pdf-lib` alone). As a new dependency, it needs a `risk:dependency`-labelled
issue and founder approval before it is added, per AGENTS.md rule 7 — this is Founder Decision 3.

**12. How should generated PDFs be named?**
A sensible default (`merged.pdf`) that the user can edit before downloading — the founder's own PDF Merge
input list already includes an output-file-name field. The entered name must be sanitised before it becomes
a real filesystem download name (strip path separators, force a `.pdf` extension), the same discipline
`downloadText`'s callers already apply implicitly by using a fixed `outputFileName` from the preset.

**13. Should we preserve original metadata?**
For Merge specifically: **no** — do not try to reconcile or copy metadata (title, author, etc.) from
multiple different source files into one merged document, since none of it meaningfully describes the
result. Set minimal, honest metadata on the output (no fabricated author, a neutral producer string, a
current creation date) and state plainly in content that "metadata, bookmarks and form fields from the
original files may not be preserved." Tools that edit a *single* existing PDF in place (Watermark, Page
Numbering) should preserve its existing metadata by default, since there is exactly one source to preserve.

**14. Should metadata stripping be a separate explicit tool?**
Yes — keep **PDF Metadata Remover** as its own tool in **Privacy & Compliance**, matching the original
Phase 1 plan's own category placement (not `pdf`) and this platform's existing positioning of metadata
removal as a privacy action distinct from any content-editing tool. Do not bundle a metadata-stripping
option onto every other PDF tool as a side effect.

**15. What tests are required before public launch?**
- **Engine (Vitest):** golden fixtures for valid merges (2+ files, varying page counts, a single-file
  degenerate case); dedicated cases for encrypted, corrupted, 0-byte, and non-PDF (wrong magic bytes) input;
  a case at and just above the stated size limit; determinism across Node, Chromium, Firefox and WebKit
  (this platform's existing determinism suite, extended to binary output — see §7's fixture strategy for
  the format question this raises).
- **Playwright/e2e:** drag-and-drop selection, click-to-browse fallback, add/remove/reorder files, download
  triggers and produces the expected file, the standard shared suites (axe light/dark/empty/result, SEO,
  screenshots, network recorder confirming zero requests) extended to cover the new archetype.
- **Accessibility:** keyboard-only path through the entire file queue (add, reorder, remove) — not
  drag-and-drop only.
- **Manual, per the Phase 1 plan's own checklist** (§17/`docs/phase-1/manual-test.md`): a real
  password-protected PDF, a real corrupted PDF, a large real-world multi-page PDF, on an actual Android
  phone and a laptop.

## 4. PR speed rule

Adopting the founder's rule with one honest addition. The founder's instruction: *"First foundation/tool
may need 2 PRs: PR 1 foundation/engine, PR 2 first visible tool."* Investigating the codebase (§3 Q10)
found that **"foundation" cannot mean the engine alone** — `packages/ui` has no archetype for multiple
binary file inputs, a reorderable queue, or a binary download yet (only archetype A, text transform, and
archetype B, calculator, exist; C, D and E are reserved names in the schema with no implementation). The
original Phase 1 plan itself treats this as real, separate scoped work: *"P1-27 | Archetype D (DropZone,
FileQueue, limits, downloads) | ui | M | 004"*. Without it, no PDF tool can be shown at all, regardless of
how complete the engine is.

**Recommendation: read the founder's "PR 1: PDF foundation / engine" as covering both `engines/pdf` and the
new archetype D in `packages/ui`**, since neither is independently useful or visible without the other, and
neither is a "tool" — this keeps the founder's literal 2-PR count while being honest about what "foundation"
actually requires:

| PR | Lane(s) | Content | Visible to users? |
|---|---|---|---|
| **PR 1 — Foundation** | `engine-pdf` + `ui` | `engines/pdf` (`pdf.merge@1`), and archetype D in `packages/ui` (drop zone, file queue, reorder controls, binary download action) | No — no preset uses either yet |
| **PR 2 — First tool** | `tools` | Preset `pdf/merge`, tool `pdf-merge` (manifest, content, fixtures), taxonomy/site updates needed to expose the `pdf` category | Yes |

This is a deliberate, disclosed exception to "one lane per PR" (AGENTS.md rule 1), justified the same way
this plan justifies it to itself: archetype D has no use anywhere else in the codebase, so it is foundation,
not a second feature, and bundling it with the engine in one non-visible PR is safer than trying to
half-build a UI archetype with no real tool to prove it against. **If the founder prefers strict lane
separation instead, the alternative is 3 PRs** (engine → archetype D → first tool) — slower, but each PR
touches exactly one lane. This is Founder Decision 2.

After this foundation:
- **Small PDF tools can be one PR each** once archetype D exists and is proven (for example Page Numbering,
  Metadata Remover, once their own small operation is added) — the same "operation + preset + tool in one
  PR" allowance already available to any T3/T4 tool that needs no new engine capability.
- **Complex PDF tools need their own plan or engine PR first** (PDF Split's zip/output-packaging question,
  PDF Compress's realistic-promise question, PDF to Image's renderer-library question) — none of these are
  scoped by this plan.
- **No separate report PR for every PDF tool.** One wave report is written after several PDF tools are
  complete, not after each one — a deliberate change from the Logistics wave's per-tool report cadence,
  matching the founder's own instruction here.

## 5. Foundation design

- **Package location:** `engines/pdf/` — `package.json`, `src/index.ts`, `src/errors.ts`,
  `src/operations/merge/` (`schema.ts`, `operation.ts`, `README.md`, `merge.test.ts`, `fixtures/`),
  mirroring `engines/logistics`'s own layout exactly.
- **Engine/operation naming:** `pdf.merge@1` — matches the operation id the original Phase 1 plan already
  named, and this codebase's `<engine>.<subject>.<verb>@<major>` convention (`logistics.pallet.fit@1`,
  `data.base64.transform@1`).
- **Preset naming:** `presets/pdf/merge.yaml` — one folder per engine, matching `presets/logistics/pallet.yaml`.
- **Manifest category:** `pdf` (already scaffolded in `taxonomy/categories.yaml`, name "Documents & PDF").
  Tool slug `pdf-merge` (a shorter, plainer pattern than the Logistics tools' longer
  `-loading-calculator` names, since "PDF Merge" is already the natural search phrase without a suffix).
- **Content structure:** the same five whitelisted headings every tool uses (`## How to use`, `## Method`,
  `## Worked example`, `## FAQ`, `## References`) — a custom heading is rejected at `pnpm gen`, so any topic
  not in that list (privacy explanation, limitations) is prose inside `## Method`, exactly as every
  Logistics tool's content is structured.
- **Fixture strategy — the one genuinely new problem this wave introduces.** Every existing fixture is a
  YAML file with plain-value `input`/`expected` fields; a PDF fixture's *input* is a binary file, which does
  not fit that shape well as an inline value. Recommend: small, deterministically-generated,
  minimal-content PDFs (single or few pages, no fonts beyond a standard one, built by a one-off script, not
  hand-authored) checked in as real `.pdf` files under each operation's `fixtures/` folder, with the YAML
  fixture referencing them by relative path (for example `input: { files: ['two-page.pdf', 'one-page.pdf'] }`)
  rather than inlining base64 bytes. This needs a small, additive change to the fixture schema
  (`schemas/src/fixture.ts`) to support a file-path-reference input alongside plain values — flagged as
  Founder Decision 4, since it is a platform-lane schema change, not a PDF-lane one, and should be scoped
  and approved on its own before PR 1 rather than discovered mid-PR.
- **Playwright/e2e coverage:** drag-and-drop (Playwright can dispatch real drop events, or use
  `setInputFiles` on the underlying `<input>` for the click-to-browse path), add/remove/reorder, download
  verification via `page.waitForEvent('download')`, and the shared suites (network, axe, SEO, screenshots)
  extended the same way every prior tool extended them.
- **Accessibility requirements:** the file queue must be operable by keyboard alone — explicit move-up/
  move-down (or drag-handle-with-keyboard-equivalent) controls, not drag-only reordering; every row needs an
  accessible name (file name, size, a labelled remove button); additions/removals/reorders should be
  announced via a live region; the drop zone must always have a real `<input type="file" multiple>` behind
  it as a non-drag fallback.
- **File input behaviour:** `<input type="file" multiple accept="application/pdf">` plus the drop zone;
  validate both extension and magic bytes (`%PDF-`) before attempting to parse, so a renamed non-PDF file
  fails fast with a specific, useful message instead of a confusing engine error.
- **Drag-and-drop behaviour:** a drop **appends** to the existing queue (it does not replace it) unless the
  user clears it first; a mixed valid/invalid drop keeps the valid files queued and shows a specific,
  inline error for each rejected one, rather than blocking the whole action.
- **Ordering/reordering for merge:** explicit, keyboard-operable controls (§ a11y above); the operation's
  input is simply "these PDFs, in this order" — the array order *is* the merge order, no separate `order`
  parameter needed.
- **Download behaviour:** a new `downloadBytes` helper in `packages/ui/src/toolkit/actions.ts`, parallel to
  the existing `downloadText` (`Blob` + `URL.createObjectURL` + a temporary `<a download>`, revoked after
  use) — the existing pattern extended to binary content, not a new mechanism.
- **Browser support:** the same three engines already tested (Chromium, Firefox, WebKit) — `pdf-lib` is
  pure JS with no browser-specific APIs beyond `Uint8Array`/`Blob`, so no special-casing is expected, but
  this should be explicitly confirmed by the determinism suite rather than assumed.
- **Memory/performance warnings:** warn in the UI as the queued total approaches the stated cap (§3 Q2);
  run the actual merge in a Web Worker so a large operation does not freeze the tab (matching the existing
  `runtimes: ['worker', 'node']` pattern every operation already declares); catch an out-of-memory or
  worker failure and surface a specific, honest error rather than a silent hang or a crashed tab.

## 6. Privacy / trust

**Safe wording** (used throughout the UI and content, matching the founder's own examples):
- "Files are processed in your browser where supported."
- "No file upload is required for this tool."
- "Do not use this tool for documents you are not allowed to process."
- "Very large or encrypted PDFs may fail in the browser."
- "Files up to 30 MB each are supported; larger files may not process reliably in every browser."
  (grounded in the actual stated limit, §3 Q2)
- "This tool does not preserve bookmarks, form fields, or all metadata from the original files."
  (grounded in §3 Q13's actual behaviour)

**Wording to avoid** (the founder's list, plus a few more grounded in what this plan can and cannot prove):
- "100% secure"
- "HIPAA compliant"
- "enterprise-grade privacy"
- "we never see your files" — unless the architecture fully proves it (no network call exists in this
  design, so a more precise, provable claim — "processed in your browser" plus the network-recorder test
  in CI — is preferred over a blanket promise)
- "works with all PDFs"
- "military-grade" / "bank-level" anything
- "guaranteed" (results, compatibility, or fit)
- "unlimited" (real size limits exist and are stated)
- "compatible with every PDF reader" (output fidelity depends on `pdf-lib`'s generated PDF structure, which
  cannot be claimed to work in literally every reader in existence)

## 7. PDF Merge tool plan

**Inputs:**
- multiple PDF files (drag-and-drop or click-to-browse, `<input type="file" multiple accept="application/pdf">`)
- reorder files (keyboard-operable move controls, §5)
- remove a selected file
- clear all
- output file name (default `merged.pdf`, editable, sanitised before download — §3 Q12)

**Outputs:**
- merged PDF download — primary result
- number of files merged — secondary
- total input pages, if feasible to compute cheaply (page count is available from each loaded document
  without a full merge, so this is low-cost to show)
- final file size, if feasible (`Blob.size` after the merge completes)

**Errors** (typed, specific, never a single generic "merge failed"):
| Code | Meaning |
|---|---|
| `PDF_NO_FILES_SELECTED` | merge attempted with an empty queue |
| `PDF_INVALID_FILE_TYPE` | a queued file is not a PDF (extension or magic-byte check failed) |
| `PDF_FILE_TOO_LARGE` | a file exceeds the stated per-file limit (§3 Q2) |
| `PDF_TOTAL_SIZE_EXCEEDED` | the combined queue exceeds the stated total limit |
| `PDF_ENCRYPTED_UNSUPPORTED` | a queued file is password-protected/encrypted (§3 Q4/Q6) |
| `PDF_UNREADABLE` | a queued file is corrupted or malformed (§3 Q5) |
| `PDF_MEMORY_LIMIT_EXCEEDED` | the browser ran out of memory during processing |
| `PDF_MERGE_FAILED` | a catch-all for an unexpected failure during the actual merge step, after every file individually loaded successfully |

**Warnings** (shown on every successful result):
- verify the output before sending it anywhere important
- bookmarks, form fields, and some advanced PDF features may not be preserved (§3 Q13)
- very large files may fail to process in some browsers, even under the stated limit

**Out of scope (first version):** OCR · PDF editing · compression · page-level reordering inside a single
input PDF · cloud storage · login · subscription · server upload · AI summary · e-signature · a legally
binding document workflow · password entry/decryption · any change to an existing tool, engine, or category
other than exposing the new `pdf` category.

## 8. SEO / content

Content sections (the five-heading whitelist, §5): what PDF Merge means and what it does not guarantee
(bookmarks/forms/metadata caveat); how the browser-only merge works and why nothing is uploaded; how to
use it; the formulas/behaviour (order = merge order, page counts, size limits); a worked example (for
example, "combine a 3-page cover letter and a 12-page report into one 15-page PDF"); the standing warnings
from §7; FAQs (what happens to bookmarks/forms, what the size limit is and why, what happens with an
encrypted file, whether files are uploaded, how output naming works, the difference from a PDF editor);
references (the library and standards this tool is built on, once §3 Q11's dependency is approved).

**Search synonyms** (founder's list): merge PDF, combine PDF, PDF joiner, combine PDF files, merge PDF
online, browser PDF merger, no upload PDF merge.

**SEO metadata:** title containing "PDF Merge" or "Merge PDF" (30–60 characters); description 120–160
characters using only the approved wording from §6.

## 9. Related links

**Recommendation: no related links in v1.** PDF Merge would be the *only* tool in the `pdf` category at
launch — there is no sibling PDF tool yet to link to, and none of the existing Logistics/Business/Developer
tools are topically related enough to justify a cross-category link (the same reasoning that kept every
prior category's related links within its own category). Per the founder's own instruction and this
platform's existing, repeated precedent (declined in every prior planning document that raised it —
TASK-003B §13, TASK-003C §15), **do not** link to Split, Watermark, Page Numbering, or any other tool that
does not exist yet, and **do not** build a "coming soon" page or hidden routing for future tools — nothing
in the current architecture supports it, and it is not requested anywhere in the approved Phase 1 scope.
Related links should be added, reciprocally, once a second PDF tool (recommended: JPG to PDF, §2) actually
exists.

## 10. Deliverable and PR speed for this planning task

This PR adds **only** `tasks/TASK-004A-PDF-TOOLS-FOUNDATION-PLANNER.md`. No engine, no dependency, no
preset, manifest, content, or code of any kind. `pnpm verify` is expected to pass unchanged (no tools,
presets, or fixtures added or modified). One PR, opened after `pnpm verify` passes.

## 11. Founder decisions needed

No code will be written until these are answered. Recommendations are marked ★.

1. **First tool and sequencing:** ☐ **PDF Merge first, JPG to PDF recommended as tool 2 immediately after**
   ★ (§2) ☐ PDF Merge only, sequencing for later tools decided separately ☐ a different first tool
2. **PR split for the foundation:** ☐ **2 PRs — PR 1 covers both `engines/pdf` and the new archetype D
   together as "foundation," PR 2 is the first visible tool** ★ (§4) ☐ 3 PRs, strict one-lane-per-PR
   (engine → archetype D → tool)
3. **PDF library:** ☐ **approve `pdf-lib` (MIT) as a new dependency, with a `risk:dependency`-labelled
   issue per AGENTS.md rule 7** ★ (§3 Q11) ☐ founder wants a different library evaluated first
4. **Fixture schema change for binary input:** ☐ **approve a small, additive change to
   `schemas/src/fixture.ts` to support file-path-referenced binary fixture input, scoped and reviewed
   before PR 1** ★ (§5) ☐ founder wants a different fixture approach (for example inline base64) evaluated
   first
5. **File size limits:** ☐ **30 MB per file / 150 MB combined** ★ (§3 Q2) ☐ founder supplies different
   limits
6. **Output file naming default:** ☐ **`merged.pdf`, editable and sanitised** ★ (§3 Q12) ☐ a different
   default
7. **Metadata Remover's category:** ☐ **Privacy & Compliance, matching the original Phase 1 plan** ★ (§3
   Q14) ☐ Documents & PDF instead
8. **Exposing the `pdf` category at 1 tool:** ☐ **proceed — `navigation.minToolsPerCategory` is currently 1,
   so this is consistent with the current site config** ★ ☐ founder wants the category held back (for
   example by temporarily raising the threshold, or building 2 tools before merging PR 2) until more than
   one PDF tool exists

## 12. Acceptance checklist (for the eventual PRs — nothing here is done yet)

**PR 1 — Foundation (`engines/pdf` + archetype D, per Founder Decision 2)**
- [ ] `pdf.merge@1` added to a new `engines/pdf`; architecture check green; `pdf-lib` added as an approved,
      `risk:dependency`-labelled dependency (Founder Decision 3)
- [ ] Encrypted, corrupted, 0-byte, non-PDF, and over-limit inputs each return their own specific typed
      error (§3 Q4/Q5, §7's table) — nothing throws for bad user input
- [ ] Fixture schema change (Founder Decision 4) merged and reviewed on its own footing, not discovered
      mid-PR
- [ ] Binary-file fixtures pass in Node, Chromium, Firefox and WebKit (determinism)
- [ ] Archetype D in `packages/ui`: drop zone, keyboard-operable file queue with reorder/remove, a
      `downloadBytes` helper — no visible tool wired to it yet
- [ ] No existing engine, tool, or category changed
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit

**PR 2 — First tool (PDF Merge)**
- [ ] `/pdf-merge` works for 2+ files, reordering changes the output order, remove/clear all work
- [ ] Every §7 error and warning shows a specific, correctly worded message
- [ ] Content includes every §8 section, the standing warnings verbatim, and a worked example
- [ ] The `pdf` category becomes visible per Founder Decision 8, with copy naming exactly the tools that
      exist (one, at first) and no others
- [ ] Search synonyms from §8 all resolve to this tool
- [ ] `tests/support/tool-page.ts`'s shared `SAMPLES` map (or archetype D's equivalent) includes the new
      tool from the first commit — the lesson carried forward from every prior wave's own report
- [ ] Network recorder confirms zero requests; no upload path exists anywhere in the code
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility 100, SEO 100
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit, including determinism
- [ ] No separate report after this PR alone — a wave report is written once several PDF tools are
      complete, per §4
