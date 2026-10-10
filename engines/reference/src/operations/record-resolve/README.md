# reference.record.resolve@1

Selects the reference record that applies on `effectiveDate` for the supplied `conditions`, from the
`records` supplied as input. It selects; it does not calculate, round, convert units or interpret
`status`, `value` or `meta`.

## Validation (whole dataset, before matching)

The first problem found, in this order, is returned as a typed error:

1. `datasetVersion` absent → `REFERENCE_MISSING_INPUT`; empty or over 64 characters →
   `REFERENCE_INVALID_DATASET_VERSION`.
2. `effectiveDate` absent or empty → `REFERENCE_MISSING_INPUT`; not a real `YYYY-MM-DD` date →
   `REFERENCE_INVALID_DATE`.
3. `records` absent → `REFERENCE_MISSING_INPUT`; more than 5,000 → `REFERENCE_TOO_MANY_RECORDS`.
4. `conditions` absent → `REFERENCE_MISSING_INPUT`.
5. Each `conditions.values.<key>.value`: absent or empty → `REFERENCE_MISSING_INPUT`; not a
   decimal → `REFERENCE_INVALID_NUMBER`.
6. Each record, in input order: `id` absent or empty → `REFERENCE_MISSING_INPUT`; repeated →
   `REFERENCE_DUPLICATE_RECORD_ID`; `status` absent or empty → `REFERENCE_MISSING_INPUT`;
   `effectiveFrom` / `effectiveTo` present but not a real date (an empty string included) →
   `REFERENCE_INVALID_DATE`; `effectiveTo` before `effectiveFrom` → `REFERENCE_INVALID_INTERVAL`;
   each range: neither bound → `REFERENCE_MALFORMED_RANGE`, a bound that is not a decimal →
   `REFERENCE_INVALID_NUMBER`, `min ≥ max` → `REFERENCE_MALFORMED_RANGE`, and when the query has a
   value for that key, a different `unit` (both absent counts as equal) → `REFERENCE_UNIT_MISMATCH`.

Unit mismatches are checked for every record whose range key the query supplies, before any date or
selector filtering, so an invalid record fails the call even if it would not have matched. Unknown
keys, map keys that are not lower-camel-case identifiers (≤ 40 characters) and maps with more than
16 keys fail the strict input schema (`INVALID_INPUT`).

## Matching (each record independently)

- **Date:** `effectiveFrom` present, `effectiveFrom ≤ effectiveDate`, and `effectiveTo` absent or
  `effectiveDate ≤ effectiveTo`. Both boundaries inclusive. A record without `effectiveFrom` is never
  selected.
- **Selectors:** every key in the record's `match` must be present in `conditions.selectors` with an
  identical string (case-sensitive, no trimming or normalisation). Keys the record does not list do
  not restrict it; extra query keys are ignored. `"*"` has no special meaning.
- **Ranges:** every key in the record's `ranges` must be present in `conditions.values`, and
  `min < value ≤ max` (decimal comparison via `@mangotools/engine-numeric`). An absent bound does
  not restrict.

## Outcome

| Matching records | `resolution` | `record` | `candidateIds` | Warning |
|---|---|---|---|---|
| 0 | `no-match` | absent | `[]` | `REFERENCE_NO_MATCH` |
| 1 | `matched` | the record | `[id]` | — |
| 2 or more | `ambiguous` | absent | all ids, code-point order | `REFERENCE_AMBIGUOUS` |

There is no specificity scoring and no precedence: overlapping records are always `ambiguous`.

`record` contains `id`, `status`, `effectiveFrom`, `effectiveTo` (when set), `value` and `meta`
exactly as supplied. `matchedOn` lists the selector and range keys the returned record required
(empty unless `matched`). `counts.records` is the dataset size, `counts.dateEligible` the records in
effect on the date, and `counts.conditionEligible` the records in effect that also meet every
condition. `working` has three steps (`dateEligible`, `conditionEligible`, `resolution`) carrying
values only.
