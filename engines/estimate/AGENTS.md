# engines/estimate — lane rules

- Money and percentages are decimal strings through `@mangotools/engine-numeric`. Never use JavaScript
  numbers for money, and never import `big.js` here.
- Tax rates are never hard-coded in engines: rates arrive as inputs (presets offer rate choices).
- Rounding: 2 decimals, half-up (away from zero) unless params say otherwise. Round money first, then
  derive percentages from the rounded money so displayed numbers reconcile.
- Every result includes `working` steps so the UI can show the calculation.
