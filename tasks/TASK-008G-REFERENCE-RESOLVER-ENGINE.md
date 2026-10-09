# TASK-008G — Reference Resolver Engine

## Lane

engine-reference

## Size

M (later implementation). This contract PR is documentation only.

## Operation

`reference.record.resolve@1`

Naming follows the operation-id rule `engine.domain.verb` (`repository-blueprint.md` §3.1), like
`search.index.build` and `estimate.seller.profitability`.

## Runtime

- worker
- node

## Data class

public — inputs are ordinary non-sensitive parameters (dates, prices, weights, labels), matching the
calculator rule in `tests/unit/privacy-classification.test.ts`.

## Exposure, cost, annotations

`exposure: internal` · `cost.weight: light` · read-only, idempotent, non-destructive, closed-world.

## Prerequisites (must be merged before implementation)

1. `docs/decisions/DECISION-REFERENCE-ENGINE.md` (this PR) — approves the engine family.
2. Platform PR: `ENGINE_IMPORTS.reference = ['@mangotools/engine-numeric']` in
   `scripts/validate/rules.ts`.
3. Founder edits to the blueprint §2.4 table and `.github/CODEOWNERS` (human-only).

## Scope

One pure, domain-neutral operation that selects the reference record applicable on a supplied
effective date for supplied conditions, from a dataset supplied as input.

The engine knows **records, dates, exact selectors and numeric ranges only**. Platform names,
categories, programmes, zones, fee types and every other dataset value are data, never engine
constants. The engine never interprets a record's value payload.

Primary first consumer (later task): marketplace fee records defined by TASK-008E, loaded by
`packages/runtime` from the static files described in `DECISION-MARKETPLACE-FEE-REFERENCE-DATA.md`.

Out of scope: marketplace or any real datasets, HSN/GST data, schemas under `schemas/`, the
`reference/` data folder, runtime loading, chaining into `estimate.seller.profitability@1`, UI, network,
files, storage, authentication, seller credentials, online refresh, new npm dependencies.

## Inputs

All decimal values are decimal strings handled by `@mangotools/engine-numeric`.

- `datasetVersion` — required, non-empty opaque string (≤ 64 chars); echoed, never parsed
- `effectiveDate` — required, `YYYY-MM-DD`, a real calendar date
- `records` — required array, 0 to 5,000 records:
  - `id` — required, unique within `records`
  - `effectiveFrom` — optional `YYYY-MM-DD`
  - `effectiveTo` — optional `YYYY-MM-DD`, inclusive last day
  - `status` — required opaque string (for marketplace data: `verified` · `conditional` ·
    `user-input` · `unverified`); returned unchanged
  - `match` — optional map `key → string`: exact selectors the record requires
  - `ranges` — optional map `key → { min?, max?, unit? }`: numeric conditions
  - `value` — optional map `key → string | null`: payload, returned verbatim, never interpreted
  - `meta` — optional map `key → string`: provenance pointer (for example source id, title, URL,
    verified date), returned verbatim
- `conditions` — required object:
  - `selectors` — optional map `key → string` (for example `platform`, `category`, `subcategory`,
    `sellerTierOrProgramme`, `fulfilmentMode`, `zone`, `feeType`)
  - `values` — optional map `key → { value, unit? }` (for example `price`, `weight` with `unit`)

Keys are lower-camel-case identifiers (≤ 40 chars, ≤ 16 keys per map). Unknown top-level keys fail
validation (strict objects).

## Parameters

None in `@1` (empty strict object). The operation has no display rounding: it selects, it does not
calculate.

## Resolution semantics

Applied to every record independently, in input order, with no hidden state.

1. **Effective date:** a record is date-eligible when `effectiveFrom` is present, `effectiveFrom ≤
   effectiveDate`, and (`effectiveTo` is absent or `effectiveDate ≤ effectiveTo`). ISO dates compare
   as strings after format and calendar validation.
2. **Open-ended:** an absent `effectiveTo` means "still in effect".
3. **No `effectiveFrom`:** never date-eligible, so never selected (TASK-008E).
4. **Exact selectors:** for every key in the record's `match`, `conditions.selectors` must contain the
   same key with an identical string (case-sensitive; no trimming, folding, synonyms or fuzzy match).
   A key the record requires but the query lacks → the record does not match.
5. **Wildcards:** a key absent from a record's `match` or `ranges` does not restrict that record.
   Query keys that no record uses are ignored. There is no `"*"` or other wildcard syntax.
6. **Ranges (price, weight or any numeric key):** for every key in the record's `ranges`,
   `conditions.values` must contain that key, its `unit` must equal the range's `unit` exactly (both
   absent counts as equal), and `min < value ≤ max`. An absent `min` has no lower bound; an absent
   `max` has no upper bound.
7. **Units:** the engine never converts units. Records and queries must use the same unit per key;
   normalising units (for example g vs kg) is the data foundation's build-time job. A unit mismatch is
   an input error, not a silent non-match.
8. **Zone and seller tier/programme** are ordinary exact selectors (rule 4); the engine has no
   vocabulary for them.
9. **Outcome:**
   - exactly one matching record → `resolution: matched`, that record returned;
   - none → `resolution: no-match` (valid outcome, warning `REFERENCE_NO_MATCH`);
   - two or more → `resolution: ambiguous`, no record chosen, all candidate ids returned sorted
     (warning `REFERENCE_AMBIGUOUS`).
10. **Overlapping or conflicting records** surface as `ambiguous` at resolution time. Build-time
    validation in the data foundation should prevent them; the engine never silently picks one.

### Specificity

