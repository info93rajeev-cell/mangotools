# TASK-008A Search-Driven Tools Completion Planner

Report date 2026-09-27 · coding agent: Claude (Claude Code, cloud session)

> **Status: planning only, no implementation.** This is a docs-only planner. No app code changed, no new
> tool started, no Civil, video, Fix & Growth, or AI/agent work started. It exists to decide the next
> completion direction for the general tools platform before any further implementation task begins.

## 1. Summary

- The project should now move from **"adding tools one by one"** to **"search-driven completion"** — a
  deliberate pass over the platform's thinner categories, prioritized by what people actually search for,
  rather than continuing to add tools in whichever order occurs to us next.
- The platform should prioritize **deterministic, JavaScript-first** tools: rule-based, calculable, or
  directly derived from input, running client-side wherever practical — the same discipline that has held
  for every tool shipped so far (PDF, Image & Media, Logistics, Business & Finance, Civil & Construction).
- **The goal is not to build every possible tool.** A tools directory with hundreds of low-traffic,
  near-duplicate utilities is worse than one with a smaller number of tools people actually search for and
  return to.
- The goal is to build tools with **search demand, repeat use, and feasible browser implementation** —
  in that order of importance.
- **Fix & Growth is not considered in this phase.** It is out of scope for this planner entirely, beyond
  this one scope note.
- **AI video is out of scope, permanently.** Not deferred, not "later" — excluded by policy.
- **Server-side video is deferred.** It may be considered later, only as a possible paid/pro layer, only
  after real traffic and demand exist, and only after this general tools platform is stronger.
- **The Civil ecosystem comes later**, after the general tools foundation is stronger. This planner
  preserves that direction (see §10) without starting any Civil ecosystem work now.

## 2. Current platform status

- **Visible tools: 23**
- **Visible categories: 6**

| Category | Tools | Note |
|---|---|---|
| Developer & Data | 3 | Still thin |
| Business & Finance | 3 | Still thin |
| Logistics | 4 | Reasonably balanced already |
| PDF & Documents | 2 | Still thin |
| Image & Media | 7 | Checkpoint complete (see TASK-007) |
| Civil & Construction | 4 | Real tools, but not yet a complete ecosystem |

- **Image & Media checkpoint is complete** (TASK-007A–F, closed by the TASK-007 checkpoint report). No
  further Image & Media tool is proposed as urgent in this planner; a short list of future candidates is
  kept in §4 and §7 for later, founder-approved sequencing only.
- **Civil & Construction has 4 tools but is not yet a complete ecosystem.** It currently reads as a
  reasonable calculator cluster (Concrete Quantity, Excavation, Brickwork, Plaster), not yet the
  full quantity-survey/estimation/surveying ecosystem the founder has in mind for later (§10).
- **PDF & Documents is still thin** — only PDF Merge and JPG to PDF exist, despite PDF tools generally
  carrying strong, consistent search demand.
- **Developer & Data is still thin** — only JSON Formatter, Base64 Encode/Decode, and URL Encode/Decode
  exist, despite this being one of the highest-search-volume, lowest-implementation-cost categories
  available (nearly every candidate tool is pure, synchronous, dependency-free JavaScript).
- **Business & Finance is still thin** — only GST Calculator, Profit Margin Calculator, and Markup
  Calculator exist, leaving several very common, high-search calculator types unaddressed (EMI, discount,
  simple/compound interest, break-even).

## 3. Completion strategy

"Completion" for this platform is defined deliberately narrowly:

- **Not** "every possible tool that could plausibly exist."
- **Instead:** enough high-search, high-utility, low-cost tools to make the website feel credible and
  useful in each category it claims to serve — enough depth that a category reads as a real destination,
  not a placeholder with two or three tools bolted on.

As planning guidance only (not a hard promise, and not a task to schedule outright):

- A practical target before major Civil ecosystem work begins is roughly **40 to 50 visible tools total**,
  across **6 to 8 strong categories**.
- Each main category should have **at least 5 useful tools where practical** — thin categories (PDF &
  Documents, Developer & Data, Business & Finance) are the priority gap; categories already past that bar
  (Logistics, Image & Media) do not need forced additions just to keep pace.
- This target exists to guide sequencing decisions, not to justify rushing low-value tools into any
  category just to hit a number.

