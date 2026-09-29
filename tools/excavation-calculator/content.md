---
lastReviewed: 2026-09-30
example: 001-pit
---

## How to use

This excavation calculator works out earthwork volume for a rectangular pit, a trench, or a footing pit —
the three excavation shapes most site engineers, contractors, and quantity surveyors need for everyday
earthwork quantity checks.

1. Choose the excavation type: rectangular pit / general excavation, trench, or footing pit.
2. Choose the unit your dimensions are measured in: millimetres, centimetres, metres, inches, or feet.
3. Enter the length, width, and depth of one pit or trench.
4. Enter the number of pits or trenches (a whole number from 1 to 1,000,000) and a bulking/swell
   percentage (0 to 50, defaults to 0).
5. Read the loose excavated volume including bulking, the neat volume before bulking, and the same
   volume in cubic feet, with the working. Copy or print the result.

## Method

A rectangular pit, a trench, and a footing pit are all excavated as a rectangular prism, so this
excavation quantity calculator uses one formula for all three:

- One excavation's volume = length × width × depth, converted to cubic metres.
- Neat volume before bulking = one excavation's volume × number of pits or trenches.
- Bulking/swell volume = neat volume × bulking %.
- Loose excavated volume including bulking = neat volume + bulking volume.
- Excavation volume in cubic feet (ft³) = loose volume × 35.3146667.

Unit conversions are exact: 1 mm = 0.001 m, 1 cm = 0.01 m, 1 inch = 0.0254 m and 1 foot = 0.3048 m. The
rule is **exact first, round once** — every volume is calculated exactly and rounded only for display, the
same rule the Concrete Quantity Calculator uses.

**Neat volume vs. loose excavated volume.** "Neat" is the volume of the hole itself, as if the soil were
removed with no change in volume. "Loose" is the neat volume plus bulking/swell: once soil is dug, it no
longer packs as tightly, so the same soil occupies more space once excavated. Bulking/swell varies by
soil type and moisture content — loose sand typically bulks less than dense clay — so this calculator
treats it as a single adjustable percentage you set, not a soil-specific lookup table.

This calculator gives excavation/earthwork **volume only**. It does not calculate side-slope or battered
excavation, stepped excavation, dewatering, shoring, disposal cost, truck trips, or backfill and backfill
compaction — each depends on site-specific factors this simple rectangular-volume tool does not model.

## Worked example

A 5 × 4 × 1.5 m rectangular pit, 1 pit, 0% bulking:

## FAQ

### How do I calculate trench excavation volume?

Choose "Trench" as the excavation type, enter the trench's length, width, and depth in one unit, and the
number of trench runs. The trench excavation calculator uses the same length × width × depth formula as
a pit — a trench is simply a long, narrow rectangular excavation.

### How do I calculate footing excavation quantity?

Choose "Footing pit" as the excavation type and enter the footing pit's length, width, and depth. Footing
excavation quantity uses the same rectangular-volume formula; the excavation type only changes the label,
not the arithmetic.

### How do I calculate pit excavation volume?

Choose "Rectangular pit / general excavation," enter the pit's length, width, and depth, and the number of
pits. This also covers a general soil excavation volume calculation for any simple rectangular cut.

### What is the difference between neat excavation and loose excavation?

Neat excavation volume is the size of the hole itself. Loose excavated volume adds bulking/swell, since
dug soil takes up more space than it did in the ground. Use the loose volume when estimating how much
excavated material there will be to move or haul; use the neat volume when describing the excavation
itself.

### What is soil bulking or swell?

Bulking (also called swell) is the percentage increase in volume when soil is excavated and loosened,
compared to its volume in the ground. It varies by soil type and moisture content, so this calculator lets
you set your own bulking percentage rather than assuming one figure for every soil.

### Can I use this for final billing?

No. This is an estimation aid for planning and quantity checks, not a final billing quantity or a
certified bill of quantities. Actual site quantities can differ due to soil conditions, over-excavation,
side slopes, shoring, compaction, and local measurement rules — verify quantities before excavation,
purchase, billing, or construction, and confirm the final figures with a licensed engineer, architect,
contractor, or professional quantity surveyor.

### Does this calculate truck trips or disposal cost?

No. Truck trips and disposal cost depend on truck capacity, haul distance, and local disposal rates —
factors outside a simple excavation volume calculator.

### Does this include backfill or compaction?

No. This calculator estimates the excavation volume only. Backfill quantity and compaction are separate
calculations this tool does not perform.

## References

- Rectangular-prism volume: length × width × height (SI, general geometry).
- International yard and pound agreement (1959): 1 inch = 25.4 mm and 1 foot = 304.8 mm exactly.
- Cubic foot: 1 ft³ = 0.028316846592 m³, rounded here to 35.3146667 ft³ per m³, matching this platform's
  Concrete Quantity Calculator and CBM Calculator.
