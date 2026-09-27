---
lastReviewed: 2026-09-27
example: 001-standard-wall
---

## How to use

This brickwork calculator works out brick count and brickwork volume for a rectangular wall — a
practical brick quantity calculator for site engineers, contractors, masons, and quantity surveyors
planning a brick wall.

1. Choose the wall unit and enter the wall's length, height, and thickness.
2. Enter the number of walls (a whole number, defaults to 1) and, if the wall has doors or windows, the
   total opening area to deduct (defaults to 0).
3. Choose the brick unit and enter the brick's length, width, and height, plus the mortar joint thickness
   (defaults to 10 mm; set it to 0 for a brick-size-only count).
4. Enter a wastage percentage for site cutting and breakage (defaults to 0%, up to 50%).
5. Read the total estimated bricks including wastage, the brickwork volume, and the working. Copy or
   print the result.

## Method

- Gross wall area = wall length × wall height (per wall), × the number of walls for the total.
- Opening deduction = the opening area you enter (per wall), × the number of walls.
- Net wall area = gross wall area − opening deduction. This is your **brick wall calculator with
  openings**: enter one total opening area for doors and windows and it is subtracted before the brick
  count is worked out.
- Brickwork volume = net wall area × wall thickness.
- Effective brick volume = (brick length + mortar) × (brick width + mortar) × (brick height + mortar) —
  the common simplified assumption most published bricks-per-square-metre calculators use, adding the
  mortar joint to all three brick dimensions rather than modelling a specific bond pattern.
- Estimated brick count = brickwork volume ÷ effective brick volume.
- Wastage bricks = estimated brick count × wastage %.
- Total bricks including wastage = estimated brick count + wastage bricks.

Unit conversions are exact: 1 mm = 0.001 m, 1 cm = 0.01 m, 1 inch = 0.0254 m and 1 foot = 0.3048 m. The
wall and the brick can each use their own unit — a wall is commonly measured in metres while a brick is
commonly measured in millimetres.

**Gross wall area vs. net wall area.** Gross wall area is the full wall as if it were a solid rectangle.
Net wall area subtracts the opening deduction you enter for doors and windows — the figure the brick
count is actually based on, since bricks are not needed where an opening is.

**Does brick size affect the result?** Yes. A larger brick needs fewer bricks for the same wall volume,
and a thicker mortar joint increases each brick's effective volume, which also reduces the brick count
slightly. Always use your actual brick size, not an assumed standard one, for an accurate estimate.

The brick count is shown as an exact number, not rounded up to a whole brick — round it up yourself when
ordering material, since you cannot buy a fraction of a brick.

This calculator gives brick count and volume **only**. It does not calculate structural design,
reinforcement, labour cost, the cement/sand mortar material breakup, a bill of quantities (BOQ), or a
final billing quantity.

## Worked example

A 5 × 3 m wall, 230 mm thick, 1 wall, standard 230 × 110 × 75 mm brick, 10 mm mortar joint, no opening, no
wastage:

## FAQ

### How do I calculate bricks for a wall?

Enter the wall's length, height, and thickness, and the brick's length, width, and height. This brickwork
calculator works out the wall volume and divides it by the effective brick volume (brick size plus mortar
joint) to estimate the brick count.

### How do I calculate brickwork with openings?

Enter the total area of doors and windows in the opening area field. It is deducted from the gross wall
area, per wall, before the brick count is calculated — a simple way to handle a brickwork calculator with
openings without needing a separate row for each opening.

### How many bricks are needed per square metre?

It depends on brick size, mortar joint thickness, and wall thickness — there is no single universal
figure. Enter your own brick size and mortar joint here rather than relying on a generic bricks-per-square-metre
number, since brick sizes vary by region and manufacturer.

### Should I include mortar joint thickness?

Yes, for a realistic estimate. A typical mortar joint is around 10 mm, though it varies by site practice.
Set it to 0 if you want a brick-size-only count without any mortar allowance.

### Can I use this for final billing?

No. This is an estimation aid for planning and quantity checks, not a final billing quantity or a
certified bill of quantities. Brick sizes, mortar thickness, wall bonds, site cutting, breakage, and
measurement rules vary — verify brick sizes, wall thickness, openings, mortar joints, and wastage before
purchase or construction, and confirm the final figures with a licensed engineer, architect, contractor,
mason, or professional quantity surveyor.

### Does this calculate cement and sand for mortar?

No. This calculator estimates brick count and brickwork volume only. The cement/sand mortar material
breakup is a separate calculation this version does not perform.

## References

- Rectangular-prism volume: length × width × height (SI, general geometry).
- International yard and pound agreement (1959): 1 inch = 25.4 mm and 1 foot = 304.8 mm exactly.
- Cubic foot: 1 ft³ = 0.028316846592 m³, and square foot: 1 ft² = 0.09290304 m², both rounded here to this
  platform's own Phase 1 constants (35.3146667 ft³ per m³ and 10.7639104 ft² per m²), matching the
  Concrete Quantity Calculator and CBM Calculator.