## 4. Category-by-category gap analysis

### Developer & Data

Current: 3 tools (JSON Formatter, Base64 Encode/Decode, URL Encode/Decode).

| Candidate | Search-worthy? | Browser-feasible? | Note |
|---|---|---|---|
| CSV to JSON | Yes, steady developer/data-entry search volume | Yes — pure string parsing, no dependency needed | Strong candidate |
| JSON to CSV | Yes, pairs naturally with the above | Yes — same, the reverse transform | Strong candidate; ship as a pair or as one bidirectional tool depending on preset shape |
| Timestamp Converter (Unix ⇄ human-readable) | Yes, very high, evergreen developer search term | Yes — trivial with the platform's existing numeric/`Date`-via-`ctx` discipline | Strong candidate |
| UUID Generator | Yes, high | Yes — `crypto.randomUUID()`/RNG via `ctx`, already the platform's `Math.random`-via-`ctx` pattern | Strong candidate, very low effort |
| Regex Tester | Yes, high | Yes, but needs careful UX (live match highlighting) — more UI-heavy than most tools here | Worth doing, moderate effort |
| Text Diff Checker | Yes, high | Yes — a known, well-documented diff algorithm, pure JS | Worth doing, moderate algorithmic effort |
| Hash Generator (MD5/SHA family) | Yes, high | Yes — Web Crypto API covers SHA family natively; MD5 needs a small pure-JS implementation (no server call) | Worth doing; scope to SHA-1/256/512 first, MD5 only if a small dependency-free implementation is acceptable |
| JWT Decoder | Moderate-high search, but sensitive framing | Yes, decode-only (base64url + JSON, no verification) is simple and safe | Worth doing **only if scoped to decode-only**, with explicit wording that this does not verify a signature — a "verify" claim would be a real risk (see §6) |

All eight are genuinely low-infrastructure, dependency-light or dependency-free, and fit this platform's
existing archetypes without new engine categories. This is the strongest, lowest-risk gap on the whole
platform.

### Business & Finance

Current: 3 tools (GST Calculator, Profit Margin Calculator, Markup Calculator).

