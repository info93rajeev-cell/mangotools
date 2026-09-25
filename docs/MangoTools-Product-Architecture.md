# MangoTools — Product Architecture v1.0

**Prepared for:** Rajeev (MangoPie) · **Date:** 25 September 2026 · **Status:** Foundation spec — no code
**Scope:** Vision → IA → navigation → hierarchy → templates → components → design system → business model → roadmap → critique → new ideas

---

## 0. The ten decisions that matter most

Read this page even if you read nothing else. Everything below explains and supports these.

| # | Decision | Why |
|---|---|---|
| 1 | **Build engines, not tools.** About 12 shared engines × presets = hundreds of tools. | This is the only way one person (plus AI coding help) can keep 500 tools correct, consistent and cheap to maintain. |
| 2 | **Every tool is a manifest.** One Tool Shell with **5 layout archetypes** renders all of them. | One file generates the page, nav, search, sitemap, schema, pricing gates and future AI/API definitions. |
| 3 | **Local-first, privacy you can prove.** Work saves in the browser; cloud sync (Pro) is end-to-end encrypted. Enforce "no uploads" with a strict Content-Security-Policy and an offline-capable PWA. | "Your files never leave your browser" is only a selling point if it is *true and checkable*. "Turn off Wi-Fi — it still works" is proof no competitor can copy with marketing. |
| 4 | **Launch narrow, architect wide.** Launch 2 professional suites (Surveying, Privacy) + ~12 generic tools. Design for 9 categories. | You run several ventures. Depth in two niches beats thin coverage of nine. |
| 5 | **Rethink `tools.mangopie.in`.** Prefer a standalone generic domain; keep MangoPie as the quiet parent company. | `.in` tells Google the site is for India; MangoPie is a gifts/toys store — both work against a global professional brand (details in §11). |
| 6 | **One paid plan, annual-first, regional pricing, plus a day pass.** Drop the $2.99 Starter tier. | At $2.99, payment fees eat ~22% of revenue. Two plans $2 apart create hesitation, not upgrades. |
| 7 | **Free users can export — with attribution.** Pro removes it and adds branding. | Printing is free anyway (Print → Save as PDF), so a paid-only PDF gate leaks. An attributed report shared with a client is free marketing. |
| 8 | **Reposition the PHI Scrubber as "Safe Paste for AI"** (reversible pseudonymisation), with medical as one preset. | Many more professionals paste sensitive text into ChatGPT/Claude every day than run HIPAA de-identification jobs. Same engine, far bigger market. |
| 9 | **Generic tools are for retention and long-tail search, not head terms.** | A new domain will not outrank iLovePDF for "merge pdf" for years. It *can* win "merge PDF offline without uploading." |
| 10 | **Design every engine AI-ready from day one:** typed JSON input/output, pure functions, no DOM. | The same engines can later become an API, an MCP server (tools inside Claude/ChatGPT), and on-device AI workflows — at almost no extra cost. |

---

## 1. Overall platform vision

### 1.1 Positioning

> **MangoTools is the professional's browser toolkit — precise calculations, private document work, and report-ready output, without uploads, sign-ups or ads.**

- **For:** professionals who do *recurring, checkable* work — surveyors, site engineers, logistics coordinators, healthcare/legal admins, developers.
- **Against:** Excel templates (error-prone, ugly output), ad-heavy calculator sites (untrustworthy, no export), and upload-based converters (privacy risk).
- **Unlike SmallPDF/iLovePDF:** they sell *file conversions*. MangoTools sells *finished professional work* — a checked level book, an adjusted traverse, a de-identified document with an audit trail.

### 1.2 The three layers

```
┌──────────────────────────────────────────────────────────────┐
│ LAYER 3 · PLATFORM (later)   Teams · API · MCP · Embeds · AI │  ← B2B revenue
├──────────────────────────────────────────────────────────────┤
│ LAYER 2 · WORKSPACE (Pro)    Projects · Import · Reports ·   │  ← subscription revenue
│                              Branding · Sync · Templates     │
├──────────────────────────────────────────────────────────────┤
│ LAYER 1 · TOOLS (Free)       Every calculation and transform │  ← SEO traffic + trust
│                              free, unlimited, no login       │
└──────────────────────────────────────────────────────────────┘
```

**Why this shape:** Layer 1 earns traffic and trust. Layer 2 is where professionals feel pain (repetition, presentation, record-keeping), so it is where they pay. Layer 3 is where organisations pay. Every layer is built from the same engines, so no layer is a separate product to maintain.

### 1.3 North-star metric

**Weekly Completed Workflows** — a professional tool run that ends in export, print, save or copy of a validated result.

Why not page views or tool runs? Page views reward SEO fluff. Tool runs reward curiosity. A *completed workflow* means someone got real work done — the thing that predicts both retention and payment.

Supporting metrics: repeat use within 7 days, Pro-gate views → conversions, report shares (attribution clicks), Core Web Vitals pass rate, tool error rate.

### 1.4 Product principles (use these to settle arguments)

1. **The tool comes first.** The working tool is visible without scrolling, on a phone and on a 1366×768 laptop. Explanatory content goes *below* it.
2. **Private by architecture, not by promise.** If a tool needs the network, the page says so, exactly.
3. **Show the work.** Every professional result shows its checks, formulas and step-by-step working. Engineers trust what they can audit.
4. **Paste in, get out.** Excel paste, keyboard entry, CSV in, clean output. Respect how professionals already work.
5. **Free means free.** Never limit calculations, never add fake delays, never use dark patterns. Charge for workflow only.
6. **One system.** No tool gets a custom look. A new tool is a manifest + preset, not a new design.
7. **Fast on a ₹12,000 Android on 4G.** That is a real user in India's field teams and student base — and fast for them means fast for everyone.

### 1.5 On the tagline

"Your files never leave your browser" is strong — but it is an **absolute claim**, and it becomes false the day you add cloud sync or cloud AI. Use a layered version:

- **Brand line:** *Professional tools. Zero uploads.* (or *Private by design.*)
- **Per-tool badge (exact, honest):** "Runs locally — nothing is uploaded" · "On-device AI" · "Encrypted sync (only you hold the key)" · "Uses network: fetches exchange rates"

This keeps the promise precise, so it survives legal scrutiny and product growth.

---

## 2. Information architecture

### 2.1 The core insight: two axes, not one

Your category list mixes **what a tool does** (Developer, Media, General Utilities) with **who uses it** (Medical, Legal, Construction). Mixed axes break at scale: does "PDF Merge" belong under Legal, Construction or Office? Does "PII Scrubber" belong under Medical or Developer? The answer is *all of them*.

So the architecture uses **two independent axes**:

| Axis | Answers | Used for | Example |
|---|---|---|---|
| **Category** (one per tool) | *What kind of tool is this?* | Breadcrumbs, category hubs, mega-menu | Privacy & Compliance |
| **Profession** (many per tool) | *Who is this for?* | "Solutions" landing pages, onboarding, recommendations | Healthcare admins, Legal, Developers |

A tool has **exactly one primary category** (stable hierarchy, clean breadcrumbs) and **any number of professions and tags**. This is how the IA stays clean at 500 tools.

### 2.2 Content model (the entities)

```
Engine ──powers──▶ Tool ◀──belongs to── Category
                    │  └──tagged with──▶ Profession (many)
                    │  └──part of──────▶ Workflow (many)
                    │  └──explained by─▶ Guide (many)
                    │
         (Pro)      ▼
User ─owns─▶ Workspace ─contains─▶ Project ─contains─▶ Sheet (a saved tool run)
                │                          └────────▶ Report (composed from sheets)
                ├─▶ Brand Kit (logo, colours, letterhead, signature)
                ├─▶ Templates (saved sheet/report layouts)
                └─▶ Entitlements (capabilities granted by plan / day pass)
```

**Why a "Sheet" and a "Project":** a professional's unit of work is a *job* (a site, a shipment, a case), not a calculation. Projects are where willingness to pay lives.

### 2.3 The tool manifest (single source of truth)

Every tool is described by one manifest. Nothing about a tool is hand-written anywhere else.

