# TASK-005 Image Wave Checkpoint Report

Report date 2026-09-26 · coding agent: Claude (Claude Code, cloud session)

> **Status: checkpoint, wave paused pending founder direction.** TASK-005 opened the Image & Media
> category in four PRs, each merged after `pnpm verify`/`pnpm build`/`pnpm test:e2e` passed locally and
> GitHub CI passed on Node 24 with Chromium, Firefox and WebKit. No further image tool is started without
> explicit founder approval — see §11.

## 1. Summary

- **TASK-005A** planned the Image Tools wave: 10 candidate tools classified by risk, Image Resize
  recommended first over Compress/JPG↔PNG/EXIF Remover, all 15 architecture questions answered, and the
  load-bearing finding that a canvas-based image engine cannot meet this platform's existing
  byte-identical cross-browser determinism bar — flagged and resolved as a disclosed, scoped exception
  before any code was written.
- **TASK-005B** added the `image.resize@1` engine foundation and dev-only real-browser harness (PR 1),
  then the visible **Image Resize** tool (PR 2) — reusing and extending the file-tool archetype D built in
  the PDF wave for a fundamentally different shape: a single image, a live preview, and typed
  width/height/format/quality controls alongside the file.
- **TASK-005C** added the visible **Image Compress** tool, reusing `image.resize@1` at the source's own
  decoded dimensions rather than a new operation, plus small, additive foundation fields (size-change
  output, a larger-output warning, configurable output-name wording).
- **Image & Media is now a live category** with two tools, up from zero at the start of this wave.

## 2. Current status

- **Visible tools: 14**
- **Visible categories: 5** — Logistics (4), Business & Finance (3), Developer & Data (3),
  PDF & Documents (2), Image & Media (2)
- **Image & Media tools:**
  - Image Resize
  - Image Compress
- **No future image tools are exposed.** Background Remover, JPG to PNG, PNG to JPG, WebP Converter,
  EXIF/Metadata Remover, Passport Photo, and Image Watermark do not exist as manifests, presets, routes,
  or links anywhere on the site — confirmed by a dedicated e2e test on the Image & Media category page
  (see §8).

## 3. PR sequence

