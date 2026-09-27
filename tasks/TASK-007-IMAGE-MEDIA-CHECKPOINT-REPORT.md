# TASK-007 Image & Media Checkpoint Report

Report date 2026-09-27 · coding agent: Claude (Claude Code, cloud session)

> **Status: checkpoint, wave paused pending founder direction.** TASK-007 expanded the Image & Media
> category from 2 tools to 7 tools across six PRs, each merged after `pnpm verify`/`pnpm build`/
> `pnpm test:e2e` passed locally. No further Image & Media tool, and no other category's work, is started
> without explicit founder approval — see §11.

## 1. Summary

- **TASK-007A** planned the Image & Media completion wave: it surveyed the category's remaining gap (only
  Image Resize and Image Compress existed at the time) and laid out a sequenced set of tools to bring the
  category to a fuller, repeat-user media utility cluster.
- **TASK-007B through TASK-007F** implemented that plan one tool at a time, one PR each: Image Format
  Converter, Image Metadata Remover, Image Watermark, Image Crop, and Favicon Generator.
- **Image & Media now has 7 live tools**, up from 2 at the start of this wave.
- The category has shifted from a small pair of image-adjustment tools into a stronger repeat-user media
  hub covering resizing, compression, format conversion, privacy cleanup, watermarking, cropping, and
  favicon generation — the everyday image tasks a website owner, online seller, or content creator returns
  to repeatedly, not a one-off utility.
- **This checkpoint closes the first Image & Media expansion milestone.** No new Image & Media tool, and no
  other category, is started until the founder explicitly says so.

## 2. Current platform status

- **Visible tools: 23**
- **Visible categories: 6**

Category counts:

| Category | Tools |
|---|---|
| Developer & Data | 3 |
| Business & Finance | 3 |
| Logistics | 4 |
| PDF & Documents | 2 |
| Image & Media | 7 |
| Civil & Construction | 4 |

Image & Media live tools:

- Image Resize
- Image Compress
- Image Format Converter
- Image Metadata Remover
- Image Watermark
- Image Crop
- Favicon Generator

## 3. PR / task sequence

