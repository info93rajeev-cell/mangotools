# engines/numeric

Deterministic decimal arithmetic used by every engine that handles money or percentages.
Library engine: it exposes functions, not operations.

- Values in and out are decimal strings. `big.js` is used internally and never leaves this package.
- `half-up` rounds halves away from zero (commercial rounding); `half-even` is available where a rule requires it.
- Division keeps 20 decimal places before any presentation rounding.

Changelog: 0.1.0 — first version (TASK-001).
