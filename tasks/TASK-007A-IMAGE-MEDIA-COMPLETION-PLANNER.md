# TASK-007A — Image & Media Completion Planner (plan only)

> **Planning document. No code has been written, no schema, engine, preset, manifest or content file has
> been created or changed, no dependency added, and no existing tool has been touched.** This revisits the
> Image & Media category — paused at two tools since TASK-005's own checkpoint report — and plans whether
> and how to complete it further, using the same candidate-tool list TASK-005A already produced and TASK-005's
> checkpoint report (`tasks/TASK-005-IMAGE-WAVE-CHECKPOINT-REPORT.md` §10) already deferred, now re-examined
> with the benefit of what TASK-005B/TASK-005C actually built. This is a separate, parallel planning track:
> the Civil & Construction sequence (TASK-006F onward) remains explicitly paused per the founder's own
> instruction and is untouched by this document.

## Context

- **Current platform: 18 live tools across 6 visible categories** — Logistics (4: CBM, Volumetric Weight,
  Container Loading, Pallet Loading), Business & Finance (3: GST, Profit Margin, Markup), Developer & Data
  (3: JSON Formatter, Base64, URL Encode/Decode), Civil & Construction (4: Concrete Quantity, Excavation,
  Brickwork, Plaster), PDF & Documents (2: PDF Merge, JPG to PDF), **Image & Media (2: Image Resize, Image
  Compress)**.
