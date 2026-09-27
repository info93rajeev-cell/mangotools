---
lastReviewed: 2026-09-27
example: 001-room-5x4-m
---

## How to use

This tile calculator works out how many tiles you need for a rectangular floor or wall — a practical
flooring calculator and floor tile calculator for homeowners, contractors, and quantity surveyors
planning a tiling job.

1. Choose the unit your measurements are in.
2. Enter the floor or wall's length and width.
3. Enter one tile's length and width, in the same unit.
4. Enter the number of identical rooms or areas (defaults to 1) and a wastage percentage for cutting
   and breakage (defaults to 10%, up to 50%).
5. If you know the tiles per box, enter it to also see the boxes required — leave it blank to skip
   that calculation.
6. Read the total tiles required (including wastage), the base tile count, and the working. Copy or
   print the result.

## Method

- Surface area = length × width (per room), × the number of identical rooms for the total.
- Tile area = tile length × tile width.
- Base tile count = surface area ÷ tile area, **rounded up** — a fractional tile still needs a whole
  one.
- Total tiles required = base tile count × (1 + wastage %), **rounded up again**. This tile quantity
  calculator uses the already-rounded base count in this step, so you can recompute the total by hand
  from the base count shown.
- Extra tiles for wastage = total tiles − base tile count (shown for reference; it is not a separate
  rounding step).
- Boxes required = total tiles ÷ tiles per box, **rounded up**, shown only when tiles per box is
  entered.

Unit conversions are exact: 1 mm = 0.001 m, 1 cm = 0.01 m, 1 inch = 0.0254 m and 1 foot = 0.3048 m. The
same unit applies to both the surface and the tile in this version — for example, enter both the room
and the tile in feet, or both in inches.

**Why round up twice?** Rounding the base tile count up first, then applying wastage to that whole
number and rounding again, means every number in the result is one you could have arrived at by hand
from the number before it — there's no hidden, unrounded number behind the total you see.

This calculator gives tile count **only**, for a flat rectangular area. It does not calculate grout or
adhesive quantity, material or labour cost, a diagonal or pattern tile layout, skirting, or a bill of
quantities (BOQ).

## Worked example

A 5 × 4 m room, 0.3 × 0.3 m (30 cm) tiles, 1 room, 10% wastage, 10 tiles per box:

## FAQ

### How do I calculate how many tiles I need?

Enter the floor or wall's length and width, and one tile's length and width, in the same unit. This
calculator divides the surface area by the tile area and rounds up to give the base tile count, then
adds your wastage allowance.

### How much wastage should I add for tiles?

10% is a common starting allowance for cutting and breakage, and is this calculator's default; some
patterns or awkward room shapes call for more. Always confirm your own project's expected wastage.

### Does this calculate boxes of tiles?

Yes, if you enter how many tiles come in one box. Leave that field blank to skip the boxes
calculation and see only the tile count.

### Can I use feet for room size and inches for tile size?

Not in this version — the same unit applies to both the surface and the tile. Convert one of them
first (for example, 12 inches = 1 foot) if your measurements are in different units.

### Does this include grout or adhesive?

No. This tile quantity calculator estimates tile count only. Grout and adhesive quantities are a
separate calculation this version does not perform.

### Does it handle diagonal tile layouts?

No, not in this version. It assumes a simple rectangular layout; a diagonal or pattern layout
typically needs more tiles and more cutting than this estimate accounts for.

### Does it calculate tile cost?

No. This calculator estimates quantity only, not material or labour cost.

### Can I use it for wall tiles?

Yes. Enter the wall's length and height as the surface length and width — the same length × width ÷
tile area formula applies to a floor tile calculator, a wall tile calculator, or a bathroom tile
calculator alike.

### Do I need to sign up?

No. This tool works without an account, sign-up, or login.

### Is the result an estimate?

Yes. This is an estimation aid for planning and quantity checks, not a final billing quantity. Actual
tile usage can vary due to cutting at edges and corners, breakage, pattern layout, and grout width —
verify tile sizes, room dimensions, and wastage before purchase or installation, and confirm the
final figures with a licensed engineer, architect, contractor, or professional quantity surveyor.

## References

- Rectangular area and tile-count ratio: surface area ÷ tile area (general geometry).
- International yard and pound agreement (1959): 1 inch = 25.4 mm and 1 foot = 304.8 mm exactly.
- Square foot: 1 ft² = 0.09290304 m², rounded here to this platform's own Phase 1 constant
  (10.7639104 ft² per m²), matching the Plaster Calculator and Brickwork Calculator.
