---
lastReviewed: 2026-10-22
example: 006-shipment-sample
---

## How to use

1. In Shipment Cartons, enter one row per carton or package type: Description / SKU (optional; it stays in browser memory), OUTER packed length, width and height including packaging and protrusions, quantity and, optionally, weight per carton. You can paste rows copied from a spreadsheet.
2. In Units & Display Options, choose one dimension unit (mm, cm, m, in or ft) and one weight unit (kg, g or lb) for every carton, and the decimal places shown. Changing a unit converts the entered values; the shipment totals do not change.
3. Use Add carton, Duplicate selected, delete or drag to reorder rows; Clear All starts a blank worksheet. Up to 50 rows are supported as a technical limit.
4. Shipment Visualization draws the carton you are editing or have selected in 3D, top, front and side views. It is illustrative only, never a loading plan or a fit check.
5. Read total cartons, total CBM, known packed weight, average CBM per carton and the load composition; cubic feet show when you point at total CBM and are included in the copied summary. Display precision never changes the exact totals used for pricing.
6. Optionally turn on Cost Estimate and enter your own per-CBM freight rate, currency, minimum charge and other charges.
7. Use Print / Save PDF or Copy Summary for the current result. Calculations run locally in your browser; there is no upload.

## Method

CBM: each carton's outer packed dimensions are converted to metres and multiplied together, then by its quantity. Rows aggregate in worksheet order. The engine uses exact decimal arithmetic first and rounds only for display; pricing uses the exact current shipment CBM, never rounded displayed CBM. A changed input clears previous results until the current calculation succeeds.

Length factors are exact: 1 mm = 0.001 m, 1 cm = 0.01 m, 1 in = 0.0254 m and 1 ft = 0.3048 m. Cubic feet use the approved factor 35.3146667 per m³. Weight factors are 1 g = 0.001 kg and 1 lb = 0.45359237 kg.

Weight: each row's weight per carton is converted to kg and multiplied by its quantity. Without weights, packed weight is not provided. With weights for some rows, only their known packed weight is shown and labelled partial; missing weights are never treated as a complete zero-weight shipment. Complete coverage includes every package row.

Cost: the optional freight cost uses your entered rate multiplied by exact CBM, applies your minimum when higher, then adds other charges. There are no live freight rates and no FX conversion; changing currency relabels amounts. Actual freight charges may differ due to carrier terms, route, taxes, surcharges and minimums. CBM is volume, not chargeable weight.

The dimensional visualization is illustrative, not a loading plan. Volume comparison only — not a guarantee of physical fit. Nominal dry-container reference volumes are Maersk 20 ft standard 33.2 m³, 40 ft standard 67.7 m³ and 40 ft High Cube 76.4 m³. Capacities vary by carrier, manufacturer and container series; confirm actual equipment specifications with your carrier.

## Worked example

100 packages of 50 × 40 × 30 cm give 6.000 m³ and 211.888 ft³, totalling 100 pieces. Weight is not provided. At a user-entered rate of INR 100 per CBM, with no minimum or other charges, estimated freight is INR 600.00.

## FAQ

### Can I calculate multiple package types?

Yes. Add a row for each package type, with its own dimensions, unit and quantity. Duplicate copies a row for independent editing.

### Why can displayed row volumes differ from the shipment total?

Rows and totals round independently for display. Exact row values determine the shipment total and optional freight estimate. A 25 × 25 × 20 cm package has 0.0125 m³; 100 give 1.250 m³ even when one displays as 0.013 m³.

### What does partial packed weight mean?

Only packages with weight per item contribute to known packed weight. Partial means some package rows have no weight; it is not the complete shipment weight.

### Is CBM the same as chargeable weight?

No. CBM measures volume. Carriers may compare actual and volumetric weight and apply their own minimums and rounding. Use [Volumetric Weight Calculator](tool:volumetric-weight-calculator) and confirm billing rules with your forwarder.

### Does the freight estimate include live prices or currency conversion?

No. It uses your own per-CBM rate, optional minimum and other charges in the selected currency. No live rates or FX conversion are supplied, and actual charges may differ.

### Will this shipment physically load into a container?

Volume comparison only — not a guarantee of physical fit. Dimensions, orientations, stacking, door access and securing need separate assessment. Check actual fit → [Container Loading Calculator](tool:container-loading-calculator).

### Are descriptions or shipment data uploaded?

No. Processing is browser-local with no network upload. Descriptions/SKUs remain in browser memory and are excluded from numeric engine payloads. Copy and print include the current worksheet when you choose those actions.

## References

- SI definition of metre and cubic metre; international yard and pound agreement (1959): inch 0.0254 m, foot 0.3048 m, pound 0.45359237 kg exactly.
- Approved CBM conversion reference: 35.3146667 cubic feet per cubic metre.
- Maersk, A handy guide to Maersk’s fleet of containers, Dry Cargo; equipment-flyer.pdf, Greece local-information import reference. Checked 21 October 2026. Nominal volume references only; actual equipment varies.
