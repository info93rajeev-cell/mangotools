# engines/civil — lane rules

- All dimensions, volumes and percentages are decimal strings through `@mangotools/engine-numeric`.
  Never use JavaScript numbers for measurements, and never import `big.js` here.
- Unit factors (mm/cm/m/in/ft to metres) are exact decimal strings. Units arrive as inputs; presets
  offer the unit choices.
- Keep values exact until the end. Round each output once, from its exact value, to `params.decimals`.
  Never compute a total from an already-rounded value.
- Every result includes `working` steps so the UI can show the calculation.
- This engine calculates quantities only. Never add cost, price, currency, material-split (cement/sand/
  aggregate), reinforcement, mix-design or structural-adequacy logic here — those are separate,
  out-of-scope concerns tracked in `tasks/TASK-006A-QUANTITY-SURVEY-CIVIL-TOOLS-PLANNER.md`.
- Every successful result carries the standing estimation-aid warnings (never removed or made
  conditional) — this is a liability-adjacent domain; wording discipline matters more here than in
  most other lanes. Never use "guaranteed", "approved for construction", "structural design", "code
  compliant", "certified BOQ" or similar overclaiming language anywhere in this engine.
