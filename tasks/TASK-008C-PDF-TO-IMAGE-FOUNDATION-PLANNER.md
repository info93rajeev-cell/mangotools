# TASK-008C PDF-to-Image Foundation Planner

Report date 2026-09-27 · coding agent: Claude (Claude Code, cloud session)

> **Status: planning only, no implementation.** This is a docs-only planner. No dependency is added, no
> app code changes, no tool, preset, or manifest is created, and PDF to JPG implementation does not start
> in this task. It exists to answer the question raised while scoping TASK-008C (PDF to JPG): this
> platform's PDF engine cannot rasterize a page to an image today, and adding the capability to do so is a
> foundation-level decision, not a one-PR add-on.

## 1. Summary

- **PDF to JPG cannot be built on `pdf-lib` alone.** `pdf-lib` creates and modifies PDF *structure*; it has
  no API to paint a page's visual content onto pixels. This was already known and recorded at the very
  start of the PDF wave — TASK-004A's own foundation planner states plainly that `pdf-lib` "explicitly does
  **not** rasterise pages to images (ruling it out, alone, for PDF to Image)." TASK-008C's own technical
  reality check reconfirmed this directly against the installed package (no `render`/`raster`/`canvas`
  API anywhere in its type definitions), not from memory.
- **A real rasterizer is a new engine capability**, not a config tweak. Adding one means a new dependency
  (governed by AGENTS.md rule 7's `risk:dependency` approval), a bundle-size decision (this platform's own
  build currently reports a 14.6–27.1 KB gzip JS budget per page), a CSP-compatible worker/script hosting
  strategy, and a determinism-policy decision (mirroring the disclosed exception `engines/image` already
  carries for canvas-based image output).
- **The likely candidate is `pdfjs-dist`** (Mozilla's PDF.js distribution) — Apache-2.0 licensed, which is
  on AGENTS.md's allowed-license list, actively maintained, and the de facto standard for client-side PDF
  rendering. This planner evaluates it specifically, rather than leaving "a renderer" abstract.
- **A concrete, favorable architectural finding:** this platform already runs every `runtimes: ['worker']`
  operation inside a real, dedicated Web Worker (one per engine, `packages/runtime/src/worker-host.ts` +
  `engine.worker.ts`), and `engines/image`'s own operations already prove `OffscreenCanvas` works correctly
  inside that same Worker. This means a PDF-rendering operation could very plausibly run pdf.js with its
  own internal worker **disabled** (`disableWorker: true`) — rendering directly inside the PDF engine's
  existing Worker rather than spinning up a second, nested Worker — which would avoid the most complex part
  of a typical pdf.js integration (hosting and CSP-hashing a *second* worker script) entirely. This needs
  to be prototyped and confirmed, not assumed, before it becomes a founder decision.
- **This planner recommends a specific, narrow v1 scope** (§9) and a specific decision list (§11) the
  founder needs to approve before any implementation PR opens — deliberately narrower than a full
  "PDF-to-Image everything" foundation, matching the same discipline TASK-004A/TASK-005A used for their own
  waves.

## 2. Why PDF to JPG needs a real rasterizer

Rendering a PDF page to a JPG requires interpreting the page's content stream — text runs (with embedded or
standard fonts), vector paths, and embedded raster images — and painting all of it onto a pixel grid at a
chosen resolution. That is fundamentally different from what every existing PDF operation in this engine
does:

| Operation | What it does with page content |
|---|---|
| `pdf.merge@1` | Copies whole pages (their underlying PDF objects) between documents, unchanged |
| `pdf.jpgToPdf@1` | Embeds an already-decoded JPEG's pixel data as a new page's own content — the reverse direction, and it only ever *places* an image, never paints one |
| `pdf.split@1` | Copies a page range's own PDF objects into a new document, unchanged |

None of these read or interpret a page's *visual* content — they move already-structured PDF objects
around. Rendering to JPG is the first operation in this engine that would need to actually **interpret and
paint** a page, which is a fundamentally larger, different piece of software: a PDF content-stream
interpreter plus a rasterizer. Writing one from scratch is not realistic or advisable (font handling alone —
embedded subsets, standard 14 fonts, CID-keyed CJK fonts — is a multi-year effort for the existing
open-source projects that do it well); the only responsible path is a well-maintained existing library.

**No shortcut exists.** A browser's native PDF viewer (Chrome's built-in viewer, or an `<embed>`/`<iframe>`)
is not scriptable for pixel export — there is no API to ask it to hand back a canvas or bitmap of what it
rendered, by design (security/sandboxing). There is no way to produce a real, correct JPG of a PDF page
without a real rasterizer somewhere in the pipeline.

