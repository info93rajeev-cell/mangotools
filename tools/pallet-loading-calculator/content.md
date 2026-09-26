---
lastReviewed: 2026-09-26
example: 001-euro-pallet-basic
---

## How to use

1. Choose the carton's dimension unit (cm, m, mm or inch) and enter the outer length, width and height of one carton.
2. Enter the number of cartons of that size.
3. Choose a pallet: Euro, US, or Custom to enter your own base length and width.
4. Enter the maximum stack height (default 150 cm) — the load height above the pallet deck that you allow, in the pallet unit.
5. Read the results. The main figure is the total cartons the simple grid fits on one pallet; pallets required and every other step are shown below.

## Method

This tool gives one estimate — a simple, single-orientation grid fit — as a **planning aid**, not a guaranteed real-world fit, a load-safety calculation, or advanced pallet optimisation.

**Footprint and layer fit:** the carton is tried in up to 6 axis-aligned orientations on the pallet base. For each, cartons along the pallet's length = floor(pallet length ÷ the carton's matching dimension), and the same for width — you cannot load part of a carton. The two counts multiplied give cartons per layer. Layers = floor(maximum stack height ÷ the carton's height on the vertical axis). Cartons per pallet = cartons per layer × layers. The orientation with the highest total is used, with its leftover space on each axis (pallet axis − cartons × carton dimension).

**Pallets required and the last pallet:** pallets required = the quantity requested divided by cartons per pallet, rounded up — you cannot ship a fraction of a pallet. Cartons on the last pallet is the remainder, or a full pallet when the quantity divides exactly.

**Cartons can be stacked**, **allow base rotation** and **keep upright** change which orientations are tried:

- Turning off **cartons can be stacked** limits every orientation to a single layer — for cargo that cannot be stacked at all.
- Turning off **allow base rotation** uses only the carton's given length-along-length, width-along-width footprint, with no other footprint tried.
- Turning off **keep upright** (base rotation still allowed) lets the carton lie on its side, trying up to 6 orientations instead of 2. **This assumes the carton is safe to lay on its side, which is not true for every carton** — leave it on unless you know the carton can be safely turned.

**Why real pallet loading depends on more than a footprint fit:** carton strength (which limits safe stack height), weight and its distribution, centre of gravity, the pallet's own type and condition, stretch-wrap or strapping, overhang, warehouse handling method, and carrier rules all affect a real load in ways this calculator does not check. **This is a simple grid estimate, not a load-safety validation — verify the final pallet load before shipment, with your logistics or warehouse professional and your carrier's requirements.**

Unit conversions are exact: 1 inch = 2.54 cm, 1 mm = 0.1 cm, 1 m = 100 cm. Euro and US pallet base dimensions are commonly published approximate figures; they vary by pallet condition, manufacturer and region, so confirm the exact figures for your pallets, or use Custom with your own measurements. The maximum stack height has no safe default we can vouch for — 150 cm is only a common planning figure; always confirm the real limit for your warehouse, trailer or carrier.

Results are rounded to three decimal places for display; totals and percentages are calculated from the unrounded values.

## Worked example

100 cartons of 40 × 30 × 20 cm on a Euro pallet, maximum stack height 150 cm:

## FAQ

### Does this tool give me a real, safe pallet load?

No. It gives a simple grid estimate as a planning aid. Always verify the final pallet load before shipment, with your logistics or warehouse professional and your carrier's requirements.

### Why does the base orientation matter so much?

A pallet's footprint rarely divides evenly by a carton's size, so which side faces which way changes how many fit. In the worked example, turning the carton 90° on its base (width along the pallet's length) gives 8 cartons per layer with no wasted space, instead of 6 with the carton placed as given — a real difference worth checking.

### How accurate are the Euro and US pallet dimensions?

They are commonly published approximate base dimensions. Pallet dimensions vary by condition, manufacturer and region, so treat them as a planning reference, not a certified specification — confirm with your supplier, or use Custom.

### What happens when my quantity needs more than one pallet?

The tool shows pallets required (rounded up) and how many cartons sit on the final, possibly partly filled, pallet. This is expected, not an error.

### Does the maximum stack height include the pallet itself?

No. It is the load height above the pallet deck. Add your pallet's own height separately if you are checking against a fixed overall height limit, such as a trailer or container door.

### Should I turn off "cartons can be stacked" or "allow base rotation"?

Turn off stacking if your cargo genuinely cannot be stacked (fragile or top-loaded items). Turn off base rotation if the carton must be loaded exactly as given, for example because of markings or a fixed pattern. Leave "keep upright" on unless you know the carton is safe to lay on its side.

### How is this different from the Container Loading Calculator?

The [Container Loading Calculator](tool:container-loading-calculator) estimates cartons in a shipping container, by volume and by a simple 3D loading grid. This calculator estimates cartons on a single pallet's footprint, stacked to a height limit, plus how many pallets a quantity needs. To work out carton and shipment volume without a container or pallet, use the [CBM Calculator](tool:cbm-calculator); for chargeable shipping weight, use the [Volumetric Weight Calculator](tool:volumetric-weight-calculator).

## References

- Cartons along an axis = floor(pallet axis ÷ carton dimension); cartons per layer × layers = cartons per pallet; pallets required = ceil(quantity ÷ cartons per pallet) — a standard first-pass method used by hand in warehouse and freight planning.
- SI definition of the metre; international inch (1959): 1 in = 25.4 mm exactly.
- Pallet base dimensions are commonly published approximate figures and are not a certified specification; verify with your pallet supplier before relying on them.
