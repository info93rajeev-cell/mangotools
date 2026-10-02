---
lastReviewed: 2026-10-01
example: 001-slab-overage
---

## How to use

1. Choose the member type — slab, footing, wall, beam, rectangular column, circular column or a general rectangular volume — and the unit your dimensions are in: millimetres, centimetres, metres, inches or feet. Changing the unit converts the values you already typed.
2. Enter one member's size: length, width and depth/thickness/height, or diameter and height for a circular column.
3. Enter the number of identical members and an overage allowance (0 to 50%, defaults to 0%).
4. Optionally, for pre-mixed bags, enter the yield per bag printed on your product to see how many bags to buy.
5. Read the concrete to order, the net geometric volume, the assumptions used and the working. Copy or print the result.

## Method

- Rectangular members: volume = length × width × depth × number of members.
- Circular columns: volume = π × (diameter ÷ 2)² × height × number of members.
- Order volume = net volume × (1 + overage % ÷ 100).
- Bags (only when you enter a yield) = order volume ÷ yield per bag, **rounded up to a whole bag**.

Unit conversions are exact: 1 mm = 0.001 m, 1 cm = 0.01 m, 1 inch = 0.0254 m and 1 foot = 0.3048 m, so 1 ft³ = 0.028316846592 m³ and 1 yd³ = 0.764554857984 m³ exactly. Imperial and metric inputs that describe the same member give the same volume.

The rule is **exact first, round once**: every volume is kept at full precision and rounded only for display — m³ to 3 decimal places, ft³ and yd³ to 2.

**Overage is your estimating allowance, not a rule.** It covers spillage, uneven formwork or over-excavation, and how much is sensible depends on the job, so the percentage is always shown with the result.

**Why yield, not bag weight?** Bags of the same weight can yield different volumes depending on the product, so this calculator never guesses a yield from weight. Use the figure printed on your bag.

If any dimension, converted to metres, is larger than 100 m, the calculator still gives a result but shows a warning — this usually means the wrong unit was selected.

This calculator gives concrete **volume only**. It does not calculate reinforcement (rebar), mix design or the cement/sand/aggregate split, cost, or a bill of quantities (BOQ).

## Worked example

A 5 × 4 × 0.15 m slab, 1 member, with a 5% overage allowance:

## FAQ

### Which member shapes are supported?

Slabs, footings, walls, beams, rectangular columns and general rectangular volumes all use length × width × depth. Circular columns use π × (diameter ÷ 2)² × height.

### What does the overage % add?

An editable estimating allowance applied to the net geometric volume to give an order volume. It defaults to 0% and can be set from 0 to 50%. Common practice varies by job and supplier, so choose the allowance that fits your project.

### How many bags of concrete do I need?

Enter the yield per bag printed on your pre-mixed product (in litres, m³ or ft³). The calculator divides the order volume by that yield and rounds up to a whole bag. Leave the yield blank to skip bags.

### Can I mix units, for example metres for length and centimetres for depth?

No. One unit applies to every dimension of a member. Switching the unit converts the values already entered, so you can type in one unit and read the result in another.

### Is this an exact quantity I can order material against?

No. This is an estimation aid, not a certified bill of quantities. Local codes, site conditions, mix design, wastage and measurement rules vary by project — verify quantities before purchase or construction, and confirm the final figures with a licensed engineer, architect or professional quantity surveyor.

## References

- Rectangular-prism and cylinder volume (general geometry).
- International yard and pound agreement (1959): 1 inch = 25.4 mm and 1 foot = 304.8 mm exactly.
