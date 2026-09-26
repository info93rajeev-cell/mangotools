---
lastReviewed: 2026-09-26
example: 001-slab
---

## How to use

1. Choose the member type (general/rectangular, slab, beam, column or footing) and the unit your dimensions are measured in: millimetres, centimetres, metres, inches or feet.
2. Enter the length, width and depth/thickness/height of one member.
3. Enter the number of members (a whole number from 1 to 1,000,000) and a wastage percentage (0 to 50, defaults to 0).
4. Read the total concrete volume including wastage, the volume before wastage and the same volume in cubic feet, with the working. Copy or print the result.

## Method

Every supported member type — general/rectangular, slab, beam, column and footing — uses the same rectangular-prism volume formula:

- One member's volume = length × width × depth/thickness/height, converted to cubic metres.
- Volume before wastage = one member's volume × number of members.
- Wastage volume = volume before wastage × wastage %.
- Total volume including wastage = volume before wastage + wastage volume.
- Cubic feet (ft³) = total volume × 35.3146667.

Unit conversions are exact: 1 mm = 0.001 m, 1 cm = 0.01 m, 1 inch = 0.0254 m and 1 foot = 0.3048 m.

The rule is **exact first, round once**. Every volume is calculated exactly and rounded to three decimal places only for display. For example, a 6 × 0.3 × 0.45 m beam is 0.81 m³ per beam; 4 beams are 3.24 m³ before wastage, and 5% wastage adds 0.162 m³, for a total of 3.402 m³ — not a total built from already-rounded figures.

If any dimension, converted to metres, is larger than 100 m, the calculator still gives a result but shows a warning — this usually means the wrong unit was selected (for example, metres typed where centimetres were meant), not a real member of that size.

This calculator gives concrete **volume only**. It does not calculate reinforcement (rebar) quantity or weight, mix design or the cement/sand/aggregate split, cost, labour or material pricing, or a bill of quantities (BOQ) or PDF report.

## Worked example

A 5 × 4 × 0.15 m slab, 1 member, 0% wastage:

## FAQ

### Which member types are supported?

General/rectangular, slab, beam, column and footing. All five use the same length × width × depth formula — the member type changes only the label, not the arithmetic, since every supported shape is a rectangular prism.

### What does wastage % add?

An adjustable allowance for material lost to cutting, spillage and site handling, applied to the volume before wastage. It defaults to 0% and can be set from 0 to 50%. A value above 50% is rejected, since it almost certainly signals a mistake rather than a real wastage rate.

### Can I mix units, for example metres for length and centimetres for depth?

No. One unit applies to length, width and depth for a given calculation. Choose the unit that matches how you measured the member, or convert your figures to one unit first.

### Is this an exact quantity I can order material against?

No. This is an estimation aid, not a certified bill of quantities. Local codes, site conditions, mix design, wastage and measurement rules vary by project — verify quantities before purchase or construction, and confirm the final figures with a licensed engineer, architect or professional quantity surveyor.

### Why does the calculator warn about a large dimension?

A dimension over 100 m, once converted to metres, is implausible for a single rectangular concrete member and usually means the wrong unit was selected. The calculator still gives a result, since a genuinely large input is possible to describe, but flags it so you can double-check the unit.

## References

- Rectangular-prism volume: length × width × height (SI, general geometry).
- International yard and pound agreement (1959): 1 inch = 25.4 mm and 1 foot = 304.8 mm exactly.
- Cubic foot: 1 ft³ = 0.028316846592 m³, rounded here to 35.3146667 ft³ per m³, matching this platform's CBM Calculator.
