# engines/reference

Deterministic, domain-neutral selection of versioned reference-data records by effective date and
explicit conditions. The engine knows records, dates, exact selectors and numeric ranges only; every
platform, category, programme, zone or fee value is dataset data supplied as input. Decimal range
comparisons use `@mangotools/engine-numeric`.

| Operation | Purpose |
|---|---|
| `reference.record.resolve@1` | Select the one record in effect on a date for exact selectors and `min < value ≤ max` ranges, or report no match or ambiguity |

Contract: `tasks/TASK-008G-REFERENCE-RESOLVER-ENGINE.md`. Engine family decision:
`docs/decisions/DECISION-REFERENCE-ENGINE.md`.

Error messages for every code are in `src/errors.ts`. Golden fixtures live next to the operation in
`src/operations/record-resolve/fixtures/` (synthetic, neutral labels only) and run through
`tests/unit/engine-fixtures.test.ts`; the operation declares `runtimes: ['worker', 'node']`, so its
fixtures also join the determinism suite.

## Changelog
- 0.1.0 — `reference.record.resolve@1` added (TASK-008G).