- **Image & Media has not grown since TASK-005C.** TASK-005's checkpoint report explicitly recommended
  pausing Image tools after Resize and Compress and opening Civil & Construction instead (§11 of that
  report) — a recommendation the founder took, and which this session then executed through TASK-006A–E.
  Civil & Construction is itself mid-sequence (4 of 9 planned tools shipped; TASK-006F–J and the wave
  checkpoint remain pending, explicitly not started per the founder's own most recent instruction). This
  document does not reopen or reorder that sequence — it plans a *second*, independent track for a category
  that has been idle for four wave-cycles, so both plans exist and either can be approved to proceed next
  without blocking on the other.
- **TASK-005's own checkpoint report already named ten candidates it did not build**, with each one's own
  reasoning (`tasks/TASK-005-IMAGE-WAVE-CHECKPOINT-REPORT.md` §10): Background Remover, JPG to PNG,
  PNG to JPG, WebP Converter, EXIF/Metadata Remover, Passport Photo/ID Photo Tool, Image Watermark Tool,
  batch processing, ZIP downloads, and AI upscaling/editing. This plan re-examines those same candidates —
  it does not invent a new list — and adds two findings from actually reading the shipped code that TASK-005A
  could not have known before implementation existed (§2, §5).

## Why this planning task exists

Two things make "just resume TASK-005A's list" insufficient on its own, both found by reading the code that
now exists rather than assumed from the original plan:

- **TASK-005A recommended three separate converter tools (JPG to PNG, PNG to JPG, WebP Converter) before
  Image Resize existed.** Image Resize now ships with an output-format selector (JPG/PNG/WebP, feature-
  detected) as one of its core fields, and Image Compress already proved that a *second* tool can reuse
  `image.resize@1` behind different framing and wording with **zero engine changes** — only a new preset and
  a `deriveOutputFileName` style override (`engines/image/src/operations/resize/file-name.ts`'s own
  `style?: { suffix, fallbackBase }` parameter, added in TASK-005C specifically so a reused preset is not
  locked into Image Resize's `-resized` wording). Three separate, single-direction converter tools would
  compete with each other and with Image Resize itself for the same search terms and mostly duplicate
  content — a real, nameable risk TASK-005A could not have flagged before Compress's reuse pattern existed
  to prove it out. §2 proposes one unified tool instead.
- **The Image & Media category's own listed copy is stale and should be corrected whenever this category
  next ships a tool**, found by reading `taxonomy/categories.yaml` directly rather than assumed: its `faq`
  entry still reads *"This category currently has one tool, Image Resize. Further image tools may be added
  later,"* and its `summary`/`seo.description` still describe only Image Resize by name, even though Image
  Compress has been live since TASK-005C. This is not a defect introduced by this plan — it is an existing
  gap this plan is flagging because the next tool to ship in this category is the natural, lowest-friction
  place to fix it (a small, additive copy change alongside real new content, not a dedicated PR just for
  wording). Recorded as a required item in whichever PR ships next (§7 acceptance checklist), not treated as
  optional polish.

## 1. Candidate tools, re-classified

| # | Tool | Class | Why (updated from TASK-005A/TASK-005 §10 with what actually shipped) |
|---|---|---|---|
| 1 | **Image Format Converter** (JPG ⇄ PNG ⇄ WebP, one tool) | **Simple** | Replaces TASK-005A's three separate converter candidates (§ intro). Reuses `image.resize@1` exactly as Image Compress does — same decoded dimensions preserved, format selector exposed, quality control shown only for lossy output — needing **no engine change at all**, only a new preset (`presets/image/convert.yaml`) using the existing `style` override for its own output-name wording (for example `-converted`, matching the precedent Compress already set). |
| 2 | **EXIF / Metadata Remover** | **Simple** | Unchanged from TASK-005A's own classification: the one image tool that is pure, byte-level logic (locating and stripping JPEG APP1/EXIF segments directly, no canvas, no re-encode, no quality loss) and can declare `runtimes: ['worker', 'node']` — the only image-category tool that can rejoin this platform's full byte-identical cross-browser determinism suite, unlike every canvas-based tool in this category. Needs a genuinely new operation (`image.exif-remove@1`), not a reuse of `image.resize@1`. |
| 3 | **Image Watermark Tool** (text, anchor-point placement) | **Medium** | Unchanged classification from TASK-005A. A new drawing primitive (draw text onto the canvas at one of 9 preset anchor positions: corners/edges/center) with a new operation, but no new UI archetype — anchor-point selection is a `select` field, not free-drag placement. **Logo/image-file watermarking is out of scope for v1** (a second file input is a new archetype-D shape this plan does not recommend opening for a first watermark tool); text-only keeps this Medium rather than Medium–Complex. |
| 4 | **Image Crop** | **Medium–Complex** | Unchanged from TASK-005A: needs a genuinely new, interactive-canvas UI archetype (closer to the architecture doc's "archetype E: visual canvas" than to archetype D's file-plus-fields shape). Still not buildable as a small extension. Still blocks Passport Photo and free-drag Watermark placement, neither of which is recommended here (§6). |
| 5 | **Passport Photo / ID Photo Tool** | **Complex** | Unchanged: depends on Crop (not built), needs physical print units (mm/inch at a target DPI — a new unit dimension no image tool needs otherwise), multiple country/authority size presets, and disclaimer wording that must avoid implying any guarantee of official acceptance. Still gated on Crop. |
| 6 | **Background Remover** | **Complex** | Unchanged from TASK-005A §9/TASK-005 §10: likely needs ML/on-device or server inference (a dependency and cost class this platform has never taken on), a server path would break this platform's no-upload positioning, output quality cannot be promised, and it plausibly needs a paid/pro tier — a business-model decision that should not be backed into by building the tool first. Still needs its own dedicated planning document, still must not be built as part of this completion pass. |
| 7 | **Batch image processing / ZIP downloads** | **Medium** (as a cross-cutting capability, not a tool) | Unchanged reasoning from TASK-005A §3 Q9/Q10: resize/quality/format settings are naturally per-image, so a queue needs either one shared setting set (a real behavior change users must understand) or per-item settings (real, unscoped UI complexity); ZIP output is a new dependency question under AGENTS.md rule 7. Still not recommended for this pass — see §6. |
| 8 | **AI upscaling / AI-assisted editing of any kind** | out of scope, not classified | Excluded outright, matching this platform's "no AI" positioning stated in every Image & Media tool's content so far. Not re-examined here. |

## 2. First tool recommendation

The candidate this plan checks first against the others is **Image Format Converter**, on the same axes
used for every prior wave's first-tool choice: **new-architecture cost**, **search demand**, and **risk of
duplicating or cannibalizing an existing tool's own content**.

| Tool | New engine work | New UI capability | Search demand | Risk found |
|---|---|---|---|---|
| **Image Format Converter** | **None** — reuses `image.resize@1` exactly as Compress does | **None** — reuses archetype D's existing file + format-select + quality fields | Very high ("jpg to png converter", "png to jpg converter", "convert to webp") — three of TASK-005's own highest-search deferred candidates, served by one tool | Low, **if built as one unified tool** rather than three separate ones (§ intro); building three separate tools would itself be the risk (keyword cannibalization, near-duplicate content across three manifest/content files) |
| EXIF / Metadata Remover | A new, small, pure operation | None | Lower ("remove exif", "strip metadata") | Low, but teaches this category nothing it does not already have (the canvas pipeline is already proven) |
| Image Watermark Tool | A new operation (new canvas draw primitive) | None (anchor-point select) | Medium ("add watermark to image") | Low–Medium — genuinely new drawing logic to get right (text sizing/wrapping at different anchor positions, contrast/legibility warnings) |

**Recommendation: confirm Image Format Converter as the next tool**, for the same class of reason Image
Resize itself was confirmed first in TASK-005A: it is the only candidate here that needs **zero new engine
or UI capability** (a genuine rarity — every prior wave's first tool needed at least one architectural
extension), it has the highest combined search demand of anything left in this category, and — unlike
building three separate converters — it resolves a real problem this plan can name rather than create one:
JPG↔PNG↔WebP conversion currently has no dedicated page at all, even though Image Resize's own format
selector can already do the conversion, which is exactly the kind of "a real capability exists but is not
discoverable under the name people search for" gap a single, correctly-named tool should close, once,
rather than three times. **EXIF Remover is recommended as the natural second tool** in this completion pass
(§6) precisely because it is genuinely new, low-risk, and the only Image & Media tool that can rejoin this
platform's full determinism suite. **Watermark is a reasonable third.** **Crop, Passport Photo, Background
Remover, and batch/ZIP are not recommended for this pass** — see §6.

## 3. Architecture questions

**1. Does Image Format Converter need a new engine operation?**
No. It reuses `image.resize@1` unchanged — request the source's own decoded width/height as the target (no
resize actually occurs unless the user separately changes them, matching Image Compress's own precedent
exactly), expose the format selector and quality control, and use `deriveOutputFileName`'s existing `style`
parameter for this tool's own output-name wording (for example `-converted`, `converted-image`). No engine
file changes at all — confirmed by reading `engines/image/src/operations/resize/file-name.ts` directly,
which added this exact override hook in TASK-005C for a second reuse case.

**2. Should the three original directions (JPG→PNG, PNG→JPG, →WebP) really be one tool, or three?**
**One tool, all directions**, not three separate tools. The underlying operation does not care which format
is "from" and which is "to" — it takes a source file of a detected type and a requested output format. A
single "Image Format Converter" (input: any of JPG/PNG/WebP; output: any of JPG/PNG/WebP) covers every
direction TASK-005A's three candidates named, with one manifest, one content page, and one place to state
the transparency-to-JPG white-flatten behavior (already proven correct in Image Resize) instead of three
near-duplicate pages that would also compete with each other and with Image Resize in search results. This
is a direct, disclosed deviation from TASK-005A's original three-tool framing, made now because Compress's
actual reuse pattern did not exist to inform that framing at the time.

**3. Does EXIF Remover need the DOM-in-engine exception `image.resize@1` needed?**
No — the opposite finding from TASK-005A's own Q11 for Resize. EXIF/APP1 segment removal is byte-level
parsing of a JPEG's own container structure (locate marker segments, drop APP1, leave image data
untouched), the same class of operation as this platform's existing `hasPdfSignature`/`hasJpegSignature`
byte-signature scanning in `engines/pdf`. It needs no canvas, no `OffscreenCanvas`, no `createImageBitmap`,
so it can declare `runtimes: ['worker', 'node']` and be fully Node-testable and fully covered by the
existing byte-identical determinism suite — a genuine, disclosed exception *to* the image category's own
disclosed exception, not a new one.