**Ambiguity is an explicit outcome; there is no most-specific-wins rule and no scoring in `@1`.**
Determinism and auditability require that the record used can be explained from the data alone.
Datasets therefore have to be authored so that at most one record matches any complete set of
conditions. If a real dataset later needs precedence (for example a category-specific rate
overriding a general one), it must be expressed as explicit authored data under a new contract and
operation major, not as engine heuristics.

### Status handling

The engine returns each record's `status` unchanged and never promotes, demotes, filters or rewrites
it. Prefill eligibility (only `verified`, or `conditional` after the user selects every condition) is
applied by the consumer according to TASK-008E. Candidate records in an `ambiguous` outcome are
returned with their statuses for display.

## Outputs

- `datasetVersion` — echoed input
- `effectiveDate` — echoed input
- `resolution` — `matched` · `no-match` · `ambiguous`
- `record` — present only when `matched`: `id`, `status`, `effectiveFrom`, `effectiveTo` (when set),
  `value` and `meta` verbatim
- `candidateIds` — ids of all matching records, sorted by code-point order (one element when matched,
  empty when no match)
- `matchedOn` — the selector and range keys the returned record required (provenance of the match)
- `counts` — `records`, `dateEligible`, `conditionEligible`
- `working` — steps using the shared `WorkingStep` shape (date filter, condition filter, outcome);
  values only, no UI copy (templates belong to presets/tools)

## Errors

Typed errors with the `REFERENCE_` prefix, following the existing engine error conventions (codes
plus an English `messages` map in `src/errors.ts`; `path` points at the offending field):

| Code | When |
|---|---|
| `REFERENCE_MISSING_INPUT` | A required field is absent or empty |
| `REFERENCE_INVALID_DATE` | `effectiveDate`, `effectiveFrom` or `effectiveTo` is not a real `YYYY-MM-DD` date |
| `REFERENCE_INVALID_DATASET_VERSION` | `datasetVersion` is empty or too long |
| `REFERENCE_INVALID_INTERVAL` | A record's `effectiveTo` is before its `effectiveFrom` |
| `REFERENCE_INVALID_NUMBER` | A range bound or query value is not a decimal string |
| `REFERENCE_MALFORMED_RANGE` | A range has `min ≥ max`, or neither bound |
| `REFERENCE_UNIT_MISMATCH` | A query value's unit differs from a record range's unit for the same key |
| `REFERENCE_DUPLICATE_RECORD_ID` | Two records share an `id` |
| `REFERENCE_TOO_MANY_RECORDS` | More than 5,000 records |

Non-error outcome codes (returned as warnings with the result): `REFERENCE_NO_MATCH`,
`REFERENCE_AMBIGUOUS`.

Input validation runs on the whole dataset before matching, so an invalid record fails the call even
if it would not have matched. No new error framework is introduced.

## Expected implementation files

- `engines/reference/package.json`, `tsconfig.json`, `AGENTS.md`, `README.md` (with changelog)
- `engines/reference/src/index.ts`, `src/errors.ts`
- `engines/reference/src/operations/record-resolve/` — `schema.ts`, `operation.ts`, focused modules,
  `README.md`, `fixtures/*.yaml`, colocated test
- `pnpm-lock.yaml` workspace entry (no external dependency)

Not touched: `scripts/` (whitelist is its own platform PR), `schemas/`, `packages/*`, `apps/*`,
`presets/`, `tools/`, other engines.

## Fixtures (synthetic, hand-verified)

Synthetic data only, with neutral labels such as `platform-a`, `category-x`, `programme-1`,
`zone-north`; no real marketplace names or rates. Minimum coverage:

1. exact date match (boundary days `effectiveFrom` and `effectiveTo` both included)
2. open-ended `effectiveTo`
3. category selector match and non-match
4. seller programme/tier selector
5. price slab (`min < price ≤ max`, both boundaries)
6. weight slab with matching unit
7. zone selector
8. no match (`REFERENCE_NO_MATCH`)
9. overlapping records → `ambiguous` with sorted candidate ids
10. invalid interval (`REFERENCE_INVALID_INTERVAL`)
11. historical lookup: earlier date selects the superseded record, later date the new one
12. status preserved verbatim for `verified`, `conditional`, `user-input`, `unverified`

Plus: unit mismatch error, duplicate id error, record without `effectiveFrom` never selected. Every
fixture joins the cross-browser determinism suite (Node-capable operation).

## Implementation sequence

1. This contract + engine-family decision (docs) — this PR
2. Platform PR: `ENGINE_IMPORTS` whitelist entry; founder updates blueprint §2.4 and CODEOWNERS
3. `engine-reference` PR: implement `reference.record.resolve@1` with fixtures
4. `platform` PR: marketplace reference-data schema and foundation (DECISION-MARKETPLACE-FEE-REFERENCE-DATA task A)
5. First sourced marketplace dataset (task C), founder-approved sources only
6. Seller Profitability prefill and provenance display (task D), after TASK-008C
7. Optional online refresh — separate ADR, much later

## Acceptance criteria

- One operation, `reference.record.resolve@1`, pure and domain-neutral.
- No marketplace, fee, tax or product constants in the engine.
- Date, selector, range, unit, wildcard, ambiguity and no-match semantics as above.
- Ambiguity is never resolved silently; no scoring.
- Status returned unchanged; value payload and meta never interpreted.
- Typed errors with the `REFERENCE_` prefix; valid non-matches are outcomes, not errors.
- Imports limited to `zod`, `@mangotools/core`, `@mangotools/engine-numeric`.
- `estimate.seller.profitability@1` unchanged.
- No dependency, network, file, storage, UI or authentication surface.
