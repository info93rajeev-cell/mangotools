# TASK-008E — Marketplace Fee Data and Source Provenance

## Lane

platform

## Size

M (later implementation). This contract PR is documentation only.

## Status

Contract only. Nothing in this task is implemented by this PR. Implementation is blocked until the
approvals listed under **Governance** are recorded.

## Goal

Define the smallest approved contract for a future static, versioned marketplace-fee dataset with
per-record source provenance, so that a later Seller Profitability capability can know, for every
marketplace fee value:

- what fee the value represents;
- where the value came from;
- when it became effective;
- when it was verified;
- whether it is safe to prefill;
- whether the seller has overridden it.

Platforms in scope for the future dataset: Amazon India, Flipkart, Meesho, Myntra.

This contract adds no numeric rates, no data files, no code, and no network behaviour.

## Why this is a platform task

The repository assigns every surface the implementation needs to the `platform` lane
(`docs/architecture/repository-blueprint.md` §2.3–2.4):

- `schemas/` is the single source of data shapes (platform, restricted);
- `scripts/generate` and `scripts/validate` load, validate and emit data (platform, restricted);
- data folders are never imported by code — only read by `scripts/generate` (§2.4), so a static
  dataset is loaded and validated at build time, not inside an engine or tool.

It is not `engine-estimate`: TASK-008B keeps `estimate.seller.profitability@1` free of
platform-specific knowledge, and `engines/estimate/AGENTS.md` forbids hard-coded rates in engines.
It is not `tools`: no preset, manifest or tool content changes. Tool, preset and UI integration are
separate later tasks in their own lanes (see **Later tasks**).

## Relationship to the architecture

`docs/architecture/platform-security-architecture.md` §3 defines reference data as a first-class,
versioned product (dataset identity, effective dates, source, licence, status, immutability) served
later by a Reference Data Service (Phase-1 plan §3: datasets and dataset service are M3), with
lookups in a future `engines/reference`. This task defines a Phase-1-compatible **subset** of that
model for one dataset family and must stay forward-compatible with it:

| Architecture field (§3.1) | This contract |
|---|---|
| `family` | `marketplace-fees.<platform>` (one family per platform) |
| `type` | `marketplace-fee-schedule` |
| `version` | dataset version string, immutable once published |
| `effectiveFrom` / `effectiveTo` | per record (below) |
| `publisher` & `sourceRef` | per record `sourceAuthority`, `sourceTitle`, `sourceURL` |
| `licence` | per dataset (below) |
| `status` (`draft` · `verified` · `published` · `withdrawn`) | **dataset-version** lifecycle; distinct from the per-record evidence status defined here |

## Contract

### Dataset envelope

One dataset version per platform. Fields:

- `family` — `marketplace-fees.amazon-in` · `marketplace-fees.flipkart` ·
  `marketplace-fees.meesho` · `marketplace-fees.myntra`
- `type` — `marketplace-fee-schedule`
- `version` — immutable dataset version identifier
- `currency` — `INR` (the only currency; matches the existing schema currency enum)
- `licence` — one of the architecture licence classes; a legal/terms check is required before any
  record from a source is published (see **Governance**)
- `publicationStatus` — `draft` · `verified` · `published` · `withdrawn` (architecture §3.1)
- `supersedes` — previous dataset version, when any
- `records` — the fee records below

Only a `published` dataset version may ever be offered to users.

### Fee record fields

Every record is one fee for one set of conditions. Fees are never combined into one generic
marketplace fee.

**Identity**

- `id` — stable kebab-case record id, unique within the family across all versions
- `supersedes` — id of the record this one replaces, when any

**What the fee is**

- `platform` — `amazon-in` · `flipkart` · `meesho` · `myntra`
- `feeType` — one of:
  `referral-commission` · `closing-fixed` · `collection-payment` · `shipping-logistics` ·
  `fulfilment` · `pick-and-pack` · `storage` · `packaging` · `cod` · `reverse-logistics` ·
  `return` · `rto` · `cancellation` · `platform-service` · `advertising-promotion` · `other`
- `officialFeeName` — the platform's own name for the fee, as written in the source

**Conditions** (all optional; an absent condition means "not restricted by this condition" only
when the source says so — otherwise the record is `conditional`)

- `category`, `subcategory` — the platform's own category labels, matched exactly; no
  cross-platform category mapping is authorized
- `sellerTierOrProgramme` — free text naming a tier or programme stated by the source or by a seller
  agreement. **No tier or programme names are hard-coded** in the schema or in this contract
- `fulfilmentMode` — the platform's own fulfilment-mode label, free text; no names hard-coded
- `priceMin`, `priceMax` — decimal strings, INR
- `weightMin`, `weightMax` — decimal strings, with `weightUnit` `g` · `kg` (required when either
  weight bound is present)