## 3. Candidate evaluation: `pdfjs-dist`

- **What it is:** the npm-published, pre-built distribution of PDF.js, Mozilla's own PDF rendering engine
  (used inside Firefox's built-in PDF viewer). It is the standard, most widely used client-side PDF
  rasterizer in the JavaScript ecosystem.
- **License:** Apache-2.0 — on AGENTS.md rule 7's allowed list (MIT, Apache-2.0, BSD, ISC, 0BSD, MPL-2.0).
  No license conflict.
- **Current version:** the 6.x line (actively maintained, monthly-ish releases). Any approval should pin a
  specific version at adoption time and record it in the engine README's changelog, per this platform's own
  convention for every other dependency.
- **What it provides:** a `getDocument()` API that parses a PDF from bytes, a `page.getViewport({ scale })`
  call to compute pixel dimensions at a chosen resolution, and a `page.render({ canvasContext, viewport })`
  call that paints the page onto any 2D canvas context — including an `OffscreenCanvas`, which this engine
  already uses successfully in `engines/image`. This is exactly the shape TASK-008C's own "preferred
  implementation approach" describes (load PDF → render page to canvas → export canvas as JPG).
- **Runtime footprint:** pdf.js ships a core parsing/rendering module plus, by default, a separate worker
  script it uses to keep parsing off the calling thread. Exact minified/gzipped byte counts should be
  measured directly against the version actually adopted (see §5) rather than quoted from memory here —
  bundle size claims that go stale are worse than no claim. What is stable and worth stating now: it is
  meaningfully larger than any dependency this platform has added so far (`pdf-lib` is a pure
  structure-manipulation library with no rendering code to carry; pdf.js's rendering and font-handling code
  is inherently larger), and it is the kind of dependency that must be lazy-loaded, not bundled into every
  page's shared chunk (see §5).
- **Known limitation to scope around:** full-fidelity rendering of non-Latin scripts (CJK, etc.) and some
  embedded font edge cases benefits from pdf.js's optional "cmaps" and "standard fonts" asset packages,
  shipped as separate files. A v1 that ships without bundling those assets will still render the large
  majority of real-world PDFs (Latin-script text with standard or embedded fonts, vector graphics, embedded
  images) correctly, but should disclose the limitation plainly in the tool's content page rather than
  silently producing degraded output for the PDFs it doesn't handle perfectly — the same "disclosed
  exception" discipline this platform already uses for `pdf.jpgToPdf@1`'s own EXIF-orientation limitation.

**Recommendation:** `pdfjs-dist` is the right candidate to bring to founder approval. No alternative library
is meaningfully more established, better licensed, or lighter for equivalent capability — the tradeoffs
here are about *how* to integrate it (lazy-loading, worker strategy), not *whether* it's the right choice.

## 4. Dependency approval needed

Per AGENTS.md rule 7, `pdfjs-dist` **cannot be added without an approved, `risk:dependency`-labelled
decision** — exactly the same gate `pdf-lib` itself went through at the start of the PDF wave (TASK-004A
§11, Founder Decision 3). This planner does not add the dependency; it prepares the decision so the founder
can approve it explicitly, the same way `pdf-lib`'s own adoption was recorded before any PDF Merge code was
written.

## 5. Bundle-size risk and lazy-loading strategy

- **The platform's current budget is tiny by design.** `pnpm build`'s own summary line (checked as part of
  this planner) reports "home JS 14.6 KB, largest page JS 27.1 KB (gzip)" as of the current build. Adding
  `pdfjs-dist` to the site's shared bundle would be a large, visible regression against a number this
  platform actively tracks and reports on every build.
- **The fix is scoping, not avoidance:** `pdfjs-dist` must be loaded **only on the PDF to JPG tool's own
  page**, and ideally only once the user has actually selected a file (a dynamic `import()`, not a static
  one), not bundled into the shared/home/navigation chunk every page pays for. This platform's existing
  build (Astro + Vite, per `apps/web`) already supports per-route and dynamic-import code-splitting; this is
  a matter of using that correctly for this one tool, not a new build-system capability.
- **A concrete acceptance bar for the eventual implementation PR:** the PR must show, in its own evidence
  section, the actual gzip size added to the PDF to JPG page specifically (not the shared bundle), and
  confirm every other page's own JS size is unchanged. "We lazy-loaded it" is a claim; the build's own
  reported numbers are the proof.
- **Do not guess a size threshold now.** Rather than picking an arbitrary KB ceiling in this planner without
  having measured the real number, the founder decision (§11) should be "approve pdfjs-dist conditional on
  the implementation PR proving the shared bundle is unaffected and reporting the actual per-page size
  added" — a testable gate, not a guess.

## 6. Worker execution model and CSP requirements

- **This platform already runs PDF operations inside a real Web Worker.** `pdf.merge@1`, `pdf.jpgToPdf@1`,
  and `pdf.split@1` all declare `runtimes: ['worker', 'node']`; in the browser, `packages/runtime`'s
  `createWorkerHost` spins up one real Web Worker per engine (`engine.worker.ts`) and every operation call
  for that engine runs inside it — confirmed by reading `worker-host.ts` directly, not assumed.
- **`engines/image` already proves `OffscreenCanvas` works inside that same Worker context.** Every image
  operation (`image.resize@1`, `image.crop@1`, `image.favicon@1`, etc.) decodes and draws onto an
  `OffscreenCanvas` from inside its own engine Worker today. A PDF-rendering operation drawing onto an
  `OffscreenCanvas` from inside the PDF engine's own Worker is the same proven pattern, not a new one.
- **The favorable implication:** pdf.js supports a `disableWorker: true` option on `getDocument()`, which
  runs its own parsing/rendering synchronously on the calling thread instead of spinning up its own
  internal Worker. Since the "calling thread" here would already be this platform's own dedicated PDF
  engine Worker (not the page's main UI thread), setting `disableWorker: true` very plausibly avoids the
  single most complex part of a typical pdf.js integration — hosting, hashing, and CSP-allowing a *second*,
  nested worker script — while still keeping all the rendering work off the main UI thread, preserving the
  "the page stays responsive" guarantee every other worker-runtime tool already gives.
- **This must be prototyped, not assumed, before implementation.** A short spike (inside the eventual
  implementation PR, or as this planner's own recommended first step of that PR) should confirm
  `disableWorker: true` actually renders correctly inside a Web Worker in Chromium, Firefox, and WebKit —
  nested-worker and synchronous-fallback behavior can have real per-browser differences pdf.js's own issue
  tracker documents. If it does not hold up in one browser engine, the fallback is a second, self-hosted
  worker script — solvable, but with the CSP-hashing work this section exists to flag in advance.
- **CSP compliance either way.** `tests/seo/seo.spec.ts` enforces `script-src 'self' 'sha256-...'` (no
  third-party scripts, no `unsafe-eval`) and a page-level "no CSP violations" check, per
  `docs/architecture/platform-security-architecture.md`'s "no third-party scripts" policy. Whatever pdf.js
  code ships must be self-hosted from this site's own build output (not loaded from a CDN) and must not
  rely on `eval`/`Function` construction at runtime — this needs a direct check against the specific
  version adopted, since pdf.js's own internals have changed across major versions.

## 7. Determinism policy implication

`engines/image` already carries a disclosed, founder-approved exception to this platform's normal
byte-identical determinism bar, because canvas-based encoders are implementation-defined per browser engine
(`engines/image/README.md`'s "Determinism" section). A PDF-rendering operation would need the **same**
disclosed exception, for the same underlying reason (canvas rendering and JPEG encoding are not
spec-guaranteed identical across browsers) — this is not a new kind of exception to invent, just the same
one already precedented and already generically excluded by `scripts/generate/pipeline.ts`'s
`determinismCases()` (which excludes any operation not declaring `'node'` among its runtimes). A PDF
rasterizing operation would declare `runtimes: ['worker']` only (matching `engines/image`, since
`OffscreenCanvas`/rendering do not exist in plain Node either), automatically picked up by that same
existing, generic exclusion — no pipeline change needed, only the same disclosure already written once for
`engines/image`.

## 8. Testing plan (for the eventual implementation PR, not this one)

- **Engine (Vitest):** only the pre-render, pre-decode validation paths are Node-testable (file presence,
  signature, size, page-number shape) — matching every existing worker-only operation's own fixture
  strategy (`engines/image`'s own operations already document this split in each operation's README).
  Actual rendering/output assertions (dimensions, format) belong in Playwright, not Vitest, for the same
  reason `image.crop@1`'s out-of-bounds behavior is e2e-tested rather than fixture-tested.
- **Playwright/e2e:** upload a real multi-page test PDF, select a page, download, and assert the downloaded
  file decodes as a JPG of the expected pixel dimensions (the same "produce a real file, then verify its
  real properties" discipline every other file tool's e2e suite already uses). Cover an out-of-range page
  number, a non-PDF file, and (if the chosen approach can detect it cleanly) an encrypted PDF.
  Cross-browser rendering differences (per §7) mean assertions should check the stable contract (correct
  pixel dimensions, correct format, a non-trivial file size) rather than a specific byte-identical output.
- **Bundle-size check:** as described in §5, the implementation PR's own evidence must show the lazy-loaded
  size and confirm no regression to any other page.
- **CSP check:** the existing `pages run under the CSP without violations` e2e test (`tests/seo/seo.spec.ts`)
  must stay green on the PDF to JPG page specifically, with pdf.js loaded and actually exercised (not just
  present on an untested page).

## 9. Safest first implementation scope (recommended v1, once approved)

Matching TASK-008C's own original brief almost exactly, with the refinements this planner's investigation
surfaced:

- One PDF file, one page number, one JPG output — no multi-page or ZIP output (this platform's file-tool UI
  is single-file-in/single-file-out today, the same limitation already documented for Favicon Generator).
- A fixed, reasonable render scale/DPI for v1 (no user-facing scale control yet) — keeps the first
  implementation's surface area small; a scale/quality control can be added later once the rendering
  foundation itself is proven.
- JPG output only (matching the tool's own name and the brief's scope) — no PNG/WebP output option in v1.
- Disclosed limitation: PDFs relying on pdf.js's optional cmap/standard-font asset packages for full text
  fidelity may render with minor font substitution artifacts in v1, stated plainly in the tool's content
  page rather than silently degraded.
- Password-protected PDFs are rejected with a clear, typed error (matching `pdf.merge@1`/`pdf.split@1`'s own
  `isEncrypted` check) — no password entry in v1.

## 10. Out of scope / risks to avoid (unchanged from the original brief)

No multi-page output, no ZIP export, no batch PDFs, no PDF to PNG/WebP, no OCR, no text extraction, no AI,
no server-side rendering, no cloud storage, no login/account, no subscription, no page thumbnails/preview,
no drag/reorder, no PDF editing UI. This planner adds one more: **do not bundle `pdfjs-dist` into any
shared/page-wide chunk** — that would be a platform-wide regression, not a PDF to JPG–specific one.

## 11. Founder decisions needed

No dependency is added and no implementation starts until these are answered. Recommendations are marked ★.

1. **Rendering library:** ☐ **approve `pdfjs-dist` (Apache-2.0) as a new dependency, with a
   `risk:dependency`-labelled issue per AGENTS.md rule 7, version pinned at adoption time** ★ (§3, §4)
   ☐ founder wants a different library evaluated first
2. **Bundle-size gate:** ☐ **approve conditionally — the implementation PR must lazy-load `pdfjs-dist` on
   the PDF to JPG page only and report the actual gzip size added, with every other page's own JS size
   unchanged** ★ (§5) ☐ founder wants a specific KB ceiling set in advance instead
3. **Worker strategy:** ☐ **prototype `disableWorker: true` inside the PDF engine's existing per-engine
   Worker first (§6); fall back to a self-hosted second worker script, with its own CSP hash, only if that
   does not hold up across Chromium/Firefox/WebKit** ★ ☐ founder wants a self-hosted second worker planned
   from the start
4. **Determinism disclosure:** ☐ **apply the same disclosed, `runtimes: ['worker']`-only exception
   `engines/image` already carries (§7) — no new pipeline change needed** ★ ☐ founder wants a different
   determinism story evaluated
5. **Font-fidelity limitation:** ☐ **ship v1 without bundling pdf.js's optional cmap/standard-font asset
   packages, disclosed plainly in the tool's content page (§3, §9)** ★ ☐ founder wants those assets bundled
   from v1 (larger footprint, addressed as a separate, explicit decision if so)
6. **Scope confirmation:** ☐ **the v1 scope in §9 (one file, one page, one JPG, fixed scale, JPG-only
   output)** ★ ☐ founder wants a different v1 boundary

## 12. Recommendation / next steps

Once the founder decisions in §11 are answered, the correct next task is an implementation PR — most
naturally split the same way TASK-004A/TASK-005A split their own foundations if the actual work turns out
larger than expected in practice:

- **PR 1 (foundation):** add the approved `pdfjs-dist` dependency, the new `pdf.renderPage@1`-style engine
  operation (naming TBD at implementation time) proving the disableWorker/OffscreenCanvas render path works
  end to end in Chromium, Firefox, and WebKit, with no visible tool yet — mirroring `image.resize@1`'s own
  "foundation PR, no visible tool" precedent (TASK-005B PR 1).
- **PR 2 (visible tool):** the PDF to JPG preset, manifest, content page, and the PDF ↔ Image
  workflow-loop related links described in the original TASK-008C brief.

This planner does not schedule either PR outright — per this session's standing instructions, no
implementation starts until the founder explicitly says so.
