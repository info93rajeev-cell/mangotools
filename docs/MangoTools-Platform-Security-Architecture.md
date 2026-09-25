# MangoTools — Platform, Security & Engineering Architecture v1.1

**Prepared for:** Rajeev (MangoPie) · **Date:** 25 September 2026
**Roles:** CTO · Security Architect · SaaS Platform Architect · Browser Platform Architect · Enterprise Software Architect
**Builds on (approved):** `product-architecture.md` and `repository-blueprint.md`. The product and its philosophy are not redesigned. Where the new locked constraints change something in those documents, §15 lists the exact changes.
**Contains no code.** Architecture, decisions and reasons only.
**v1.1:** adds §18 Deployment & Trust Architecture (four deployment modes, organisation policies, signed update packages, Trust Center) and the small compatibility notes it requires in §0.1, §1.4, §2.3, §2.4, §9.8, §14 and §16.

---

## 0. Summary

### 0.1 Locked inputs this document obeys

- Deterministic JavaScript/TypeScript engines. Same input ⇒ same output. No LLM in any calculation.
- Everything that can run in the browser runs in the browser. **The server coordinates; it never calculates.**
- An internet connection is required (authentication, subscription validation, updates, extension licensing, device management, security, analytics, sync). Since v1.1 this means **a trusted MangoTools control plane must be reachable** — MangoTools' own, or the organisation's own server in Private and Air-Gapped deployments (§18.2).
- Plans: **Free · Professional · Business · Enterprise.** Subscription first. No daily charging. Tokens only later, only for expensive cloud operations.
- Engineering tools are **workspaces**, not calculators: Project Profile → Standard → Parameters → Material Library → Drawing/Measurements → Calculation → BOQ → Material Analysis → Financial Estimation → Reports.
- Every report states the engine version, reference-data version, standard used, rate source and revision.

### 0.2 The fifteen decisions that shape everything