| Candidate | Search-worthy? | Simplicity | Note |
|---|---|---|---|
| Discount Calculator | Yes, high, evergreen | Very simple, deterministic | Strong candidate |
| Percentage Calculator | Yes, very high | Very simple, deterministic | Strong candidate; check it isn't already trivially covered by an existing tool before scoping |
| Loan EMI Calculator | Yes, very high (especially India-relevant, consistent with GST's own regional framing) | Simple, well-defined formula | Strong candidate |
| Interest Calculator (simple/compound) | Yes, high | Simple, deterministic | Strong candidate |
| Break-even Calculator | Yes, moderate | Simple, deterministic | Reasonable candidate |
| GST reverse calculator | Check first — GST Calculator's existing "remove GST" mode may already cover this | N/A pending check | Do not duplicate if already covered |
| Invoice / simple estimate calculator | Moderate search, but scope risk (can balloon into a mini-app) | More complex — multi-line-item state, not a single calculation | Defer; treat as a possible later, carefully-scoped addition, not part of this near-term queue |

Business & Finance has some of the simplest, safest wins on the platform (Discount, Percentage, EMI,
Interest) — all pure arithmetic, no ambiguity, no legal/compliance risk beyond the platform's existing
"not financial advice" disclaimer pattern.

### Logistics

Current: 4 tools (CBM, Volumetric Weight, Container Loading, Pallet Loading). **Already stronger than most
other categories** — this is not a priority gap.

| Candidate | Note |
|---|---|
| Freight Class / dimensional-weight helper (region-neutral) | Only worth it if it adds something genuinely distinct from Volumetric Weight Calculator's existing coverage — check for overlap first |
| Shipping Cost Estimator | Recommend against unless carefully scoped — real shipping cost depends on carrier contracts and surcharges this platform cannot know; a generic estimator risks a misleading-claim problem (see §6) |
| Unit conversion for packaging (cm/in/etc.) | Low priority — likely already implicitly covered by existing logistics tools' own unit handling |
| Carton Box Calculator | Possible, but check for meaningful overlap with CBM Calculator and Container/Pallet Loading before scoping as a distinct tool |
| Truck Loading Calculator | Reasonable future candidate, same shape as Container/Pallet Loading, but not urgent — Logistics is not the thin category right now |

No Logistics addition is recommended in the near-term queue (§7); this category can wait until a clear,
non-overlapping candidate is identified.

### PDF & Documents

Current: 2 tools (PDF Merge, JPG to PDF). Confirmed via repo inspection: `engines/pdf` already depends on
`pdf-lib` (client-side PDF creation/editing library, `runtimes: ['worker', 'node']`), which is the same
dependency PDF Merge and JPG to PDF already use.

| Candidate | Search-worthy? | Browser feasibility | Note |
|---|---|---|---|
| PDF Split | Yes, high, and a natural complement to PDF Merge | **High** — `pdf-lib`'s `PDFDocument.copyPages` can extract a page range into a new document entirely client-side, no new dependency | Strongest PDF candidate; see the scoping note below |
| PDF Compress | Yes, high | **Lower** — meaningful PDF compression (image downsampling, font subsetting) is genuinely harder client-side than page manipulation; `pdf-lib` alone does not give strong compression | Defer; would need real feasibility research before scoping, not a quick win |
| PDF to JPG | Yes, high | **Lower** — requires *rendering* PDF pages to raster images, which needs a rendering library (e.g. `pdf.js`), not `pdf-lib` (a creation/editing library, not a renderer) — a new, heavier dependency and a new rendering pipeline | Real candidate, but meaningfully more implementation risk than PDF Split; treat as its own follow-up planner item, not folded into this queue |
| PDF to PNG | Same as PDF to JPG | Same as PDF to JPG | Same as PDF to JPG — would likely share a rendering foundation with PDF to JPG if both are ever built |
| Images to PDF (batch) | Yes, moderate — JPG to PDF already covers the single/multi-image-to-PDF case | Already substantially covered by the existing JPG to PDF tool | Do not duplicate; only revisit if JPG to PDF's own scope is found to be missing something specific |
| PDF Page Extractor | Same underlying mechanism as PDF Split (extract a page range into a new PDF) | High, same as PDF Split | Likely the same feature as PDF Split's own "extract a range" mode — do not build as a second, separate tool |
| PDF Rotate | Yes, moderate | High — `pdf-lib` supports page rotation directly | Reasonable future candidate, lower priority than Split |
| PDF Metadata Remover | Yes, moderate (privacy-oriented) | High — `pdf-lib` can clear document metadata directly, same shape as Image Metadata Remover's own privacy positioning | Reasonable future candidate |

**PDF Split scoping note:** a literal "split into N separate downloadable files" mode would hit the same
multi-file-output UI limitation already documented during Favicon Generator's own planning (this
platform's file-tool UI — archetype D — is single-file-in/single-file-out today; see TASK-007F's PR). The
safe v1 scope is **"extract a page range into one new PDF"** (a single input PDF, a page range like
"2-5", one output PDF) — deterministic, single-output, and fully supported by the existing architecture
with no new UI work. A true "split every page into its own file" mode should be treated as a later,
separate scope decision once (or if) the platform gains real multi-file-download support.

PDF tools overall have strong, consistent search demand, but are **technically heavier on average than
simple calculators** — PDF Split is the one clear exception (low technical risk, existing dependency,
existing pattern), which is why it is this planner's top recommendation (§7, §8).

### Image & Media

Current: 7 tools (checkpoint complete per TASK-007).

| Candidate | Note |
|---|---|
| Passport / ID Photo Maker | Real search demand; feasible with the existing crop/resize foundation, but needs country-specific size presets and careful "not an official verification of compliance" wording — moderate scope, not urgent right after a just-closed checkpoint |
| Color Picker from Image | Simple, feasible, low risk — click a pixel, get its hex/RGB value; genuinely low effort on top of the existing preview/canvas foundation |
| Image Filters / Adjustments | Moderate search; feasible for simple, deterministic adjustments (brightness/contrast/grayscale via canvas pixel/filter operations) — must stay away from anything that reads as "AI enhancement" |
| Image Rotate / Flip | Simple, feasible, low risk — a natural, low-effort addition reusing the existing crop/resize canvas pipeline |
| Image to PDF / PDF to Image bridge | Image to PDF already exists as JPG to PDF; a PDF-to-Image bridge depends on the same rendering-library question raised for PDF to JPG/PNG above, so treat it as the same technical decision, not a separate one |
| YouTube Thumbnail Size / Social Media Image Resizer | Only worth it if genuinely distinct from Image Resize's existing generic width/height control — a size-preset wrapper around the same operation is easy to add, but must not read as a duplicate tool for SEO purposes |