| Task | Title | PR |
|---|---|---|
| TASK-007A | Image & Media Completion Planner | [#45](https://github.com/info93rajeev-cell/mangotools/pull/45) |
| TASK-007B | Image Format Converter | [#46](https://github.com/info93rajeev-cell/mangotools/pull/46) |
| TASK-007C | Image Metadata Remover | [#47](https://github.com/info93rajeev-cell/mangotools/pull/47) |
| TASK-007D | Image Watermark | [#48](https://github.com/info93rajeev-cell/mangotools/pull/48) |
| TASK-007E | Image Crop | [#49](https://github.com/info93rajeev-cell/mangotools/pull/49) |
| TASK-007F | Favicon Generator | [#50](https://github.com/info93rajeev-cell/mangotools/pull/50) |

All six PRs were opened and merged in this order, one lane per PR, with no reverts and no out-of-scope
tool ever added or exposed along the way.

## 4. Tools shipped

### Image Resize

Part of the original Image & Media foundation, shipped before this wave (TASK-005). Resizes a JPG, PNG, or
WebP image to a requested width and height, entirely in the browser, with an optional keep-aspect-ratio
toggle. Included here for completeness, since it is the operation every later tool in this wave builds on
or alongside.

### Image Compress

Also part of the original Image & Media foundation (TASK-005), shipped before this wave. Re-encodes a JPG,
PNG, or WebP image at an adjustable quality to reduce file size where possible, reusing `image.resize@1` at
the source's own decoded dimensions rather than a new operation. Output size depends on the source image
and the browser's own encoder, so the tool never claims guaranteed compression.

### Image Format Converter

A single, unified converter between JPG, PNG, and WebP, rather than three separate duplicate tools
(JPG-to-PNG, PNG-to-JPG, WebP Converter) that would have shipped largely the same underlying behavior under
different names. Supports conversion in any direction between the three formats where the browser itself
can decode and encode them, with a graceful PNG fallback and warning if WebP output isn't supported. Reused
the existing `image.resize@1` operation at the source's own dimensions with an explicit (never `'same'`)
output format — no new engine operation was needed, and no separate duplicate tools were created.

### Image Metadata Remover

Creates a re-encoded, metadata-clean copy of a JPG, PNG, or WebP image — the common "strip EXIF/GPS/camera
data before sharing" use case, positioned as a privacy-oriented media tool. Reuses `image.resize@1`
unchanged (metadata removal is simply a re-encode at the source's own dimensions, with a preset-level
"same as input" default); zero engine changes were required for this tool.

### Image Watermark

Adds a text watermark only in v1 — no logo/image watermark and no batch/ZIP processing. Supports five
anchor positions (the four corners plus center), with opacity, font size, and text color controls. Required
a new, small engine operation (`image.watermark@1`), since drawing text onto a canvas is something
`image.resize@1` cannot do. This is also where the shared decode/encode/file-name/size-change lib code
(`engines/image/src/lib/`) was first extracted out of `image.resize@1`, so both operations could reuse it
instead of duplicating it.

### Image Crop

Accepts a numeric crop rectangle (X, Y, width, height in pixels) for a single image — there is no
drag-or-interactive crop selection UI in v1. Added a new `image.crop@1` operation (cropping a rectangle,
like drawing text, is something `image.resize@1` cannot do), and extracted `decodeAndCheckSource` into a
shared `lib/decode-source.ts` helper once it became the third identical copy across Resize, Watermark, and
Crop.

### Favicon Generator

Creates a square PNG favicon from an uploaded image, at a selected size (16, 32, 48, 180, 192, or 512
pixels) chosen from a fixed list — one size per run. Center-crops a non-square source image to a square
before scaling, so the output canvas is always fully filled by the source with no padding or background
color decision needed. No ZIP multi-size pack and no `.ico` output in v1; the tool's content page includes
plain guidance on recommended favicon sizes and a basic HTML `<link>` snippet for installing the result on
a website.

## 5. Platform foundation added

- **Stronger Image & Media category copy** — `taxonomy/categories.yaml`'s `media` category description and
  FAQ were updated after every tool addition to name the current, accurate tool count and list.
- **More complete image file-tool coverage** — the category now spans the core everyday image tasks
  (resize, compress, convert, clean, watermark, crop, favicon) rather than only resize/compress.
- **Shared image processing helpers (`engines/image/src/lib/`)** — `codec.ts` (decode/encode),
  `file-name.ts` (output name derivation), `size-change.ts` (before/after byte comparison),
  `signature.ts`/`formats.ts` (file-type detection), `limits.ts` (shared file/pixel caps), and
  `decode-source.ts` (decode + pixel-cap check) were extracted from `image.resize@1` as later operations
  needed the same logic, each extraction verified against the existing operations' own tests with zero
  behavior change before being built on.
- **Reuse of `image.resize@1` where appropriate** — Image Format Converter and Image Metadata Remover both
  ship as presets over the existing `image.resize@1` operation, adding no new engine code; only Watermark,
  Crop, and Favicon Generator needed genuinely new operations.
- **`image.watermark@1`, `image.crop@1`, and `image.favicon@1` operations** — three new, small, single-
  purpose operations added only when the existing operation genuinely could not do the job (drawing text,
  reading a sub-rectangle, and center-crop-then-scale, respectively).
- **`browser-globals.d.ts` 9-argument `drawImage` overload** — added for `image.crop@1` (draws a source
  sub-rectangle rather than the whole image) and reused unchanged by `image.favicon@1`'s own center-crop
  step, rather than being re-declared.
- **Reciprocal related links among media tools** — each new tool's manifest links back to the prior tools
  it's most related to, and the prior tool's own manifest was updated in the same PR to link forward (for
  example, Image Watermark → Image Crop, and Image Crop → Favicon Generator), so the category's internal
  navigation stayed two-way as it grew.
- **Repeated screenshot hygiene pattern** — every PR in this wave produced a batch of unrelated,
  pre-existing run-to-run screenshot rendering noise from the shared test harness; only the new tool's own
  screenshots were kept in each PR, with the rest discarded after visual (and in one case byte-level)
  confirmation that they were noise, not real content changes.
- **Category count held steady at 6 while visible tools grew from 21 to 23** — no new category was needed
  to absorb this wave's tools; all five new tools landed inside the existing Image & Media category.

## 6. Product positioning

Image & Media is positioned as a set of free, everyday media tools:

- No signup required.
- No MangoTools watermark added to any output.
- Browser-first where practical — most tools need no file upload at all.
- Useful for websites, ecommerce stores, social media, documents, and cleaning up AI-generated media that
  arrives in the wrong format or size.

Safe wording used consistently across the category:

- "Browser-based where supported."
- "Large files may depend on device/browser memory."
- "File size/encoding may vary by browser."

Overclaims deliberately avoided:

- "100% secure"
- "Unlimited forever"
- "Works with every file"
- "Enterprise-grade privacy"
- "Professional editor replacement"

## 7. Determinism and browser encoder policy

Image tools that use browser canvas encoders cannot promise byte-identical output across browsers — this
policy was established in the original TASK-005A planning pass and preserved, unchanged, across every tool
added in this wave. The deterministic contract instead focuses on:

- output dimensions
- output format (including any disclosed fallback, such as WebP-unsupported → PNG)
- validation behavior (file presence, type, size, and any tool-specific field checks)
- typed warnings (raised exactly when the engine's own output fields say they should be, never asserted as
  a hardcoded byte count or percentage)
- the output contract's stable fields (file size, size difference, size-change percentage — always
  populated, sign and shape asserted, exact magnitude not)
- predictable, tested UI behavior

This exception is scoped to image binary outputs only; it does not weaken the byte-identical determinism
bar for any non-image engine on the platform.

## 8. Testing and validation

Across every PR in this wave:

- `pnpm verify` was run and required to pass before opening the PR.
- `pnpm build` was run and required to pass for every implementation PR (TASK-007A was docs-only and did
  not touch app code).
- `pnpm test:e2e` was run and required to pass for every implementation PR.
- Local e2e ran against Chromium only, since Firefox and WebKit are not available in this session's local
  sandbox — a disclosed, pre-existing environment limitation affecting every PR equally, not specific to
  this wave.
- Screenshot diffs were curated after every e2e run: only the new tool's own new screenshots were kept,
  and unrelated pre-existing rendering noise was discarded after checking it was genuinely noise (visual
  comparison, and in one case a byte-level diff confirming a 2-byte encoding artifact rather than a real
  content change).
- A transient `mobile-search.spec.ts` "tap outside to close" flake was observed during TASK-007F's own
  implementation. It was bisected by re-running the identical test against a clean `main` checkout with
  this wave's changes fully removed: it failed at a similar rate there too (a pre-existing timing race in
  the test itself, unrelated to any Image & Media change). No app code was changed for it, consistent with
  this platform's policy of never chasing an unrelated flake by editing product code.

Latest known state, from TASK-007F (the most recent implementation PR in this wave):

- 23 tools, 23 presets, 6 visible categories
- 839 tests passing via `pnpm verify`
- `pnpm build` green (35 pages)
- `pnpm test:e2e` green locally (335 passed) on the final, clean run

## 9. Scope control / out of scope

Deliberately not included in this wave:

- Passport Photo Maker
- Background Remover
- Object Remover
- AI Upscale
- AI Restore
- Video tools
- Audio tools
- Batch processing (multiple images per run)
- ZIP export (for multi-file or multi-size output)
- Login / account
- Subscription
- Cloud upload
- AI of any kind
- Civil & Construction tool work during any Image & Media implementation task
- Fix & Growth, LinkedIn/social agent, or any other agent-related work in this checkpoint

## 10. Known notes / implementation lessons

- A unified Image Format Converter was a better choice than three separate duplicate tools (JPG-to-PNG,
  PNG-to-JPG, WebP Converter) that would have shipped nearly identical underlying behavior under different
  names.
- Related-link changes often render below the fold in the fixed-viewport screenshots this platform
  captures, so a screenshot diff on an existing tool's page needs to be checked for real content change
  (not assumed significant) before deciding whether to keep or discard it.
- The homepage and category-listing screenshots may not visibly change even when a category's tool count
  changes, if the new tool's card sits below the captured viewport — tool-count changes are better verified
  by the platform's own generated counts and dedicated category-page tests than by screenshot review alone.
- Search relevance can be sensitive to exact manifest wording (synonyms, primary keyword, title), so
  running a quick search-relevance check against a new tool's terms — and against an existing regression
  sentinel query — before finalizing a manifest is a useful, cheap safety check.
- Browser-based image outputs can change file size after re-encoding, sometimes growing rather than
  shrinking for very small or already-optimized source images; tools in this category state this plainly
  rather than promising compression or a specific output size.
- Multi-output downloads, such as a favicon size pack or a ZIP export, should be deferred until the
  platform's own UI has a demonstrated way to offer more than one downloadable file per run — today's
  file-tool archetype (archetype D) is single-file-in, single-file-out, and building a real multi-file
  download experience is new UI work, not something that can be added cheaply inside a single tool's PR.

## 11. Recommended next Image & Media options

Possible next tools, none started:

- Passport / ID Photo Maker
- Color Picker from Image
- Image Filters / Adjustments
- PDF to JPG
- PDF to PNG
- PNG to PDF / WebP to PDF
- PDF Page Image Extractor
- Video Trim (later)
- Audio Trim (later)

**Recommendation:** before starting any higher-risk AI or media-editing tool, choose one low- or
medium-risk tool from the list above and continue the same one-PR-at-a-time discipline this wave used.
This is a recommendation only — per this session's standing instructions, no new tool, engine operation, or
task is started without explicit founder direction.

## 12. Final milestone statement

TASK-007 first Image & Media expansion milestone is complete. The category now has enough depth to be
treated as a serious repeat-user utility cluster, not only a small pair of image tools.
