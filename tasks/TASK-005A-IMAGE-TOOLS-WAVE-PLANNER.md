# TASK-005A — Image Tools Wave Foundation (plan only)

> **Planning document. No code has been written, no schema, engine, preset, manifest or content file has
> been created, no dependency added, and no existing tool has been touched.** This plans the first wave of
> Image tools, the sixth category to gain tools after Developer & Data, Business & Finance, Logistics, and
> PDF & Documents. It fills the `media` category already scaffolded (but empty) in `taxonomy/categories.yaml`
> ("Media & Images", icon `image`, order 80) and refines the original Phase 1 build plan's own image engine
> slot (`docs/architecture/product-architecture.md` §5.2, engine **E8**: "Image (decode/encode codecs,
> canvas ops) — Resize, convert, compress, crop, EXIF strip, aspect-ratio crop — Phase 1 (lite)") into the
> same plan → PR → PR → report lifecycle this session has used for every wave since TASK-002.

## Context

- **Current platform:** 12 live tools across 4 visible categories — Developer & Data (3), Business & Finance
  (3), Logistics (4), PDF & Documents (2: PDF Merge, JPG to PDF). TASK-004 is closed; its checkpoint report
  (`tasks/TASK-004-PDF-WAVE-CHECKPOINT-REPORT.md`) recommended Image tools or Quantity Survey/Civil
  calculators as the next wave.
- **Taxonomy already scaffolds a `media` category** (id/slug `media`, name "Media & Images", icon `image`,
  order 80, summary "Resize, crop, compress and convert images on your device") with no tools yet — this
  plan fills it, not creates it.
- `site.config.yaml`'s `navigation.minToolsPerCategory` is currently **1**, so the first Image tool will make
  "Media & Images" immediately visible with just one tool, exactly as happened for `pdf` in TASK-004B —
  expected, not a bug, flagged again for founder awareness in §12.
- **Target public direction:** MangoTools / "Beyond the AI Tools" — professional tools for work that should
  not depend on AI. Image tools must be deterministic *where that is actually possible* (see §3, a genuinely
  new limit this wave introduces), browser-first, privacy-safe, and honest about limits.

## Why this planning task exists

Image tools are public-traffic tools, but they introduce questions no prior wave has faced, because — for
the first time on this platform — the actual transform (not just file I/O) requires browser-only, pixel-level
APIs (`<canvas>`, `OffscreenCanvas`, `createImageBitmap`) that live outside every existing engine's "pure
logic, no DOM" contract:

- **browser memory limits** — a decoded bitmap can be tens of times larger than its compressed file, so file
  size alone is not a safe proxy for memory risk (§3 Q3/Q4);
- **image quality** and **resize/compress behavior** — a canvas-based resize or re-encode is not free; it has
  real, disclosable quality implications;
- **EXIF/metadata handling** — canvas re-encoding strips it as a side effect, which is convenient but must be
  stated, not assumed;
- **privacy/no-upload wording** — same discipline as PDF, extended to a new failure surface (corrupted/huge
  images);
- **canvas behavior** and **output format behavior** — format support (especially WebP) is not uniform across
  browsers, and canvas has real gotchas (transparent-to-opaque compositing defaults to black, not white — a
  concrete bug class, not a hypothetical, detailed in §3 Q7);
