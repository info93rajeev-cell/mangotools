---
lastReviewed: 2026-10-01
example: 001-wall-5x3-m-openings
---

## How to use

This brickwork calculator works out how many bricks to order for a wall — a practical brick quantity
calculator for site engineers, contractors, masons, and quantity surveyors planning a brick wall.

1. Choose the wall unit and enter one wall's length and height. Changing the unit converts the values
   you already typed.
2. Enter the number of identical walls and the wall thickness in brick skins (1 skin for a half-brick
   wall, 2 for a one-brick wall).
3. Add each door, window or other opening with its width, height and quantity. Leave the list empty for
   a solid wall.
4. Pick a brick size preset or enter your own brick face size (length × height) and mortar joint. The
   presets are regional starting points, not universal standards — every value stays editable.
5. Set a wastage allowance for cutting and breakage (defaults to 0%, up to 50%).
6. Read the bricks to order (a whole number, rounded up), the calculated count before wastage, the
   assumptions used, and the working. Copy or print the result.

## Method

- Gross wall area = wall length × wall height × number of walls.
- Openings = Σ(width × height × quantity) for one wall, × number of walls.
- Net wall area = gross wall area − openings. An opening list that equals or exceeds the wall area is
  rejected, since nothing would be left to build.
- Brick face with joint = (brick length + joint) × (brick height + joint).
- Calculated bricks = net wall area × number of skins ÷ brick face with joint.
- Bricks to order = calculated bricks × (1 + wastage % ÷ 100), **rounded up to a whole brick**.

Everything is kept at full precision until the end, and each result is shown at a practical precision:
areas to 2 decimal places, the calculated count to 2 decimal places, and the order quantity as a whole
number.

Unit conversions are exact: 1 mm = 0.001 m, 1 cm = 0.01 m, 1 inch = 0.0254 m and 1 foot = 0.3048 m, so the
same wall entered in feet and inches or in metres and millimetres gives the same brick count.

**Assumptions you can see and change.** The mortar joint (10 mm, about ⅜ in, by default), the number of
skins and the wastage allowance all affect the result, so each one is listed under the result as an
assumption. None of them is a universal standard — use your own brick, joint and site practice.

This calculator gives brick count **only**. It does not calculate structural design, reinforcement, bond
patterns, labour cost, the cement/sand mortar material breakup, a bill of quantities (BOQ), or a final
billing quantity.

## Worked example

A 5 × 3 m wall with one 0.9 × 2.1 m door and two 1.2 × 1.2 m windows, single skin, India modular brick
(190 × 90 mm face) with a 10 mm joint, and a 5% wastage allowance:

## FAQ

### How do I calculate bricks for a wall?

Enter the wall's length and height, your brick's face size and the mortar joint. The calculator divides
the net wall area by the area of one brick plus its joint, multiplies by the number of skins, adds your
wastage allowance and rounds up to a whole brick.

### How do I calculate brickwork with doors and windows?

Add each opening as its own row with width, height and quantity — for example one door and two identical
windows. The total is deducted from every identical wall before the bricks are counted.

### How many bricks are needed per square metre?

It depends on the brick face size and the joint: for a 190 × 90 mm face with a 10 mm joint it is
1 ÷ (0.2 × 0.1) = 50 bricks per square metre per skin. Brick sizes vary by region and manufacturer, so use
your own brick rather than a generic figure.

### What mortar joint should I use?

10 mm (about ⅜ in) is a common starting value and the default here, but it is not universal. Enter the
joint your mason actually uses; set it to 0 for a brick-size-only count.

### Why is the order quantity higher than the calculated bricks?

The order quantity adds your wastage allowance and rounds up, because you cannot buy part of a brick. The
calculated count before wastage is shown alongside it so you can check the arithmetic.

### Can I use this for final billing?

No. This is an estimation aid for planning and quantity checks, not a final billing quantity or a
certified bill of quantities. Brick sizes, mortar thickness, wall bonds, site cutting, breakage, and
measurement rules vary — verify brick sizes, wall thickness, openings, mortar joints, and wastage before
purchase or construction, and confirm the final figures with a licensed engineer, architect, contractor,
mason, or professional quantity surveyor.

### Does this calculate cement and sand for mortar?

No. This calculator estimates brick count only. Mortar materials depend on mix, joint and site practice,
and are not calculated here.

## References

- Face-area brick count: net wall area ÷ (brick length + joint) × (brick height + joint), per skin
  (general geometry).
- International yard and pound agreement (1959): 1 inch = 25.4 mm and 1 foot = 304.8 mm exactly, so
  1 ft² = 0.09290304 m² exactly.