| # | Decision | Why |
|---|---|---|
| 1 | **The server is a control plane only.** Its jobs are identity, licensing, devices, reference-data distribution, encrypted sync, audit, configuration and verification | Keeps hosting cost near zero at any scale, keeps user files private, and makes "server coordinates, never calculates" enforceable: no endpoint accepts engineering inputs |
| 2 | **Determinism is engineered, not assumed.** A deterministic math library replaces JavaScript's built-in trigonometric and exponential functions inside engines; money and measured quantities use decimal arithmetic | Browsers are allowed to compute `Math.sin` and similar functions slightly differently, so without this, "same input ⇒ same output" is false across Chrome, Firefox and Safari |
| 3 | **Every calculation is locked.** Each project revision stores a *calculation lock* that pins exact engine bundles, datasets, presets, parameters and input hashes | Reproducibility years later — the same idea as a software lockfile, applied to engineering |
| 4 | **Engine bundles and datasets are immutable and never deleted** | You can only reproduce a 2027 report in 2031 if the 2027 engine and dataset still exist |
| 5 | **Reference data is a first-class, signed, versioned product** with source, version, effective dates and licence | Engineering and financial results are only as trustworthy as their tables; versioning makes changes (e.g. a GST rate change) auditable |
| 6 | **Engineering modules are "module packs"** — data plus one domain engine — plugged into one shared workspace framework | 14 modules (and more later) without 14 architectures |
| 7 | **A project is a deterministic computation graph** (like a spreadsheet's dependency tree) evaluated in the browser | Change one measurement and only affected quantities, BOQ lines and costs recompute — traceably |
| 8 | **Identity is bought; licensing is built.** A standards-based identity provider handles sign-in; MangoTools' own licensing service owns plans, seats, devices and certificates | Identity is a commodity with high security risk; licensing is your business logic and must stay under your control and swappable |
| 9 | **Passwordless by default:** passkeys, email one-time codes, Google/Microsoft sign-in, and enterprise SSO | No password database to leak; passkeys resist phishing |
| 10 | **Device-bound credentials instead of fingerprinting.** Each device holds a non-exportable key; sessions and licences are bound to it | Stops cookie theft and casual account sharing without invasive tracking that conflicts with your privacy brand and data-protection law |
| 11 | **Signed entitlement certificates with a grace window** let paid features work through connectivity drops | "Internet required" must not mean "unusable on a building site with weak signal" |
| 12 | **End-to-end encryption for projects and company rate libraries**, with optional organisation-held recovery keys | Your commercial data and clients' rates stay unreadable to MangoTools, while businesses can still recover data when staff leave |
| 13 | **Large files are streamed, never loaded whole.** Limits come from the device's measured capabilities, not arbitrary caps | The only honest path to 1–5 GB files in a browser |
| 14 | **The browser extension is another client of the same platform** — same engines, same identity, same licence certificates, same device registry | Not a separate product, no separate backend |
| 15 | **Drawings: DXF, PDF and images first; DWG only through a licensed SDK** | DWG is proprietary; the only permissively usable routes are paid (ODA) — GPL libraries conflict with the licence policy |

---

## 1. Platform topology

### 1.1 The picture

```
                              ┌──────────────────────── CLIENTS (compute) ─────────────────────────┐
                              │  Web app (tools, workspaces)      Browser extension (Chrome/Edge)   │
                              │  ├─ UI (islands)                  ├─ Side panel / context menu UI   │
                              │  ├─ Runtime + worker pool         ├─ Service worker (auth, licence) │
                              │  ├─ Engines (deterministic)       ├─ Same engines, bundled          │
                              │  ├─ Workspace graph               └─ Same licensing client          │
                              │  ├─ IO layer (streams, OPFS)                                        │
                              │  ├─ Licensing client (certificate verify, grace)                    │
                              │  └─ Local store (IndexedDB/OPFS, encrypted)                         │
                              └──────────────┬──────────────────────────────────────┬──────────────┘
                                             │ HTTPS (same-origin /api, device-bound)│
┌──────────────────────── EDGE ──────────────▼──────────────────────────────────────▼──────────────┐
│  CDN (static site, immutable engine bundles, signed dataset bundles)                              │
│  WAF · rate limiting · bot challenge · TLS termination                                            │
└──────────────┬────────────────────────────────────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────── CONTROL PLANE (coordinates, never calculates) ─────────────────────┐
│ Identity adapter │ Licensing & Entitlements │ Device Registry │ Organisations & Access             │
│ Billing adapter  │ Reference Data Service   │ Sync Service    │ Audit Service                      │
│ Release & Config │ Verification Registry    │ Notifications   │ Telemetry Ingest                   │
│ (later) Cloud Operations — opt-in, metered by tokens                                               │
└──────────────┬────────────────────────────────────────────────────────────────────────────────────┘
               │
┌──────────────▼───────────── DATA ──────────────────────────────────────────────────────────────────┐
│ Relational DB (orgs, seats, devices, entitlements, catalog, audit index) — row-level tenant isolation│
│ Object storage (encrypted sync blobs, dataset bundles, engine bundles, audit archives)             │
│ Edge key-value cache (public keys, revocation epochs, config, entitlement snapshots)               │
│ Queue (webhooks, emails, audit writes)        Key management (signing keys, envelope keys)         │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
External: Identity provider (passkeys, OTP, social, SAML/OIDC SSO, SCIM) · Merchant of record / payments
```

### 1.2 Control-plane services

| Service | Responsibilities | Why it exists as its own service |
|---|---|---|
| **Identity adapter** | Bridges the external identity provider (IdP) to MangoTools users; maps IdP subjects to user ids; handles SSO and SCIM callbacks | Keeps the IdP swappable (vendor pricing, residency) without touching licensing |
| **Licensing & Entitlements** | Plans → capabilities; seat assignment; device limits; issues and signs **entitlement certificates**; revocation epochs; grace policy | The core of revenue protection; must be owned, audited and simple |
| **Device Registry** | Device activation/deactivation, device public keys, last-seen, activation throttles, pairing of web app and extension in the same browser profile | Device limits and account-sharing controls need a single source of truth |
| **Organisations & Access** | Organisations, teams, roles, invitations, domain verification, project membership (for shared projects), policy settings | Authorization data for Business/Enterprise |
| **Billing adapter** | Verifies merchant-of-record/payment webhooks; maps subscription events to licensing changes; GST invoice data | Billing providers change; licensing logic must not |
| **Reference Data Service** | Dataset catalog, access control per entitlement, signed bundle URLs, delta updates, publishing pipeline endpoints | Datasets are a licensed, versioned product (§3) |
| **Sync Service** | Stores opaque end-to-end-encrypted blobs; version vectors; quotas; sharing envelopes (wrapped keys) | Sync and team sharing without ever seeing content |
| **Audit Service** | Append-only, hash-chained security audit log; exports for Enterprise | Accountability and tamper evidence (§9.14) |
| **Release & Config** | Minimum client/extension versions, feature flags, kill switches, staged rollouts — all as **signed configuration** | Safe remote control of clients without shipping code |
| **Verification Registry** | Stores report content hashes (never content) for QR verification | Lets a client's customer verify a report was not altered |
| **Notifications** | Email for sign-in codes, billing, security alerts, invitations | Centralised templates and rate limits |
| **Telemetry Ingest** | Accepts catalogue-validated analytics events and scrubbed error reports | First-party, privacy-safe product analytics |
| **Cloud Operations** (later) | Opt-in expensive operations (e.g. DWG conversion, heavy OCR) metered by tokens | The only place the server may compute — explicitly labelled, consented, and never used for core calculations |

**Rule enforced in code review and API design:** no control-plane endpoint accepts measurements, drawings, quantities or financial inputs for computation. Cloud Operations is a separate, clearly-labelled service that users opt into per job.

### 1.3 Hosting and data residency

- **Edge + static:** the existing static-site and CDN plan remains (Cloudflare-style). Engine bundles and datasets are served from the CDN.
- **Control plane:** stateless edge functions in front of a **managed relational database** with a primary region in **India** and read replicas added as needed. Why relational: seats, devices and entitlements need strong consistency; a wrong seat count is a billing error.
- **Tenant isolation:** every tenant-owned row carries `org_id`/`user_id`; the database enforces row-level security in addition to application checks (defence in depth against broken object-level authorization).
- **Residency:** Indian customers' control-plane data stays in India by default; Enterprise can request dedicated regions later. Project content is end-to-end encrypted, so its storage location matters less legally — but keep it in-region anyway for enterprise procurement.

### 1.4 Connectivity model ("internet required", designed humanely)

| Situation | Behaviour | Why |
|---|---|---|
| First use of a free tool, not signed in | Works without an account (pages load from the internet) | Free tools are your SEO and acquisition engine; a login wall would destroy them |
| Signed in, online | Access token refreshed every 15 minutes; entitlement certificate refreshed every 6 hours and at start-up | Short tokens limit stolen-token damage |
| Signed in, connection drops | All work continues (engines are local); paid features stay unlocked until the certificate's **grace deadline** | Site engineers and surveyors lose signal routinely |
| Grace deadline passes while offline | Paid features lock; projects open **read-only**; raw data export (CSV/JSON) stays available; free features continue | Protects revenue without holding customers' data hostage |
| Back online | Silent refresh; everything unlocks | No friction for honest users |

This replaces the earlier "works fully offline" idea with a **bounded grace window** (see §15). In Private and Air-Gapped deployments the same model applies, with the organisation's own server as the control plane (§18).

---

## 2. Determinism and reproducibility

### 2.1 What "same input ⇒ same output" requires in a browser

| Source of non-determinism | Why it happens | Rule |
|---|---|---|
| `Math.sin`, `cos`, `tan`, `atan2`, `exp`, `log`, `pow`, `cbrt`, `hypot` | The JavaScript specification lets engines approximate these; results can differ in the last bits between browsers and versions | Engines must use **`engines/numeric`**, a pure implementation of these functions with fixed algorithms. A lint rule bans the built-ins in `engines/` |
| Floating-point accumulation order | Adding in a different order gives slightly different sums | Summation order is defined (row order, then item code). Parallel workers merge partial results in a fixed order |
| Money and rounded quantities | Binary floating point cannot represent 0.1 exactly | **Decimal arithmetic** for money (integer minor units) and for quantities that follow measurement rules (fixed scale per unit) |
| Rounding | Different rules (half-up, half-even, per-line vs per-total) | Rounding policy is **data**, defined by the selected dataset/jurisdiction, and recorded in the lock |
| Locale-dependent operations | `toLocaleString`, `localeCompare`, `Intl` follow the browser's locale data, which changes with updates | Banned in engines. Sorting uses code points or explicit sort keys; formatting happens only in the UI |
| Dates and time zones | Parsing and time-zone rules vary | Engines receive ISO date strings and integers only; time comes from `ctx.clock` |
| Randomness | Obvious | Only `ctx.random` with a seed recorded in the lock (e.g. seeded simulations) |
| Changing engine code | Fixes and features change results | Immutable, versioned engine bundles; old versions remain loadable |
| Changing data | New dataset versions | Immutable, versioned datasets pinned per revision |

### 2.2 Immutable, content-addressed engine bundles

- Every released engine version is built once into a bundle addressed by version **and content hash** (e.g. `survey@1.4.0` + hash) and stored permanently on the CDN.
- The runtime loads engines by exact version+hash when reproducing a revision, and by "latest compatible" when creating new work.
- Bundles are integrity-checked before execution (hash comparison), so a tampered or corrupted bundle is refused.
- **Why permanent:** storage costs almost nothing; the ability to re-run a 4-year-old calculation exactly is a professional feature competitors don't offer.

### 2.3 The calculation lock

Stored with every project revision (and every saved single-tool sheet):

| Lock field | Content |
|---|---|
| Engines | `id@version` + bundle hash for every engine used |
| Operations | `operation@major` for each graph node |
| Presets & parameter profiles | ids + versions + resolved hashes |
| Datasets | family, edition, version, effective date, bundle hash, signature key id |
| Rate sources | dataset or company library id + version; vendor quote references and validity |
| Policies | rounding policy, measurement rules, tax regime version |
| Inputs | hash of every input set (measurements, parameters) |
| Outputs | hash of every node output and of the final BOQ/estimate |
| Environment | MangoTools release, deterministic-math library version; deployment mode, platform/server version, update package id, licence authority, policy hash (§18.11) — recorded for audit, excluded from output-hash comparison |
| Signatures | Signed by the device key of the preparer; checker/approver signatures added at approval |

**"Reproduce revision"** reloads the pinned bundles and datasets, recomputes, and compares output hashes → *Reproduced ✓* or a precise list of differing nodes.

### 2.4 Report provenance block (mandatory on every professional report)

| Line | Example content |
|---|---|
| Engine | Survey Engine 1.4.0 (bundle a3f9…); Estimate Engine 2.1.0 |
| Reference data | CPWD Delhi Schedule of Rates, edition, version, effective date, source |
| Standard used | Code, edition, amendments applied (clause references only) |
| Rate source | Government schedule / company library "Rates FY26 v3" / vendor quote refs with validity |
| Tax regime | GST dataset version and effective date |
| Revision | Rev C, date, prepared by / checked by / approved by |
| Calculation lock | Short hash + "reproducible with MangoTools" |
| Licensee | "Licensed to <organisation>" (Professional and above) |
| Verification | QR code linking to the verification registry (hash only) |
| Deployment, licence authority, dataset approval, policy | See §18.11 |

**Why "Licensed to":** it is a zero-cost deterrent against account sharing (a shared account puts someone else's company name on your report) and a trust signal for the report's recipient.

### 2.5 How determinism is tested

- Every golden fixture runs in **Chromium, Firefox and WebKit** and in **Node**; output hashes must be identical bit-for-bit.
- Property tests assert invariants (e.g. BOQ total = Σ line amounts after the defined rounding policy).
- "Reproduction tests" re-run fixtures against the **previous** released engine versions to prove old bundles still load and reproduce.

---

## 3. Reference data architecture

### 3.1 Dataset identity

| Field | Meaning | Example |
|---|---|---|
| `family` | Stable identity of a dataset line | `in.gst.rates`, `in.cpwd.dsr`, `in.mh.pwd.sor`, `steel.sections.is808` |
| `type` | Schema the data follows | `rate-schedule`, `tax-table`, `section-table`, `material-properties`, `coefficient-set`, `measurement-rules`, `labour-rates`, `equipment-rates`, `emission-factors`, `irradiance`, `cable-ratings` |
| `edition` | Publisher's edition | `2023` |
| `version` | MangoTools version of that edition (corrections/errata) | `2023.2` |
| `jurisdiction` | Country/state/authority | `IN`, `IN-MH`, `EU` |
| `effectiveFrom` / `effectiveTo` | Legal/commercial validity | `2025-09-22` / open |
| `publisher` & `sourceRef` | Who published it and which document/page | Publisher name, document title, clause/table refs |
| `licence` | `public` · `government-open` · `licensed` · `customer-provided` | Drives who can access it |
| `status` | `draft` · `verified` · `published` · `withdrawn` | Only published data reaches users |
| `supersedes` / `errata` | Lineage and corrections | Links and notes |
| `hash` & `signature` | Integrity and authenticity | Signed by the dataset signing key |

**Immutability:** a published dataset version never changes. Corrections produce a new version with an errata note, and projects keep their pinned version until the user upgrades.

### 3.2 Dataset types

| Type | Used by | Examples |
|---|---|---|
| Rate schedules (items with code, description, unit, rate, component breakdown) | Estimation, BOQ | Government schedules of rates, company rate books |
| Rate analyses (resource consumption per item) | Material analysis, estimation | Materials, labour, equipment per unit of work |
| Labour, equipment, transport rates | Estimation | Skill categories, hire rates, carriage by distance slab |
| Tax tables | Financial | GST by HSN/SAC and effective date; works-contract rules |
| Measurement rules | Takeoff, BOQ | Rounding, deductions, units per item type |
| Material properties & libraries | All engineering modules | Densities, grades, strengths, unit weights |
| Section and product tables | Structural, electrical, plumbing | Steel sections, cable data, pipe schedules |
| Coefficient sets | Design-check modules | Numeric parameters with clause references |
| Environmental and energy data | Environmental, solar | Emission factors, irradiance, grid factors |
| Currency and indices | Financial | Dated FX rates, price indices (for escalation, later) |

### 3.3 Licensing of reference data — the biggest non-technical risk

Standards bodies (national standards institutes, ASTM, CEN/Eurocodes, NFPA, ASHRAE, IPC, road-congress codes, RICS measurement standards) **hold copyright** in their documents and tables. Being free to *read* a standard does not grant the right to *redistribute* its tables inside a product.

| Data class | Policy | Why |
|---|---|---|
| Laws, tax rates, government notifications | Include (`public`) | Public law and official rates |
| Government schedules of rates and consumption norms | Include only after a documented permission/legal check per publisher (`government-open`) | Reproduction rights vary by publisher |
| Formulas and physical constants | Include | Facts and methods are not protected in the same way as the text and tables expressing them |
| Standards' tables and text | **Never reproduce text.** Store only the numeric parameters needed, with clause references, where legal review permits — otherwise license the data (`licensed`) | Avoids infringement claims that could take the product down |
| Customer-licensed data (Enterprise) | Customers import their own licensed tables as private datasets (`customer-provided`) | Enterprises already hold these licences |

**Smallest solution now:** start with public data (GST, formulas, own-measured material data) and government schedules cleared by legal review; add a `licence` field and access control from day one so licensed data can be added later without redesign.

### 3.4 Publishing pipeline (in a separate private repository)

```
Source document ─▶ Extraction (manual or assisted) ─▶ Independent second entry
      ─▶ Automated comparison (entry A vs entry B; publisher's machine-readable file when available)
      ─▶ Validation (schema, units, ranges, totals) ─▶ Diff vs previous version
      ─▶ Domain reviewer sign-off ─▶ Sign ─▶ Publish to catalog + CDN ─▶ Changelog entry
```

- **Why double entry:** transcription errors in rate schedules are common and invisible; two independent entries compared automatically catch them cheaply.
- **Why a separate repository:** licensed data must not be readable by every AI agent and contributor working on application code; access is limited and audited.

### 3.5 Distribution and caching

- The client asks the catalog for datasets its entitlements allow; the service returns **short-lived signed URLs** to CDN bundles.
- The client verifies the dataset signature against pinned public keys before use.
- Bundles are cached in IndexedDB/OPFS. **Licensed datasets are cached encrypted** with a key delivered inside the entitlement certificate — a deterrent against copying files out of the browser (not an absolute barrier; nothing on a client is).
- Large datasets are chunked and support **delta updates** (only changed items).

### 3.6 Selection, pinning and upgrades

- A project profile **pins** its datasets at creation.
- For effective-dated data (taxes), the default version is the one effective on the project's **estimate date**, which the user can change.
- "Upgrade dataset" creates a **new revision** and a **difference report** (which quantities, rates and totals changed and by how much).
- **Why:** GST rates in India were restructured with effect from 22 September 2025. An estimate prepared before and after must each be explainable using the rates valid at the time.

### 3.7 Company and vendor data

- **Company rate libraries** (Business/Enterprise) use the same dataset model, versioned per organisation, **end-to-end encrypted** with organisation keys. MangoTools cannot read your rates.
- **Vendor quotes** are records with vendor, item, rate, unit, validity dates and quote reference — also encrypted, organisation-scoped.

### 3.8 The Reference engine (`engines/reference`)

Deterministic lookups over signed datasets: resolve dataset by family + date; get item by code; table lookups with **defined** interpolation rules (linear, step, none — declared by the dataset type, never guessed); unit normalisation; validate datasets against type schemas. Exposure: internal (licensing prevents public API exposure of licensed data).

---

## 4. Engineering workspace framework

### 4.1 Calculators become entry points, workspaces become the product

This keeps the approved product intact and satisfies "engineering tools are not calculators":

- The public **tool page** (e.g. Rise & Fall) stays free and fast — it is a single-node workspace in "quick mode", and it keeps your SEO.
- One action — **"Open as project"** — converts the quick calculation into a full workspace with profile, standards, revisions and reports (Professional and above).
- **Why:** you keep traffic *and* the professional product, with no second codebase.

### 4.2 The ten stages mapped to components

| Stage | What the user does | Component that owns it | Output |
|---|---|---|---|
| 1 Project Profile | Client, site, location, jurisdiction, currency, units system, revision scheme, team | Workspace (`packages/workspace`) + Storage engine | Profile (versioned) |
| 2 Engineering Standard | Choose standards set and dataset pins | Reference engine | Pinned datasets |
| 3 Parameter Definition | Named parameter profiles (e.g. "M25 site mix", "Cable derating – buried") | Presets + parameter profiles | Parameter sets with hashes |
| 4 Material Library | Project library derived from organisation library + datasets; overrides tracked | Library engine | Library snapshot |
| 5 Drawing / Measurements | Manual entry or takeoff on PDF/DXF/images, each measurement with provenance | Takeoff + CAD engines | Measurement set |
| 6 Calculation | Domain operations as graph nodes | Domain engines via workspace graph | Node outputs + checks + working |
| 7 BOQ | Items with codes, units, measurement-rule references, quantities traced to nodes | BOQ engine | Bill of quantities |
| 8 Material Analysis | Explode BOQ items into materials, labour, equipment using rate analyses | BOQ + Library + Estimate engines | Resource schedule |
| 9 Financial Estimation | Rates by source policy, taxes, contingency, cash flow, procurement | Estimate engine | Estimate, cash flow, procurement plan |
| 10 Professional Reports | Templates, provenance block, signatures, verification QR | Report engine | PDF/XLSX/DXF packages |

### 4.3 The project computation graph

- A project is a **directed acyclic graph**: nodes are operation invocations; edges are data dependencies (a measurement feeds a quantity, which feeds a BOQ line, which feeds a cost).
- **Evaluation:** topological order with a stable tie-break (node id); each node's output is memoised by the hash of its inputs; only nodes downstream of a change recompute.
- **Errors propagate** as typed states (a failed node marks dependants "blocked", never silently zero).
- **Every number is traceable:** "Why this number?" walks the graph back to measurements, parameters, datasets and formulas (using the `WorkingStep` records engines already produce).
- **Where it lives:** `packages/workspace` (platform lane), not in an engine — because it invokes many engines, and engines may not import each other.
- **Why a graph instead of scripts:** it is what makes reproducibility, incremental recompute, traceability and revision diffs all come from one mechanism.

### 4.4 Revisions, approvals and history

| Concept | Design | Why |
|---|---|---|
| Working copy | Editable state of the project | Normal work |
| Revision | Immutable snapshot + calculation lock + revision code (e.g. P1, P2 for preliminary; A, B, C for issued) | Engineering practice: issued documents never change |
| Status | Draft → For checking → Checked → Approved → Issued (→ Superseded) | Mirrors how engineering offices issue work |
| Roles | Preparer, Checker, Approver; the preparer cannot approve their own revision (policy, default on for Business) | Separation of duties is standard in professional QA |
| Signatures | Each transition signed with the user's device key; recorded in the project audit trail | Non-repudiation without the server seeing content |
| Diffs | Revision-to-revision comparison of measurements, quantities, rates and totals | Clients always ask "what changed since Rev B?" |
| History | Every change event (who, when, what node) kept in the encrypted project log | Accountability |

### 4.5 Module packs

A **module** (e.g. Solar) = **one domain engine** + **a module pack of data**:

```
modules/<module-id>/
├── module.yaml             # id, name, risk class, phase, required datasets, reviewer of record
├── profile.schema          # extra project-profile fields for this discipline
├── parameters/             # parameter-profile presets
├── library/                # material/component library schema + seed data
├── graph-templates/        # standard calculation graphs ("Rooftop PV 10 kW", "RCC slab quantities")
├── boq-mappings/           # how node outputs become BOQ items (codes, units, measurement rules)
├── reports/                # report templates
├── tools/                  # quick-mode tool manifests (SEO entry points)
└── glossary.md
```

**Why:** adding a discipline adds data and one engine — never a new architecture. At 1,000 tools the platform is ~35 engines and ~15–20 module packs.

---

## 5. Engineering modules

### 5.1 Risk classes

| Class | Meaning | Controls |
|---|---|---|
| **A — Quantities & estimation** | Measurement, quantities, costs; errors cost money, not lives | Golden fixtures + domain reviewer for datasets |
| **B — Engineering aids** | Sizing and performance calculations with code checks | Above + reviewer of record per module + "for use by qualified engineers" notice |
| **C — Life-safety design** | Structural adequacy, fire protection, electrical protection design | Above + chartered/licensed reviewer sign-off per operation, mandatory checker/approver workflow, professional-indemnity insurance before launch |

### 5.2 Module catalogue

| Module | Core workspace scope | Key reference data | Class | Launch order |
|---|---|---|---|---|
| **Surveying** | Leveling, traverse, COGO, areas, volumes, setting-out, contours (later) | Coordinate reference systems, tolerance specs | A | 1 |
| **Quantity Surveying** | Measurement sheets, BOQ, rate analysis, abstracts, bills | Measurement rules, schedules of rates, rate analyses | A | 1 |
| **Construction** | Concrete, masonry, plaster, steel quantities, bar bending schedules, formwork, site consumption | Consumption norms, bar shapes, material data | A | 2 |
| **Civil** | Earthwork, roads/pavement quantities, drainage (open channel), water demand | Government manuals, material data | B | 2 |
| **Solar** | PV sizing, string design, yield, shading inputs, BOQ, payback/LCOE | Irradiance datasets (public), module/inverter data, tariffs | B | 2 |
| **Electrical** | Load schedules, cable sizing, voltage drop, earthing, short-circuit (later) | Cable ratings, derating factors, standards parameters | B → C for protection design | 3 |
| **Plumbing** | Fixture units, pipe sizing, water demand, pump heads | Fixture unit tables, pipe schedules | B | 3 |
| **HVAC** | Heat load, duct and pipe sizing, psychrometrics | Climate data, material thermal properties (licensing check) | B | 3 |
| **Mechanical** | Fluid flow, pumps, fasteners, fits, gears, belts | Material data, standards parameters (licensing check) | B | 4 |
| **Environmental** | Emissions, carbon footprint of BOQ, stormwater, noise | Emission factors, grid factors (public) | B | 4 |
| **Manufacturing** | OEE, cycle time, yield, costing, tolerance stack-ups | Process and material data | B | 4 |
| **Electronics** | Component values, filters, power budgets, trace widths | Standards parameters (licensing check) | B | 5 |
| **Structural** | Loads, member design checks, section properties | Section tables, design codes (licensed) | **C** | 5 |
| **Fire Protection** | Sprinkler hydraulics, hydrant demand, egress calculations | Fire codes (licensed) | **C** | 5 |

**Why this order:** Class A modules reuse the survey, BOQ and estimate engines you need anyway, carry the least liability, and match your first professional users. Class C modules need licensed data, qualified reviewers and insurance — start them only when revenue can fund those.

### 5.3 What every module supports (framework guarantees)

Project profiles · parameter profiles · material libraries · reference standards (pinned datasets) · calculation graph templates · BOQ mappings · reports with provenance · revision history and approvals · reproduction · company overrides · quick-mode SEO tools.

---

## 6. Drawing workflow

### 6.1 Formats

| Format | Approach | Why |
|---|---|---|
| **PDF (vector)** | Render with tiled rendering in workers; extract vector paths for snapping and length/area measurement | Most drawings reach contractors as PDFs; vector data gives exact geometry |
| **PDF (scanned)** | Raster tiles; manual measurement with scale calibration | Common for older drawings |
| **Images** (JPG/PNG/TIFF; large rasters later) | Tiled raster viewer; manual measurement | Site photos, scans, drone orthophotos |
| **DXF** | Streaming parser → geometry model with layers, blocks, units → spatial index | Open format; carries real CAD geometry and layers |
| **DWG** | **Not supported natively at first.** Users export DXF. Later: licensed DWG SDK (commercial) in the browser, or Cloud Operations with consent | DWG is proprietary; the permissive route requires a commercial licence; GPL libraries violate the licence policy |

### 6.2 Measurement model

Every measurement records: type (length, polyline, area, count, volume by area × depth), geometry, **scale calibration** (known distance or drawing scale), units, deductions, layer/sheet reference, drawing revision, who measured, and the measurement rule applied. **Why:** a quantity without provenance can't be checked, and checking is the core of professional QA.

### 6.3 Roadmap — deterministic first, AI optional

| Phase | Capability | Technique (deterministic) |
|---|---|---|
| **1 · Manual measurement** | Calibrate scale; measure lengths, areas, counts; deductions; group into BOQ items | Geometry maths; user clicks |
| **2 · Semi-assisted takeoff** | Snap to vector geometry; detect closed polylines and hatched areas; quantities by DXF layer/block; repeat-count identical blocks/symbols | Vector analysis, spatial indexing, exact block/geometry matching, template matching on rasters |
| **3 · Automatic recognition** | Rooms from wall lines; openings; symbol legends mapped to items; batch sheets | Rule-based geometry recognition (e.g. closed-region detection, parallel-line wall pairs), legend-driven symbol matching; **optional** on-device ML models as an opt-in assist — results always shown for user confirmation |

**Rule:** recognised items are proposals until a user accepts them; accepted items become normal measurements with provenance "assisted (method, version)". The calculation itself never depends on a model.

### 6.4 Engines

- **`engines/cad`** — DXF parsing (streaming), PDF vector-path extraction to a common geometry model, units, layers, blocks, spatial index, geometry predicates.
- **`engines/takeoff`** — calibration, measurement operations, deductions, measurement-rule application, grouping into quantities.
- Rendering stays in the UI layer (workers + OffscreenCanvas where available); engines stay DOM-free.

---

## 7. Financial module

### 7.1 Cost model (transparent formulas, all data-driven)

```
Item rate  = Σ materials (qty × (rate + transport + handling) × (1 + wastage))
           + Σ labour (hours or days × wage ÷ productivity)
           + Σ equipment (usage × hire or ownership cost)
           + sundries
           + overheads % + profit %          ← percentages come from the selected dataset or company policy
Item amount = BOQ quantity × item rate
Subtotal    = Σ item amounts
Contingency = rule from policy (percentage, or itemised risk allowances)
Taxes       = per tax-regime dataset (rates, place-of-supply rules, rounding rule, effective date)
Total       = Subtotal + Contingency + Taxes
```

Every term appears in the "Why this number?" trace and can be printed as a report appendix.

### 7.2 Rate sources and comparison

| Source | Nature | Stored as |
|---|---|---|
| Government schedules | Published rates per item/region | Signed dataset versions |
| Company rates | Organisation's own rate book | Encrypted company dataset versions |
| Vendor rates | Quotes with validity dates and references | Encrypted vendor-quote records |

- **Rate selection policy** per project: a fixed source, or an ordered priority (e.g. valid vendor quote → company rate → government rate). The chosen source is recorded **per line**.
- **Rate comparison** view: for each item/resource, all sources side by side with variance %, lowest/median, and warnings for expired quotes or outdated schedules.
- **Why per-line recording:** auditors and clients ask "where did this rate come from?" for individual lines, not for the whole estimate.

### 7.3 BOQ structure

Bill → Section → Item → Sub-item; item code (schedule or company code), description, unit, quantity (traced to measurements/graph nodes and measurement sheet), rate, amount; deductions; provisional sums; prime-cost items; abstract of cost. Measurement rules (rounding and deduction conventions) come from the selected measurement-rules dataset.

### 7.4 Cash flow

- Activities (manual durations or BOQ sections mapped to a schedule).
- Spend distribution per activity: uniform, front-loaded, back-loaded, or S-curve defined by an explicit formula with stored parameters.
- Payment terms: advance, mobilisation, retention, billing cycle, payment delay, retention release.
- Outputs: monthly outflow/inflow, cumulative position, peak funding requirement; NPV/IRR computed with a fixed algorithm, fixed starting point, fixed tolerance and iteration limit (so it is deterministic).
- Optional risk simulation later uses a **recorded seed**, so even simulations reproduce exactly.

### 7.5 Procurement

Material quantities from the analysis, plus wastage, rounded to pack sizes and minimum order quantities, scheduled against the cash-flow timeline using lead times from vendor data; vendor comparison per material. Output: procurement schedule and purchase list.

### 7.6 Numbers, currency and rounding

- **Money:** integer minor units (paise/cents) in decimal arithmetic; never binary floating point.
- **Quantities:** decimal with a scale per unit set by measurement rules.
- **Rounding:** mode (half-up, half-even) and level (per line or per total) defined by the tax/measurement dataset, recorded in the lock.
- **Currency:** INR default; multi-currency via a **dated FX dataset** captured at estimate time — never a live rate during calculation.

### 7.7 Engines

- **`engines/boq`** — BOQ structure, item mapping from graph outputs, measurement-rule rounding, abstracts.
- **`engines/estimate`** — rate build-up, source selection, comparison, taxes, contingency, cash flow, procurement, NPV/IRR.
- **`engines/library`** — materials, resources, assemblies, overrides with lineage.
- **`engines/numeric`** — deterministic maths and decimal arithmetic used by all engines.

---

## 8. Large-file architecture (100 MB → 5 GB)

### 8.1 The browser realities that decide the design

| Reality | Consequence |
|---|---|
| A tab's memory is limited and varies by device; mobile browsers are far stricter | Never hold a whole large file in memory; budget working memory per device |
| JavaScript strings have a maximum length (in Chromium, roughly half a billion characters) | "Read file as text" fails on large text/CSV files — text must be streamed |
| Very large single buffers (above ~2 GB) are unreliable across browsers | Process in chunks; never allocate one buffer for the file |
| Standard WebAssembly memory is capped at 4 GB; 64-bit WebAssembly memory is available in Chromium and Firefox but not Safari yet, and is slower | Design WASM modules for chunked input within 32-bit memory; don't depend on 64-bit memory |
| Reading: `File`/`Blob` support slicing and streaming without loading | Random access and sequential streaming are both possible for any size |
| Writing: direct streaming to the user's disk exists only in Chromium desktop (File System Access API) | Need a portable fallback: write to the **Origin Private File System (OPFS)** in a worker, then save; last resort a streamed download |
| Storage quotas differ by browser and free disk | Probe quota before starting; request persistent storage for long jobs |
| Background and mobile tabs get throttled or killed | Jobs must checkpoint and resume |
| `SharedArrayBuffer` and multi-threaded WASM require cross-origin isolation headers | Enable isolation on tool/workspace pages only (it conflicts with some auth popups — use full-page redirects for sign-in) |

### 8.2 Capability-based limits instead of arbitrary caps

Before a job starts, a **capability probe** measures: available storage quota, reported device memory (where the browser exposes it), CPU cores, write strategy available (direct-to-disk / OPFS / download), cross-origin isolation, and browser family. It then tells the user honestly: *"This device can process this 2.4 GB file. Estimated time 6–9 minutes. Needs 2.6 GB free space."* — or explains exactly what is missing.

| Tier | Typical target devices | Requirements | Notes |
|---|---|---|---|
| ≤ 100 MB | All, including phones | — | Default path; streaming anyway |
| 250 MB | Laptops, recent phones | Output space ≈ input size | Phones: text/CSV and PDF page operations |
| 500 MB | Laptops/desktops; high-end phones for text streams | ≥ 1× input free space | Mobile: warn and suggest desktop for rewrites |
| 1 GB | Desktop browsers | OPFS or direct-to-disk writing | Checkpointing mandatory |
| 2 GB | Desktop, ≥ 8 GB RAM recommended | Direct-to-disk (Chromium) preferred; OPFS elsewhere | Parallel workers only with isolation |
| 5 GB | Desktop Chromium recommended; Firefox with sufficient quota | Direct-to-disk strongly preferred; ≥ 1.2× input free space | Long-running job UX, wake lock, resume |

### 8.3 Processing model

- **Streams everywhere.** The IO layer (`packages/io`) turns files into chunk streams (4–16 MB adaptive) with **backpressure**, so reading never outruns processing.
- **Streaming operations.** The operation contract gains `mode: stream`: the engine consumes an async sequence of chunks or records through a port and emits results incrementally. Engines stay pure; the IO layer does the browser work.
- **Worker pool.** Size = min(cores − 1, 4) by default; deterministic merge order for partial results.
- **Bounded memory.** Each stream operation declares its peak working memory per chunk; the runtime refuses to start a job that the probe says won't fit, and lowers parallelism before failing.
- **Serializable state.** Stream operations expose their state between chunks (a small, schema-defined object), which is what makes checkpoints possible.

### 8.4 Jobs, checkpoints and recovery

| Element | Design |
|---|---|
| Job record | Operation, parameters, file identity (name, size, last-modified, hash of first and last megabytes), chunk plan, last completed chunk, engine state, partial-output location — stored in IndexedDB |
| Partial output | Written to OPFS (or the user's chosen file via direct-to-disk) |
| Checkpoints | After each chunk group (e.g. every 64–256 MB or 10 seconds) |
| Crash / reload | On return, "Resume job" appears. Chromium can re-open the file from a stored file handle after the user re-grants permission; other browsers ask the user to re-select the file, and the identity check confirms it is the same file |
| Multi-tab safety | A browser lock ensures only one tab runs a given job; other tabs show progress |
| Keep-alive | Screen wake lock during jobs; warning before closing the tab |
| Verification | Final pass validates output (e.g. page count, row count) and computes a streaming SHA-256 of the output, shown to the user |
| Cleanup | Partial files deleted on completion or after 7 days |

### 8.5 Per-format strategies

| Format | Strategy | Practical ceiling |
|---|---|---|
| CSV, TSV, JSON Lines, logs, plain text (PII scrubbing, conversions) | Record streaming, constant memory | Multi-GB on desktop |
| PDF (read, render, extract text, page images) | Range-based loading of only the needed parts of the file | Multi-GB; bounded by page complexity |
| PDF (merge, split, reorder, stamp) | **Object-streaming writer**: copy objects byte-range to byte-range, renumber, write a new cross-reference table — not whole-document libraries | Multi-GB on desktop |
| PDF (full rewrites: compression, flattening) | Page-group processing; heavier memory | Around 1 GB on desktop |
| Raster images | Tiled decoding where the format allows (tiled TIFF, cloud-optimised GeoTIFF); strict pixel budgets otherwise | Pixel budget per device, not file size |
| DXF | Streaming text parser → spatial index; level-of-detail rendering | Hundreds of MB+ on desktop |
| ZIP archives | Streaming inflate with ZIP64 support | Multi-GB |
| Video/audio | Out of scope now; WebAssembly codec limits apply | Later |

**Important:** the popular in-memory PDF library assumed in the repository blueprint loads whole documents. It stays for small files; large-file PDF operations need the object-streaming writer above (a dedicated engine work item and spike).

### 8.6 Testing large files

Nightly runs on a large CI runner generate synthetic 1 GB and 5 GB files, run each streaming operation, and record time and peak memory (Chromium performance tooling). Regressions open an issue automatically.

---

## 9. Security architecture

### 9.1 Principles

1. **Assume the client is hostile.** Anything in the browser can be read and modified. Server-side checks decide access to server resources; client checks are for experience and deterrence.
2. **Least privilege everywhere** — users, roles, API keys, CI tokens, extension permissions.
3. **Defence in depth** — edge, application, database and cryptography each enforce the rules independently.
4. **Privacy by design** — no fingerprinting, no content in logs, end-to-end encryption for project data.
5. **Short-lived everything** — tokens, certificates, signed URLs.
6. **Everything security-relevant is audited.**

### 9.2 Threat model (summary)

| Asset | Main threats | Primary controls |
|---|---|---|
| Accounts & sessions | Phishing, credential stuffing, token theft, session hijack | Passkeys, no passwords, device-bound tokens, short lifetimes |
| Entitlements (revenue) | Licence bypass, account sharing, seat rotation | Signed certificates, device limits, activation throttles, "Licensed to" watermark, server-held value |
| Project data & company rates | Server breach, insider access, cross-tenant access | End-to-end encryption, tenant isolation, row-level security |
| Licensed datasets | Scraping, redistribution | Entitlement-gated signed URLs, quotas, anomaly detection, encrypted cache, per-licensee bundle headers |
| Users' local files | Malicious files exploiting parsers | Worker isolation, validation, resource limits |
| Web app integrity | XSS, supply-chain compromise | Strict CSP, Trusted Types, SRI, no third-party scripts, build provenance |
| Extension | Store account takeover, malicious update, message spoofing | Hardware-key 2FA, minimal permissions, message validation, signed config and kill switch |
| Reports' credibility | Tampering | Verification registry (hash) + signatures in the calculation lock |

### 9.3 Authentication

| Decision | Why |
|---|---|
| **Passwordless first:** passkeys (WebAuthn), email one-time codes, Google and Microsoft sign-in | No password database to steal; passkeys are phishing-resistant; one-time codes work better than magic links (email security scanners often "click" links) |
| **Enterprise SSO** (SAML 2.0 and OIDC) with **SCIM** provisioning | Enterprises require central control; SCIM removes access the moment someone leaves |
| **Step-up authentication** (passkey or authenticator app) for admins, billing, device removal, API keys, exports of company libraries | Sensitive actions deserve stronger proof than a session |
| **Managed identity provider** behind the Identity adapter | Identity is high-risk commodity software; the adapter keeps vendor lock-in low |
| One-time codes: 6 digits, 10-minute validity, 5 attempts then 15-minute lock, uniform responses | Prevents brute force and account enumeration |

### 9.4 Sessions and tokens

| Decision | Why |
|---|---|
| **Same-origin API** (`/api/*` on the site's domain) with a **backend-for-frontend session cookie**: `HttpOnly`, `Secure`, `SameSite=Lax`, host-only prefix | Tokens are never exposed to JavaScript, so an XSS bug can't steal them; same-origin removes CORS complexity |
| **Device-bound requests:** each request carries a proof signed by the device's non-exportable key | A stolen cookie is useless on another machine |
| Access lifetime 15 minutes; refresh credentials rotate on every use with **reuse detection** (reuse ⇒ revoke the whole session family) | Limits damage from theft and detects replay |
| Sessions: sliding 30 days, idle expiry 14 days (Business/Enterprise configurable; SSO sessions follow the IdP) | Professional convenience balanced against risk |
| Session list with remote sign-out; "sign out everywhere" | User control, incident response |
| CSRF: SameSite cookies + Origin checks + a required custom header on state-changing requests | Standard layered CSRF defence |

### 9.5 Device management

| Decision | Why |
|---|---|
| A **device** = one browser profile. At activation the client generates a **non-exportable key pair** (Web Crypto, stored in IndexedDB); the public key is registered | Strong device identity without fingerprinting |
| The web app and the extension in the **same browser profile are paired** and count as one device | Users shouldn't lose a slot for using the extension |
| Device list shows name (editable), type (web/extension), browser family, first/last seen, coarse region | Transparency for users and admins |
| Deactivation from any signed-in device or by an admin → revocation epoch increments → the device's next refresh fails; cached licensed data and keys on that device are wiped when it next runs | Fast, verifiable removal |
| **Activation throttle:** default 5 new activations per seat per 30 days | Stops "device rotation" sharing without annoying real users |

### 9.6 Authorization and roles

| Level | Roles | Notes |
|---|---|---|
| Organisation | Owner · Admin · Billing Manager · Security Admin (Enterprise) · Member · Guest | Owner is irremovable except by another owner |
| Project | Lead · Engineer (edit) · Checker · Approver · Viewer · External Reviewer (time-limited) | Separation of duties: preparer ≠ approver |
| Datasets | Library Manager (company rates) · Consumer | Controls who changes company rates |

| Decision | Why |
|---|---|
| Permissions are **data** (a role → permission matrix file), compiled and tested with an automatic **endpoint × role test matrix** | Prevents the most common API vulnerability: missing object-level checks |
| Every server request checks object ownership/membership; the database enforces tenant isolation with row-level security | Two independent layers |
| Client-side permission checks only shape the UI | The client is not trusted |

### 9.7 Subscription validation and licence verification

| Element | Design | Why |
|---|---|---|
| Source of truth | Licensing service (updated from verified billing webhooks, idempotent, event-ordered) | One place decides what a user may do |
| **Entitlement certificate** | Signed token containing: user, organisation, plan, capabilities, device id, issued-at, expires-at (24 h), **grace-until**, dataset access list, minimum client version, revocation epoch, licensee display name | Portable, verifiable proof the client can check without calling the server every time |
| Signature algorithm | ECDSA P-256 | Verified natively by Web Crypto in every modern browser |
| Key management | Signing keys in a cloud key-management service; an offline root key signs rotating signing keys; clients pin root public keys and fetch current keys from a signed key set | Key rotation without app updates; compromise of one signing key is recoverable |
| Verification | Runtime verifies signature, device binding, expiry, grace and epoch before unlocking capabilities | Deterministic, offline-capable checks |
| Revocation | Short certificate life + epoch bump on device removal, downgrade, suspension | Maximum exposure = certificate life + grace |
| Honest limit | Client-side checks can be bypassed by a determined attacker | Real protection comes from **server-held value** — datasets, sync, sharing, SSO, verification, updates — and the licensee watermark on reports |

### 9.8 Grace periods and offline protection

| Grace | Default | Why |
|---|---|---|
| **Connectivity grace** (certificate `graceUntil`) | Professional 72 h · Business 7 days · Enterprise policy up to 30 days (Private/Air-Gapped: organisation policy within licence bounds, §18.7) | Field work without signal; enterprises need predictable policies |
| **Payment grace** (failed renewal) | 7 days full access with reminders, then Free with read-only projects | Card failures are usually accidental |
| **Data retention after downgrade** | Projects kept (encrypted) for 12 months; always openable read-only with raw export | Never hold data hostage — trust and data-protection rights |

**Offline protection:**
- **Clock-rollback detection:** the client stores the latest trusted time (from server responses and local observations); if the local clock falls behind it by more than a few minutes, paid features require going online.
- Certificates are bound to the device key; copying one to another device fails verification.
- Licensed dataset caches are encrypted with keys delivered only inside valid certificates.

### 9.9 Account sharing detection and device limits

| Plan | Devices (default) | Concurrent active sessions | Why |
|---|---|---|---|
| Free (signed in) | 2 | 2 | Light use |
| Professional | 3 | 2 | Laptop + desktop + phone, but one person at a time plus a margin |
| Business | 3 per seat | 2 per seat | Same logic per named user |
| Enterprise | Policy | Policy | Contracts vary |

**Signals** (server-side, privacy-preserving): more concurrent sessions than allowed; refresh-token reuse; "impossible travel" between coarse regions within minutes (IP used transiently, only the region stored); unusually high device churn; seat reassignment churn.
**Response ladder:** notify the user → require step-up re-authentication → end the oldest session → temporary activation hold → human review. Never an automatic ban on one signal.
**Explicitly not used:** canvas/audio/font fingerprinting or hidden tracking identifiers — they conflict with the privacy brand and create data-protection liabilities.

### 9.10 Business and Enterprise licensing

| Feature | Business | Enterprise |
|---|---|---|
| Seats | Named seats, assign/reassign (reassignment cooldown to stop seat rotation) | Contracted seat pools, true-up |
| Sign-in | Passwordless + optional Google/Microsoft domain restriction | Enforced SSO, SCIM provisioning/de-provisioning |
| Domain verification | DNS record; auto-join for verified domains | Domain capture |
| Policies | Device limit per seat, session length, separation of duties | All policies, grace window, IP allow-list for admin/API |
| Audit | 1-year retention, in-app viewer | Configurable retention, export to SIEM |
| Data | Company libraries, shared projects | Plus private dataset hosting, residency options |
| Billing | Central invoices with GSTIN | Contract invoicing |

### 9.11 API security

| Control | Why |
|---|---|
| All endpoints behind the edge WAF and rate limits | Absorb abuse before it reaches the application |
| Request and response schemas validated with the same schema definitions the clients use; unknown fields rejected | Blocks mass-assignment and malformed input |
| Object-level authorization on every request + row-level security | Top API risk class |
| Idempotency keys on mutating endpoints | Safe retries on flaky mobile connections |
| Pagination and payload size caps | Resource exhaustion protection |
| Versioned API (`/api/v1`); deprecation windows | Stable clients (web, extension, future integrations) |
| Future public REST API: scoped, expiring API keys stored as hashes, shown once, prefix-identifiable, per-key rate limits and IP allow-lists (Enterprise) | Standard key hygiene |
| Webhooks (inbound) verified by signature and timestamp; replay window 5 minutes | Prevents forged billing events |
| Errors never include internals; correlation id only | Information-leak prevention |

### 9.12 File validation and upload protection

**Local files (never uploaded):**

| Control | Why |
|---|---|
| Parse only inside workers, with per-job memory and time limits | Contains crashes and hangs |
| Detect type from file signatures, not extensions | Prevents disguised files |
| Decompression-bomb limits (ratio and absolute), pixel-count limits for images, depth limits for nested structures, entity-expansion protection for XML-based formats (XLSX, KML) | Classic resource-exhaustion attacks |
| Never execute embedded content (PDF scripts, spreadsheet macros); never render SVG inline; untrusted text rendered as text only | Removes code-execution paths |
| **Formula-injection neutralisation** when exporting CSV/XLSX (cells starting with `=`, `+`, `-`, `@` are escaped) | Stops exported files from attacking whoever opens them in a spreadsheet |

**Uploads (sync, sharing, dataset imports into company libraries, later Cloud Operations):**

| Control | Why |
|---|---|
| Pre-signed, single-use upload URLs scoped to one object, size and content type | The server never streams arbitrary uploads |
| Resumable chunked uploads with per-chunk checksums; server verifies final size and hash | Integrity for large encrypted blobs |
| Quotas per plan and per organisation | Cost and abuse control |
| End-to-end-encrypted blobs are opaque and never parsed server-side | No server parser = no server parser vulnerabilities |
| Downloads served from a **separate, cookie-less user-content domain** with `Content-Disposition: attachment` and no-sniff headers | Uploaded content can never run as your site |
| Non-encrypted uploads (only for opt-in Cloud Operations) scanned for malware in an isolated sandbox before processing | The one place server-side parsing exists |

### 9.13 Rate limiting, bot protection and abuse detection

| Area | Control | Why |
|---|---|---|
| Sign-up, sign-in, code resend, invitations | Privacy-friendly bot challenge + strict per-IP and per-account limits | Credential and email abuse |
| API | Token buckets per account, device, organisation and IP; tighter for expensive endpoints | Fairness and cost control |
| Dataset downloads | Per-account quotas; anomaly detection on volume and breadth; bundles carry licensee id in their signed header | Scraping and redistribution |
| Free-tier farming | Disposable-email filtering, bot challenge, one trial per payment instrument (enforced by the payment provider) | Trial abuse |
| Static free tools | Served from CDN; no bot challenge needed | Don't add friction where there's no cost |
| Abuse workflow | Automated throttles → review queue → logged admin actions | Proportionate, auditable responses |

### 9.14 Audit logs

| Log | Contents | Protection | Retention |
|---|---|---|---|
| **Security audit (server)** | Sign-ins, failures, step-ups, device activations/removals, role and seat changes, SSO/SCIM events, plan and billing changes, API key events, dataset publishing, admin actions | Append-only; each entry includes the hash of the previous entry; daily anchor hashes stored separately | Professional 90 days · Business 1 year · Enterprise configurable + SIEM export |
| **Project audit (client, encrypted)** | Revisions, approvals, signatures, dataset upgrades, reproductions, exports | Signed by device keys; synced end-to-end encrypted | Lifetime of the project |

Audit entries contain metadata only — never file content, measurements or rates.

### 9.15 Encryption and key management

| Layer | Design | Why |
|---|---|---|
| In transit | TLS 1.3, HSTS preload | Baseline |
| At rest (server) | Provider encryption + application-level envelope encryption for secrets (SSO certificates, webhook secrets) via key management service | Limits blast radius of a database leak |
| **Project data & company libraries** | Per-project data keys (AES-256-GCM) wrapped for each member's public key; organisation key hierarchy | MangoTools cannot read customer content |
| Recovery | Personal recovery key (downloaded at setup); Business/Enterprise may enable an **organisation-held** recovery key (held by the customer's admins, not MangoTools) | Staff leave; data must remain recoverable without giving MangoTools access |
| Member removal | New data keys for future revisions; honest limit: data a removed member already downloaded can't be "unshared" | Correct expectations |
| Signing keys | Licence, dataset and config signing keys in the key-management service; offline root; scheduled rotation | Protects the most valuable secrets |

### 9.16 Web application hardening

Strict Content-Security-Policy with hashes/nonces; Trusted Types enforced where supported; Subresource Integrity on all bundles; no third-party scripts; `frame-ancestors 'none'` (except the embed route); cross-origin isolation on tool/workspace pages; Permissions-Policy restricting unused features; user-generated names/notes rendered as text only.

### 9.17 Supply chain and release security

Pinned dependencies and lockfile; licence and vulnerability checks in CI; CI authenticates to cloud providers with short-lived federated credentials instead of stored long-lived tokens where supported; build provenance attestations for web bundles and extension packages; production releases require founder approval; extension store and domain registrar accounts protected with hardware security keys; separate publisher account for the extension stores.

### 9.18 Incident response and compliance readiness

- Published security contact and vulnerability-disclosure policy.
- Incident runbook: detect → contain (revocation epochs, kill switch, key rotation) → notify → recover → review.
- **India DPDP Rules 2025:** personal-data breaches must be intimated to affected users and to the Data Protection Board without delay, with a detailed report to the Board within 72 hours. The runbook and notification templates are prepared in advance. GDPR timelines apply for EU users.
- Data-principal rights (access, correction, erasure) served from the account page; a grievance contact published.
- SOC 2 readiness starts when the first Enterprise deal requires it; the audit logs, access controls and change management above are designed to map onto it.

---

## 10. Browser extension architecture

### 10.1 Principles

- The extension is **another client of the same platform**: same engines (bundled), same UI components, same identity, same entitlement certificates, same device registry, same audit.
- It lives in the monorepo as `apps/extension`, built for **Chrome and Edge** from one Manifest V3 package (two store listings); **Firefox** later with a thin compatibility layer (its MV3 uses background scripts instead of service workers).
- **Store policy constraint:** extension stores require a single, clear purpose and forbid remotely hosted code. Therefore the extension is positioned as *"MangoTools in your browser: run your MangoTools tools on files, text and pages"*, with every engine bundled inside the package.

### 10.2 Components

| Component | Role |
|---|---|
| Background service worker | Authentication, certificate refresh (alarms), messaging hub, device key operations |
| Side panel | Main UI (tools, recent projects, Safe Paste) using the shared UI package |
| Context menus | "Scrub with MangoTools", "Open PDF in MangoTools" on user action |
| Offscreen document (Chromium) | Tasks that need DOM APIs, e.g. clipboard handling, parsing helpers |
| Content scripts | Injected **only** on user action or on sites the user has granted (e.g. AI chat sites for Safe Paste); isolated, minimal |
| Options page | Account, device, permissions, data |

### 10.3 Authentication and activation

| Step | Design | Why |
|---|---|---|
| Primary: **Connect from the web app** | User clicks "Connect extension" in the signed-in web app → the web app sends a short-lived one-time activation code to the extension (web-to-extension messaging restricted to the MangoTools origin) → the extension generates its device key and calls the activation endpoint with code + public key → server pairs it with the browser profile's device and returns a refresh credential + certificate | One click, no passwords typed into the extension |
| Fallback: **device code** | Extension shows a short code; user approves it on the website (standard device-authorization flow) | Works in every browser, including Firefox, and when messaging is unavailable |
| Token storage | Access token in session-only extension storage (cleared on browser close); refresh credential in local extension storage, **useless without the non-exportable device key** | Protects against file-level token theft |
| Session expiry | Access 15 minutes; certificate 24 hours; plan grace as in §9.8 | Same rules as the web app |

### 10.4 Licensing, subscription sync, offline behaviour

- Certificate refresh at browser start-up, every 6 hours by alarm, and **immediately** when the web app notifies the extension of a plan change.
- Paid features require a valid certificate or grace; free features require sign-in (the extension is part of the subscription platform).
- Offline: engines run locally within grace; after grace, paid features lock with a clear message; nothing is deleted.
- Device deactivation → next refresh fails → extension signs out and wipes cached licensed data and keys.

### 10.5 Extension security

| Control | Why |
|---|---|
| Minimal permissions: storage, alarms, side panel, context menus, active tab; site access requested **per site at runtime** | Users trust extensions that ask for little; store reviews go faster |
| No broad "all sites" access by default | Reduces risk if the extension is ever compromised |
| Strict extension CSP; no `eval`; WebAssembly allowed only as required | Removes injection paths |
| All messages schema-validated; sender checked (extension id or MangoTools origin) | Prevents web pages from driving the extension |
| Content scripts never trust page data and never expose privileged APIs to pages | Isolation |
| No analytics of page content; only catalogue events | Privacy brand |
| Clipboard access only on explicit user action | Least privilege |

### 10.6 Updates and remote control

- Code updates only through the stores (automatic for users). Staged rollouts where the store supports them.
- **Minimum version** enforced through the certificate: below it, the extension shows "Update required" and locks paid features.
- **Signed remote configuration** (feature flags and per-version kill switches) lets you disable a faulty feature within minutes without a store review.
- **Why:** store reviews can take days; signed configuration is your emergency brake without violating the no-remote-code rule.

---

## 11. Plans and licensing model

### 11.1 Capability matrix (mechanics, not prices)

| Capability area | Free | Professional | Business | Enterprise |
|---|---|---|---|---|
| All quick-mode calculations and tools | ✅ (no account needed) | ✅ | ✅ | ✅ |
| Engineering workspaces (projects, revisions, reports) | 1 project (as in the approved product architecture) | ✅ unlimited | ✅ unlimited | ✅ unlimited |
| Imports, branded reports, provenance block | Attributed exports | ✅ | ✅ | ✅ |
| Reference datasets | Public datasets | + government datasets | + company datasets | + licensed/customer datasets |
| Encrypted sync | — | ✅ personal | ✅ team sharing | ✅ + residency options |
| Browser extension | Basic (sign-in) | ✅ | ✅ | ✅ policy-managed |
| Company rate libraries, vendor quotes | — | Personal library | Organisation libraries | + governance |
| Approval workflow (preparer/checker/approver) | — | Self-check | ✅ enforced roles | ✅ + policies |
| Large files | Up to device capability for streaming text/PDF page tools | + all large-file jobs | Same | Same |
| Devices / sessions | 2 / 2 | 3 / 2 | 3 / 2 per seat | Policy |
| Connectivity grace | — | 72 h | 7 days | Up to 30 days |
| Audit | — | 90 days | 1 year | Configurable + SIEM |
| SSO / SCIM | — | — | Google/Microsoft domain sign-in | SAML/OIDC + SCIM |
| Support | Community | Email | Priority | SLA |

Education licences are delivered as a Business organisation type (special pricing, student seats) — keeping four plans.

### 11.2 Tokens (later, only for Cloud Operations)

The architecture reserves a **usage ledger** (append-only records per organisation: operation, units, cost in tokens) and a **wallet** per organisation. Both stay switched off until the first cloud operation exists. **Why now:** designing metering later usually forces billing and audit rewrites; reserving the shape costs nothing.

---

## 12. Scalability: 20 → 100 → 500 → 1,000 tools

### 12.1 What grows and what never changes

| Dimension | 20 tools | 100 tools | 500 tools | 1,000 tools |
|---|---|---|---|---|
| Engines | ~16 | ~22 | ~30 | ~35–40 |
| Module packs | 2 | 5 | 10 | 15–20 |
| Dataset families | ~5 | ~20 | ~60 | ~120 |
| Static pages | ~80 | ~350 | ~1,300 | ~2,600 |
| Site build | Full static | Full static | Full static, cached OG images | Sectioned builds or edge-rendered pages from the **same registry** |
| Search index | Single | Single | Single (≤ 150 KB) | Split by section, loaded on demand |
| CI | Everything | Everything | Changed tools + archetype smoke on PRs; full nightly | Same, sharded across runners |
| Control plane | One region, one DB | Same | Read replica | Read replicas + edge-cached entitlement snapshots |

**Never changes:** the operation contract, manifests/presets/module packs, the workspace graph, the calculation lock, dataset model, entitlement certificates, the IO layer and the security model. Scale is absorbed by data and operations, not by architecture.

### 12.2 Server load stays small by design

- Certificate refreshes: roughly 4–6 per active user per day; at one million monthly active users that is a few million tiny requests a day — well within an edge function + relational database setup.
- Datasets and engine bundles are CDN traffic, cached at the edge.
- Sync storage grows only with paying users, and is opaque blobs.
- No compute load, because the server never calculates.

### 12.3 Start as a modular monolith

All control-plane services begin as **modules of one deployable** (`apps/api`) with strict internal boundaries (each module owns its tables and exposes an internal interface). **Why:** a solo founder cannot operate twelve services; boundaries let you split one out later (e.g. Sync) without rewriting callers.

---

## 13. Updated engine and repository map

| Kind | Items | Lane / owner |
|---|---|---|
| Existing engines (blueprint) | units, grid, survey, data, pdf, image, privacy, import, report, storage, ai, search, settings, analytics | Unchanged |
| **New platform engines** | `numeric` (deterministic maths + decimal), `reference` (datasets), `library` (materials/resources/assemblies), `cad` (DXF/PDF geometry), `takeoff` (measurements), `boq`, `estimate` (rates, taxes, cash flow, procurement) | One lane each |
| **Domain engines** (one per module) | construction, civil, solar, electrical, plumbing, hvac, mechanical, environmental, manufacturing, electronics, structural, fire (surveying = existing `survey`; quantity surveying = `boq` + `estimate`) | One lane each, reviewer of record per module |
| **New packages** | `packages/workspace` (graph, revisions, locks, reproduction) · `packages/io` (streams, OPFS, jobs, checkpoints) · `packages/client-platform` (session, device keys, certificate verification, grace, clock checks, sync crypto) | Platform lane; security-reviewed |
| **New apps** | `apps/extension` (Chrome/Edge MV3) · `apps/api` grows into the modular-monolith control plane | Extension lane; services lane |
| **New folders** | `modules/<module-id>/` (module packs) | Tools lane + module reviewer |
| **Separate private repository** | `mangotools-datasets` (sources, double-entry files, publishing pipeline, signing) | Datasets lane; restricted access |

**Operation contract additions** (small, backward-compatible): `mode` (`batch` \| `stream`); `stateSchema` for stream operations; `datasets` (dataset types an operation requires, resolved and pinned by the workspace); a rule that engines use `numeric` for transcendental maths and decimals (lint-enforced).

**Dependency rule update:** every engine may import `numeric`; engineering engines may import `units`, `numeric`, `reference`, `library`; only `packages/workspace` orchestrates multiple engines.

---

## 14. Risks and challenged ideas

| # | Idea or assumption | Challenge | Smallest solution |
|---|---|---|---|
| 1 | "Internet connection is required" | Surveyors and site engineers often lack signal; the earlier privacy proof ("works with Wi-Fi off") no longer fits | Connectivity grace via signed certificates (§9.8); change the privacy message to "processed on your device — nothing uploaded", backed by a visible network-activity panel |
| 2 | Requiring sign-in everywhere | A login wall on free tools would end SEO and acquisition | Free quick-mode tools stay anonymous; sign-in starts at projects, imports, reports and the extension |
| 3 | Reference data from IS, ASTM, Eurocode, NFPA, ASHRAE and similar | These publishers own copyright in tables and text | Licence field and access control now; public data first; legal review per dataset family; customer-provided licensed data for Enterprise; licensed partnerships later |
| 4 | Structural, fire-protection and electrical-protection design | Life-safety liability, licensed codes, need for qualified reviewers and insurance | Risk classes (§5.1); Class A modules first; Class C only with a chartered reviewer, mandatory checker/approver workflow and indemnity cover |
| 5 | Fourteen modules for one founder | Each module needs domain expertise to be correct | Module packs + one engine each; a paid reviewer of record per module (freelance chartered engineer), sequenced by risk class |
| 6 | "JavaScript is deterministic" | Built-in trig/exp functions may differ across browsers | `engines/numeric` + cross-browser hash tests (§2) |
| 7 | Reproducing old revisions forever | Future browsers may break an old bundle | Engines use only stable language features; reproduction tests against previous bundles in CI; portable engines can also reproduce in Node as a fallback |
| 8 | DWG support | Proprietary format; permissive support requires a commercial SDK | DXF/PDF/images first; decide on a licensed DWG SDK when customer demand justifies its cost |
| 9 | "No arbitrary 100 MB limits" | Real limits exist (memory, quotas, Safari/iOS); the in-memory PDF library won't scale | Capability probe with honest limits; streaming IO layer; an object-streaming PDF writer for large merges/splits (§8) |
| 10 | Licence enforcement in the browser | Always bypassable by a determined attacker | Accept it; concentrate value server-side; "Licensed to" on reports; device-bound certificates |
| 11 | Account-sharing detection | False positives (office NAT, VPNs, travel) annoy honest customers | Coarse regions only, multiple signals, response ladder, no automatic bans |
| 12 | End-to-end encryption for businesses | Lost keys, admin access, legal hold, server-side search all get harder | Personal recovery key + optional organisation-held recovery key; client-side search indexes; clear UX |
| 13 | One extension for "everything" | Stores require a single clear purpose and forbid remote code | One cohesive purpose statement; all engines bundled; signed config as the emergency brake |
| 14 | Enterprises or government needing air-gapped use | Conflicts with the locked "internet required" rule | **Resolved in §18:** four deployment modes; the organisation's own control plane satisfies "internet required"; indefinite offline operation under an organisation licence |
| 15 | Identity-provider pricing per active user | Costs can rise with many free sign-ins | Free tools anonymous; choose an IdP whose pricing fits a freemium model; the adapter keeps switching possible |
| 16 | Token-based cloud operations | Could erode the privacy promise | Separate service, explicit per-job consent, distinct badge, never used for core calculations |
| 17 | Tax and rate changes (e.g. India's GST restructuring effective 22 September 2025) | Hard-coded rates become wrong overnight | Effective-dated datasets; monitoring of official notifications; dataset update service levels |
| 18 | Vendor and company rates | Stale or wrong rates produce confident but wrong estimates | Validity dates, stale-rate warnings, per-line source recording |
| 19 | Cross-origin isolation for multi-threaded large-file work | Breaks some pop-up sign-in flows and embeds | Isolate only tool and workspace routes; full-page redirects for sign-in |
| 20 | Enterprise compliance (e.g. SOC 2) | Costly and slow for a solo founder | Design controls to map onto it now; start the audit when the first enterprise contract requires it |
| 21 | "No daily charging" | Removes the 24-hour pass designed earlier; bursty users may not subscribe | Monthly Professional with easy cancellation; tokens later only for cloud operations |
| 22 | The platform's total size | This is a large system for one founder | Build security and platform features **only when the plan that needs them launches** (§16) |

---

## 15. Changes to the approved documents

These are the only edits the locked constraints require. Nothing else in the product architecture or repository blueprint changes.

### 15.1 Product architecture

| Section | Change |
|---|---|
| Privacy positioning | Replace "Turn off your Wi-Fi. It still works." with "Processed on your device — nothing is uploaded", proven by a network-activity panel and the trust centre |
| Offline Field Mode | Becomes a **connectivity grace window** (72 h Professional, 7 days Business, policy for Enterprise) |
| Plans | Free · Professional · Business · Enterprise. The 24-hour pass is removed. Education becomes a Business organisation type. Tokens reserved for future cloud operations |
| Engineering tools | Become workspaces; quick-mode tool pages remain as free SEO entry points with "Open as project" |
| Categories | Engineering modules become categories as they launch; navigation groups them under an "Engineering" heading |
| Reports | The provenance block (§2.4) is mandatory on professional reports |

### 15.2 Repository blueprint

| Section | Change |
|---|---|
| ADR-0003 numeric model | Deterministic maths library for transcendental functions; decimal arithmetic for money and rule-rounded quantities |
| ADR-0009 auth/DB/billing | Resolved: managed identity provider behind an adapter; in-house licensing; same-origin backend-for-frontend sessions; relational DB with row-level security |
| ADR-0011 sync encryption | Resolved: per-project keys, member key wrapping, personal and organisation-held recovery keys |
| Engines, packages, apps, folders | As in §13 |
| Operation contract | `mode`, `stateSchema`, `datasets`, determinism lint rules |
| `entitlements.yaml` | Plans renamed; device, session and grace policies defined per plan |
| CI additions | Cross-browser output-hash equality; reproduction against previous bundles; endpoint × role authorization matrix; large-file nightly; dataset signature tests; extension build with provenance attestation; store publishing behind founder approval |
| PDF engine | Adds object-streaming merge/split operations for large files |

---

## 16. Implementation sequence

| Milestone | Platform and security work (built only when needed) |
|---|---|
| **M1 Public beta** (free tools, anonymous) | `numeric` library, cross-browser determinism tests, streaming IO basics, strict CSP, privacy-safe analytics |
| **M2 Professional launch** | Identity adapter + IdP (passkeys, codes, Google/Microsoft), licensing service, entitlement certificates, device registry, grace and clock checks, billing adapter, security audit log, rate limiting and bot challenge on auth, Release & Config (minimum versions, kill switches) |
| **M3 Workspace** | Workspace graph, revisions and calculation locks, Reference Data Service with first datasets (GST; one government schedule after legal clearance), Surveying + Quantity Surveying modules, `boq` and `estimate` engines, end-to-end encrypted sync, large-file jobs with checkpoints, extension v1 for Chrome/Edge |
| **M4 Business** | Organisations, seats, roles, shared projects and company libraries, approval workflow, audit viewer, Construction/Civil/Solar modules, DXF and PDF takeoff phases 1–2 |
| **M5 Enterprise** | SSO/SCIM, policies, SIEM export, residency options, Electrical/Plumbing/HVAC modules, Firefox extension, optional Cloud Operations with tokens, DWG SDK decision, takeoff phase 3 |
| **M6 Private** | MangoTools Server distribution and delegated licence authority (§18.18) |
| **M7 Air-Gapped** | Offline licence exchange, signed packages, offline verifier (§18.18) |
| **Later** | Class C modules (structural, fire protection) once reviewers, licensed data and insurance are in place |

---

## 17. Decisions needed from you

1. **Identity provider** — shortlist vendors that support passkeys, email codes, SAML/OIDC and SCIM with freemium-friendly pricing and India data residency.
2. **Merchant of record / payments** for subscriptions with GST-compliant invoices for Business customers.
3. **First government rate dataset** to clear legally (which schedule and region), and a legal-review budget for dataset licensing.
4. **Reviewers of record** for Surveying/QS/Construction (paid per module verification).
5. **Default device, session and grace values** (§9.8–9.9) — confirm or adjust.
6. **Extension purpose statement** for store listings.
7. **Enterprise offline stance** — decided in §18: four deployment modes, including fully air-gapped operation under an organisation licence. Remaining choices are listed in §18.18.

---

## 18. Deployment & Trust Architecture

This section **extends** the architecture above. Every earlier mechanism — engines, calculation locks, datasets, certificates, device keys, grace windows, policies, audit — is reused unchanged; §18.17 lists the exact touch-points.

### 18.1 Invariants that hold in every deployment mode

| # | Invariant | How it is guaranteed |
|---|---|---|
| 1 | **Engines are identical** | One build produces content-addressed engine bundles. The Mango CDN, server images and update packages all carry the **same bytes with the same hashes**. There are no mode-specific engine builds |
| 2 | **Results never depend on cloud availability** | The calculation path is engines + pinned datasets + inputs, all local to the client. Licensing gates *actions* in the UI; it never changes an operation's inputs or outputs. A project can only pin datasets already cached locally |
| 3 | **One chain of trust** | Every signature — licences, datasets, update packages, configuration, policies — chains to the MangoTools root key pinned in every client. Organisations receive certified sub-keys for their own scope (local licence issuance, policies, company datasets) but can never sign engines or MangoTools datasets |
| 4 | **One client codebase** | The web app and extension are identical in every mode. Differences come only from a signed **Deployment Profile** and the organisation's signed **Policy** |
| 5 | **Everything is recorded** | Deployment mode, licence authority, platform version, update package and policy version are written into the calculation lock and printed on reports |

### 18.2 How this fits the locked "internet required" rule

The earlier rule required internet access for authentication, subscription validation, updates, licensing, device management, security, analytics and sync. §18 keeps every one of those functions and changes only **who provides them**:

> **A client must always reach a trusted MangoTools control plane.** In Mango Cloud and Hybrid that is MangoTools' own service over the internet. In a Private Customer Server it is the organisation's server (which reaches MangoTools only for licence check-ins and downloads). In a Fully Air-Gapped deployment it is the organisation's server on an isolated network, and the MangoTools-side steps become signed files carried in and out by an administrator.

Certificates, device keys, grace windows and clock checks work exactly as in §9 in all four modes.

### 18.3 The four modes at a glance

| | **1 · Mango Cloud** | **2 · Hybrid Enterprise** | **3 · Private Customer Server** | **4 · Fully Air-Gapped** |
|---|---|---|---|---|
| Control plane | MangoTools | Split: MangoTools (identity federation, licensing, catalog, updates) + **Org Node** in the customer's environment (data services) | MangoTools Server run by the customer | MangoTools Server on an isolated network |
| Web app served from | Mango CDN | Mango CDN or Org Node mirror | Customer server | Customer server |
| Identity | MangoTools identity provider (+ SSO for Enterprise) | Customer identity provider via SSO | Customer identity provider (OIDC/SAML) or built-in local accounts | Customer identity provider on the isolated network or built-in local accounts |
| Licence authority | MangoTools | MangoTools | **Delegated authority** on the customer server, periodic check-in | Delegated authority with an **offline organisation licence** |
| Reference datasets | Mango CDN | Mango catalog, mirrored and approved in the Org Node | Mirrored from MangoTools, approved locally | Signed dataset packages imported manually |
| Project sync & backups | MangoTools (end-to-end encrypted) | Org Node storage | Customer server storage | Customer server storage |
| Updates | Continuous | MangoTools channel, gated by the organisation's rings | Pulled from MangoTools, approved by the organisation | Signed packages imported manually |
| Telemetry default | Standard catalogue events (policy-controlled) | Essential to MangoTools; full to the organisation's sink | Organisation-only | Organisation-only or off |
| AI default | On-device, optional | Per policy | Off | Off; only packaged on-device models allowed |
| Extension distribution | Chrome/Edge stores | Stores or self-hosted | Self-hosted through browser enterprise policy (or stores) | Self-hosted through browser enterprise policy |
| Clients need the internet? | Yes | Yes (MangoTools for licensing; Org Node for data) | No — organisation network only | No |
| Server needs the internet? | — | Org Node: outbound only | Outbound HTTPS to allow-listed MangoTools hosts only | Never |
| Typical customer | Individuals, SMEs, Business teams | Enterprises with data-residency rules | Large firms, public-sector units | Defence, government, critical infrastructure |
| Plans | Free → Enterprise | Enterprise | Enterprise + Private add-on | Enterprise + Air-Gapped add-on |

### 18.4 The Deployment Profile — the single switch

A **signed document** served by the control plane at a well-known path, loaded and verified by every client at start-up:

| Field | Purpose |
|---|---|
| Mode | One of the four modes |
| Control-plane endpoints | API base, dataset mirror, update source, telemetry sinks |
| Organisation id & licence authority chain | Lets clients verify locally issued certificates up to the MangoTools root |
| Identity configuration | IdP type and endpoints, or built-in accounts |
| Allowed egress destinations | Generated from the Egress Registry (§18.12) for this mode and policy — becomes the browser's `connect-src` policy |
| Policy reference | Hash and version of the current organisation policy |
| Platform version | Installed server/platform release and engine set |

Signed by MangoTools in Cloud mode; signed by the organisation's authority key (certified by MangoTools) in the other modes. The extension receives the same profile through browser-managed configuration or pairing.

**Why one document:** four modes become four *configurations* of one product, not four products. There are no forks to maintain.

### 18.5 Topologies

**Hybrid Enterprise**
```
 Clients ──data──▶ Org Node (customer network or cloud account)
    │               ├─ encrypted sync & backups     ├─ dataset mirror + approvals
    │               ├─ audit copy                   ├─ telemetry sink
    │               └─ update cache (rings)
    └──licence / identity federation──▶ Mango Cloud (licensing, catalog, update channel, config)
                     Org Node ──outbound only──▶ Mango Cloud (catalog and update downloads)
```

**Private Customer Server**
```
 Clients ──▶ MangoTools Server (customer data centre / private cloud)
               full control plane · web app · dataset mirror · update manager · Trust Center
               │ outbound HTTPS to allow-listed MangoTools hosts only
               └──▶ MangoTools: licence check-in, update and dataset downloads
```

**Fully Air-Gapped**
```
 Clients ──▶ MangoTools Server (isolated network) — same software as Private
                         ▲                                   │
   signed update, dataset, model and licence files IN        │ usage reports, licence requests,
   (removable media, verified before import)                 ▼ support bundles OUT (previewed, logged)
```

### 18.6 MangoTools Server (the Private and Air-Gapped distribution)

| Aspect | Design | Why |
|---|---|---|
| What it is | The **same** modular-monolith control plane (§12.3) plus the web app bundle and mirrors, packaged as container images | One codebase, one test suite; "private" is a configuration |
| Components | Gateway (TLS, rate limits, security headers) · control-plane application · PostgreSQL · storage adapter · job worker (imports, backups, mirror sync) · admin console · local licence authority · dataset mirror · update manager · Trust Center · local telemetry sink | Everything the cloud does, minus billing and public web pages |
| Packaging | One set of images; a Compose bundle for single-server installs and a Helm chart for high-availability Kubernetes installs | Covers small offices and large IT departments |
| Starting size | Up to ~200 users: one VM with 4 vCPU, 16 GB RAM, 500 GB disk. Larger: 2+ application replicas, replicated PostgreSQL, customer object storage | The server coordinates; it never calculates, so it stays small |
| Storage | Filesystem adapter by default; any S3-compatible service the customer already runs | Avoids bundling third-party storage servers whose licences conflict with ADR-0008 |
| Identity | Customer IdP via OIDC/SAML (with SCIM where available), or built-in local accounts (passkeys + authenticator app, admin-provisioned) for sites without an IdP | Air-gapped sites often have their own directory; small sites may not |
| Email | Optional customer SMTP; without it, sign-in uses passkeys or authenticator apps only | Email is often unavailable on isolated networks |
| Bot protection | Cloud challenge services are unavailable; built-in rate limits and lockouts apply; the server is not internet-facing | Proportionate to an internal network |
| Upgrades | Update manager applies signed packages, takes a pre-upgrade backup, runs forward-only migrations, keeps the previous version for rollback | Safe, auditable upgrades without internet |
| Self-check | Admin console runs a pre-flight check (TLS, backups, recovery-key escrow, exposed ports, clock source, pending security packages) and shows results in the Trust Center | Customer-run servers are often misconfigured; make it visible |

### 18.7 Licensing across modes

**Chain of trust**
```
MangoTools Root (offline)
  └─ MangoTools Licensing CA
       ├─ Cloud & Hybrid: MangoTools signing keys ──▶ device entitlement certificates (as in §9.7)
       └─ Private & Air-Gapped: Organisation Licence (signed by the CA)
              └─ certifies the Organisation Licence Authority key (generated inside the customer server)
                    └─ device entitlement certificates issued locally
```

Clients verify every certificate up to the pinned MangoTools root — the verification logic is unchanged from §9.7.

**Organisation Licence contents:** organisation id · deployment mode · installation id (bound to the server's key) · capabilities and modules · seat count · device-policy bounds · validity (term dates, or perpetual) · updates-entitled-until · check-in requirement (interval or none) · dataset licences · maximum grace the organisation may grant.

| Mode | Check-in | If check-in is missed / licence ends |
|---|---|---|
| Private | Server check-in every 30 days (contractual): uploads a signed usage summary (active seats, device counts, versions — no content, pseudonymous user ids) and downloads a renewed licence and revocation lists | 30-day server-level grace; then new paid sessions lock; existing projects stay readable with raw export; nothing is deleted |
| Air-Gapped | None. Seat true-up by an **offline usage report** exported by an admin (previewable in the Trust Center before it leaves). Renewal by file exchange: licence request file out → MangoTools portal → licence response file in | Term licence: same read-only behaviour after expiry. Perpetual licence: capabilities never expire; only update entitlement ends |

**"Operate indefinitely without internet when licensed accordingly"** is delivered by the **perpetual organisation licence** (or long term licences): the software keeps working at the last installed version forever; updates require an active maintenance entitlement.

**Clock and devices:** the server keeps its own latest-trusted-time record and uses the organisation's time source; device certificates carry a grace window set by organisation policy within the licence's bounds (e.g. up to 90 days for field laptops that leave the isolated network). Device limits, activation throttles and account-sharing signals (§9.5, §9.9) run on the local authority.

**Honest limit:** on customer-controlled servers, licence enforcement relies on installation binding, usage reports and contractual audit rights more than on technology. That is normal for enterprise software — don't over-engineer DRM.

### 18.8 Organisation policies

#### 18.8.1 Policy model

- One **signed, versioned Organisation Policy** document, edited in the admin console; every change is audited.
- Its hash is embedded in each device certificate, so clients always know which policy version applies.
- **Precedence:** deployment-mode limits → organisation policy → team/project policy → user settings. Lower levels may only make things **stricter**.
- **Enforcement points:** client runtime and egress client, control-plane API, browser CSP (generated from allowed egress), extension (browser-managed configuration).

**Why:** security teams need a guarantee that no user setting can loosen what the organisation decided.

#### 18.8.2 Data synchronisation policy

| Option | Meaning |
|---|---|
| Local only | Projects stay on the device; export/import by file |
| Organisation storage | Sync to the Org Node or customer server |
| MangoTools Cloud (encrypted) | End-to-end encrypted sync to MangoTools |
| By classification | Projects carry a label (Public · Internal · Confidential · Restricted); each label maps to an allowed destination (e.g. Restricted ⇒ local or organisation storage only) |

Additional controls: external sharing allowed or not; raw-export behaviour (allowed, watermarked, or approval required and logged — the client cannot physically stop copying, so this is policy plus audit).

#### 18.8.3 Update policy

| Control | Options |
|---|---|
| Channel | Stable (monthly) · Extended Stable (quarterly, security fixes in between) |
| Approval | Automatic · administrator approval |
| Rings | Pilot group → everyone after N days |
| Window | Maintenance window for server upgrades |
| **Engine-set pinning** | Keep a named engine set for *new* work for a defined period (e.g. for a contract's duration) |
| Source | MangoTools online · organisation mirror · manual package import |
| Rollback | Allowed to the previous N versions, with reason recorded |

Existing revisions are never affected by updates — they stay pinned by their calculation locks.

#### 18.8.4 AI policy

| Option | Meaning |
|---|---|
| Off | Default for Private and Air-Gapped |
| On-device only | Approved on-device models (delivered as packages in air-gapped sites) |
| On-device + MangoTools Cloud Operations | Token-metered cloud assist, per-job consent (Cloud/Hybrid only) |
| Customer-hosted model endpoint | Later, for Hybrid/Private |

Settable per feature (takeoff assist, NER in privacy tools, OCR). Unchanged rules: AI never enters the calculation path; AI output is a proposal until a user accepts it; accepted items record model id, version and hash.

#### 18.8.5 Telemetry policy

| Level | What is sent | Where |
|---|---|---|
| Full | Catalogue events (content-free) + scrubbed crash reports | MangoTools |
| Essential | Licence and health counters only; crash reports held for admin approval | MangoTools |
| Organisation-only | Catalogue events and crash reports | The organisation's own sink |
| Off | Nothing beyond the local egress ledger | — |

Air-Gapped mode permits only Organisation-only or Off. Telemetry is content-free at every level; the analytics-catalogue rules from the repository blueprint still apply.

#### 18.8.6 Backup policy

| Control | Options |
|---|---|
| Scope | Control-plane database, encrypted project blobs, audit logs, dataset mirror, configuration, **escrowed recovery keys (encrypted)** |
| Targets | Organisation storage, offsite copy |
| Frequency & retention | Recovery point and retention per scope |
| Encryption | Organisation-held keys |
| Restore tests | Scheduled; results recorded as evidence in the Trust Center |
| Local-only projects | Scheduled reminders or automatic exports to a chosen location, because no server copy exists |

**Why keys are called out:** end-to-end-encrypted backups are worthless without their keys. The Trust Center warns when recovery keys are not escrowed and backed up.

In Mango Cloud, MangoTools backs up encrypted blobs and control-plane data; Business and Enterprise may add scheduled exports to their own storage.

#### 18.8.7 Extension policy

Allowed or blocked · force-installed · distribution source (store or self-hosted package) · minimum or pinned version · allowed features (e.g. Safe Paste on/off) · allowed sites for page access · organisation sign-in required (personal accounts blocked in managed browsers) · clipboard behaviour. Delivered through browser enterprise policies and browser-managed extension configuration, and enforced again through the policy hash in the certificate.

#### 18.8.8 Dataset approval workflow

```
Available (published by MangoTools or imported) ─▶ In review ─▶ Approved for organisation use
                                                       │                 └─▶ Deprecated / Withdrawn
                                                       └─▶ Rejected (reason recorded)
```

| Rule | Why |
|---|---|
| Roles: Dataset Steward (reviews), Approver (second person) | The choice of schedule of rates is a governed commercial decision |
| Two-person approval for rate schedules and company datasets | Prevents single-person errors or manipulation |
| Review shows the difference from the previous approved version | Reviewers see exactly what changed |
| Projects may pin only Approved datasets (policy may allow "Available with warning") | Governance where it matters, flexibility where it doesn't |
| Air-gapped: package → quarantine → signature check → review → approval | Nothing unverified reaches users |
| Reports print the approval (§18.11) | The report shows the dataset was sanctioned for use |

#### 18.8.9 Policy defaults per mode

| Policy | Mango Cloud | Hybrid | Private | Air-Gapped |
|---|---|---|---|---|
| Sync | MangoTools encrypted | Organisation storage | Organisation storage | Organisation storage |
| Updates | Automatic, Stable | Rings, Stable | Approval, Stable | Manual import, Extended Stable |
| AI | On-device, optional | Off | Off | Off |
| Telemetry | Full (user opt-out) | Essential + organisation | Organisation-only | Off |
| Backups | MangoTools-managed | Organisation | Organisation | Organisation |
| Extension | Stores, user choice | Managed | Managed, self-hosted | Managed, self-hosted |
| Dataset approval | Not required (Business: optional) | Required | Required | Required |

### 18.9 Signed update packages

| Package type | Contents |
|---|---|
| Platform | Web app bundle, engine bundles (byte-identical to the cloud), server images, database migrations |
| Engine set | Named set of engine bundles for pinning |
| Dataset | Signed dataset versions |
| Extension | Extension package for self-hosted distribution |
| Model | Approved on-device AI models (optional) |
| Security & revocation | Trust-store updates, revoked keys, revoked licences |
| Licence response | New organisation licence (from the renewal exchange) |

**Structure:** a manifest (package id, type, version, creation time, compatible server versions, every file with hash and size, SBOM reference, release notes, provenance attestations) plus content-addressed payloads, signed by a MangoTools release key certified by the root. Organisations may add a countersignature after internal approval when redistributing internally.

**Import workflow**
```
Download (connected machine or MangoTools portal) ─▶ Transfer (approved media)
  ─▶ Verify offline (signature chain + every payload hash; built-in verifier + independently published checksums)
  ─▶ Quarantine ─▶ Compatibility check ─▶ Stage ─▶ Pilot ring ─▶ Approve ─▶ Activate ─▶ Keep N previous versions for rollback
```

| Protection | Why |
|---|---|
| Signature chain to the pinned root; every payload hashed | Authenticity without contacting MangoTools |
| Revocation lists inside every package, applied first | Air-gapped sites still learn about compromised keys |
| **Downgrade protection** (older packages rejected unless an admin performs a recorded rollback) | Blocks rollback attacks to vulnerable versions |
| Unique package ids recorded | Blocks replay |
| Archive safety: path validation, size and decompression limits | Malicious package files can't escape or exhaust storage |
| No import-time scripts other than signed migrations inside signed server images | Nothing arbitrary executes during import |
| Delta packages | Practical sizes for monthly updates |

Recommended cadence: monthly platform package, security packages as issued, dataset packages when published.

### 18.10 Determinism across modes

- **Build once, promote everywhere:** the CDN, server images and packages reference the same engine bundle hashes.
- **Four-mode CI matrix:** the full fixture suite runs in cloud mode and in a simulated private deployment with **all outbound network blocked**; output hashes must match bit-for-bit.
- **Cross-mode reproduction:** a revision computed in an air-gapped site reproduces exactly in Mango Cloud (and vice versa) given the same bundles and datasets — tested in CI.
- Deployment fields in the calculation lock are **excluded from output-hash comparison**, so mode can never make a reproduction "fail".

### 18.11 Report provenance additions

Added to the §2.4 block:

| Line | Example |
|---|---|
| Deployment | Fully Air-Gapped · MangoTools Server 2027.3 · installation A1B2 · update package P-2027.03.1 |
| Licence authority | MangoTools Cloud, or organisation licence id |
| Dataset approval | "Approved for use in ⟨organisation⟩ on ⟨date⟩ (Steward, Approver)" or "Not organisation-approved" |
| Policy | Organisation policy version and hash |

Printed footnote: *"Deployment mode is recorded for audit. It does not affect calculation results: identical inputs, engines and datasets produce identical outputs in every mode."*

### 18.12 Trust Center

#### 18.12.1 Truthful by construction: the Egress Registry

| Mechanism | Effect |
|---|---|
| Every network request any MangoTools component can make (web app, extension, server) is declared in a versioned **Egress Registry**: id, component, purpose, destination class, data categories, content class (none · metadata · pseudonymous · encrypted content · plain content), trigger, frequency, governing policy key, modes where allowed | One authoritative list |
| All code makes network calls **only** through the platform egress client, which requires a registry id; a lint rule bans direct network calls elsewhere | Undeclared traffic can't be written |
| Each deployment's browser CSP `connect-src` is **generated** from the registry entries allowed by mode and policy | The browser itself blocks undeclared destinations |
| Server outbound calls go through one egress module; Private and Air-Gapped firewall allow-lists are **generated** from the registry | Network teams can verify independently |
| CI runs every end-to-end test with a network recorder; any request not matching an allowed registry entry fails the build | The registry can't drift from reality |
| The registry ships signed with every release and package; the Trust Center renders it | What users see is what the software does |

#### 18.12.2 Egress ledger

Every egress event is recorded with metadata only — time, registry id, destination, bytes, component, and policy decision (allowed or blocked). Clients keep a local ledger and send summaries to their own organisation's control plane; the server records its own outbound events. Retention follows policy.

#### 18.12.3 Dashboard (organisation administrators)

| View | Shows |
|---|---|
| Overview | Deployment mode; which data categories can leave the organisation and which cannot; last-30-day totals by destination |
| Data flows | One row per category (identity, licensing, telemetry, crash reports, sync, backups, datasets, updates, verification registry, notifications, AI/cloud operations, support bundles, usage reports): destination, what is sent, **what MangoTools can see, what MangoTools cannot see**, frequency, encryption, governing policy, current setting, last event |
| Egress ledger | Searchable events; CSV export |
| Blocked attempts | Events stopped by policy (e.g. telemetry disabled), by category |
| Policies | Current policy, full change history with who and when |
| Versions & integrity | Installed platform and engine sets, package history, signature verification status, SBOM download |
| Datasets | Approved datasets, effective dates, staleness warnings (e.g. a tax dataset older than the latest imported notification) |
| Keys & backups | Recovery-key escrow status, last backup, last restore test |
| Network allow-list | Generated hostname/port list for firewall teams, per mode |
| Trust report | PDF for procurement and security reviews: mode, policies, egress registry, versions, SBOM, self-check results |

**Personal view (every user):** my devices and sessions, what my devices sent in the last 30 days, and my data export and deletion.

#### 18.12.4 What leaves the organisation, by mode

| Category | Mango Cloud | Hybrid | Private | Air-Gapped |
|---|---|---|---|---|
| Identity | Account identifiers to the MangoTools IdP | Federated from the customer IdP; MangoTools receives the user id and org | Nothing | Nothing |
| Licensing | User, device and plan metadata | Same | Monthly usage summary (counts, pseudonymous ids) | Only the usage report an admin exports |
| Project content | Encrypted blobs — MangoTools cannot read them | Nothing | Nothing | Nothing |
| Telemetry | Per policy, content-free | Essential counters by default | Nothing by default | Nothing |
| Datasets & updates | Download requests | Download requests from the Org Node | Download requests from the server | Nothing (files carried in) |
| Verification registry | Report hashes (optional) | Optional | Optional | Nothing |
| Support | On request | On request | Support bundle on request | Support bundle exported manually |

**Support bundles** are generated on demand, contain only diagnostics (versions, configuration hashes, error codes, egress summaries), are previewed and checked for redaction before export, and are logged in the ledger.

### 18.13 Shared responsibility

| Responsibility | Mango Cloud | Hybrid | Private | Air-Gapped |
|---|---|---|---|---|
| Engine correctness and signing | MangoTools | MangoTools | MangoTools | MangoTools |
| MangoTools dataset publishing and signing | MangoTools | MangoTools | MangoTools | MangoTools |
| Company datasets and approvals | Customer | Customer | Customer | Customer |
| Control-plane availability | MangoTools | Shared | Customer | Customer |
| Infrastructure patching | MangoTools | Customer (Org Node) | Customer | Customer |
| Applying updates | MangoTools | Customer (rings) | Customer | Customer (manual import) |
| Identity | MangoTools IdP (or customer SSO) | Customer | Customer | Customer |
| Backups | MangoTools (+ optional customer exports) | Customer | Customer | Customer |
| Recovery-key custody | Customer | Customer | Customer | Customer |
| Root signing keys | MangoTools | MangoTools | MangoTools | MangoTools |
| Network security | MangoTools edge | Shared | Customer | Customer |
| Incident response | MangoTools | Shared | Customer, supported by MangoTools | Customer, supported via support bundles |

Data-protection roles (e.g. data fiduciary under India's DPDP Act) follow the same split: MangoTools for data it holds in Mango Cloud; the customer for data on its own servers. Data-processing agreements are templated per mode.

### 18.14 Repository and CI additions

| Addition | Purpose |
|---|---|
| `deploy/` | Container definitions, Compose bundle, Helm chart, hardening guide, generated firewall allow-lists |
| `egress-registry.yaml` (platform lane, founder-reviewed) | Source for CSP, allow-lists, Trust Center and conformance tests |
| Schemas | Deployment profile, organisation policy, organisation licence, update-package manifest, egress registry, usage report |
| `apps/api` modules | Local licence authority, update manager, dataset mirror, Trust Center, backup scheduler — compiled into the same monolith and switched on by the deployment profile |
| Release pipeline | Build once → publish to CDN + build server images + assemble and sign update packages + SBOM + provenance + offline verifier |
| CI matrix | Cloud-mode E2E; private simulation with a test IdP (OIDC and SAML); air-gapped simulation with outbound network blocked; package import, rollback and downgrade-rejection tests; cross-mode output-hash equality; egress conformance |
| ADRs | 0012 Deployment modes & profile · 0013 Organisation licence & delegated authority · 0014 Update package format & signing · 0015 Egress registry & Trust Center |

### 18.15 Commercial alignment

- Mango Cloud serves every plan. Hybrid, Private and Air-Gapped are **Enterprise deployment add-ons** on annual contracts, keeping the business subscription-first.
- Term licences (1–3 years) are the default for Private and Air-Gapped; a perpetual licence with a maintenance subscription for updates is a priced exception that satisfies "operate indefinitely".
- New capability keys in `entitlements.yaml`: `deploy.hybrid`, `deploy.private`, `deploy.airgap`, `licence.perpetual`, `updates.extended-stable`.

### 18.16 Risks and smallest solutions

| # | Risk | Smallest solution |
|---|---|---|
| 1 | Four modes multiply testing and support for a solo founder | One codebase + deployment profile; automated four-mode CI; offer Private/Air-Gapped only under Enterprise contracts that fund them; launch order Cloud → Hybrid → Private → Air-Gapped |
| 2 | Air-gapped sites fall behind on security fixes and tax datasets | Staleness warnings in the Trust Center; Extended Stable channel; dataset effective dates on reports; recommended update cadence in contracts |
| 3 | Weak technical licence enforcement on customer servers | Installation binding, usage reports, contractual audit rights |
| 4 | Customer-run servers misconfigured | Secure defaults, hardening guide, pre-flight self-check shown in the Trust Center |
| 5 | Old browsers inside isolated networks | Published minimum browser versions; capability probe; engines use stable language features |
| 6 | Extension distribution without stores | Browser enterprise policies for self-hosted packages (Chrome/Edge now, Firefox later) |
| 7 | Copyleft components inside server images | ADR-0008 licence checks applied to image SBOMs |
| 8 | Root or release key compromise | Offline root; revocation delivered in every package; documented re-keying runbook |
| 9 | Trust Center drifting from reality | Egress conformance tests in CI; CSP and allow-lists generated from the registry |
| 10 | Perpetual licences eroding subscription revenue | Term licences by default; perpetual only as a priced exception |
| 11 | Built-in local accounts add an identity surface | Passkeys and authenticator apps only; admin-provisioned; lockouts; audit; recommend the customer IdP |
| 12 | Readers assuming results differ by mode | Report footnote; cross-mode reproduction tests |
| 13 | Hybrid partial outages (MangoTools reachable but Org Node down, or the reverse) | Clients continue on certificates and grace; sync queues locally; calculations never block |

### 18.17 Compatibility with earlier sections

| Section | Relationship |
|---|---|
| §0.1, §1.4 | "Internet required" reads as "a trusted MangoTools control plane is required" (§18.2) |
| §1.2, §12.3 | The modular monolith is the MangoTools Server distribution; no new services |
| §2.3, §2.4 | Lock and provenance gain deployment fields (§18.11); output hashing unchanged |
| §3 | Dataset model unchanged; approval workflow and mirrors added (§18.8.8) |
| §9.7, §9.8 | Certificate format and verification unchanged; delegated authority adds one certified link; organisation policy sets grace in Private/Air-Gapped within licence bounds |
| §10 | Extension gains managed configuration and self-hosted distribution |
| §11 | Enterprise gains deployment add-ons |
| §14 #14 | Resolved by this section |
| §16 | Adds milestones M6 and M7 (§18.18) |

### 18.18 Sequencing and remaining decisions

| Milestone | Deployment & trust work |
|---|---|
| M1–M2 | Egress Registry, egress client and generated CSP (cheap, and needed for the privacy promise anyway); personal Trust Center view |
| M5 Enterprise | Organisation policies; Hybrid Enterprise (Org Node: storage adapter, dataset mirror with approvals, telemetry sink, update rings); organisation Trust Center |
| M6 Private | MangoTools Server distribution, delegated licence authority with check-in, update manager, built-in local accounts, self-check, shared-responsibility documentation |
| M7 Air-Gapped | Offline licence exchange, signed packages for every artefact, offline verifier, support bundles, self-hosted extension distribution |

Each of M5–M7 starts only when a signed Enterprise contract funds it.

**Remaining decisions:**
1. Contract model for Private/Air-Gapped: term lengths and whether to offer perpetual licences at all.
2. Private check-in interval (default proposed: 30 days) and server-level grace.
3. Maximum device grace an organisation may set in Air-Gapped mode (proposed: 90 days).
4. Supported installation targets (Compose, Kubernetes versions) and minimum browser versions for enterprise networks.
5. Whether Hybrid's Org Node is also offered as a MangoTools-managed service inside the customer's cloud account (later).

---

## Sources

- DPDP Rules 2025, Rule 7 (breach intimation, 72-hour detailed report): [dpdprules.org/rules/7](https://dpdprules.org/rules/7)
- WebAssembly Memory64 status (available in Chromium and Firefox, not yet Safari): [Platform.uno — State of WebAssembly 2025–2026](https://platform.uno/blog/the-state-of-webassembly-2025-2026/), [Can I use — Memory64](https://caniuse.com/wf-wasm-memory64)
- Approved inputs: `docs/architecture/product-architecture.md`, `docs/architecture/repository-blueprint.md`
