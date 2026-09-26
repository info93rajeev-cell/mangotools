---
lastReviewed: 2026-09-26
example: 001-40ft-standard-basic
---

## How to use

1. Choose the carton's dimension unit (cm, m, mm or inch) and enter the outer length, width and height of one carton.
2. Enter the number of cartons of that size.
3. Choose a container: 20 ft standard, 40 ft standard, 40 ft high cube, or Custom to enter your own internal length, width and height.
4. Enter the usable space percentage (default 90%) — the share of the container's volume left after pallets, uneven stacking or handling clearance.
5. Read the results. The main figure is the maximum cartons the simple grid fits; the working below shows every step, including the separate volume-only estimate.

## Method

This tool gives two different numbers, both **estimates**, not a guaranteed loading plan:

- **Estimated cartons by volume** — how many cartons could fit if the container were filled perfectly, with no gaps. This is always the more generous number.
- **Maximum cartons (simple grid)** — a real, single-orientation arrangement: cartons stacked in rows along the container's length, width and height, in whichever of the 6 axis-aligned orientations fits the most. This number is usually lower, because a real carton shape rarely tiles a container with zero wasted space.

**Volume estimate:**

- Carton volume (m³) = length × width × height, converted to metres.
- Container volume (m³) = internal length × width × height, converted to metres (from the container type chosen, or your custom dimensions).
- Usable volume = container volume × usable space percentage.
- Estimated cartons by volume = floor(usable volume ÷ carton volume).
- Total shipment volume = carton volume × number of cartons.

**Simple grid fit:** the carton is tried in all 6 axis-aligned orientations (which of the carton's length, width and height sits along the container's length, width and height). For each orientation, cartons along one axis = floor(the container's length on that axis ÷ the carton's matching dimension) — you cannot load part of a carton. The three per-axis counts are multiplied together, and the orientation with the highest total is shown, with its per-axis counts and the leftover space on each axis (container axis − cartons × carton dimension). The usable space percentage is **not** applied to the grid — a carton either fits a cell or it does not, so a percentage reduction would not make physical sense there; it applies to the volume estimate only. This means the grid can occasionally show a higher utilisation than the volume estimate, since the volume estimate is reduced by the usable percentage and the grid is not.

This is still not advanced 3D loading optimisation: it assumes every carton uses the same single orientation in a uniform grid, it does not mix orientations within one load, and it does not attempt bin-packing. Real loads sometimes do better with mixed orientations or partial layers, and sometimes worse once pallets, bracing and handling space are accounted for.

**Cartons can be stacked**, **allow rotation** and **keep upright** change which of the 6 orientations are tried:

- Turning off **cartons can be stacked** limits every orientation to a single layer high (the height-axis count is capped to 1) — for cargo that cannot be stacked at all.
- Turning off **allow rotation** uses only the carton's length × width × height as given, with no other orientation tried.
- Turning on **keep upright** (with rotation still allowed) only tries the two orientations where the carton's own height stays on the container's vertical axis — its height is never rotated onto a horizontal axis.

**Why exact loading depends on more than volume:** a volume or grid estimate cannot account for everything a real load needs — pallets (which take up space themselves and are rarely an exact multiple of the container), carton strength (which limits safe stack height), weight distribution (which affects safe handling and, for road and rail, axle limits), the door opening (which can be narrower than the container's internal width), lashing and load securing for transit safety, and the loading method and sequence. **This calculator does not check any of these — verify the final loading plan with your freight forwarder or logistics professional before shipment.**

Unit conversions are exact: 1 inch = 2.54 cm, 1 mm = 0.1 cm, 1 m = 100 cm. Container internal dimensions for the 20 ft standard, 40 ft standard and 40 ft high-cube presets are commonly published approximate figures; they vary by carrier, manufacturer and container condition, so confirm the exact figures with your carrier before booking, or use Custom with your own measurements.

Results are rounded to three decimal places for display; totals and percentages are calculated from the unrounded values.

## Worked example

500 cartons of 60 × 40 × 30 cm in a 40 ft standard container, 90% usable space:

## FAQ

### Does this tool give me a real loading plan?

No. It gives two estimates — one from volume alone, one from a simple single-orientation grid — as a planning aid. Always verify the final loading plan with your freight forwarder or logistics professional before shipment.

### Why is the simple grid number lower than the volume estimate?

The volume estimate assumes the container fills perfectly, with no wasted space. The simple grid checks a real arrangement in one orientation, and a carton's shape rarely tiles a container exactly, so some space is always left over. Seeing both numbers side by side shows how much the shape of your carton costs you.

### Can the simple grid number be higher than the volume estimate?

Yes, in one case: the volume estimate applies the usable-space percentage (for example 90%), while the simple grid is checked against the full container. If your carton tiles the container efficiently, the grid can fit more cartons than the reduced "usable" volume alone would suggest.

### How accurate are the 20 ft, 40 ft and 40 ft high-cube dimensions?

They are commonly published approximate internal dimensions. Container dimensions vary by carrier, manufacturer and container condition, so treat them as a planning reference, not a certified specification — confirm with your carrier before booking, or use Custom.

### What does "usable space" mean, and does it affect the grid fit?

It is the share of the container's volume you expect to actually use once pallets, uneven stacking and handling clearance are accounted for (default 90%). It is applied to the volume estimate only, not to the simple grid, which is a physical fit check against the full container.

### Should I turn off "cartons can be stacked" or "allow rotation"?

Turn off stacking if your cargo genuinely cannot be stacked (fragile or top-loaded items). Turn off rotation if the carton must be loaded exactly as given, for example because of markings, handles or a fixed pallet pattern. Turning on "keep upright" keeps the carton the right way up while still allowing its length and width to swap.

### How is this different from the CBM Calculator and the Volumetric Weight Calculator?

The [CBM Calculator](tool:cbm-calculator) works out carton and shipment volume on its own, without a container. The [Volumetric Weight Calculator](tool:volumetric-weight-calculator) turns a carton's size into a weight for courier and freight billing. This calculator compares carton volume and a simple loading grid against a specific container's capacity.

## References

- Estimated cartons by volume = floor(usable container volume ÷ carton volume); simple grid fit = floor(container axis ÷ carton dimension) per axis, over the 6 axis-aligned orientations (a standard first-pass method used by hand in freight planning).
- SI definition of the metre; international inch (1959): 1 in = 25.4 mm exactly.
- Container internal dimensions are commonly published approximate figures and are not a certified specification; verify with your carrier before booking.