**4. Should EXIF Remover apply to PNG/WebP as well as JPG?**
Recommend **JPG only for v1**, stated plainly in content rather than silently assumed. EXIF/APP1 is a JPEG
container concept; PNG and WebP carry incidental metadata in different chunk/container formats (PNG
`tEXt`/`eXIf` chunks, WebP `EXIF`/`XMP` RIFF chunks) that would each need their own, separately-verified
parsing logic. Scoping to JPG first (by far the most common camera/phone EXIF carrier) ships a correct,
narrow tool now rather than a broader one with unverified edge cases in two other container formats.

**5. Does Image Watermark need a new UI archetype?**
No. Anchor-point placement (9 preset positions via a `select` field) fits archetype D's existing file +
typed-fields shape exactly like Image Resize's own width/height/format/quality fields do. Free-drag
placement would need Crop's not-yet-built interactive canvas (archetype E) and is explicitly deferred, not
part of this recommendation.

**6. What text-rendering risk does Watermark introduce that this category has not needed before?**
A genuinely new one: text must remain legible against an arbitrary background image at an arbitrary anchor
position — a light watermark on a light photo, or text wider than the image at small sizes, are real failure
modes with no universal "correct" answer. Recommend a fixed, disclosed default (a semi-transparent dark
outline/shadow behind the text, or a solid contrasting background chip) stated plainly as a best-effort
legibility aid, never a guarantee, mirroring the same hedged-claim discipline TASK-005A required for
Background Remover's output quality.