**Do not add low-search novelty image tools.** **Do not add AI image tools.** **Background Remover and
Object Remover remain out of scope** unless a future, explicitly-planned, AI-free approach is identified —
neither is proposed or scheduled by this planner.

None of these are placed in the near-term queue (§7); Image & Media just closed its own checkpoint, and
this planner's priority is the thinner categories (PDF & Documents, Developer & Data, Business & Finance).

### Civil & Construction

Current: 4 tools (Concrete Quantity, Excavation, Brickwork, Plaster Calculators).

| Candidate | Note |
|---|---|
| Tile / Flooring Calculator | Already planned as **TASK-006F**, currently paused — a natural next simple addition when Civil work resumes |
| Paint Calculator | Reasonable, simple, deterministic, same shape as existing Civil calculators |
| Rebar Weight Calculator | Reasonable, simple, deterministic |
| Formwork / Shuttering Calculator | Reasonable, moderate complexity |
| Cement Sand Aggregate Calculator | Reasonable, may overlap partially with Concrete Quantity Calculator's own mix-ratio handling — check for overlap before scoping |

**Civil should later become a full ecosystem** (§10), not a scattered set of one-off calculators. For now,
per the founder's own direction, Civil work stays paused (TASK-006F included) until the general tools
platform is stronger and a dedicated Civil ecosystem planner exists. This planner does not recommend
resuming any Civil tool, including TASK-006F, in its own near-term queue (§7) — that decision belongs to
the future Civil ecosystem planner, not this one.

## 5. Video tools decision

This is a firm policy section, not a proposal.

- **No AI video.** Not now, not later. Permanently out of scope for this platform.
- **Do not build any AI video tool** — no AI subtitles, no AI dubbing, no AI enhancement, no AI-generated
  video content of any kind.
- **Do not start server-side video now**, in any form.
- **If a free video tool is ever attempted, it must be browser-first** — processed on the user's own
  device, consistent with this platform's entire existing positioning.
- **Paid server-side video can be considered later**, only after real traffic and demand are proven on the
  rest of the platform, and only as a separate, later, explicitly-scoped decision — not implied or started
  by anything in this planner.

Browser-feasible candidates, if video is ever prioritized (not proposed now):

- Video Trim
- Video Mute
- Extract Audio from Video
- Video to GIF (small files only)
- Video Crop/Resize (only if performance in-browser is genuinely acceptable — needs real feasibility
  testing before any commitment)

Deferred or avoided outright:

- Large video compression
- Large video conversion
- AI subtitles
- AI dubbing
- AI enhancement
- Background removal (video)
- Noise removal
- Batch video processing
- Unlimited free server-side processing