- **transparency handling** — PNG/WebP keep alpha, JPG cannot, and that conversion needs an explicit decision;
- **large image failures** and **mobile performance** — this platform's first tools where the underlying
  browser API itself (not just this platform's own limit) can silently degrade or crash on pathological input;
- **future Background Remover scope** and **paid vs. free separation** — the most-requested image tool is
  also the one this plan must explicitly keep out of the first wave (§9);
- **a genuinely new architecture tension**: every existing engine (`numeric`, `data`, `estimate`, `logistics`,
  `pdf`) is pure JavaScript with no DOM dependency, runs identically in Node and every browser, and is
  verified byte-for-byte across all of them by this platform's determinism suite. A Canvas-based image engine
  **cannot** meet that bar — not because of an implementation mistake, but because `OffscreenCanvas`/
  `createImageBitmap` do not exist in Node, and even between browsers, JPEG/WebP/PNG encoders and canvas
  resize-interpolation quality are implementation-defined, not spec-guaranteed identical. This is the single
  most consequential finding in this plan (§3 Q11/Q15) and needs explicit founder sign-off before any code
  is written, exactly as the archetype-D gap did for TASK-004A.

This is why a planning document comes before any code.

## 1. Candidate tools, classified

| # | Tool | Class | Why |
|---|---|---|---|
| 1 | **Image Resize** | **Simple–Medium** | The full decode → draw/scale → re-encode canvas pipeline, but a single well-understood operation with no interactive selection UI. Needs new numeric input fields (width/height) that archetype D has never carried alongside a file queue before (§5 Q12) — the one real foundation gap this tool exposes. |
| 2 | **Image Compress** | **Medium** (Complex for real PNG compression) | Same pipeline as Resize, but "compress" implies a guaranteed size reduction. A JPEG/WebP quality slider (`canvas.toBlob` quality param) works honestly; canvas has **no real PNG compression knob** — a browser re-encodes PNG losslessly at its own default zlib level, not a user-controlled trade-off — so a genuine PNG-compress promise needs a WASM/palette-reduction library (a new dependency question), mirroring PDF Compress's overpromising risk from TASK-004A. |
| 3 | **JPG to PNG** | **Simple** | Pure format conversion, no quality slider (PNG is lossless), no transparency-compositing problem (PNG supports alpha, so nothing needs to be added). The lowest-risk pipeline in this list, but also the one that proves the least — see §2. |
| 4 | **PNG to JPG** | **Simple–Medium** | Same pipeline as JPG to PNG, but exercises the transparent-to-opaque compositing problem (§3 Q7) that JPG to PNG does not: JPG has no alpha channel, so a transparent PNG's see-through pixels must be composited onto a chosen background color before encoding, or they silently render solid black (a real canvas default, not a hypothetical). |
| 5 | **WebP Converter** | **Medium** | The code is no harder than the other converters, but **browser support is the real risk, not the logic**: WebP *encoding* via `canvas.toBlob('image/webp', …)` has a materially shorter and less uniform support history across engines than JPEG/PNG, especially in older Safari/WebKit. This tool cannot silently assume support — it needs feature detection and a clear fallback message, which the JPG/PNG converters do not. |
| 6 | **Image Crop** | **Medium–Complex** | Needs an interactive, draggable selection UI over a live image preview — a genuinely new UI surface, not a file-queue-plus-fields extension of archetype D. Closer to the architecture doc's own "archetype E: Visual canvas" concept (`docs/architecture/product-architecture.md` §5.4) than to archetype D. Not buildable as a small extension the way Resize's numeric fields are. |
| 7 | **EXIF / Metadata Remover** | **Simple** | The one image tool that can be **pure, DOM-free, byte-level logic** — EXIF/APP1 segments in a JPEG can be located and stripped directly on the raw bytes, with no canvas, no re-encode, and no quality loss, exactly like this platform's existing byte-signature-scanning code (`hasPdfSignature`/`hasJpegSignature`). Uniquely, this is the **only** image tool in this list that could plausibly stay in the `runtimes: ['worker', 'node']` pattern and rejoin the cross-browser byte-identical determinism suite, unlike every canvas-based tool here (§3 Q11/Q15). Lower search demand than Resize, and — like PDF Metadata Remover before it — teaches the platform little about the canvas pipeline every other image tool needs. |
| 8 | **Background Remover** | **Complex** | See the dedicated note in §9. Must not be first; likely needs ML/on-device or server inference, cannot promise a reliable result, and raises paid-tier questions no other tool on this platform has needed. |
| 9 | **Passport Photo / ID Photo Tool** | **Complex** | A compound tool, not a single primitive: it needs Image Crop's not-yet-built interactive UI (fixed-aspect-ratio guide), physical print units (mm/inch at a target DPI, a new unit dimension no image tool needs otherwise), multiple country/authority size presets, and — because a "wrong" passport photo has real consequences for the user (a rejected visa or passport application) — content and disclaimers that must avoid implying any guarantee of official acceptance. Depends on Crop being built first. |
| 10 | **Image Watermark Tool** | **Medium** | A single well-understood drawing primitive (draw text/logo onto the canvas, matching PDF Watermark's own TASK-004A classification), moderate options surface (position, opacity, size). **Anchor-point placement** (9 preset positions: corners/edges/center) keeps this Medium; **free-drag placement** would need Crop's interactive canvas UI and should be treated as a later enhancement, not the v1 shape. |

## 2. First tool recommendation

The founder's expected first tool is **Image Resize**. This plan checks that against Image Compress, JPG to
PNG, PNG to JPG, and EXIF Remover, on the axes that mattered for PDF Merge's own selection in TASK-004A:
**engineering/reputational risk** and **infrastructure value** (does building it prove the foundation every
later image tool needs).

| Tool | Exercises the full canvas pipeline? | New archetype-D input needed? | Reputational risk | Search demand |
|---|---|---|---|---|
| **Image Resize** | Yes — decode, scale, re-encode | **Yes** — width/height numeric fields alongside a file, the one real gap (§5 Q12) | Low — "smaller/larger" is an objective, checkable claim | Very high ("resize image", "image resizer") |
| Image Compress | Yes, plus a quality dial | Yes — a quality/format select | **Higher** — "compress" implies a size-reduction guarantee canvas cannot fully back for PNG (§1) | High, but riskier framing |
| JPG to PNG | Yes, simplest form (no quality, no compositing) | No | Very low | Medium |
| PNG to JPG | Yes, plus transparency compositing | No new *input* field, but a real new *decision* (background color, §3 Q7) | Low, if the compositing default is correct | Medium |
| EXIF Remover | **No** — pure byte-level, no canvas at all | No | Very low | Lower ("remove exif", "strip metadata") |

**Honest finding, matching TASK-004A's own pattern:** EXIF Remover is the single lowest-risk tool to *build*
— it does not even need the canvas pipeline — but it teaches the platform nothing about that pipeline, which
Resize, Compress, both converters, Watermark, and eventually Crop all need. JPG to PNG and PNG to JPG
exercise the pipeline but not the one thing archetype D has never carried before: typed numeric/select input
fields alongside a file (every PDF tool so far needed only an optional filename string). Image Resize is the
only candidate that forces that gap to be closed now, with real tests, rather than discovered mid-build by
whichever tool needs it next.

**Recommendation: confirm Image Resize as the first tool**, for the same three reasons PDF Merge was
confirmed first in TASK-004A: highest search demand and clearest flagship positioning of anything in this
list; it forces the platform to solve the canvas decode/resize/re-encode pipeline and the DOM-in-engine
question (§3 Q11) *now*, properly, with tests whose scope is honestly redefined for this new engine type
(§3 Q15) — and every other image tool in this wave needs that same pipeline regardless of which ships first;
and it closes the one real archetype-D gap (numeric fields) that Compress, Watermark, and Crop will all also
need. **Background Remover must not be first** — see §9 for the full justification, which this plan treats
as a hard requirement, not a preference.

## 3. Architecture questions

**1. Should first image tools be browser-only?**
Yes. Same reasoning as PDF (TASK-004A §3 Q1): no `apps/api` exists in Phase 1, and server-side processing
would break this platform's privacy-first positioning for its first pixel-data category.

**2. Should files ever upload to a server in this wave?**
No. Never. Same hard product commitment as PDF.

**3. What should be the default max file size?**
Recommend **25 MB per image** as the *compressed file* limit — but this number alone is not sufficient (see
Q4). A highly-compressed file can still decode to a catastrophic in-memory size, so file size is a necessary
check, not a sufficient one, for image tools in a way it was for PDF (where `pdf-lib`'s in-memory object
graph scales roughly with file complexity, not a hidden multiplier like raw pixel decoding does).

**4. What should be the default max image dimensions?**
Recommend a **decoded pixel-area cap, not a resolution shape** — for example **40 megapixels** (roughly
equivalent to 6000×6667), checked from `createImageBitmap`'s reported width × height (or an `Image` element's
`naturalWidth`/`naturalHeight`) **before** any canvas draw at full resolution. Rationale, found during this
planning pass, not assumed: an N×M image occupies roughly `N × M × 4` bytes once decoded to RGBA — a highly
compressed but very-high-resolution PNG or JPEG can be a few MB on disk and multiple GB decoded, so a
file-size-only limit (Q3) would let a pathological image through to freeze or crash the tab. Requested
*output* dimensions for Resize need the same cap applied in the other direction (a user typing 50000×50000 as
a target size is the identical risk).

**5. Should EXIF metadata be preserved or removed by default?**
Recommend **removed by default** for Resize/Compress/Convert — not as a bespoke privacy feature to build, but
because it is what a canvas re-encode already does as a side effect (canvas never reads or writes EXIF), so
"removed by default" costs nothing extra and should simply be stated honestly in warnings/content rather than
silently assumed. A dedicated **EXIF Remover** tool (§1) remains the right home for "remove metadata without
otherwise touching the image," since the canvas tools' removal is a byproduct of re-encoding, not a
guaranteed, quality-preserving scalpel.

**6. How should transparency be handled?**
Preserve the alpha channel when the output format supports it (PNG, WebP). When it does not (JPG), composite
onto a solid background color before encoding — see Q7 for the default and a real implementation gotcha.

**7. How should JPG output background color be handled when converting from transparent PNG?**
Recommend a fixed, stated default of **white**, with a color picker as an optional *later* control (not
required for v1). **A concrete gotcha found during this planning pass, not hypothetical:** an unfilled canvas
is transparent by default; drawing a transparent-PNG image onto it and then encoding straight to JPG (which
has no alpha channel) does not "leave the background white" — encoders typically flatten transparent regions
to **black**, not white, unless the canvas is explicitly filled with a background color *before* the image is
drawn. This must be implemented as an explicit fill step, not assumed to happen automatically, and is exactly
the kind of implementation detail this platform's fixture tests must cover (§6).

**8. Should output quality slider be available for JPG/WebP?**
Yes — a simple quality control (for example 0–100, or low/medium/high presets) mapped directly to
`canvas.toBlob(type, quality)`'s native quality parameter. Trivial to wire, no new dependency. Not applicable
to PNG (lossless — no quality parameter exists).

**9. Should batch processing be included in first tools?**
**No — recommend single-image only for Image Resize v1.** Unlike PDF Merge/JPG to PDF, where "the more files
the better" is the whole point, resize/quality/format settings are naturally *per-image* choices; applying
one set of settings uniformly across a queue (or building per-item settings) is real, unscoped additional
complexity that should be a later, explicitly-approved enhancement once the single-image pipeline is proven.
This is a deliberate, disclosed deviation from reusing archetype D's multi-file queue exactly as PDF used it
— flagged as Founder Decision 6 (§12), not assumed silently.

**10. Should downloads be one-by-one or zip for multiple outputs?**
Not applicable to v1 given Q9. If batch is approved later, recommend **one-by-one downloads first** (no new
dependency) with a zip option only if separately approved — a new zip library is a new dependency question
under AGENTS.md rule 7, exactly like PDF Split's zip question was deferred, unscoped, in TASK-004A.

**11. Should we create a new image engine package?**
**Yes, `engines/image` — but with an explicit, disclosed, narrow exception to AGENTS.md golden rule 2
("Engines are pure: no DOM…"), which needs founder sign-off, not a silent decision.** Found during this
planning pass by reading the actual enforcement, not assuming from the rule's prose: `scripts/validate/
rules.ts`'s `ENGINE_BANNED` check only forbids literal `document.` and `window` references — it does **not**
and structurally **cannot** forbid `OffscreenCanvas`/`createImageBitmap`/`ImageData`, since those are
worker-safe, not `window`-scoped APIs. But they are still **absent from plain Node** (no DOM, no polyfill in
this codebase), which breaks two things every prior engine has had: (a) `runtimes: ['worker', 'node']` dual
execution — an image engine can only declare `runtimes: ['worker']`; (b) Node-side Vitest fixtures that
exercise the actual pixel pipeline — only pure, non-canvas logic (validation, filename sanitization, dimension
math) can be unit-tested in Node the way every previous engine's whole operation could be. This is also the
architecture the platform's own vision doc already anticipates (`docs/architecture/product-architecture.md`
§5.2, engine **E8**: "canvas ops"), so this is a pre-anticipated, scoped exception, not an invented one — but
it is still a real, precedent-setting deviation from a golden rule and must be approved explicitly (Founder
Decision 3, §12), exactly as the archetype-D bundling was in TASK-004A.

**12. Should we reuse file-tool archetype D or create a new image-specific archetype?**
**Extend archetype D minimally** — add optional, typed input fields (numeric width/height, a format select, a
quality control) alongside its existing single-file queue, rather than build a wholly new archetype. Resize,
Compress, and both converters are still "one file in, a few settings, one file out" — structurally identical
to what D already does for PDF Merge/JPG to PDF, just without extra fields until now. **Image Crop and
free-drag Watermark placement are different** — they need a genuinely new, interactive-canvas archetype
(closer to the architecture doc's own "archetype E: visual canvas") and are explicitly out of scope for this
first tool.

**13. How should image previews be handled safely?**
Preview from the local file only (`URL.createObjectURL` or `createImageBitmap`, never a network round-trip),
revoke object URLs once no longer needed to avoid a memory leak across repeated selections, and render the
*preview* at a capped display resolution (a CSS/canvas downscale) independent of the full decoded bitmap —
so a very large source image does not also make the on-page preview itself slow or memory-heavy before the
user has even pressed resize.

**14. How should corrupted/unreadable images be handled?**
`createImageBitmap`/an `Image` element's `error` event fails for a genuinely corrupted file — map that to a
specific typed error (mirroring `PDF_JPG_UNREADABLE`'s exact pattern from TASK-004C) rather than a generic
failure. Validate the file's declared type and, where practical, magic bytes before attempting to decode, the
same fail-fast-before-the-expensive-step discipline both PDF operations already use.

**15. What tests are required before public launch?**
**This wave must redefine what "determinism" means, honestly, not silently drop it.** Every prior engine's
tests assert byte-identical output across Node/Chromium/Firefox/WebKit. That bar **cannot** be met by a
canvas-based image engine: JPEG/WebP/PNG encoders and canvas resize-interpolation quality are
implementation-defined per browser engine, not spec-guaranteed identical, even given the exact same input and
requested output size. Recommend instead:
- **Engine (Vitest, Node-only, non-canvas logic per Q11):** input validation, filename sanitization,
  dimension/pixel-area math, and error-code coverage — the same fixture discipline as every prior engine,
  scoped to what can actually run in Node.
- **Playwright/e2e (the real correctness check for this wave):** load a real image, request a resize, then
  **decode the downloaded result back** (via `createImageBitmap` inside the test page) and assert its actual
  width/height match the request, its format matches what was requested, and its file size is within the
  expected bounds — dimensional and format correctness, not byte-hash equality. Run across Chromium, Firefox
  and WebKit to catch real per-browser gaps (especially WebP support, §1), not to assert they produce
  identical bytes.
- **Accessibility:** keyboard-only path through file selection, the new numeric/select fields, and the
  result, matching archetype D's existing a11y bar.
- **Manual, per the Phase 1 plan's own checklist discipline:** a real large photo (near the stated cap), a
  transparent PNG converted to JPG (checking the background-color gotcha, Q7), and a corrupted/truncated
  image file, on an actual Android phone and a laptop.

## 4. PR speed rule

The founder's rule allows one implementation PR for a simple tool "if architecture is already sufficient," or
asks this plan to recommend a single PR for Image Resize specifically if it can be done safely that way.
**Finding: it cannot, for the same class of reason PDF Merge could not skip archetype D in TASK-004A.**
Architecture is not yet sufficient in two concrete ways this plan just found, not assumed:

1. **Archetype D has never carried typed numeric/select fields alongside a file queue.** Every existing
   archetype-D tool (PDF Merge, JPG to PDF) needed only an optional output-filename string. Image Resize is
   the first tool that needs real, validated width/height inputs — a genuine, if modest, UI extension that
   should be built and tested once, deliberately, not improvised inside a "visible tool" PR.
2. **The DOM-in-engine exception (§3 Q11) is a golden-rule deviation that needs its own founder sign-off**
   before it ships alongside a public-facing tool, exactly as the archetype-D bundling itself needed
   sign-off in TASK-004A rather than being discovered mid-PR.

**Recommendation: 2 PRs**, mirroring TASK-004A's own foundation split:

| PR | Lane(s) | Content | Visible to users? |
|---|---|---|---|
| **PR 1 — Image foundation** | `engine-image` (new) + `ui` | `engines/image` (`image.resize@1`, `runtimes: ['worker']` only, per §3 Q11), plus archetype D's extension for typed width/height/format/quality fields alongside its existing file queue | No — no preset uses either yet |
| **PR 2 — First image tool** | `tools` | Preset `image/resize`, tool `image-resize` (manifest, content, fixtures), taxonomy/site updates to expose the `media` category | Yes |

This is the same disclosed exception to "one lane per PR" (AGENTS.md rule 1) TASK-004A already used, for the
identical reason: neither the engine nor the archetype extension is independently useful or visible without
the other, and neither is itself a "tool." **After this foundation:** simple additional image tools that need
no new archetype extension (for example EXIF Remover, once its own pure operation exists) can be one PR each,
matching PDF's own post-foundation pattern. **No separate report PR after every image tool** — one wave
checkpoint report is written after several image tools are complete, exactly as instructed and as TASK-004's
own checkpoint report already modeled.

## 5. Image foundation design

- **Package location:** `engines/image/` — `package.json`, `src/index.ts`, `src/errors.ts`,
  `src/operations/resize/` (`schema.ts`, `operation.ts`, `README.md`, `resize.test.ts`, `fixtures/`),
  mirroring `engines/pdf`'s own layout.
- **Operation naming:** `image.resize@1` — matches this codebase's `<engine>.<subject>.<verb>@<major>`
  convention (`pdf.jpg-to-pdf@1`, `logistics.pallet.fit@1`). Operation ids must stay lowercase-kebab per
  `schemas/src/common.ts`'s `operationRef` pattern — a real constraint this session hit and fixed during
  TASK-004C (`pdf.jpgToPdf` was rejected; `pdf.jpg-to-pdf` was required).
- **Preset naming:** `presets/image/resize.yaml`, one folder per engine, matching `presets/pdf/`.
- **Manifest category:** `media` (already scaffolded, name "Media & Images"). Tool slug `image-resize`.
- **Content structure:** the same five whitelisted headings every tool uses (`## How to use`, `## Method`,
  `## Worked example`, `## FAQ`, `## References`) — any topic not in that list (privacy explanation, the
  background-color gotcha, browser-support caveats) is prose inside `## Method`, exactly as PDF Merge and JPG
  to PDF are structured.
