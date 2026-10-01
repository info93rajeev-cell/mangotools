---
lastReviewed: 2026-10-01
example: 003-v2-room-5x4-m
---

## How to use

This tile calculator works out how many tiles and boxes to buy for a floor or wall — a practical
flooring calculator for homeowners, contractors, and quantity surveyors planning a tiling job.

1. Enter the surface as length × width, or switch to **Known area** if you already have the area. Changing
   a unit converts the values you already typed.
2. Enter the number of identical rooms or areas, and add any parts that will not be tiled.
3. Enter one tile's face size in the tile unit — the surface and the tile can use different units.
4. Pick a layout to suggest a wastage percentage, or type your own. The suggestions are estimating
   guidance only.
5. Enter the box packing from the label — tiles per box or coverage per box — or skip boxes.
6. Read the tiles to buy, the boxes to buy, the calculated count before wastage, the assumptions and the
   working. Copy or print the result.

## Method

- Gross area = length × width (or the known area) × number of rooms.
- Deductions = Σ(width × height × quantity), from each room. Deductions that equal or exceed the area are
  rejected.
- Tile area = tile length × tile width (the tile's face).
- Calculated tiles = net area ÷ tile area.
- Tiles to buy = calculated tiles × (1 + wastage % ÷ 100), **rounded up once** to a whole tile.
- Boxes = tiles to buy ÷ tiles per box, or net area × (1 + wastage % ÷ 100) ÷ coverage per box, **rounded
  up** to a whole box.

Unit conversions are exact (1 inch = 25.4 mm, 1 foot = 0.3048 m, 1 ft² = 0.09290304 m²). The wastage
allowance is applied to the exact calculated count and the result is rounded only once, so the order
never carries a hidden double rounding.

**Why grout joints are not deducted.** A simple "tile + joint" formula does not reliably predict how many
tiles a real layout uses — cuts at the edges usually matter more. The calculator uses tile face area and
lets your wastage allowance cover cuts and breakage.

This calculator gives tile and box quantities **only**. It does not calculate grout or adhesive, skirting,
layout-specific cuts, material or labour cost, or a bill of quantities (BOQ).

## Worked example

A 5 × 4 m room, 300 × 300 mm tiles, 10% wastage, 10 tiles per box:

## FAQ

### How do I calculate how many tiles I need?

Enter the floor or wall size and one tile's size. The calculator divides the net area by the tile's face
area, adds your wastage allowance and rounds up to a whole tile.

### How much wastage should I add for tiles?

It depends on the layout, the room shape and the tile size. The layout picker suggests 10% for a straight
lay, 15% for diagonal and 20% for herringbone or complex patterns — as starting points you can change, not
standards.

### Can I use feet for the room and inches for the tile?

Yes. The surface and the tile each have their own unit.

### How do I calculate boxes of tiles?

Enter either the tiles per box or the area one box covers, from the box label. Boxes are rounded up to
whole boxes.

### Does this include grout or adhesive?

No. This calculator estimates tiles and boxes only.

### Is the result an estimate?

Yes. This is an estimation aid for planning and quantity checks, not a final billing quantity. Actual
tile usage can vary due to cutting at edges and corners, breakage, pattern layout, and grout width —
verify tile sizes, room dimensions, and wastage before purchase or installation.

## References

- Rectangular area and tile-count ratio: net area ÷ tile face area (general geometry).
- International yard and pound agreement (1959): 1 inch = 25.4 mm and 1 foot = 304.8 mm exactly.
