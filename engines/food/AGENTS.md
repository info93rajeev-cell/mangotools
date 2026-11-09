# engines/food — lane rules

- Pure TypeScript only: no DOM, network, storage, time, randomness, `Intl` or locale comparison.
  Recipes and the ingredient catalogue always arrive as input; this engine never reads files.
- Quantities are exact fractions (`src/exact-quantity.ts`), never JavaScript numbers. Output is a
  decimal string: exact when the value has a finite decimal, otherwise rounded half-up to 3
  decimals and listed in `rounded`.
- Never convert between mass, volume and count. Unit factors are definitions only (tsp 5 ml,
  tbsp 15 ml, cup 250 ml).
- Round count items up only after every recipe has been added.
- A diet check may report recipes or leave whole recipes out. It never removes or substitutes an
  ingredient inside a recipe that is still listed.
- `verification` and allergen labels are passed through, never changed or upgraded.
- Never change an existing fixture's expected value, here or in `reference/food/fixtures/`.
  Add a new fixture instead.
- Every error or warning code needs a message in `src/errors.ts`.