- **Fixture strategy:** small, hand-built or programmatically generated source images (mirroring TASK-004C's
  hand-built minimal JPEGs) checked into each operation's `fixtures/files/`. Because pixel-identical output
  cannot be asserted across runtimes (§3 Q15), fixture `expected` blocks should assert **dimensions, format,
  and size bounds**, not exact bytes — a real, disclosed change in what "golden fixture" means for this one
  engine, not a silent weakening of AGENTS.md rule 4 (fixtures are still truth for everything they *do*
  assert).
- **Playwright/e2e coverage:** real file selection (`setInputFiles`, matching the existing `FILE_TOOLS`
  pattern in `tests/support/tool-page.ts`), entering width/height, downloading, and decoding the result back
  in-page to assert actual dimensions — the correctness check redefined in §3 Q15.
- **Accessibility requirements:** the new width/height/format/quality fields must be labelled and
  keyboard-operable, with the aspect-ratio-lock toggle announced on change, matching archetype D's existing
  bar for the file queue itself.
- **File input behavior:** `<input type="file" accept="image/jpeg,image/png,image/webp">`, single file for v1
  (§3 Q9); validate declared type and, where practical, magic bytes before decoding.
- **Preview behavior:** capped-resolution preview from the local file only, object URLs revoked after use
  (§3 Q13).
