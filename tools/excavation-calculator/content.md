---
lastReviewed: 2026-10-05
example: 001-trench-swell-trucks
---

## How to use

This excavation calculator works out earthwork volume for a rectangular pit, circular pit or shaft,
trench, or footing pit — common shapes used for everyday earthwork quantity checks.

1. Choose the excavation type and the unit your dimensions are in. Changing the unit converts the values
   you already typed.
2. For a rectangular excavation, enter length, width, and depth. For a circular pit or shaft, enter
   diameter and depth. Then enter how many identical excavations there are.
3. Optionally enter a swell percentage to see the loose volume of the dug soil (0% shows bank volume
   only).
4. Optionally enter the usable volume one truck carries on your job to see truck loads.
5. Choose 2, 3, or 4 decimal places for volume results and the swell percentage. Read the bank
   (in-place) volume, loose volume and whole truck loads when used, then copy or print the result.

## Method

- Bank volume = length × width × depth × number of pits or trenches — the geometric volume of the hole,
  shown on its own.
- Circular bank volume = π × (diameter² ÷ 4) × depth × number of circular pits or shafts.
- Loose volume = bank volume × (1 + swell % ÷ 100), only when you set a swell percentage.
- Truck loads = loose volume (or bank volume when swell is 0%) ÷ your usable truck volume, **rounded up
  to whole loads**.

Unit conversions are exact: 1 mm = 0.001 m, 1 cm = 0.01 m, 1 inch = 0.0254 m and 1 foot = 0.3048 m, so
1 ft³ = 0.028316846592 m³ and 1 yd³ = 0.764554857984 m³ exactly. Volumes are kept at full precision and
rounded only for display using your 2, 3, or 4 decimal-place selection. That selection also sets the
accepted decimal precision for the swell percentage; it does not alter existing values or the formula.

**Bank volume vs. loose volume.** Bank volume is the size of the hole itself. Once dug, soil no longer
packs as tightly, so the same soil occupies more space; that is the loose volume you haul. Swell varies
by soil type and moisture content, so it is an approximate estimate you set — not an engineering constant
— and it is listed with the result whenever it is used.

**Truck capacity is yours to enter.** Trucks carry very different usable volumes, so the calculator
never assumes one.

This calculator gives **geometric volume only**, for vertical-sided rectangular or circular excavations.
It does not cover side slopes or battered excavation, slope stability, shoring design, excavation safety
compliance, dewatering, geotechnical design, disposal cost, or backfill compaction.

## Worked example

A 20 × 0.6 × 1 m trench with a 25% swell estimate and trucks carrying 6 m³ per load:

## FAQ

### How do I calculate trench excavation volume?

Choose "Trench", enter the trench's length, width, and depth in one unit, and the number of identical
trench runs. A trench uses the same length × width × depth formula as a pit.

### How do I calculate footing excavation quantity?

Choose "Footing pit" and enter the pit's length, width, and depth. The excavation type changes only the
label, not the arithmetic.

### How do I calculate a circular pit or shaft?

Choose "Circular pit / shaft", then enter its diameter, depth, and the number of identical excavations.
The calculator uses π × (diameter² ÷ 4) × depth × quantity and keeps the full result precision internally.

### What is the difference between bank and loose volume?

Bank volume is the excavation as measured in the ground. Loose volume adds swell, since dug soil takes up
more space. Use bank volume to describe the excavation and loose volume when estimating material to move
or haul.

### What swell percentage should I use?

It depends on the soil and its moisture, and published figures vary. Use a figure from your site
investigation, contractor or supplier, and treat the result as an estimate. Leave it at 0% to see bank
volume only.

### How many truck loads will I need?

Enter the loose volume one truck actually carries on your job. The calculator divides the loose volume
by it and rounds up to whole loads.

### Can I use this for final billing?

No. This is an estimation aid for planning and quantity checks, not a final billing quantity or a
certified bill of quantities. Actual site quantities can differ due to soil conditions, over-excavation,
side slopes, shoring, compaction, and local measurement rules — verify quantities before excavation,
purchase, billing, or construction, and confirm the final figures with a licensed engineer, architect,
contractor, or professional quantity surveyor.

## References

- Rectangular-prism volume: length × width × height (SI, general geometry).
- Circular-cylinder volume: π × diameter² ÷ 4 × depth (general geometry).
- International yard and pound agreement (1959): 1 inch = 25.4 mm and 1 foot = 304.8 mm exactly.