**7. Should the Image & Media category's stale copy be fixed as part of the next tool, or separately?**
**As part of the next tool's own PR**, not a separate copy-only PR. The `faq`/`summary`/`seo.description`
fields in `taxonomy/categories.yaml`'s `media` entry need updating regardless of which tool ships next (they
already understate the category at 2 tools; a 3rd tool makes the gap worse, not new), so the smallest correct
fix is folding it into whichever tool's PR next touches this category, exactly as any other taxonomy update
already happens alongside a tool PR in this codebase's own convention (`docs/playbooks/add-tool.md`).

## 4. Privacy / trust / safety wording

Extends the existing Image & Media safe-wording list (`tasks/TASK-005A-IMAGE-TOOLS-WAVE-PLANNER.md` §6,
already in production use on Image Resize and Image Compress), rather than replacing it:

**New safe wording needed for this pass:**
- "Converting between formats may change file size, and converting to JPG removes transparency." (Format
  Converter, reusing the exact, already-shipped transparency-to-JPG wording from Image Resize)
- "Removes metadata such as camera model, camera settings, and GPS location, if present, from a JPG image."
  (EXIF Remover — stated as "if present," never implying every JPG carries this data)
- "This does not guarantee all identifying information is removed." (EXIF Remover — a JPG can still carry
  identifying information outside EXIF, for example in its visible pixels; the tool must not be read as a
  general anonymization guarantee)
- "Watermark placement and legibility are not guaranteed against every background." (Watermark)

**No new items needed for the "wording to avoid" list** — the existing list (100% secure, guaranteed,
lossless unless strictly true, works with all images, and so on) already covers every risk this pass
introduces; EXIF Remover in particular must avoid any phrase implying it makes an image "anonymous" or
"untraceable," which it does not.

## 5. PR speed rule

Checked against the same "does this need a new capability, or does it fit what already exists" test every
prior wave's PR-speed recommendation used:

| Tool | New engine work | New UI capability | Recommended PRs |
|---|---|---|---|
| **Image Format Converter** | None (§3 Q1) | None | **1** — a new preset + tool only, plus the category copy fix (§3 Q7) |
| **EXIF / Metadata Remover** | A new, small, pure operation (§3 Q3) | None | **1** — new operation, preset, and tool together, matching Concrete Quantity's and Excavation's own one-PR precedent for a self-contained, no-new-UI-capability tool |
| **Image Watermark Tool** | A new operation (new drawing primitive) | None (§3 Q5) | **1**, tentatively — recommend confirming this only once the text-legibility default (§3 Q6) is settled; if it proves to need genuinely new field types beyond a `select` anchor and a text input, re-evaluate for a 2-PR split at that time, not assumed now |

**No separate report PR after each tool** — matching every prior wave's own discipline, a completion
checkpoint is written once this pass's approved tools are shipped, not after each one.

## 6. Explicitly not recommended for this pass

- **Image Crop** — still needs a genuinely new interactive-canvas UI archetype; not a small extension of
  anything that exists. A candidate for its own dedicated planning document if the founder wants to invest
  in that archetype, not a slot in this completion pass.
- **Passport Photo / ID Photo Tool** — gated on Crop; also carries real-consequence disclaimer risk (a
  rejected visa/passport application) that deserves its own careful wording pass once Crop exists.
- **Background Remover** — Complex, ML/privacy/cost/paid-tier questions unresolved; needs its own dedicated
  planning document exactly as TASK-005A originally required, not reopened here.
- **Batch processing / ZIP downloads** — real, unscoped UI and dependency questions (§1 item 7); revisit
  only once single-image tools in this category are otherwise complete and the founder wants to invest in a
  queue UI specifically.