| PR | Title | Lane(s) | Head → merged as |
|---|---|---|---|
| [#33](https://github.com/info93rajeev-cell/mangotools/pull/33) | docs(tasks): add TASK-005A image tools wave foundation plan | docs (planning only, no code) | `33ea3d3` → `ba244c3` |
| [#34](https://github.com/info93rajeev-cell/mangotools/pull/34) | TASK-005B PR 1: image.resize@1 foundation (no visible tool) | engine-image (new engine), platform (disclosed determinism exclusion) | `6bdfe1c` → `667955d` |
| [#35](https://github.com/info93rajeev-cell/mangotools/pull/35) | TASK-005B PR 2: add visible Image Resize tool | ui (archetype D extension), tools | `3bb032c` → `e1e9c77` |
| [#36](https://github.com/info93rajeev-cell/mangotools/pull/36) | TASK-005C: add visible Image Compress tool | ui, tools, engine-image (small, founder-approved addition) | `8b6b8bd` → `4741708` |

All four PRs were opened, reviewed and merged in this order with no reverts and no out-of-scope tool ever
added or exposed. PR #34's first push (`b809146`) failed CI on a lockfile mismatch and was fixed in the
same PR (see §8); PR #36's first push briefly showed a merge-conflict indicator from stale branch
ancestry and two Firefox/WebKit-only test failures, both fixed in the same PR before merge (see §8).

## 4. Platform foundation added

This wave extended infrastructure the PDF wave introduced, and added new pieces specific to image
workflows, reusable by any future image-adjacent tool:

- **`engines/image` (`image.resize@1`)** — the platform's first engine that decodes and re-encodes binary
  media via `OffscreenCanvas`/`createImageBitmap`, rather than only reading/writing bytes structurally
  (as `engines/pdf` does).
- **Disclosed browser/worker runtime caveat** — `image.resize@1` declares `runtimes: ['worker']` only,
  never `'node'`, since `OffscreenCanvas`/`createImageBitmap` do not exist in Node and have no polyfill
  here. This is a founder-approved, documented exception to the general "engines are pure, runnable in
  Node" expectation (`engines/image/README.md`'s "Runtime" section), not an oversight, and
  `determinismCases()` (`scripts/generate/pipeline.ts`) excludes any operation lacking `'node'` among its
  runtimes generically, by capability — every other engine is unaffected.
- **Dev-only harness for real-browser canvas validation** — `/_dev/image-foundation`
  (`apps/web/src/pages/[dev]/image-foundation.astro` + `ImageFoundationHarness.tsx`), mirroring the
  existing determinism harness pattern: generates test images at runtime via canvas, runs
  `image.resize@1` for real in a real browser across 8 scenarios, and asserts on dimensions, format,
  warnings and error codes. This let PR #34 prove the actual decode/resize/encode pipeline works before
  any visible tool, manifest, or route existed.
- **File-tool archetype D extended for image workflows** — `ui.maxFiles` (single-file mode, replacing on
  each new selection, no queue/reorder UI needed), a new `boolean` field kind in `fieldSchema` for
  input-side booleans like `keepAspectRatio` (distinct from `userOptionSchema`'s `control: 'switch'`,
  which routes to operation params instead), and reuse of the existing `CalculatorFields`/`OptionControls`
  components (built for archetype B) against local state, since those components turned out to have no
  dependency on the `ToolStore` they were originally built alongside.
- **Image preview support** — a plain `<img>` element sized by CSS `max-height` regardless of decoded
  bitmap size, with its `onLoad` event prefilling `targetWidth`/`targetHeight` from the image's own
  natural dimensions — avoiding any extra engine-level decode just to read dimensions, and (for Image
  Compress) letting width/height fields exist and be sent to the operation without ever being shown to
  the user.
- **Typed image controls alongside the file input** — width, height, keep-aspect-ratio, output format,
  and quality, all declared through the same `preset.fields`/`preset.outputs` mechanism archetypes A and B
  already use, not hardcoded to any one tool.
- **Output filename derivation and normalization** — `deriveOutputFileName` (`file-name.ts`) never rejects
  a name, only cleans one up or falls back, extended in PR #36 with an optional `style` argument
  (`suffix`/`fallbackBase`) so a preset that reuses `image.resize@1` for a different purpose (Image
  Compress's `-compressed` wording) can pick its own output-name style without changing Image Resize's own
  `-resized` default.
- **Image warning/error surface** — every warning and typed error `image.resize@1` can raise (invalid
  file, file too large, pixel caps, unreadable image, transparency flatten, upscale quality loss, WebP
  fallback, and — added in PR #36 — output-larger-than-input) is rendered through the same
  `messageFor`/`FileToolOutcome` mechanism the PDF tools already use; no new UI plumbing was needed to add
  a new warning code.
- **Image & Media category launch** — `taxonomy/categories.yaml`'s `media` category, scaffolded but empty
  before this wave, is now live as **Image & Media**, with copy naming exactly Image Resize and Image
  Compress.

## 5. Image determinism decision

Documented explicitly during TASK-005A's own planning, not discovered mid-implementation, and applied
consistently across both PR #34 and PR #36:

- **Image tools do not require byte-identical binary output across browsers.** Every other engine on this
  platform (numeric, data, estimate, logistics, pdf) is verified byte-for-byte identical between Node and
  every browser engine by the existing determinism suite. `image.resize@1` is the one disclosed exception.
- **Why:** browser image encoders differ. Canvas-based JPEG/PNG/WebP encoding and resize-interpolation
  quality are implementation-defined per browser engine, not spec-guaranteed identical — confirmed
  concretely in PR #36's CI, where the same 331-byte source re-encoded to `−128.4%` size change on
  Chromium, `−89.4%` on Firefox, and `−128.7%` on WebKit.
- **The stable contract that *is* required instead:**
  - dimensions (original and output width/height)
  - format (the resolved output format, including the disclosed WebP-unsupported → PNG fallback)
  - validation behavior (file presence, type, size, dimension checks — all pre-decode and Node-testable)
  - error codes (typed, asserted by both engine and tool fixtures)
  - warnings where reported by the engine (transparency flatten, upscale quality loss, WebP fallback,
    output-larger-than-input — asserted as "shown when the engine's own output fields say so," never as
    a hardcoded byte count or percentage)
  - stable metadata fields (`originalFileSize`, `outputFileSize`, `sizeDifferenceBytes`,
    `sizeChangePercent` — always populated, sign and general shape asserted, exact magnitude not)
- **This exception is limited to image binary outputs only.** It does not weaken or change the
  byte-identical determinism bar for calculator (numeric, estimate), logistics, PDF, or any other
  non-image engine — `determinismCases()`'s exclusion is scoped generically by declared `runtimes`
  capability, not by engine name, and every existing engine still declares `runtimes: ['worker', 'node']`
  and is still verified byte-for-byte on every run.

## 6. Image Resize summary

- **What it does:** resizes one JPG, PNG, or WebP image to a requested width/height, entirely in the
  browser.
- **One image at a time**, with drag-and-drop or click-to-browse upload and a live preview.
- **Input formats:** JPG, PNG, WebP where supported (detected by file signature, not extension or claimed
  MIME type).
- **Output format:** same as input, or JPG/PNG/WebP where browser-supported, with a graceful PNG fallback
  and warning if the browser cannot honor a WebP request.
- **Width/height controls**, prefilled from the image's own natural dimensions on selection.
- **Keep-aspect-ratio toggle:** on, the target width/height describe a bounding box the source is scaled
  to fit inside (never cropped, never distorted); off, the output is exactly the requested size.
- **Quality control** for JPG/WebP output, shown only when a lossy format is selected; ignored for PNG,
  which has no quality knob.
- **Browser-first processing:** every image is read, resized and downloaded on the user's own device; no
  upload, no server round-trip.
- **Transparency-to-JPG white-flatten warning:** converting an alpha-capable source to JPG fills the
  canvas with white before drawing (avoiding canvas's default-to-black behavior) and states this in the
  warnings, regardless of whether any pixel in the specific image is actually transparent.
- **Limits:** 25 MB maximum input file size, 40 megapixel decoded-pixel cap (checked separately from file
  size, since a small, highly-compressed file can still decode to a very large bitmap), single image only
  in this version.
- **Category launch:** Image & Media became visible for the first time with Image Resize as its only tool.

## 7. Image Compress summary

- **What it does:** re-encodes a JPG, PNG, or WebP image with adjustable quality and output format, to
  reduce file size **where possible** — it reuses `image.resize@1` at the source's own decoded dimensions
  rather than a new operation.
- **Not guaranteed compression:** wording throughout uses "reduce file size where possible," never
  "guaranteed," "lossless," or "always smaller." Whether the output shrinks, and by how much, depends on
  the source image, its format, and the settings chosen.
- **Keeps original dimensions by default:** width, height, and aspect-ratio fields exist and are sent to
  the operation (prefilled from the decoded image, via the same preview mechanism as Image Resize) but are
  hidden from the UI — the user cannot resize from this tool.
- **Quality setting** for JPG/WebP output, same behavior and visibility rule as Image Resize.
- **Shows original size, output size, size difference, and percentage change** — all always populated,
  regardless of whether the output grew or shrank.
- **Warns if the output is larger than the original:** "The output file is larger than the original. Try
  a lower quality setting or another format." — raised whenever re-encoding produces a larger file than
  the input, and genuinely demonstrated (not merely theoretical) by the tool's own hand-built test fixture,
  which is smaller than any real browser's JPEG container overhead.
- **Cross-browser image encoder variance found in Firefox/WebKit and fixed by contract-based tests:** the
  first CI run against all three browsers showed each producing a different size-change percentage for the
  identical source; fixed by asserting the stable contract (sign of the size change, presence of the
  warning) instead of a hardcoded magnitude, with no change to the engine's own validation or the warning
  itself (see §5, §8).

## 8. Tests and CI

| Check | PR #34 (image.resize@1 foundation) | PR #35 (visible Image Resize) | PR #36 (visible Image Compress) |
|---|---|---|---|
| `pnpm verify` (local) | ✅ 521 tests; 12 tools/13 presets/4 visible categories (operation not yet exposed); 221 architecture files, no violations | ✅ **535 tests**; 13 tools/13 presets/5 visible categories; 222 architecture files, no violations | ✅ **555 tests**; 14 tools/14 presets/5 visible categories; 224 architecture files, no violations |
| `pnpm build` (local) | ✅ 22 pages (+1 for the new dev-only harness page) | ✅ **24 pages** | ✅ **25 pages** |
| `pnpm test:e2e` (local, Chromium-based projects) | ✅ 185 passed (e2e, the new `dev` project, a11y, seo, screenshots) | ✅ **179 passed**, including 9 new Image Resize / Image & Media category tests | ✅ **195 passed**, including 10 new Image Compress tests and the updated Image & Media category test |
| GitHub CI (Node 24; Chromium, Firefox, WebKit) | First push (`b809146`) failed at `pnpm install --frozen-lockfile` — `engines/image/package.json` was added without regenerating `pnpm-lock.yaml`. Fixed by running `pnpm install` (no dependency versions changed elsewhere); re-run [36253410064](https://github.com/info93rajeev-cell/mangotools/actions/runs/36253410064) green | ✅ [36258993727](https://github.com/info93rajeev-cell/mangotools/actions/runs/36258993727) | First push briefly showed a merge-conflict indicator on `scripts/generate/pipeline.test.ts` from stale branch ancestry (carried pre-squash history across two prior PRs), and two Firefox/WebKit-only failures from a test that hardcoded Chromium's exact size-change percentage. Both fixed in-PR (ancestry corrected via a merge onto `origin/main`; tests changed to assert the stable contract, not a magnitude — see §5, §7); final run [36264033928](https://github.com/info93rajeev-cell/mangotools/actions/runs/36264033928) green on all three browsers |

Firefox/WebKit were unavailable in this session's local sandbox throughout the wave (only Chromium is
installed here) — a disclosed, pre-existing environment limitation affecting every tool's local test run
equally, not specific to any image tool. GitHub CI's own Chromium/Firefox/WebKit matrix is what actually
proved cross-browser behavior in every PR, including catching the one real image-encoder variance issue
in PR #36 before merge.

## 9. Safety / privacy positioning

Both tools, and the Image & Media category page, are worded consistently with this platform's
privacy-first positioning:

- **Browser-first**, stated plainly on both tool pages and in their content.
- **No upload required for these tools** — every image is read, processed and downloaded on the user's
  own device.
- **Overclaims avoided by design:** no "100% secure," no "HIPAA compliant," no "enterprise-grade
  privacy," no "perfect quality," no "works with all images," and — specific to Image Compress — no
  "guaranteed compression" or "lossless compression" claim beyond what is strictly true (PNG output is
  genuinely lossless; JPG/WebP re-encoding is not, and is described as such).
- **Output can differ slightly across browsers**, stated explicitly in both tools' content, since browser
  image encoders vary (see §5).
- **Verify output before use** — both tools carry a standing warning to verify the result before
  publishing, printing, filing, or sending it.
- **User responsibility stated explicitly** — both tools' standing warnings and content state plainly that
  the tool must not be used for images the user is not authorized to process.

## 10. Kept for future, not implemented

Per the founder's roadmap notes across TASK-005A, TASK-005B, and TASK-005C, these remain candidates
only — none were started, and none have a manifest, preset, engine operation, or route in the codebase:

- **Background Remover** — confirmed Complex in TASK-005A's own risk classification: ML/AI segmentation,
  a privacy-model conflict (meaningful background removal typically needs a model too large to ship
  client-side, in tension with this platform's browser-only positioning), variable quality, and likely
  cost/paid-tier implications. Explicitly not first, with its own roadmap note; a candidate for a future
  paid/pro tier rather than the free tool set this wave built.
- **JPG to PNG**
- **PNG to JPG**
- **WebP Converter** (as a separate, dedicated tool — format conversion is already partially covered by
  Image Resize's and Image Compress's own output-format selector)
- **EXIF / Metadata Remover**
- **Passport Photo / ID Photo Tool**
- **Image Watermark Tool**
- **Batch image processing** (multiple images per run)
- **ZIP downloads** (for multi-file output)
- **AI upscaling / AI editing** of any kind

## 11. Recommendation

**Pause Image tools after this checkpoint.** Image & Media now has two tools (Resize, Compress), matching
the TASK-005A plan's own recommended sequencing exactly, and both share a proven, generalized file-tool
UI foundation (archetype D, extended twice in this wave without needing a third variant). Rather than
continuing immediately into a third image tool, the next wave should be:

- **Quantity Survey / Civil calculators.** This platform's live categories today (Logistics, Business &
  Finance, Developer & Data, PDF & Documents, Image & Media) are either generic public utilities or
  document/image processing — none serve a distinct professional trade the way this platform's original
  Logistics category does. Quantity Survey / Civil calculators would open a genuinely differentiated
  professional category, consistent with the platform's calculator-first, "every check shown" positioning,
  rather than adding a third tool to a category the wave has already delivered its planned scope for.

Two other options exist but are recommended against for now:
- **One more Image tool** — only if the founder explicitly approves a specific candidate from §10; none
  is recommended as more urgent than opening a new professional category.
- **PDF tools** — only if the founder explicitly approves a specific candidate from the PDF wave's own
  kept-for-future list; the PDF wave already reached its own planned two-tool checkpoint.

This is a recommendation only. Per this session's standing instructions, no new tool, engine operation, or
task is started without explicit founder direction.