- `zone` — the platform's own zone or distance-tier label, free text; zone vocabularies are per
  platform and are not hard-coded

Range convention for price and weight: **`min < value ≤ max`**. An absent `min` has no lower bound
(includes 0); an absent `max` has no upper bound. Sources that state a different boundary convention
must be transcribed into this one, with the original wording kept in `notes`. Weight bounds are the
slab the platform applies to its own chargeable weight; computing actual or volumetric weight is
calculator logic and out of scope.

**Amount**

- `ratePercent` — decimal string percentage
- `fixedAmount` — decimal string, INR
- `minimumAmount`, `maximumAmount` — decimal strings, INR, bounding the computed fee
- `calculationBasis` — one of: `percent-of-item-price` · `percent-of-order-value` ·
  `fixed-per-unit` · `fixed-per-order` · `fixed-per-shipment` · `per-weight-slab` ·
  `per-volume-per-period` · `other` (`other` requires `notes` describing the basis). Whether an
  item price includes GST, shipping or discounts must be stated in `notes` when the source states it.

All numbers are decimal strings, never JavaScript numbers (platform money rule).

**Tax on the fee** (GST charged on the marketplace's own fee — not product GST)

- `gstRateOnFee` — decimal string percentage
- `taxTreatment` — `gst-extra` · `gst-inclusive` · `not-applicable` · `unknown`

**Dates** (ISO `YYYY-MM-DD`, existing `isoDate` convention)

- `effectiveFrom` — first day the rate applies, where the source states it
- `effectiveTo` — last day the rate applies (inclusive); absent means open-ended
- `announcementDate` — when the platform announced it, where known
- `verifiedDate` — when a reviewer last checked the value against the source

**Source / provenance**

- `sourceTitle` — title of the source document or page
- `sourceURL` — URL or other stable reference (document id, notice number)
- `sourceAuthority` — who published it (for example the platform itself)
- `sourceOfficial` — `true` only when published by the platform or a government authority

**Evidence**

- `status` — see **Statuses**
- `notes` — free text: conditions, original boundary wording, caveats

### Statuses

Exactly four record-level evidence states. Serialized values follow the repository's lower-case
kebab enum convention.

| State | Value | Meaning | Automatic prefill |
|---|---|---|---|
| VERIFIED | `verified` | Supported by an authoritative source; safe to prefill | Yes, when the record is the single match for the selected conditions and date |
| CONDITIONAL | `conditional` | Sourced, but depends on category, seller programme, fulfilment, contract, location, weight, date or another condition | Only after the user has explicitly selected every condition the record depends on, and shown as conditional |
| USER_INPUT | `user-input` | No universal authoritative numeric value should be prefilled | Never; the record documents that the fee exists and that the seller must enter it |
| UNVERIFIED | `unverified` | Insufficient evidence | Never an automatic numeric default; may only be displayed as an unverified reference |

### Provenance rules (validation the implementation must enforce)

1. A `verified` or `conditional` record must have `sourceTitle`, `sourceURL`, `sourceAuthority`,
   `sourceOfficial: true`, `verifiedDate` and at least one numeric amount field.
2. A numeric value with no source is never `verified` or `conditional`; it may only be `unverified`.
3. A non-official source (`sourceOfficial: false`) cannot support `verified` or `conditional`.
4. A `user-input` record must carry **no** numeric amount fields.
5. `effectiveTo`, when present, must not be before `effectiveFrom`.
6. `verifiedDate` must not be in the future relative to the dataset's publication.
7. `weightUnit` is required when a weight bound is present; `min ≤ max` for every range present.
8. Within one dataset version, two records with the same `platform`, `feeType` and identical
   condition values must not have overlapping effective periods.
9. Unknown keys fail validation (strict objects, existing schema rule).

Validation failures are build-time data problems reported through the existing generator issue
mechanism — not engine error codes.

### Versioning and effective dates

- Published records are immutable. A rate change adds a **new record** with its own
  `effectiveFrom`; the old record keeps its values and gains `effectiveTo` only through a new dataset
  version. Old records are never overwritten or deleted.
- A correction to a wrong value is a new record with `supersedes`, recorded in a new dataset version
  (architecture §3.1 immutability and errata).
- **Applicable on date D:** a record applies when `effectiveFrom ≤ D` and (`effectiveTo` is absent
  or `D ≤ effectiveTo`).
- A record without `effectiveFrom` is never selected by date resolution and therefore never
  prefilled automatically; it may be displayed for reference.
- **Current** means applicable on the resolution date the caller supplies (normally today, supplied
  by the runtime). **Historical** means applicable on an earlier supplied date. The data layer never
  reads the clock itself.
- When conditions and date match **more than one** record, or **no** record, nothing is prefilled
  and the field remains user input.

This task defines these semantics only. Date-resolution code is not authorized here (see
**Governance**).

### Sourced values versus user-entered values

The future calculator must keep three value origins distinguishable:

| Origin | Meaning |
|---|---|
| `dataset` | Prefilled from a record; carries the record id and dataset version |
| `user-override` | The seller replaced a prefilled value; the original record reference is retained for display |
| `user-entered` | Entered by the seller with no dataset record |

Seller-specific values — for example a negotiated Myntra commission, an account-specific Flipkart
charge, a Meesho Supplier Panel shipping rate, or a custom Amazon seller or programme rate — are
`user-override` or `user-entered` values. They are never written into the dataset, never presented
as universal platform rates, and never stored by this capability. No seller credentials, accounts,
authentication or personal seller data are part of this contract.

The future UI must be able to show, per value: **Source**, **Effective date**, **Verified date**,
**Status**, and later **Overridden by user**. This contract defines the data that makes that possible;
it authorizes no UI.

### HSN / GST separation

Product HSN/GST data is a different dataset family (architecture §3.2 "Tax tables": GST by HSN/SAC
and effective date, e.g. `in.gst.rates`). It is **not** part of TASK-008E. `gstRateOnFee` describes
only GST on the marketplace's own fee. Product HSN/GST provenance requires its own separate future
contract and must not be added to marketplace-fee records.

### Network boundary

Out of scope and forbidden in the implementation of this contract: fetch or any network access,
scraping, marketplace APIs, product URL import, adapters, server or backend, Firebase, marketplace
login, seller credentials. The dataset is static, repository-reviewed data read at build time. A later
task may define optional, user-authorized online refresh.

## Expected implementation files (later, after approval)

Within the `platform` lane only:

- `schemas/src/marketplace-fees.ts` — dataset envelope and record schemas, statuses, provenance
  refinements; exported from `schemas/src/index.ts`
- a colocated schema test (pattern: `schemas/src/page.test.ts`)
- `scripts/generate/marketplace-fees.ts` — load, validate (rules above) and emit a generated
  artefact, plus a colocated test; wired into the existing generate pipeline
- generated output under `generated/` (never committed, existing rule)
- the dataset folder location **decided by the ADR-lite below** — no data folder for marketplace
  fees exists today, and the folder governance table in the blueprint lists none
- an empty or structure-only dataset per platform with **no numeric marketplace rates**; populating
  rates is a separate, source-cited data task

Not touched: `engines/*`, `presets/*`, `tools/*`, `packages/ui`, `packages/runtime`, `apps/web`,
taxonomy, content, CI.

## Later tasks (not authorized here)

- Data population per platform, each value cited and double-checked (architecture §3.4)
- Effective-date resolution (`engines/reference` per architecture §3.8, or an approved Phase-1
  alternative)
- Seller Profitability preset/tool integration — `tools` lane, after TASK-008C is complete
- Provenance and override display — `ui` lane
- Optional user-authorized online refresh
- HSN/GST product tax dataset contract

## Governance

This is a **schema / public-contract change**: a new schema module, a new data family and a new
generated artefact. `schemas/` and `scripts/` are restricted paths (founder review required).

An **ADR-lite approved by the founder is required before implementation**, deciding:

1. where the static dataset lives in this repository (a new data folder, its owning lane and edit
   level), given architecture §3.4 places dataset publishing in a separate private repository and
   Phase-1 plan §3 defers datasets and the dataset service to M3;
2. whether Phase 1 may ship a repository-bundled public dataset ahead of the Reference Data Service,
   and how it migrates into the §3.1 identity model without breaking pinned values;
3. which future component performs date resolution (a new `engines/reference` requires its own ADR
   per the "Add engine" playbook);
4. the licence and terms check for marketplace fee sources before any record is published.

Implementation must stop and report if review classifies any of this differently.

## TASK-008C relationship

TASK-008C (`profit-margin-calculator` → Seller Profitability, manual entry) is unchanged and is not
blocked by this task. This capability is additive and integrates only after TASK-008C is complete.
This contract does not modify `tasks/TASK-008C-SELLER-PROFITABILITY-TOOL.md`, its branch, or PR #99.

## Acceptance criteria

- Record fields, the four statuses, provenance rules and effective-date semantics are defined.
- Seller tier/programme, platform/category/subcategory and price/weight/zone conditions are optional
  conditions with no hard-coded tier, programme, fulfilment or zone names.
- Sourced, overridden and user-entered values are distinguishable.
- Seller-specific values are never presented as universal platform rates and never stored.
- No network, adapter, authentication or credential surface.
- No numeric marketplace fee is populated.
- HSN/GST product tax data stays a separate future contract.
- Later implementation stays within the `platform` lane, size M, after the ADR-lite is approved.
