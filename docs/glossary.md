# Glossary

| Term | Meaning in this repository |
|---|---|
| **Engine** | Pure-logic workspace package in `engines/` exposing operations |
| **Operation** | One versioned engine function with input, params and output schemas, referenced as `id@major` (e.g. `estimate.tax.gst@1`) |
| **Preset** | YAML configuration of one operation for one use (`presets/<engine>/<name>.yaml`); may `extends` another preset |
| **Manifest** | YAML description of one tool page (`tools/<slug>/manifest.yaml`) |
| **Archetype** | Tool layout: A instant transform · B calculator · C workbench grid · D file pipeline · E visual canvas |
| **Tier** | T1 workflow tool · T2 professional calculator · T3 utility · T4 variant |
| **Lane** | The single area one change may touch (e.g. `engine-data`, `ui`, `tools`, `platform`) |
| **Fixture** | A cited input → expected output case that defines correctness |
| **Registry** | `generated/registry.json`, built by `pnpm gen` from taxonomy, presets, manifests, content and fixtures |
| **Input vs params** | Inputs are what the user calculates with; params change how the operation behaves |
| **Decimal string** | A money or percentage value written as text (e.g. `"1180.00"`) so no floating-point error occurs |
| **Half-up rounding** | Commercial rounding: halves round away from zero (2.345 → 2.35, −2.345 → −2.35) |
| **GST** | Goods and Services Tax (India). Intra-state supply: CGST + SGST; inter-state supply: IGST |
| **CGST / SGST / IGST** | Central, State and Integrated GST |
| **Taxable value** | Amount before GST |
| **Margin** | Profit ÷ selling price × 100 |
| **Markup** | Profit ÷ cost × 100 |
| **Base64** | Encoding of bytes as text using 64 characters (RFC 4648); not encryption |
| **Percent-encoding** | URL encoding of bytes as `%XX` (RFC 3986) |
| **Canonical hash** | SHA-256 of an output serialized as canonical JSON; used to prove determinism across runtimes |