**Recommendation: do not implement video immediately.** If and when video becomes the next priority, the
correct next step is a **separate Video Tools Foundation Planner** (mirroring TASK-005A's own role for
Image & Media, and TASK-004A's for PDF) — not a jump straight into implementation. This planner does not
schedule that follow-up planner as a near-term task; it only documents that this is the correct shape for
that future decision.

## 6. Tools to avoid for now

- AI video (any form — see §5)
- AI image generation
- AI voice / music / dubbing
- Heavy server-side video processing
- Batch video processing
- Tools requiring login or an account
- Tools requiring file storage (persisting a user's file beyond the single processing run)
- Tools requiring paid third-party API calls
- Duplicate micro-tools where a unified tool already covers the use case (the same lesson TASK-007
  documented for Image Format Converter applies platform-wide: one well-scoped tool beats three near-
  identical ones)
- Low-search novelty tools (interesting to build, but with no real search demand behind them)
- Tools with legal/copyright risk (for example, anything that implies verifying an official document's
  authenticity or legal compliance)
- Tools with misleading professional claims (for example, a "shipping cost estimator" that implies real
  carrier pricing this platform cannot actually know, or a "JWT verifier" that only decodes without
  checking a signature)

## 7. Recommended next 10 tools

Ranked by likely Google search demand, browser feasibility, category balance, and low infrastructure cost.

1. **PDF Split**
   - Category: PDF & Documents
   - Why it matters: strong, consistent search demand; the most obvious complement to an existing PDF
     Merge tool; PDF & Documents is the platform's thinnest heavily-searched category.
   - Browser feasibility: high — reuses the existing `pdf-lib` dependency and `runtimes: ['worker', 'node']`
     pattern already proven by PDF Merge and JPG to PDF.
   - Risk level: **low**.
   - Implementation note: scope v1 as "extract a page range into one new PDF" (single output file), not a
     literal "split into N files" mode — see the scoping note in §4.

2. **CSV to JSON**
   - Category: Developer & Data
   - Why it matters: very common developer/data-entry search term; Developer & Data is thin relative to
     its search potential.
   - Browser feasibility: high — pure string parsing, no dependency.
   - Risk level: **low**.
   - Implementation note: needs a clear, documented policy for quoting, delimiters, and header-row
     handling, stated plainly in the tool's content page (avoid silently guessing on ambiguous CSV).

3. **JSON to CSV**
   - Category: Developer & Data
   - Why it matters: the natural reverse of #2; pairs well for search and for the category's own coherence.
   - Browser feasibility: high — same shape as CSV to JSON.
   - Risk level: **low**.
   - Implementation note: decide up front whether this is a second tool or a second mode of a single
     bidirectional "CSV ⇄ JSON" tool — a single tool may be the better SEO and maintenance choice (see §6's
     duplicate-tool lesson), but only if search intent for the two directions doesn't strongly favor
     separate landing pages.

4. **Timestamp Converter**
   - Category: Developer & Data
   - Why it matters: very high, evergreen developer search term (Unix timestamp ⇄ human-readable date).
   - Browser feasibility: high — trivial with this platform's existing `Date`-via-`ctx` discipline (no
     direct `Date.now()`/`Math.random()` in engines, per AGENTS.md).
   - Risk level: **low**.
   - Implementation note: support common input formats (seconds, milliseconds) and at least UTC plus the
     browser's local timezone, stated clearly.

5. **UUID Generator**
   - Category: Developer & Data
   - Why it matters: high, steady developer search term; extremely low implementation cost.
   - Browser feasibility: high — `crypto.randomUUID()` (or an RNG supplied via `ctx`, matching this
     platform's existing determinism discipline for anything random).
   - Risk level: **low**.
   - Implementation note: lowest-effort tool in this entire queue; a good candidate to build alongside #2
     or #3 rather than as a standalone PR if the founder wants to move faster through Developer & Data.

6. **Discount Calculator**
   - Category: Business & Finance
   - Why it matters: very high, evergreen consumer/retail search term.
   - Browser feasibility: high — simple, deterministic arithmetic.
   - Risk level: **low**.
   - Implementation note: support both "final price from % off" and "% off from original/final price"
     modes, matching the existing GST/Markup/Margin calculators' own multi-mode pattern.

7. **Loan EMI Calculator**
   - Category: Business & Finance
   - Why it matters: very high search volume, especially in an India-relevant context (consistent with
     GST Calculator's own regional framing).
   - Browser feasibility: high — a well-defined, standard formula.
   - Risk level: **low**, with one caveat: must carry a clear "for estimation only, not a loan offer"
     disclaimer, consistent with this platform's existing "not financial/legal advice" wording pattern.
   - Implementation note: show the full amortization-relevant numbers (EMI, total interest, total payment)
     the same way existing calculators show every intermediate step.

8. **Timestamp/UUID sibling: Hash Generator (SHA family)**
   - Category: Developer & Data
   - Why it matters: high, steady developer search term (SHA-256 in particular).
   - Browser feasibility: high — the Web Crypto API (`crypto.subtle.digest`) covers the SHA family
     natively, no dependency needed.
   - Risk level: **low**.
   - Implementation note: scope to SHA-1/256/512 first; treat MD5 as a separate decision (needs a small
     pure-JS implementation, since it isn't in Web Crypto) rather than blocking this tool on it.

9. **Image Rotate / Flip**
   - Category: Image & Media
   - Why it matters: simple, real search demand, and a natural, low-effort extension of the existing
     crop/resize canvas foundation — included here as one exception to "no new Image & Media tool right
     after the checkpoint," specifically because its cost is so low it can ride alongside the Developer &
     Data / Business & Finance push without meaningfully competing for attention.
   - Browser feasibility: high — reuses the existing canvas pipeline (`engines/image/src/lib/`) directly.
   - Risk level: **low**.
   - Implementation note: likely the smallest possible new operation in `engines/image`, similar in spirit
     to Crop's own addition.

10. **Tile / Flooring Calculator**
    - Category: Civil & Construction
    - Why it matters: already planned (TASK-006F), currently paused; included here only to record it as a
      reasonable eventual candidate once Civil work resumes — **not** a signal to resume it now.
    - Browser feasibility: high — same deterministic-calculator shape as the existing four Civil tools.
    - Risk level: **low**, but out of scope for this queue's own priority ordering — Civil stays paused per
      the founder's own direction (§4, §10) until the general platform is stronger.

This queue deliberately front-loads PDF Split and the lowest-risk Developer & Data / Business & Finance
tools, since those are the platform's thinnest, highest-search, lowest-cost categories right now.

## 8. Suggested next task after this planner

**Preferred recommendation: TASK-008B — PDF Split.**

Reason:

- PDF & Documents is thin, with only 2 tools live today.
- PDF Split has strong, consistent search demand.
- It directly complements the existing PDF Merge tool (the natural "opposite" operation).
- It can reuse the existing PDF foundation (`pdf-lib`, `runtimes: ['worker', 'node']`, the same
  file-tool archetype D pattern already proven twice) — no new dependency, no new UI archetype.
- It is fully deterministic and non-AI, consistent with every principle in this planner.

Alternative, if PDF Split is found to be riskier than expected once scoped in detail:

**TASK-008B — Passport / ID Photo Maker** (Image & Media). This remains a real, search-worthy candidate,
but is not the primary recommendation here, since Image & Media just closed its own checkpoint and PDF &
Documents is the thinner, more urgent gap.

## 9. "Beyond the AI" positioning notes

No renaming happens in this task — repo, app, and public branding all stay as MangoTools for now. This
section records the future positioning idea only, for later reference.

Future positioning direction:

- Tools for work that should not depend on AI.
- Fast, deterministic utilities — the answer is calculated, not guessed.
- No prompting required.
- No AI guessing involved in the result.
- Clear, predictable outputs every time.
- Useful for people who want a result, not an AI conversation.

**Positioning to use:** "Beyond AI" as in *beyond the need for AI* for this class of problem — deterministic
tools that are faster, clearer, and cheaper than reaching for an AI assistant for a task that has one
correct, calculable answer.

**Wording to avoid:**

- Anti-AI negativity of any kind.
- Claiming AI is "bad."
- Claiming these tools are "better than AI" for everything — the honest claim is narrower and stronger:
  for a deterministic, rule-based task, a direct tool is simpler and more reliable than a conversation with
  an AI model, not that AI itself is inferior in general.

## 10. Civil ecosystem future note

Civil & Construction is a **future major ecosystem**, not a category to fill with random one-off
calculators. It should not be planned or implemented piecemeal beyond the simple, deterministic calculators
already in scope (§4, §7's Tile/Flooring entry included only for the record, not as a near-term action).

When a dedicated Civil ecosystem planner is eventually created (not this task), it should cover:

- Quantity surveying
- Estimation
- Surveying / leveling
- Traverse adjustment
- BOQ (Bill of Quantities) / report exports
- Material calculators
- Rate analysis helpers
- Excel / PDF exports (later)
- Project-style workflows (later)

**Civil ecosystem work is not started by this planner.** This section exists only to preserve the future
direction so it is not lost or reinvented from scratch when the founder is ready to resume Civil planning.

## 11. Decision summary

- **Continue general search-driven tools first**, prioritizing the platform's thinnest, highest-search
  categories: PDF & Documents, Developer & Data, Business & Finance.
- **Do not work on Fix & Growth now.**
- **Do not build AI video, ever.**
- **Do not start server-side video now.**
- **Prefer JavaScript-first / browser-first tools** in every category, consistent with every tool shipped
  on this platform so far.
- **Next recommended implementation: PDF Split** (TASK-008B), reusing the existing `pdf-lib`-backed PDF
  foundation, scoped as a single-page-range-to-single-output-PDF tool to stay fully within this platform's
  current single-file-output architecture.