| Field group | Contents | What it generates |
|---|---|---|
| Identity | id, slug, name, short name, one-line summary, version, status (alpha/beta/stable/deprecated) | URLs, titles, lifecycle labels |
| Taxonomy | primary category, subcategory, professions, tags, synonyms ("RL", "HI method") | Breadcrumbs, hubs, search index |
| Behaviour | engine, preset, archetype (A–E), input schema, output schema, precision/unit defaults | The working tool UI, validation, API/MCP definition |
| Capabilities | import formats, export formats, batch support, project support | Action bar, export menu |
| Gating | which capabilities need which entitlement | Lock icons, upgrade sheets, pricing table |
| Content | H1, meta, how-to steps, formula, worked example, FAQ, references/standards, disclaimer level | SEO body, structured data |
| Graph | related tools, workflows, guides | Internal links, "next step" suggestions |
| Quality | golden test fixtures, verified-against sources, changelog | "Verified" panel, automated tests |
| Privacy | network usage declaration (none / fetches X) | Privacy badge, CSP rules |

**Why:** at 500 tools, anything done by hand becomes inconsistent. With manifests, adding a tool is "write a preset + write a manifest + add fixtures" — hours, not days — and every sitewide improvement (a better FAQ layout, a new export format) lands on every tool at once.

### 2.4 Site map and URL scheme

| Page type | URL pattern | Indexed | Notes |
|---|---|---|---|
| Home | `/` | ✅ | |
| Category hub | `/surveying` | ✅ | 9 short slugs |
| Subcategory (only when a category > ~20 tools) | `/surveying/leveling` | ✅ | Hub page only; tools stay flat |
| **Tool** | `/rise-and-fall-calculator` | ✅ | **Flat, permanent, matches search language** |
| Tool variant with distinct search intent | `/height-of-instrument-calculator` | ✅ | Same engine, own page (different query) |
| Profession landing | `/for/land-surveyors` | ✅ | Curated collections + workflows |
| Workflow | `/workflows/level-survey-report` | ✅ | Chains tools into a job |
| Guide | `/learn/rise-and-fall-method` | ✅ | Teaching content, links to tool |
| Comparison (later) | `/compare/excel-vs-mangotools-level-book` | ✅ | |
| Pricing | `/pricing` | ✅ | |
| Trust centre | `/privacy`, `/security`, `/how-it-works` | ✅ | Proof, not boilerplate |
| Changelog | `/changelog` | ✅ | Freshness + trust |
| App | `/app`, `/app/p/{projectId}` | ❌ | Client-side, noindex |
| Embed | `/embed/{tool}` | ❌ | Canonical → tool page |

**Why flat tool URLs:** tools move between categories and gain professions; a nested URL (`/civil/rise-and-fall`) would force redirects every time. Flat URLs are shorter, match queries exactly, and never break. **Guard rail:** the build fails if a tool slug collides with a category slug or a reserved word (`app`, `for`, `learn`, `pricing`…).

**Why public/app split:** the tool works fully on its public, static, indexable page with no login. The `/app` area (projects, dashboard) is a client-side app that search engines ignore. You get SEO *and* an app-like workspace, served as static files at almost zero hosting cost.

### 2.5 Naming rules

- Name tools **the way people search**, not the way engineers think: "Rise and Fall Calculator", not "Level Reduction Engine".
- Pattern: `[Object] [Action/Type]` — "Traverse Adjustment Calculator", "PDF Page Numberer", "HAR File Sanitizer".
- One canonical name per tool; alternatives go in `synonyms` (feeds search, not new pages — unless the alternative has genuinely separate search intent).

### 2.6 Search

Client-side search index built from manifests at build time (no server). Must support synonyms ("RL" → reduced level; "compass rule" → Bowditch), typo tolerance, and actions ("new leveling sheet"). This is the backbone of navigation at scale (see §3).

---

## 3. Navigation structure

### 3.1 Global header (public pages)

```
[◆ MangoTools]   Tools ▾   Solutions ▾   Pricing        [ Search tools…  ⌘K ]   Sign in
```