- **Download behavior:** reuse the existing `downloadBytes` helper (`packages/ui/src/toolkit/actions.ts`),
  already generic since the PDF wave — no new download mechanism needed.
- **Output filename strategy:** **open question, not assumed** — every PDF tool used a fixed default
  (`merged.pdf`, `images.pdf`), but Image Resize is the first tool where deriving a name from the original
  file (for example `photo.jpg` → `photo-resized.jpg`) may be more expected by users resizing their own
  photos. Flagged as Founder Decision 7 (§12) rather than picked silently.
- **Browser support:** Chromium and Firefox are expected to fully support the resize/JPEG/PNG pipeline;
  **WebP output support must be feature-detected, not assumed** (§1), with the WebP option hidden or clearly
  marked unsupported rather than silently failing when unavailable.
- **Memory/performance warnings:** warn as requested output dimensions approach the pixel-area cap (§3 Q4);
  run decode/resize/encode inside the Web Worker via `OffscreenCanvas` so the main thread stays responsive;
  catch a decode/encode failure (including an out-of-memory condition, where detectable) and surface a
  specific, typed error rather than a silent hang or a crashed tab.

## 6. Privacy / trust

**Safe wording** (the founder's own examples, plus a few more grounded in what this plan can actually prove):
- "Images are processed in your browser where supported."
- "No file upload is required for this tool."
- "Very large images may fail because of browser memory limits."
- "Do not use this tool for images you are not allowed to process."
- "Resizing may reduce image quality." (grounded in §3 Q8's re-encode behavior)
- "Metadata such as camera and location data is not preserved when an image is resized or converted."
  (grounded in §3 Q5's actual canvas behavior, not a promised feature)
- "Transparent images converted to JPG are placed on a white background." (grounded in §3 Q7's stated
  default)

**Wording to avoid** (the founder's list, plus a few more this plan can name specifically):
- "100% secure"
- "HIPAA compliant"
- "enterprise-grade privacy"
- "we never see your files" — unless the architecture fully proves it; prefer the provable, specific claim
  ("processed in your browser," backed by the same network-recorder e2e test every prior tool already has)
- "works with all images"
- "lossless compression" — unless strictly true (only a same-format, same-dimension PNG passthrough could
  ever honestly claim this; any resize, any JPEG/WebP re-encode, and any format conversion is not lossless
  and must not be described that way)
- "military-grade" / "bank-level" anything
- "guaranteed" (quality, compatibility, or size reduction)
- "unlimited" (real size/dimension limits exist and are stated, §3 Q3/Q4)

## 7. Image Resize tool plan

**Inputs:**
- one image file (`<input type="file" accept="image/jpeg,image/png,image/webp">`, single file for v1, §3 Q9)
- target width, target height
- keep-aspect-ratio toggle (default on)
- output format: same as input (default) · JPG · PNG · WebP if browser-supported (§3 Q1/feature-detected)
- quality setting for JPG/WebP output (§3 Q8), not shown for PNG
- output file name (derivation strategy is Founder Decision 7, §12)

**Outputs:**
- resized image download — primary result
- original dimensions
- new dimensions
- original file size
- output file size, if available (`Blob.size` after encoding)
- warnings (below)

**Errors** (typed, specific, never one generic failure — naming mirrors `PDF_JPG_*`'s pattern):
| Code | Meaning |
|---|---|
| `IMAGE_NO_FILE_SELECTED` | resize attempted with no file chosen |
| `IMAGE_INVALID_FILE_TYPE` | the file is not a supported image type |
| `IMAGE_FILE_TOO_LARGE` | the file exceeds the stated size limit (§3 Q3) |
| `IMAGE_DIMENSIONS_INVALID` | width/height is zero, negative, non-numeric, or otherwise unusable |
| `IMAGE_OUTPUT_DIMENSIONS_TOO_LARGE` | the requested output exceeds the stated pixel-area cap (§3 Q4) |
| `IMAGE_UNREADABLE` | the file is corrupted or cannot be decoded (§3 Q14) |
| `IMAGE_MEMORY_LIMIT_EXCEEDED` | the browser ran out of memory during decode/resize, where detectable |
| `IMAGE_RESIZE_FAILED` | a catch-all for an unexpected failure once the source image loaded successfully |

**Warnings** (shown on every successful result; the transparency one is conditional, not standing):
- resizing may reduce image quality
- metadata (camera/location/EXIF) may not be preserved
- transparent images converted to JPG are placed on a white background (shown only when that conversion
  actually occurs)
- verify the output before relying on it

**Out of scope (first version):** AI upscaling · background remover · face retouching · object removal ·
batch/zip export unless explicitly approved (§3 Q9/Q10) · advanced color management · professional photo
editing · a Photoshop-like editor · server upload · cloud storage · login · subscription · AI of any kind.

## 8. Background Remover roadmap note

**Background Remover is high public demand but must be classified Complex, and must not be first.** Reasons,
each of which is a different *kind* of problem from every tool this platform has shipped so far, not merely a
harder version of the same problem:

- **It likely requires ML/AI segmentation**, either an on-device model (a real, often tens-of-megabytes,
  WASM/TF.js-class download, with genuine inference cost and battery/mobile-performance impact) or a
  server/GPU call — a category of dependency and cost this platform has never needed for any tool so far.
- **A server/GPU path directly breaks this platform's "no upload" privacy positioning**, the same
  differentiator every prior tool (including every PDF and Image tool planned here) is built to keep
  provably true.
- **Output quality genuinely varies and cannot be promised** — hair, fine edges, reflective or transparent
  objects, and low-contrast boundaries are well-known, unsolved failure modes for automatic segmentation of
  any kind. A tool that sometimes produces a bad cutout needs honest, hedged copy ("a quick, rough cutout —
  check the edges before using it"), not a "professional-grade" claim.
- **It can be genuinely expensive to run** at scale (compute cost per image, whether on-device battery/CPU or
  server GPU time), which is why it plausibly needs a **free-with-limits or paid/pro tier** — a business-model
  decision this platform has not needed to make for any tool yet, and should not back into accidentally by
  building the tool first and figuring out monetization after.

**Recommended future positioning, once explicitly approved and planned on its own:** free with real,
stated limits (for example image size/count) or a paid/pro tier for higher-quality or higher-volume use;
content that states plainly that results vary by image and should be checked, never a "perfect cutout every
time" claim. **Do not implement Background Remover now.** It needs its own dedicated planning document later
— the same treatment TASK-004A gave PDF Compress and PDF to Image — not a slot in this wave's first-tool
comparison beyond the exclusion this section makes explicit.

## 9. Deliverable and PR speed for this planning task

This PR adds **only** `tasks/TASK-005A-IMAGE-TOOLS-WAVE-PLANNER.md`. No engine, no dependency, no preset,
manifest, content, or code of any kind. `pnpm verify` is expected to pass unchanged (no tools, presets, or
fixtures added or modified). One PR, opened after `pnpm verify` passes.

## 10. Founder decisions needed

No code will be written until these are answered. Recommendations are marked ★.

1. **First tool and sequencing:** ☐ **Image Resize first** ★ (§2) ☐ a different first tool
2. **Background Remover:** ☐ **confirmed not first, not started; deferred to its own future planning
   document** ★ (§9) ☐ founder wants Background Remover scoped now regardless
3. **DOM-in-engine exception for `engines/image`:** ☐ **approve `engines/image` using browser-only
   `OffscreenCanvas`/`createImageBitmap` APIs, accepting `runtimes: ['worker']` only (no Node execution) as a
   disclosed, narrow exception to AGENTS.md golden rule 2** ★ (§3 Q11) ☐ founder wants a different approach
   investigated first (for example a pure-JS/WASM codec that could stay Node-compatible)
4. **Determinism redefinition for image engines:** ☐ **approve that image engine tests assert dimensions,
   format, size bounds, and error codes — not byte-identical output hashes across browsers** ★ (§3 Q15)
   ☐ founder wants a different testing bar investigated first
5. **PR split for the foundation:** ☐ **2 PRs — PR 1 covers `engines/image` and the archetype-D field
   extension together as "foundation," PR 2 is the first visible tool** ★ (§4) ☐ founder wants a single PR
   attempted despite the gaps this plan found
6. **File size / pixel-dimension limits:** ☐ **25 MB per file, 40 megapixel decoded output cap** ★ (§3 Q3/Q4)
   ☐ founder supplies different limits
7. **Batch processing:** ☐ **single image only for v1, batch deferred** ★ (§3 Q9) ☐ founder wants multi-image
   from day one
8. **Output filename strategy:** ☐ **derive from the original file name (for example
   `photo.jpg` → `photo-resized.jpg`)** ★ (§5) ☐ a fixed default name, matching the PDF tools' pattern
9. **JPG background color for transparency:** ☐ **fixed default, white** ★ (§3 Q7) ☐ founder wants a
   different default or a required color picker in v1
10. **Input/output format support for v1:** ☐ **input and output both JPG/PNG/WebP (WebP output
    feature-detected)** ★ (§5) ☐ a narrower or wider set
11. **Exposing the `media` category at 1 tool:** ☐ **proceed — `navigation.minToolsPerCategory` is currently
    1, consistent with the current site config** ★ ☐ founder wants the category held back until more than
    one Image tool exists

## 11. Acceptance checklist (for the eventual PRs — nothing here is done yet)

**PR 1 — Image foundation (`engines/image` + archetype-D field extension, per Founder Decision 5)**
- [ ] `image.resize@1` added to a new `engines/image`, `runtimes: ['worker']` only (Founder Decision 3);
      architecture check green
- [ ] Invalid type, too-large file, invalid/too-large dimensions, and corrupted-image inputs each return
      their own specific typed error (§7's table) — nothing throws for bad user input
- [ ] Archetype D extended with typed, validated width/height/format/quality fields alongside its existing
      file queue — no visible tool wired to it yet
- [ ] Engine-level (Node) tests cover every non-canvas code path (validation, filename/dimension math, error
      codes); pixel-pipeline correctness is explicitly *not* asserted in Node, per Founder Decision 4
- [ ] No existing engine, tool, or category changed
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit

**PR 2 — First image tool (Image Resize)**
- [ ] `/image-resize` works for at least one real JPG, PNG, and WebP input; aspect-ratio lock behaves
      correctly; every format/quality combination in scope produces a downloadable file
- [ ] e2e decodes the downloaded result and asserts actual width/height match the request (§3 Q15) —
      dimensional correctness, not byte-hash equality
- [ ] The transparent-PNG-to-JPG background-color gotcha (§3 Q7) is covered by a real test, not just
      documented
- [ ] Every §7 error and warning shows a specific, correctly worded message
- [ ] Content includes every §5 section, the standing/conditional warnings verbatim, and a worked example
- [ ] The `media` category becomes visible per Founder Decision 11, with copy naming exactly the tools that
      exist (one, at first) and no others
- [ ] `tests/support/tool-page.ts`'s shared file-tool test harness includes the new tool from the first
      commit
- [ ] Network recorder confirms zero requests; no upload path exists anywhere in the code
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit
- [ ] No separate report after this PR alone — a wave checkpoint report is written once several Image tools
      are complete, per §4/the founder's instruction