- **AI upscaling or any AI-assisted editing** — excluded outright, consistent with this platform's stated
  "no AI" positioning.

## 7. Deliverable and PR speed for this planning task

This PR adds **only** `tasks/TASK-007A-IMAGE-MEDIA-COMPLETION-PLANNER.md`. No engine, no dependency, no
preset, manifest, content, or code of any kind, and no change to `taxonomy/categories.yaml` (the stale-copy
finding in §3 Q7 is flagged for the next tool's own PR, not fixed here). `pnpm verify` is expected to pass
unchanged. One PR, opened after `pnpm verify` passes.

## 8. Founder decisions needed

No code will be written until these are answered. Recommendations are marked ★.

1. **Approve this as a second, parallel track alongside the paused Civil & Construction sequence:**
   ☐ **yes — plan Image & Media's completion now without reordering or resuming TASK-006F** ★ ☐ hold this
   until the Civil sequence reaches its own checkpoint
2. **First tool of this pass:** ☐ **Image Format Converter (JPG ⇄ PNG ⇄ WebP, one unified tool)** ★ (§2)
   ☐ a different first tool
3. **Three separate converter tools vs. one unified tool:** ☐ **one unified Image Format Converter,
   replacing TASK-005A's three separate candidates** ★ (§3 Q2) ☐ founder wants three separate tools built
   regardless, for individual SEO landing pages per direction
4. **EXIF Remover scope:** ☐ **JPG only for v1** ★ (§3 Q4) ☐ founder wants PNG/WebP metadata handling
   investigated and scoped now as well
5. **Watermark v1 scope:** ☐ **text only, 9 anchor-point positions, no logo/image upload** ★ (§1 item 3)
   ☐ founder wants logo/image watermarking scoped now
6. **Category copy fix:** ☐ **fold into whichever tool ships next in this category** ★ (§3 Q7) ☐ founder
   wants it fixed immediately as its own small PR, ahead of any new tool
7. **Sequencing within this pass:** ☐ **Format Converter → EXIF Remover → Watermark, one PR each, no report
   between them** ★ (§2, §5) ☐ a different order or a different subset

## 9. Acceptance checklist (for the eventual PRs — nothing here is done yet)

**Image Format Converter**
- [ ] New preset only (`presets/image/convert.yaml`) reusing `image.resize@1` unchanged; no engine file
      touched
- [ ] Output-name style uses `deriveOutputFileName`'s existing `style` override with this tool's own suffix
      (not `-resized` or `-compressed`)
- [ ] Every direction (JPG→PNG, JPG→WebP, PNG→JPG, PNG→WebP, WebP→JPG, WebP→PNG, and same-format passthrough)
      covered by at least one e2e case
- [ ] The transparency-to-JPG white-flatten behavior and warning are covered, reusing Image Resize's own
      proven behavior, not reimplemented
- [ ] `taxonomy/categories.yaml`'s `media` entry (`summary`, `seo.description`, `faq`) updated to name all
      tools actually live in the category at merge time, not just the newest one
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit

**EXIF / Metadata Remover**
- [ ] `image.exif-remove@1` (or equivalent) added, `runtimes: ['worker', 'node']`; full determinism-suite
      membership; architecture check green
- [ ] JPG-only scope stated in content; a non-JPG input produces a specific, typed error, not a silent no-op
- [ ] Node-level fixtures cover locating and stripping APP1/EXIF segments on real, hand-built minimal JPEGs,
      matching this platform's existing byte-fixture discipline
- [ ] Content states plainly that this does not guarantee all identifying information is removed (§4)
- [ ] `taxonomy/categories.yaml`'s `media` entry updated again if not already current from the prior tool
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit

**Image Watermark Tool**
- [ ] New operation added with a text-drawing primitive and 9 anchor-point positions; no interactive
      drag UI
- [ ] Legibility wording (§3 Q6) shown as a standing warning, not a guarantee
- [ ] `taxonomy/categories.yaml`'s `media` entry updated again if not already current
- [ ] CI green on Node 24 × Chromium / Firefox / WebKit

**All three, if built:**
- [ ] No existing tool (Image Resize, Image Compress) changed except where explicitly noted above
- [ ] No out-of-scope feature from §6 added
- [ ] No separate report PR after each tool; a completion checkpoint report is written once this pass's
      approved tools are shipped
