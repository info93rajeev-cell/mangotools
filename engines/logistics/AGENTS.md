# engines/logistics — lane rules

- Dimensions, volumes and factors are decimal strings through `@mangotools/engine-numeric`. Never use
  JavaScript numbers for measurements, and never import `big.js` here.
- Unit factors are exact decimal strings (1 in = 0.0254 m exactly). Units arrive as inputs; presets
  offer the unit choices.
- Keep values exact until the end. Round each output once, from its exact value, to `params.decimals`.
  Never compute a total from an already rounded value.
- Every result includes `working` steps so the UI can show the calculation.
