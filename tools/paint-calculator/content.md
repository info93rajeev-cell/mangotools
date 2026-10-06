---
lastReviewed: 2026-10-05
example: 001-room-4x3x2.7-m
---

## How to use

This paint calculator works out how much paint you need for a room, a single wall or flat surface, or
a rectangular roof with one uniform pitch.

1. Choose **Room walls**, **Single surface**, or **Roof**. Roof mode uses the rectangular plan length,
   plan width and one uniform pitch angle.
2. Choose the unit your measurements are in. Changing the unit converts the values you already typed.
3. Add each door, window or other unpainted area with its width, height and quantity.
4. Enter the number of coats and your paint's coverage per coat, in m²/L or ft²/US gal — use the figure
   on your paint's label.
5. Set a wastage allowance (defaults to 10%), display precision and, optionally, the container size.
6. Read the paint to buy, the calculated paint before wastage, the areas, the assumptions used and the
   working. Copy or print the result.

## Method

- Room walls: gross area = 2 × (length + width) × wall height, plus length × width if the ceiling is
  included, × the number of identical rooms.
- Single surface: gross area = length × height or width, × the number of identical surfaces.
- Roof: surface area = length × width ÷ cos(pitch angle), × the number of same-size roofs. A 0° pitch
  gives the plan area; pitch must be from 0° to 89°.
- Openings = Σ(width × height × quantity), deducted from each room, surface or roof. Openings that equal or
  exceed the gross area are rejected, since nothing would be left to paint.
- Paint = net area × number of coats ÷ coverage per coat.
- Paint to buy = paint × (1 + wastage % ÷ 100). Containers, when you enter a size, are rounded up to whole
  containers.

Coverage is converted exactly between m²/L and ft²/US gal (1 ft² = 0.09290304 m², 1 US gallon =
3.785411784 L), and lengths use 1 inch = 0.0254 m and 1 foot = 0.3048 m. Area and paint calculations keep
full internal precision; choose 2, 3 or 4 decimal places for display.

**Coverage is an estimate you control.** 10 m²/L is only a starting value; real coverage depends on the
product, the surface's texture and porosity, the colour change and how it is applied. The coverage used
is always listed with the result.

This calculator estimates finish paint **only**. It does not calculate primer, putty, labour, cost,
colour matching, or a bill of quantities (BOQ), and it never assumes a brand's tin size.

## Worked example

A 4 × 3 m room with 2.7 m walls, one 0.9 × 2.1 m door and one 1.5 × 1.2 m window, 2 coats, 10 m²/L
coverage and a 10% wastage allowance:

## FAQ

### How do I calculate how much paint I need for a room?

Choose "Room walls", enter the room's length, width and wall height, add the doors and windows, then the
number of coats and your paint's coverage. Wall area is the room's perimeter × height, less the openings.

### Should the ceiling be included?

Only if you are painting it with the same paint. Tick "Also paint the ceiling" to add length × width to
the area.

### What coverage rate should I use?

The one stated on your paint's label or data sheet, for the surface you are painting. Rough, porous or
unpainted surfaces usually need more paint than the label's best-case figure.

### How does Roof mode handle pitch?

It divides the rectangular plan area by the cosine of the pitch angle. It assumes one uniform pitch
across the whole roof; enter separate calculations for roof sections with different pitches.

### Does this include primer?

No. Primer usually has its own coverage and number of coats, so it is not estimated from the finish
paint's figures.

### How much wastage should I add for paint?

10% is a common starting allowance and this calculator's default; change it to suit your job.

### Is the result an estimate?

Yes. This is an estimation aid for planning and quantity checks, not a final billing quantity. Actual
paint usage may vary due to surface texture and porosity, application method, paint brand and type,
and site conditions — verify surface area, coats, coverage, and wastage before purchase or
application.

### Does this use AI?

No. This tool is a deterministic calculator — the same inputs always give the same result.

## References

- Rectangular area and paint coverage: (area − openings) × coats ÷ coverage (general geometry).
- Uniformly pitched rectangular roof surface: plan area ÷ cos(pitch angle) (right-triangle geometry).
- International yard and pound agreement (1959): 1 inch = 25.4 mm and 1 foot = 304.8 mm exactly; US
  liquid gallon = 3.785411784 L exactly.