- **Only four items.** Every extra top-level item slows the choice for everyone (Hick's law). Linear, Vercel and Stripe all keep this small.
- **Tools ▾** — mega menu: 9 categories in 3 columns, each showing its 4 most-used tools + "All 23 tools →". Right rail: *New* and *Popular*. Generated from manifests; never hand-edited.
- **Solutions ▾** — professions ("For land surveyors", "For healthcare admins"…), each linking to a `/for/…` page with curated tools + workflows.
- **Search / ⌘K** — always visible. At 500 tools, **search is the primary navigation**; menus are for browsing.

### 3.2 Command palette (⌘K or `/`)

One palette for everything: tools, guides, your local projects, and actions ("Import CSV into leveling sheet", "Export report"). Shows **Recent** and **Pinned** tools first.

**Why:** professionals are repeat users. After their third visit, they should never touch a menu again. Recent/pinned lists are stored locally, so personalisation works **without an account** — privacy-consistent and friction-free.

### 3.3 Tool page navigation

```
Home › Surveying › Rise & Fall Calculator
[ Rise & Fall | Height of Instrument ]        ← variant tabs (same engine)
```

- Breadcrumb (also emitted as structured data).
- Variant tabs when tools share an engine and users compare methods.
- Below the fold: an "On this page" mini-index (How to use · Formula · Example · FAQ).
- **"Next step" links** from the manifest graph: after leveling → "Plot a longitudinal profile" → "Compute cut & fill". Workflows emerge from navigation.

### 3.4 App navigation (`/app`, signed in or local)

```
┌────────────┬──────────────────────────────────────────────┐
│ Workspace ▾│  Search ⌘K                    ● Synced  (RK) │
│            ├──────────────────────────────────────────────┤
│ Home       │                                              │
│ Projects   │                                              │
│ Templates  │               content                        │
│ Brand kit  │                                              │
│ Team (later)                                              │
│ ───────    │                                              │
│ All tools  │                                              │
│ Settings   │                                              │
└────────────┴──────────────────────────────────────────────┘
```

### 3.5 Mobile

- Header collapses to logo · search icon · menu.
- Tool pages get a **sticky bottom action bar** (Calculate · Export) within thumb reach.
- Grid-based tools (field books) switch to a **row-card editor** on narrow screens: one station per card with large numeric inputs, swipe to next. Surveyors enter data on phones in the field; this matters more than desktop polish.

### 3.6 Footer (SEO + trust)

Full category index with top tools (internal links), Solutions, Learn, Company (About, MangoPie as parent), Trust (Privacy, Security, How it works, Status), Legal. Later: language switcher.

### 3.7 Internal linking rules (automated)

Each tool page links to: its category · 3–6 related tools (same engine or same workflow) · 1–2 guides · its workflow(s). Each guide links to its tool above the fold. Generated from the manifest graph, so link equity flows toward the professional tools, which matter most.

---

## 4. Category hierarchy

### 4.1 Refined categories

| # | Category (slug) | Change from your list | Why |
|---|---|---|---|
| 1 | **Surveying** `/surveying` | Was "Civil & Surveying" | "Civil" overlaps Construction; surveying is the sharp wedge. Civil engineers become a *profession*. |
| 2 | **Construction** `/construction` | — | Quantities, materials, estimating. |
| 3 | **Logistics** `/logistics` | Was "Logistics & Supply Chain" | Shorter; subcategories carry the detail. |
| 4 | **Privacy & Compliance** `/privacy-tools` | Was "Medical & Privacy" | The engine is *redaction*, and it serves medical, legal, HR and developers. Medical becomes a *profession*. Avoids clinical-calculator liability (§11). |
| 5 | **Business & Finance** `/business` | — | GST, margins, invoices, EMI. |
| 6 | **Developer & Data** `/developer` | — | Data tools (CSV/JSON) are used by non-developers too. |
| 7 | **Documents & PDF** `/pdf` | Was "Legal & Documents" | Legal tools (Bates, redaction, page numbering) are PDF operations. Legal becomes a *profession*. |
| 8 | **Media & Images** `/media` | Was "Media & Creators" | Creators become a *profession*. |
| 9 | **Everyday Utilities** `/utilities` | Was "General Utilities" | Text, units, QR, date/time. |

Note: `/privacy` is reserved for the privacy policy, hence `/privacy-tools`.

### 4.2 Subcategories (introduced only when a category passes ~20 tools)

| Category | Subcategories |
|---|---|
| Surveying | Leveling · Traversing · Coordinates & Geodesy · Curves & Setting-out · Areas & Volumes · Tacheometry |
| Construction | Quantities (BOQ, BBS) · Concrete & Materials · Estimating · Site Utilities |
| Logistics | Volume & Freight · Loading & Packing · Documents · Units & Incoterms |
| Privacy & Compliance | Text Redaction · Document Redaction · Data Anonymisation · Developer Secrets · Metadata Removal |
| Business & Finance | Tax (GST) · Pricing & Margins · Loans & Interest · Invoicing |
| Developer & Data | Format & Validate · Encode & Decode · Convert · Generate · Test & Compare · Time |
| Documents & PDF | Organise · Convert · Optimise · Legal Stamping · Sign & Fill |
| Media & Images | Resize & Crop · Convert · Compress · Social Formats · Colour · Subtitles |
| Everyday Utilities | Text · Units · Date & Time · QR & Codes · Quick Math |

### 4.3 Professions (the second axis — `/for/…` pages)

Land surveyors · Civil engineers · Construction companies & site engineers · Architects · Logistics & freight · Manufacturing · Healthcare administrators · Legal professionals · Developers · Small businesses · AI creators · Office workers · **Civil engineering students** (added — see §11: they are a large share of real surveying traffic).

### 4.4 Launch status by category

| Category | Launch (Phase 1) | Phase 2–3 | Later |
|---|---|---|---|
| Surveying | ✅ Pro suite | Expand | |
| Privacy & Compliance | ✅ Pro suite | Expand | |
| Developer & Data | ✅ 6–7 generic tools | | |
| Documents & PDF | ✅ 3–4 generic tools | Legal stamping | |
| Media & Images | ✅ 2 generic tools | | Video/audio |
| Everyday Utilities | ✅ 2 generic tools | | |
| Construction | | ✅ Phase 4 | |
| Logistics | | ✅ Phase 4 | |
| Business & Finance | | | ✅ |

Empty categories are **not shown**. A category appears in navigation when it has at least 3 stable tools.

---

## 5. Tool hierarchy

### 5.1 Four tiers of tools

| Tier | Definition | Examples | UX | Monetisation | SEO role |
|---|---|---|---|---|---|
| **T1 · Workflow tools** | Multi-step professional jobs with data entry, validation, projects and reports | Level book, Traverse adjustment, PHI de-identification | Full workbench, project-aware | Core Pro value | High-intent, low-volume, high-value |
| **T2 · Professional calculators** | Single-purpose pro calculations | Curve setting-out, CBM, chargeable weight, bar weight | Form → result + checks | Pro exports | Medium intent |
| **T3 · Utilities** | Generic transforms | JSON formatter, PDF merge, image resize | Instant or file pipeline | Minimal (batch/size limits) | Traffic, retention |
| **T4 · Variants** | Same engine, separate search intent | "Height of instrument calculator", "Transit rule calculator" | Same UI, preset | Inherits parent | Long-tail capture |

**T4 guard rail:** a variant gets its own page **only** when it has genuinely distinct search intent *and* distinct content (method, example, FAQ). Mass-produced near-duplicate pages risk Google's scaled-content spam policies — they are a liability, not an asset.

### 5.2 Engines → tools map (the scaling strategy)

| # | Engine | Powers (examples) | First needed |
|---|---|---|---|
| E1 | **Grid / field-book** (tabular entry, paste, validation, undo) | Rise & Fall, HI method, traverse input, BBS, BOQ, CBM lists, CSV editor | Phase 1 |
| E2 | **Survey math** (leveling, traverse adjustment, COGO, areas) | Leveling, Bowditch/Transit, closure, area by coordinates, curves | Phase 1 |
| E3 | **Units, angles & precision** (parse DMS/gon/WCB/QB, ft-in, locale numbers) | Every professional tool | Phase 1 |
| E4 | **Redaction** (detectors: patterns + checksums + dictionaries + on-device NER; actions: mask, replace, pseudonymise, reversible) | PHI scrubber, PII scrubber, Safe Paste for AI, HAR sanitizer, log scrubber, CSV anonymiser | Phase 1 |
| E5 | **Text & data transform** | JSON/YAML/SQL format, CSV↔JSON, Base64, URL, case, word count, diff | Phase 1 |
| E6 | **Generators** | UUID, QR, hash, password | Phase 1 |
| E7 | **PDF** (assemble, stamp, render) | Merge, split, rotate, page numbers, watermark, Bates, JPG→PDF, PDF→JPG, flatten | Phase 1 (lite) |
| E8 | **Image** (decode/encode codecs, canvas ops) | Resize, convert, compress, crop, EXIF strip, aspect-ratio crop | Phase 1 (lite) |
| E9 | **Import** (CSV/XLSX, instrument raw files) | All T1 tools | Phase 2 |
| E10 | **Report** (templates, branding, PDF/XLSX/CSV/DXF output) | Every Pro export | Phase 2 |
| E11 | **Plot / visual** (SVG plots, profiles, later 3D) | Traverse plot, level profile, container loading | Phase 1 (basic) |
| E12 | **Storage & sync** (IndexedDB/OPFS, project model, E2E-encrypted sync) | Projects, drafts, templates | Phase 2–3 |
| E13 | **On-device AI** (WebGPU/WASM models) | NER for redaction, photo-to-grid OCR, tool finder | Phase 3+ |

**Tool = Engine + Preset + Archetype + Content.** Engines are pure logic with typed inputs/outputs, no UI, no network, tested against golden fixtures. That one rule delivers testability, Web Worker execution (UI never freezes), and future API/MCP exposure for free.

### 5.3 The three MVP products — what "world-class" means

#### Priority 1 · Rise & Fall Leveling Calculator (T1)

| Free | Pro |
|---|---|
| Both methods: **Rise & Fall** and **Height of Instrument** (tabs, same data) | CSV/XLSX import |
| Spreadsheet-like entry: Enter = next row, Tab = next column, paste straight from Excel | **Instrument raw-file import** (digital levels) |
| Automatic change-point handling (BS+FS on the same row) | Branded PDF level book (logo, job details, signature block) |
| All three arithmetic checks: ΣBS − ΣFS = ΣRise − ΣFall = Last RL − First RL | XLSX export *with live formulas* |
| **Misclosure + allowable misclosure** (configurable, e.g. C·√K mm) with pass/fail | Save to project, templates, history |
| Optional distribution of closing error | Batch: multiple level runs in one report |
| Reduced-level profile chart | |
| **Step-by-step working** (student mode) · sample data · print | |

**Must fix before launch** (current prototype): the page labelled Rise & Fall actually computes using the height-of-instrument method and shows no Rise/Fall columns; a blank cell and a genuine 0.000 staff reading are treated identically; there is no misclosure check. A surveyor spots this within seconds, and credibility is gone.

#### Priority 2 · Bowditch Traverse Adjustment (T1)

| Free | Pro |
|---|---|
| Bearing input in WCB, quadrant (N 45°30′ E), DMS, decimal degrees, gon | Import/export CSV/XLSX |
| Closed-loop and link traverses | **DXF export** (opens in AutoCAD/Civil 3D) |
| Latitudes/departures, linear misclosure, **relative precision (1 : N)** | Coordinate file for total-station upload |
| **Bowditch and Transit rule** toggle | Branded report with plot |
| Adjusted coordinates, **area by coordinates** | Projects, templates |
| Plot with misclosure vector · step-by-step working | |

#### Priority 3 · PHI/PII Scrubber → "Safe Paste" (T1)

| Free | Pro |
|---|---|
| Paste text → layered detection of identifiers (HIPAA Safe Harbor's 18 categories as the medical preset) | Batch files (TXT, DOCX, CSV, PDF text) |
| **Review UI:** every detection highlighted; accept/reject each; add missed items | Custom dictionaries (your clinicians, MRN formats, client names) |
| Modes: redact `[NAME]`, mask `****`, **consistent pseudonyms** ("Patient A") | **Reversible mode:** re-identify an AI's reply locally using a key map only you hold |
| Summary of what was removed | Audit log export (counts, rules, reviewer, timestamp — never the PHI itself) |
| On-device NER for names (not just regex) | Saved rule sets, team sharing of rules |

**Language:** "de-identification assistant — human review required." Never "HIPAA compliant" (see §11). The current prototype's regex also over-redacts (any 4+ digit number, so "1000 mg" and "2024" vanish) and misses unlabelled names — the most common identifier.

### 5.4 Tool lifecycle

`Idea → Alpha (hidden, noindex) → Beta (public, labelled) → Stable → Deprecated (301 to successor)`

**Why:** no "coming soon" cards, no thin pages in Google's index, and a clear bar for going public.

### 5.5 Definition of Done (every tool, every time)

1. Engine passes golden fixtures (for pro tools: ≥ 3 worked examples from recognised textbooks/standards, cited).
2. Works on a 360 px phone, keyboard-only, and with a screen reader.
3. Zero network requests during processing (verified automatically) — or declared in the manifest.
4. Performance budget met (§8.10).
5. Content: how-to, formula/method, worked example, FAQ, references.
6. Sample data button works.
7. Analytics events wired (run, complete, export, gate-view) — privacy-friendly, no content captured.

---

## 6. Page templates

Fourteen templates cover the whole platform. Adding tool #500 adds **zero** templates.

| # | Template | Purpose |
|---|---|---|
| P1 | Home | Orientation, search, return visits |
| P2 | Category hub | Browse a tool family; rank for "surveying calculators" |
| P3 | Profession landing (`/for/…`) | Speak to one audience; convert to Pro |
| P4 | **Tool page** (5 archetypes) | The product. 95% of traffic lands here |
| P5 | Workflow page | Show chained jobs; the Pro story |
| P6 | Guide (`/learn/…`) | Teach the method; rank for "rise and fall method" |
| P7 | Pricing | Convert |
| P8 | Dashboard (`/app`) | Return to work |
| P9 | Project workspace | Do the job; compose reports |
| P10 | Auth & onboarding | Sign in (email link / Google) + 2-question personalisation |
| P11 | Settings (account, billing, brand kit) | Manage |
| P12 | Trust centre (`/how-it-works`, `/privacy`, `/security`) | Prove the privacy claim |
| P13 | Utility pages (search, 404, changelog) | Recover and inform |
| P14 | Embed (`/embed/{tool}`) | Tool-only view for third-party sites |

### 6.1 P1 · Home

```
┌───────────────────────────────────────────────────────────────┐
│  Professional tools. Zero uploads.                            │
│  Surveying, privacy, document and data tools that run         │
│  entirely in your browser. No sign-up. No ads.                │
│  ┌─────────────────────────────────────────────┐              │
│  │ 🔍 What do you need to do?            ⌘K    │              │
│  └─────────────────────────────────────────────┘              │
│  [Rise & Fall] [Traverse] [Redact text] [Merge PDF] [JSON]    │
├───────────────────────────────────────────────────────────────┤
│  Continue where you left off   (only if local history exists) │
├───────────────────────────────────────────────────────────────┤
│  Professional suites                                          │
│  ┌ Surveying ─────┐ ┌ Privacy ────────┐ ┌ Documents ─────┐     │
│  │ 3 key tools    │ │ 3 key tools     │ │ 3 key tools    │     │
│  │ Pro workflow → │ │ Pro workflow →  │ │                │     │
│  └────────────────┘ └─────────────────┘ └────────────────┘     │
├───────────────────────────────────────────────────────────────┤
│  "Turn off your Wi-Fi. It still works."  [How it works →]     │
│  (diagram: your device ⟲ processing   vs   upload → server)   │
├───────────────────────────────────────────────────────────────┤
│  All categories (only those with ≥3 tools, with counts)       │
├───────────────────────────────────────────────────────────────┤
│  Calculations are free forever. Pay only for workflow.        │
│  [See Pro]                                                    │
└───────────────────────────────────────────────────────────────┘
```

**Why:** most visitors land on tool pages from Google, not on the home page. Home-page visitors are either **explorers** (so search and suites) or **returners** (so "Continue"). No carousels, no stock photos, no invented testimonials — add real quotes only when you have them.

### 6.2 P2 · Category hub

Header (name, one-line purpose, tool count) → **"Start here"** (3 most-used tools) → subcategory sections with tool cards → related workflows → short, useful intro text (not SEO filler) → FAQ.
Filter chips: *Free only · Supports import · Works offline*. Tool cards show name, one-line job, and small badges (Pro features · Offline · New).

### 6.3 P3 · Profession landing (`/for/land-surveyors`)

Problem statement in their words → the 3–5 tools they need, ordered by workflow → one workflow demo (screenshot/animation of level book → report) → what Pro adds for them → trust (verification, privacy) → CTA. This is the page you link from LinkedIn posts, surveyor forums and college partnerships.

### 6.4 P4 · Tool page (the most important template)

```
Home › Surveying › Rise & Fall Calculator
Rise & Fall Leveling Calculator                    [🔒 Runs locally]
Reduce levels, run all arithmetic checks, export a clean level book.
[ Rise & Fall | Height of Instrument ]          [Try sample] [? Help]
┌─────────────────────────────────────────────────────────────────┐
│                  THE TOOL (archetype layout)                    │
│   inputs / grid                      │   results · checks ✔✔✖   │
└─────────────────────────────────────────────────────────────────┘
[Copy] [Print] [Export ▾] [Save to project ▾]      ← Pro items show 🔒
── below the fold ──────────────────────────────────────────────────
How to use (3 steps) · Method & formula · Worked example ·
Understanding the checks · FAQ · Related tools · Next step ·
References & standards · Verified against (fixtures) · Changelog
```

**Rules**
- Above the tool: only breadcrumb, H1, one line and the privacy badge. Nothing else.
- The tool is fully usable without scrolling at 360 px and at 1366×768.
- **Never block the result. Gate the action.** Locked actions stay visible with a small lock; clicking opens a compact upgrade sheet showing a *preview of their own data* in the Pro format (e.g., their level book as a branded PDF). Show value, then ask.
- No pop-ups, no timers, no interstitials, no ads.
- The content below the tool must be *genuinely useful* (method, worked example) — this is what earns rankings and AI-answer citations.

**The five archetypes**

| Archetype | Layout | Used by |
|---|---|---|
| **A · Instant transform** | Two panes: input ⇄ output, live as you type, swap button | JSON format, Base64, case convert, Safe Paste |
| **B · Calculator** | Form (left/top) → result card + checks (right/bottom) | CBM, curve setting-out, GST, unit convert |
| **C · Workbench grid** | Full-width dense grid + side/bottom check panel + plot | Level book, traverse, BBS, BOQ |
| **D · File pipeline** | Drop zone → options → file queue with per-file status → download all | PDF merge, image resize, batch redaction |
| **E · Visual canvas** | Canvas/plot centre, controls in a side panel | Crop, traverse plot, container loading |

Every archetype shares the same header, action bar, privacy badge, content area and gating — only the middle block changes.

### 6.5 P5 · Workflow page

A visual chain: `Field book → Reduce levels → Profile → Cut/fill → Report`, each step linking to its tool with "open in project" for Pro. **Why:** it shows the difference between a calculator site and a professional workspace — that is the Pro sales pitch, in the user's own job terms.

### 6.6 P6 · Guide

Article layout (max ~70 characters per line) with the **tool embedded near the top**, formulas rendered properly, worked examples as tables, diagrams, and a "Try it with this data" button that loads the example into the tool. Guides earn links from teachers and forums; tools earn the conversions.

### 6.7 P7 · Pricing

```
      Monthly | [Annual — 2 months free]          Currency: ₹ / $ (auto)
┌── Free ─────────────┐ ┌── Pro ★ ────────────────┐ ┌── Team (soon) ─┐
│ Every calculation   │ │ Everything free, plus:  │ │ Shared projects│
│ Every tool          │ │ Import (CSV/XLSX/raw)   │ │ Shared brand   │
│ Print & attributed  │ │ Branded reports         │ │ Admin, invoices│
│ export              │ │ Unlimited projects+sync │ │                │
│ Autosave drafts     │ │ Batch & templates       │ │ [Join waitlist]│
│ [Start free]        │ │ [Go Pro]  or 24h pass   │ │                │
└─────────────────────┘ └─────────────────────────┘ └────────────────┘
What's always free (explicit list) · Feature comparison table ·
FAQ: privacy, cancel anytime, GST invoices, student pricing, refunds
```

**Why "always free" first:** professionals distrust freemium traps. Stating exactly what will *never* be paywalled builds the trust that converts.

### 6.8 P8 · Dashboard (`/app`)

```
Good morning, Rajeev                                  [+ New ▾]
┌ Continue ──────────────────────────────────────────────────┐
│ NH-48 Km 12 · Level run 3      edited 2h ago     [Open]    │
│ Clinic notes batch · 14 files  edited yesterday  [Open]    │
└────────────────────────────────────────────────────────────┘
┌ Projects ─────────────────┐  ┌ Pinned tools ───────────────┐
│ list · status · sync      │  │ Rise & Fall · Traverse · …  │
└───────────────────────────┘  └─────────────────────────────┘
┌ Templates ────────────────┐  ┌ Plan ───────────────────────┐
│ Level book (company)      │  │ Pro · renews 12 Oct         │
└───────────────────────────┘  └─────────────────────────────┘
```

**Key decision — local-first dashboard:** the dashboard works **without an account** ("Saved on this device. Sign in to sync."). Free users get autosaved drafts and **one** local project — enough to feel the value of projects, which is what later converts them. Pro unlocks unlimited projects, sync, versions and sharing.

### 6.9 P9 · Project workspace

```
┌──────────────┬────────────────────────────────────┬───────────────┐
│ NH-48 Km 12 ▾│ Level run 3             ● Encrypted │ INSPECTOR     │
│              │ ┌────────────────────────────────┐ │ Checks  ✔ ✔ ✖ │
│ ▾ Sheets     │ │                                │ │ Misclosure    │
│   Level run 1│ │   active sheet                 │ │  −8 mm / ±12  │
│   Level run 2│ │   (tool archetype, embedded)   │ │ ───────────── │
│ ▸ Traverse A │ │                                │ │ Job details   │
│ ▾ Reports    │ │                                │ │ Instrument    │
│   Final.pdf  │ └────────────────────────────────┘ │ Operator, date│
│ ▸ Files      │                                    │ ───────────── │
│ ▸ Notes      │ [Compose report]  [Export ▾]       │ History       │
└──────────────┴────────────────────────────────────┴───────────────┘
 status bar: Saved locally 12:04 · Synced · 0 errors
```

- **Left:** project tree (sheets, reports, files, notes).
- **Centre:** the same tool archetypes, in "embedded mode" (no marketing content).
- **Right inspector:** checks, job metadata (site, client, job number, instrument, operator, date, benchmark, weather), version history.
- **Report composer:** select sheets → choose template → apply brand kit → live preview → export PDF/XLSX (and DXF for survey data).

**Why this layout:** it mirrors how professionals already think (job → documents → deliverable) and borrows the proven three-pane pattern from Linear, Figma and VS Code. The report composer is the single most valuable Pro feature — it turns hours of Word/Excel formatting into one click.

### 6.10 P10–P14 (brief)

- **Auth:** email magic link + Google. No passwords to store. Onboarding asks two questions (profession, main task) to pin the right tools — skippable.
- **Settings:** account, billing (GST invoice details for Indian businesses), **brand kit** (logo, colours, letterhead, signature, default report footer), data (export everything, delete everything, encryption key backup).
- **Trust centre:** plain-language "how it works" diagram, network-activity explanation, the CSP policy published, open-source engine tests (optional), third-party list (should be short), data-protection position for India's DPDP Act and GDPR/HIPAA context — worded carefully, without compliance claims.
- **404:** search box + popular tools. **Changelog:** dated entries per tool (freshness signal + trust).
- **Embed:** tool-only, "Powered by MangoTools" link, no user data leaves the host page.

---

## 7. Component library

### 7.1 Layers

```
Tokens  →  Primitives  →  Form & data  →  Tool kit  →  Patterns  →  Shells
(colour,    (button,      (number/unit    (privacy     (upgrade,   (marketing,
 type,       input,        field, angle    badge,       empty,      tool, app,
 space)      dialog)       field, grid)    checks…)     onboarding) workspace)
```

**Build on accessible headless primitives** (a Radix/Ark-style library for your chosen framework) for dialogs, menus, popovers, tabs and tooltips. Hand-rolled versions of these are where most accessibility bugs live.

### 7.2 Primitives

Button (primary, secondary, ghost, destructive; sizes S/M/L; loading state) · IconButton · Link · Input · Textarea · Select · Combobox · Checkbox · Radio · Switch · Slider · Tabs · SegmentedControl · Tooltip · Popover · Dialog · Sheet (bottom on mobile, side on desktop) · Toast · InlineAlert · Banner · Badge · Kbd · Avatar · Skeleton · Spinner · Divider · Accordion.

### 7.3 Form & data components (where professional quality lives)

| Component | What makes it professional | Notes |
|---|---|---|
| **NumberField** | Unit suffix, fixed precision, accepts `1,5` and `1.5` by locale, keeps blank ≠ zero, arrow-key stepping | Used everywhere |
| **AngleField** | Parses `45°30'15"`, `45 30 15`, `45.5042`, `N 45°30' E`, gon; shows normalised value | Surveying, construction |
| **LengthField** | m / ft / ft-in (`5' 3"`); knows the international foot vs the (retired) US survey foot | Precision matters to surveyors |
| **DataGrid** | Excel-like keyboard nav, **paste from Excel**, computed read-only columns, row-level error/warning states, undo/redo, frozen header, virtualised rows, compact density | **Largest single investment; powers every T1 tool.** Check licences — some grid libraries are free only for non-commercial use |
| **RowCardEditor** | Mobile alternative to DataGrid, one row per card | Field use on phones |
| **DropZone + FileQueue** | Multi-file, per-file progress, "processing locally" indicator, per-file errors, reorder | All file tools |
| **Diff/Highlight view** | Inline highlight of detections with accept/reject | Redaction, diff checker |

### 7.4 Tool-kit components (the shared tool experience)

| Component | Purpose |
|---|---|
| **ToolHeader** | Breadcrumb, H1, summary, privacy badge, variant tabs, sample/help |
| **PrivacyBadge** | States: *Runs locally* · *On-device AI* · *Encrypted sync* · *Uses network: …* — driven by the manifest |
| **ResultPanel** | Primary value, secondary values, copy, units |
| **CheckPanel** | List of checks: rule, computed value, tolerance, ✔/✖, plain-language explanation |
| **WorkingSteps** | Expandable step-by-step calculation per row ("show the work") |
| **FormulaBlock** | Properly typeset formulas (KaTeX-style) |
| **ActionBar** | Copy · Print · Export ▾ · Save ▾ — sticky on mobile; gating built in |
| **ExportMenu** | Formats from manifest; Pro formats show lock + preview |
| **UpgradeSheet** | Compact paywall showing the user's own data in Pro output; Pro / day pass options |
| **ReportPreview** | Paged preview with brand kit applied |
| **Plot** | SVG plots (traverse, level profile) with zoom, export PNG/SVG |
| **SampleDataButton** | Loads a realistic worked example |
| **Disclaimer** | Levels: none / standard / professional ("verify before use") / sensitive-data |
| **VerifiedPanel** | Fixture sources, last verified date, version |
| **RelatedTools / NextStep** | From manifest graph |
| **FAQ** | Accordion + structured data |

### 7.5 Patterns

Empty states (always with a sample-data action) · Error recovery (what went wrong + how to fix, never a stack trace) · Offline / update-available banners · Draft recovery ("Restore your unsaved level run?") · Upgrade moments (only on gated actions, never on page load) · Onboarding (two questions, skippable) · Keyboard shortcut overlay (`?`).

### 7.6 Shells (layouts)

MarketingShell (header, footer) · **ToolShell** (header + archetype slot + action bar + content) · AppShell (sidebar, top bar) · WorkspaceShell (three-pane) · DocsShell (guides) · EmbedShell (tool only).

### 7.7 Governance

- A single living component reference page (internal) showing every component in light/dark/compact.
- **No one-off components inside tools.** If a tool needs something new, it is built as a shared component first.
- Every component is accessible (keyboard, focus, labels) before it is merged.

---

## 8. Design system

### 8.1 Personality

**Precise · calm · confident — "instrument-grade."** Think of a well-made measuring instrument: nothing decorative, everything legible, obvious where to look. Borrow Linear's density, Stripe's documentation clarity, Vercel's restraint and Apple's typographic care.

**Honest note on the current prototype:** cream background, 900-weight headlines, pill-shaped buttons and 18 px radii read as *lifestyle/consumer*, not *professional*. Keep the warmth of Mango as an accent, not as the whole atmosphere.

### 8.2 Colour tokens

Warm-neutral greys (a subtle nod to Mango) + one brand accent + semantic colours. **Contrast values below were computed, not guessed.**

| Token | Light | Dark | Use / contrast note |
|---|---|---|---|
| `bg` | `#FFFFFF` | `#0C0A09` | Page |
| `surface-subtle` | `#FAFAF9` | `#1C1917` | Panels, table headers |
| `border` | `#E7E5E4` | `#292524` | Dividers (decorative) |
| `border-input` | `#948D87` | `#6B645E` | Input outlines — 3.27:1 / 3.01:1 (meets 3:1 for UI components) |
| `text` | `#1C1917` | `#FAFAF9` | 17.5:1 / 18.9:1 |
| `text-muted` | `#57534E` | `#D6D3D1` | 7.6:1 / 13.3:1 |
| `text-subtle` | `#78716C` | `#A8A29E` | 4.8:1 / 7.8:1 — minimum for small text |
| `accent` (Mango) | `#FFB000` | `#FFB000` | **Fills only** — primary button, logo, highlights |
| `on-accent` | `#1C1917` | `#1C1917` | Text on Mango — 9.6:1 |
| `accent-text` | `#B45309` | `#FFB000` | When Mango must be text — 5.0:1 / 10.8:1 |
| `focus-ring` | `#D97706` | `#FFB000` | 3.2:1 / 10.8:1 |
| `success` | `#15803D` | `#4ADE80` | 5.0:1 / 11.3:1 |
| `warning` | `#C2410C` | `#FB923C` | 5.2:1 / 8.7:1 — **deliberately orange, not yellow**, so warnings never look like brand accents |
| `danger` | `#B91C1C` | `#F87171` | 6.5:1 / 7.1:1 |
| `info` | `#1D4ED8` | `#60A5FA` | 6.7:1 / 7.8:1 |

**Rules**
- Mango `#FFB000` on white is only **1.8:1** — never use it for text, icons or focus rings on light backgrounds.
- Semantic states always pair colour **with an icon and words** ("✖ Misclosure exceeds allowable") — never colour alone.
- **No category rainbow.** Categories get an icon in a neutral tile, not their own loud colour. Nine competing colours would fight the semantic colours that professionals rely on (pass/fail).
- **Dark mode from day one** (tokens make it nearly free). Developers expect it; engineers work late.
- A separate, colour-blind-safe **data-viz palette** for plots.

### 8.3 Typography

- **UI & content:** Inter (or Geist) — excellent numerals, huge language coverage. Plan a Devanagari companion (e.g. Noto Sans Devanagari) for a future Hindi UI.
- **Code & raw data:** a monospace such as JetBrains Mono or Geist Mono.
- **Tabular numerals everywhere numbers align** — columns of reduced levels must line up digit-for-digit.
- **Self-host all fonts.** Loading fonts from a third-party CDN sends visitors' IP addresses to that provider — incompatible with the privacy promise (a German court awarded damages against a website operator over exactly this in 2022).
- **Weights:** 400 / 500 / 600 only. (The prototype's 900 is too heavy for a professional tool.)

| Role | Size / line-height | Weight |
|---|---|---|
| Display (home hero only) | 48 / 52 (mobile 36 / 40) | 600, tracking −2% |
| H1 (tool title) | 30 / 36 | 600 |
| H2 | 24 / 32 | 600 |
| H3 | 18 / 26 | 600 |
| Body (content) | 16 / 26 | 400 |
| UI / dense tables | 14 / 20 (compact 13 / 18) | 400–500 |
| Caption / label | 12 / 16 | 500 |

### 8.4 Spacing, radius, elevation

- **Spacing:** 4 px base → 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96.
- **Radius:** 4 (checkbox, small chips) · 6 (buttons, inputs) · 8 (cards, panels) · 12 (dialogs, sheets). Full pills only for small badges.
- **Elevation:** prefer 1 px borders over shadows. Two shadow levels only: popover and dialog.

### 8.5 Density modes

**Comfortable** (marketing, calculators; 40 px rows) and **Compact** (grids, workspace; 32 px rows). Users can switch; the choice is remembered locally. Surveyors entering 200 readings want compact.

### 8.6 Layout grid

12 columns · marketing max-width 1200 px · tool pages 1280 px · **Workbench archetype may go full-bleed** · breakpoints 640 / 768 / 1024 / 1280 / 1536 · 16 px side gutter on phones.

### 8.7 Iconography & motion

- **Icons:** one open-source outline set (e.g. Lucide), 1.5 px stroke, sizes 16/20/24. No mixed sets.
- **Motion:** 120–200 ms, ease-out, only to explain change (a panel opening, a check turning green). Nothing decorative. Respect reduced-motion settings.

### 8.8 Data display rules (professional details)

- Right-align numbers; units in column headers, not in cells.
- Fixed decimals by quantity (levels 3 dp, bearings to seconds, currency 2 dp) — set per manifest, user-adjustable.
- Use a true minus sign (−), not a hyphen.
- Locale-aware grouping, including **Indian lakh/crore grouping** as an option.
- Blank ≠ zero, visibly.

### 8.9 Voice & tone

Plain, precise, calm. Say what happened and what to do: *"Misclosure is 18 mm; allowable is ±12 mm. Check the FS at CP-3."* No hype ("military-grade", "AI-powered magic"), no exclamation marks, no guilt-trip upgrade copy.

### 8.10 Accessibility & performance budgets

- **WCAG 2.2 AA**, keyboard-first, visible focus, 24 px minimum targets (44 px for primary mobile actions).
- **Performance** (measured on a mid-range Android on 4G): LCP < 1.8 s · INP < 200 ms · CLS < 0.05 · initial JS for simple tools < 100 KB compressed · heavy WebAssembly modules load only after the user starts a task · all heavy computation in Web Workers.
- **i18n-ready:** all strings externalised, logical CSS properties (RTL-safe), locale-aware numbers — even though launch is English-only.

---

## 9. Business model

### 9.1 Principle (refined)

Your rule — *never charge for calculations, charge for workflow* — is right. Sharpened:

> **Never charge for the answer. Charge for time saved, for looking professional, and for keeping records.**

### 9.2 Plans

| | **Free** | **Pro** | **Team** (Phase 4) | **Education** (Phase 4) |
|---|---|---|---|---|
| All calculations & tools | ✅ unlimited | ✅ | ✅ | ✅ |
| Manual entry, paste from Excel | ✅ | ✅ | ✅ | ✅ |
| Step-by-step working, checks, plots | ✅ | ✅ | ✅ | ✅ |
| Print | ✅ | ✅ | ✅ | ✅ |
| PDF/CSV export | ✅ with "Made with MangoTools" footer | ✅ clean + **your branding** | ✅ | ✅ attributed |
| Import CSV/XLSX | Small files (e.g. ≤ 50 rows) | ✅ unlimited | ✅ | ✅ |
| Instrument raw-file import, DXF export | — | ✅ | ✅ | — |
| Autosaved drafts | ✅ | ✅ | ✅ | ✅ |
| Projects | 1 local project | Unlimited + **encrypted sync** + versions | Shared projects | Class projects |
| Report composer, templates, brand kit | — | ✅ | Shared brand kit | — |
| Batch processing | Small batches (e.g. 3 files) | ✅ large batches | ✅ | — |
| Support | Community / email | Priority email | Priority + onboarding | Instructor support |

**Why a small free import/batch allowance instead of none:** it lets people *experience* the workflow before paying. Hard walls convert worse than tasted value.

### 9.3 Pricing — challenging $2.99 / $4.99

Merchants of record such as Paddle and Lemon Squeezy (which handle global VAT/sales tax for you) charge about **5% + $0.50 per transaction**. At low prices the fixed $0.50 dominates:

| Price | Fee (5% + $0.50) | Share of revenue lost |
|---|---|---|
| $2.99 / month | $0.65 | **21.7%** |
| $4.99 / month | $0.75 | 15.0% |
| $6.00 / month | $0.80 | 13.3% |
| $48 / year | $2.90 | **6.0%** |

Plus: two plans $2 apart force a decision that has no clear answer, and hesitation kills conversions. For a surveyor in the UK, US or Australia, $6 vs $3 is irrelevant; what matters is whether the report looks professional.

**Recommendation (starting point, test and adjust):**

| Plan | International | India |
|---|---|---|
| Pro monthly | $6 | ₹299 |
| **Pro annual (default toggle)** | **$48** (≈ $4/mo) | **₹2,499** |
| 24-hour pass | $2 | ₹99 |
| Team (later) | ~$10 / seat / month, min 3 | ~₹499 / seat |
| Student | Free Pro-lite via verified college email or institution licence | |

- **Annual-first** cuts fee drag to ~6% and reduces churn.
- **Regional pricing** (purchasing-power parity) for India, Pakistan, Nigeria, Philippines etc. — large surveying-student and site-engineer markets.
- **24-hour pass:** professional use is often *bursty* ("I need one clean report today"). A pass captures people who will never subscribe, and many convert later.

### 9.4 Payments stack (decision needed)

- **Option A — one merchant of record** that supports INR/UPI and pays out to an Indian bank: simplest; handles global tax. Evaluate Paddle, Lemon Squeezy and India-focused MoRs (e.g. Dodo Payments, Playto) on INR/UPI support, fees, payouts and GST invoicing.
- **Option B — MoR for international + Razorpay for Indian customers:** cheaper for India (UPI), proper GST invoices, but two systems to maintain.

My recommendation: **start with A** if a provider covers INR well; move to B only when Indian revenue justifies it.

### 9.5 Entitlements architecture

Code checks **capabilities**, never plan names: `export.pdf.branded`, `import.instrument`, `projects.unlimited`, `batch.large`, `sync.encrypted`.
Plans, day passes, trials, student and team licences are just bundles of capabilities. **Why:** you can repackage pricing any time without touching tool code.

**Honest note on client-side gating:** anything that runs in the browser can be bypassed by a determined developer. Accept it. The people who crack a $6 tool were never going to pay. The value that cannot be bypassed — encrypted sync, hosted templates, report verification, instrument-format updates, support — is where Pro should concentrate over time.

### 9.6 Realistic revenue model

Organic tool sites convert a small fraction of visitors. Plan with conservative numbers and treat anything better as upside:

| Monthly visitors | Paid conversion (of visitors) | Paying users | Blended revenue/user/month* | MRR |
|---|---|---|---|---|
| 20,000 | 0.3% | 60 | ~$3.5 | ~$210 |
| 100,000 | 0.3% | 300 | ~$3.5 | ~$1,050 |
| 300,000 | 0.4% | 1,200 | ~$3.5 | ~$4,200 |

*Blended across annual, monthly, INR and passes.

**Implication:** subscriptions from individuals alone are a slow build. Real upside comes from **Team plans, Education licences, white-label embeds for equipment dealers/firms, and (later) API/MCP access** — which is why the architecture includes them from day one.

### 9.7 Cost model

Static pages on a CDN (Cloudflare-style free/low tiers), a small auth + database service, object storage for encrypted sync blobs, a domain, privacy-friendly analytics. Expect **roughly $0–50/month** until you have thousands of active Pro users. Client-side processing is what makes this possible — you never pay for compute or file bandwidth.

### 9.8 What not to monetise with

**No display ads, ever — on any page.** Ad scripts track users across sites, which directly contradicts the privacy promise, slows pages, and signals "cheap" to professionals. The same applies to session-replay tools on tool pages.

---

## 10. Future roadmap

Timings assume a part-time founder plus AI-assisted development. The sequence matters more than the dates.

### Phase 0 — Foundations (weeks 1–4)
- Decide domain, brand relationship and target market (§13).
- Design tokens, typography, core primitives, **ToolShell** with archetypes A, B, C.
- Manifest system → page, sitemap, search index, structured data generation.
- Privacy enforcement: strict CSP, no third-party scripts, privacy-friendly analytics, offline-capable service worker.
- Engine test harness with golden fixtures.
- **Exit:** a new calculator can be added by writing a preset + manifest only.

### Phase 1 — Public beta (weeks 5–10)
- **Rise & Fall + HI method** (rebuilt correctly), **Bowditch + Transit**, **PHI/PII Scrubber** (text, review UI, on-device NER evaluation).
- ~12 generic tools: JSON formatter, Base64, CSV↔JSON, UUID, timestamp, regex tester, word counter, QR generator, image resize, PNG↔JPG, PDF merge, PDF split, JPG→PDF.
- One guide per professional tool; trust centre; changelog.
- **Exit:** all tools pass fixtures; Core Web Vitals green; pages indexed; 10 real surveyors and 5 privacy-sensitive users interviewed.

### Phase 2 — Pro launch (weeks 11–18)
- Accounts (magic link + Google), payments, entitlements, day pass.
- Import engine (CSV/XLSX), report engine (branded PDF, XLSX with formulas), brand kit.
- Local projects + dashboard. Attributed free exports.
- **Exit:** first 20 paying users; clear data on which gate converts.

### Phase 3 — Workspace (months 5–8)
- End-to-end encrypted sync, project workspace, **report composer**, templates, version history.
- Surveying: instrument raw-file import (start with the most common digital-level format among your users), DXF export, report verification QR, **offline Field Mode** (installable PWA).
- Privacy: batch files, PDF redaction (true removal, not black boxes over text), custom dictionaries, **Safe Paste browser extension**.

### Phase 4 — Expansion (months 8–14)
- **Construction:** bar bending schedule, BOQ, concrete/brick/steel quantities (with Indian Standard code presets if India-first).
- **Logistics:** CBM, chargeable/volumetric weight, pallet and container planner.
- Team plans, Education programme, embeddable calculators.
- Legal PDF tools: Bates numbering, page numbering, watermark, flatten.

### Phase 5 — AI & platform (12+ months)
- On-device AI: **photo of a handwritten field book → filled grid**; natural-language tool finder ("I need to adjust a closed traverse").
- **MCP server / API** exposing engines, so Claude, ChatGPT and other agents can run MangoTools calculations — with results that link back to you.
- Template marketplace (firm-specific report templates).

### Deliberately NOT on the roadmap

| Idea | Why not |
|---|---|
| PDF → Word, PDF editor | Very hard to do well in a browser; incumbents' home turf; low differentiation |
| Video compressor, AI upscaler, background remover | Heavy downloads on mobile, commoditised, off-strategy |
| Pediatric dosing / clinical calculators | Patient-safety liability, "Your Money or Your Life" content scrutiny, dominated by established clinical sites |
| E6B flight computer, EPUB→PDF, real-estate matrices | Scattered audiences with no workflow connection to your suites |

---

## 11. Critique of this project

Direct, because it will save you months.

1. **Focus is the biggest risk.** Nine categories and ~70 listed ideas, run by a founder who also runs Mango Pie, BeyandTheAI, misting systems and other projects. Two excellent suites will beat nine mediocre ones — in SEO, in word of mouth and in your available hours.

2. **The keyword research in `Pasted text.txt` should not be trusted.** Its citations don't support its numbers — a HIPAA keyword volume is cited to a land-surveying forum, the Bowditch formula to an SEO tool's page, PHI identifiers to a container-loading calculator. A figure of 22,000–28,000 global monthly searches for "rise and fall leveling calculator" is implausibly high for a niche academic term. **Validate in Google Keyword Planner and, after launch, Search Console before committing roadmap priority.**

3. **The surveying audience is mostly students.** Rise-and-fall and Bowditch queries are heavily driven by civil engineering students (India, Pakistan, Nigeria, UK, etc.), who have low willingness to pay. Professionals often use instrument software or firm Excel templates. **Design for this reality:** free step-by-step working for students (traffic, links, goodwill); import/report/DXF for professionals (revenue); institution licences (B2B).

4. **"Generic tools for traffic" is weaker than it looks.** Head terms ("merge pdf", "json formatter") are dominated by sites with enormous authority; a new domain won't rank for them for a long time. Build fewer generic tools, make them excellent, and target the long tail where privacy is the differentiator: "merge PDF offline", "redact PDF without uploading", "HAR file sanitizer", "remove EXIF location".

5. **Brand and domain conflict.**
   - Google's own documentation says country-code domains like `.in` "provide a strong signal to both users and search engines that your site is explicitly intended for a certain country." Good for an India-first product; a handicap for US/UK/Australian surveyors and HIPAA-context users.
   - MangoPie is known as a gifts, toys and home-décor store. Cross-promoting it on surveying and medical tools confuses professionals and dilutes trust. The prototype's CTAs also promote "MangoPie AI automation" and "document automation" products that don't exist.
   - A subdomain of a low-traffic site inherits little authority anyway.
   - **Recommendation:** standalone generic domain (check availability of options like a `.com`, `.app` or `.tools`); MangoPie appears as the parent company in the footer and legal pages only. If you deliberately choose **India-first**, `tools.mangopie.in` becomes defensible — but make that a conscious strategic choice, not a default. Also run a trademark search on "MangoTools"; "Mango" is used by many software brands.

6. **Pricing is too low and too split** (§9.3).

7. **"HIPAA compliant" / "HIPAA-proof" claims are a liability.** Software alone can't be "HIPAA compliant" — HIPAA obligations apply to covered entities and their business associates and their processes. Compliance buyers know this and will distrust a site that claims otherwise. In India, the DPDP Act 2023 and its Rules (notified November 2025, with obligations phasing in) are the relevant regime. Use accurate language: *"De-identification assistant. Processes locally. Human review required."*

8. **Prototype correctness.** The Rise & Fall page computes with the height-of-instrument method, has no Rise/Fall columns, can't tell a blank cell from a 0.000 reading, and lacks misclosure checks. The PII regex over-redacts numbers and misses unlabelled names. For professional tools, **correctness is the brand** — every pro engine needs textbook-verified fixtures before launch.

9. **Privacy promise vs. common practice.** Google Analytics, ad networks, **session-replay tools (e.g. Microsoft Clarity, Hotjar)**, third-party font CDNs and external script CDNs all contradict "your files never leave your browser." Session replay on a PHI tool could literally record patient text. Enforce the promise technically (CSP), use cookieless privacy-friendly analytics, and never run replay on tool pages.

10. **Design direction** of the prototype is consumer-playful (§8.1), and the forced 3-second "Processing locally…" modal is an artificial delay — remove it.

11. **"Coming soon" graveyard.** The current index lists ~70 non-working tools as cards. It erodes trust and invites thin-content problems. List only what works.

12. **Leaky gate: free Print vs paid PDF.** Browsers can print to PDF. Resolved by attributed free exports + branded Pro exports (§9.2).

13. **Medical calculators** (GFR, pediatric dosing) are off-strategy and carry real patient-safety risk. Drop them; the privacy engine is the medical opportunity.

14. **Maintenance at 500 tools** is only viable with engines, manifests and a strict Definition of Done. Without them, quality decays linearly with tool count — the exact problem of the cluttered sites you want to beat.

---

## 12. Better ideas you haven't considered

| # | Idea | Why it's powerful | Effort |
|---|---|---|---|
| 1 | **Safe Paste for AI** — pseudonymise sensitive text before pasting into ChatGPT/Claude, then *re-identify the AI's reply locally* | Every clinic, law firm and HR team using AI has this problem today. Same redaction engine. Natural browser-extension and B2B product | Medium |
| 2 | **Offline Field Mode** (installable PWA) | Surveyors work where there is no signal. And "works in airplane mode" is the most convincing privacy proof possible | Low–Medium |
| 3 | **Instrument raw-file import** (digital levels, total stations) | A real moat: ad-supported calculator sites won't build it; it saves professionals the most time | Medium |
| 4 | **DXF + total-station coordinate export** | Bridges calculation to CAD and the field — the next step in the surveyor's real workflow | Low–Medium |
| 5 | **Report verification QR** — every Pro report carries a QR + hash; clients scan to confirm it wasn't altered | Professional trust feature for surveyors submitting to clients/authorities. Only a hash is stored, never the data | Low |
| 6 | **Attribution loop** — free exports carry "Made with MangoTools" | Every shared report is marketing. Proven growth loop (Calendly, Loom) | Very low |
| 7 | **Student Mode + institution licences** | Turns the student-heavy audience into an asset: step-by-step working, exam-format tables; colleges and polytechnics buy site licences; instructors link to you (backlinks) | Medium |
| 8 | **WhatsApp-native sharing** (browser share sheet) | Indian site teams run on WhatsApp; one-tap "share level book PDF" fits reality | Very low |
| 9 | **Engines as MCP server / API** | "Run a Bowditch adjustment" inside Claude/ChatGPT with a link back to you — distribution in AI assistants, plus a paid API tier | Low (given manifests) |
| 10 | **Answer-engine optimisation** | Worked examples, clean formulas and verified sources are exactly what AI answer engines cite. Structure content so it's quotable | Low |
| 11 | **Free Excel/PDF templates** ("level book template", "BBS template") that link back to the live tool | High-intent downloads, and a bridge from Excel users to your workflow | Low |
| 12 | **Embeddable calculators** for teachers, bloggers and equipment dealers | Backlinks + a white-label B2B revenue line | Low–Medium |
| 13 | **"Verified" trust layer** on every pro tool: fixtures, sources, version, last verified | Engineers trust what they can audit; also a strong quality signal for search | Low |
| 14 | **India-first construction wedge** with Indian Standard presets (BBS, concrete mix, brickwork, steel weight) + Hindi UI later | Local competitors are ad-heavy and low quality; strong fit with your India base — *if* you choose India-first | Medium |
| 15 | **Photo-to-grid** — photograph a handwritten field book, on-device OCR fills the grid for review | A "wow" Pro feature that removes the most tedious step in leveling | High (Phase 5) |

---

## 13. Decisions needed from you

1. **Target market:** global-English professional brand, or India-first? (This drives domain, pricing emphasis, construction presets and language.)
2. **Domain & brand:** standalone generic domain with MangoPie as parent, or `tools.mangopie.in`?
3. **Launch scope:** confirm Surveying + Privacy suites + ~12 generic tools.
4. **Pricing:** accept single Pro plan (annual-first, regional, day pass) instead of Starter/Professional?
5. **Payments:** which merchant of record to evaluate first (INR/UPI support is the deciding factor).
6. **PHI Scrubber positioning:** "Safe Paste for AI" with medical as a preset?

---

## Appendix A — Recommended technical architecture (no code)

| Concern | Recommendation | Why |
|---|---|---|
| Site framework | **Astro** (static-first, "islands") | Ships zero JavaScript by default; each tool hydrates only its own island; content collections suit manifests + guides |
| Interactive islands | One framework only — **Preact** recommended | Tiny bundles; React-compatible, so AI coding tools generate it fluently |
| Language | TypeScript everywhere; engines as pure functions | Typed I/O = validation + API/MCP definitions for free |
| Compute | Web Workers; WebAssembly loaded on demand | UI never freezes; heavy code only when needed |
| Local storage | IndexedDB (projects), OPFS (large files) | Local-first projects, no server |
| Hosting | Static CDN + edge functions (Cloudflare-style) | Near-zero cost at scale |
| Auth / DB | Managed service with a free tier | Only for accounts, entitlements, sync metadata |
| Sync | Client-side encrypted blobs in object storage | Server never sees plaintext — keeps the privacy promise with cloud features |
| Search | Build-time static index (Pagefind/MiniSearch-style) | No search server |
| Analytics | Cookieless, privacy-friendly (Plausible/Umami/Cloudflare-style) | No consent banner; consistent with the promise |
| Errors | Error tracking with content scrubbing (never send inputs) | Debug without leaking data |
| Testing | Unit tests with golden fixtures for engines; end-to-end browser tests per archetype | Correctness is the brand |
| Licences | Audit every dependency. Avoid AGPL libraries (some popular PDF engines) and "non-commercial only" grids | A commercial product cannot ship them without paid licences or open-sourcing |

**Conceptual repository layout**

```
/engines      pure logic (survey, redaction, pdf, image, units…) + fixtures
/ui           tokens, primitives, tool-kit components
/tools        one folder per tool: manifest + preset + content
/web          Astro site: templates P1–P14, generated from /tools
/app          client-side workspace (projects, dashboard)
/docs         this document, decisions log, design reference
```

---

## Sources

- Google Search Central — [Managing multi-regional and multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) (ccTLD geotargeting; gTLDs not tied to locations)
- Heroes of Digital — [Google phasing out its own ccTLD search domains; no effect on sites' ccTLD geotargeting](https://www.heroesofdigital.com/seo/google-is-phasing-out-cctlds-seo-impact/)
- Playto — [Paddle vs Lemon Squeezy vs Playto Pay for Indian businesses, 2026](https://www.playto.so/blogs/paddle-vs-lemon-squeezy-vs-playto-pay-india) (5% + $0.50 MoR fees)
- Dodo Payments — [Lemon Squeezy alternatives](https://dodopayments.com/blogs/top-5-alternatives-to-lemon-squeezy)
- Wikipedia — [Digital Personal Data Protection Rules, 2025](https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Rules,_2025) (notified 14 Nov 2025, phased implementation)
- PIB — [DPDP Rules, 2025 notified (PDF)](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf)
- OpenMed — [Local-first clinical NER & PII de-identification (Apache-2.0)](https://github.com/maziyarpanahi/openmed) (example of on-device de-identification models to evaluate)
- Existing project files reviewed: `index.html`, `project-planner.html`, `tools/*.html`, `assets/*`, `Pasted text.txt` in `E:\Tools\mangotools`
- Contrast ratios in §8.2 and fee percentages in §9.3 were computed with the WCAG relative-luminance formula and the stated fee schedule.
