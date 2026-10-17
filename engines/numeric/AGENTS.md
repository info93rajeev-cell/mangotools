# engines/numeric — lane rules

- Only this package may import `big.js`.
- The existing decimal family takes and returns decimal strings for arithmetic. Money, percentages and
  `survey.leveling.reduce@1` measurements/RLs stay in that family; never return `Big` objects or
  JavaScript numbers for those values. Preserve every existing decimal API, rounding rule and fixture.
- Narrow approved exception: only `degreesToRadians`, `sinDegrees`, `cosDegrees` and `hypot2`
  form the separately governed binary64 geometry family described in
  `docs/decisions/DECISION-NUMERIC-GEOMETRY-KERNEL.md` and issues #159–#161.
  They accept primitive finite numbers within their documented bounds and return the approved tagged
  geometry result. This is not general permission for number-based arithmetic or money.
- The geometry path must use pinned portable arithmetic, exact cardinal dispatch and only
  `-0 → +0` output normalization; no native `Math.sin/cos/hypot/sqrt`, host-specific path or
  decimal precision reduction. No new runtime dependency.
- No DOM, network, time, randomness or `Intl`.
- Changing rounding behaviour changes results everywhere: it needs founder approval and new fixtures.
- Geometry implementation remains blocked until the public-library determinism prerequisite is merged,
  required governance is approved/applied, and the production analytic/error/size gates in #161 pass.
