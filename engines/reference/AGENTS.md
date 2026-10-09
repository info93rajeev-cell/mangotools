# engines/reference — lane rules

- Domain-neutral: the engine knows records, dates, exact selectors and numeric ranges only. Never add
  platform, marketplace, category, programme, zone, fee, tax or product names or rates here — they
  are dataset values that arrive as input.
- Decimal comparisons go through `@mangotools/engine-numeric` (`parseDecimal`, `compare`). Never use
  JavaScript numbers for range bounds or query values.
- Ambiguity is an outcome, never resolved silently: no scoring, no most-specific-wins, no hidden
  precedence. A change to that needs a new contract and operation major.
- `status`, `value` and `meta` are returned verbatim and never interpreted.
- Validate the whole dataset before matching; an invalid record fails the call even if it would not
  match.
- Never change an existing fixture's expected value. Fixtures use synthetic, neutral labels only.
- Every error or warning code needs a message in `src/errors.ts`.
