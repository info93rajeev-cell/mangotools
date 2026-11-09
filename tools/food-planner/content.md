---
lastReviewed: 2026-11-03
example: 001-diwali-feast
---

## How to use

1. In Plan Setup, set your event location, occasion, planning type (e.g. Household or Catering), number of guests, and dietary policy.
2. In Recipes & Menu, browse and select dishes from the recipe catalog. Adjust individual portion multipliers or dish servings as needed.
3. In Ingredients, inspect scaled ingredient quantities across all selected dishes with allergen alerts and dietary compatibility flags.
4. In Shopping List, review the consolidated grocery purchase list grouped by aisle. Toggle checkboxes as you purchase items, and use Discover Grocery Stores to locate nearby vendors.
5. In Cost Estimation, review cost breakdowns against retail and wholesale benchmark prices, set your target budget, and account for cooking fuel, packaging, and labor.
6. In Cooking Schedule, view a backward-planned preparation timeline based on your target meal time and kitchen burner capacity.

## Method

Ingredient quantities are scaled from verified base recipe yields to your exact guest count using exact rational arithmetic, avoiding floating-point rounding errors.

Duplicate ingredients across multiple selected recipes are converted to base metric units (grams, milliliters, pieces) and consolidated into single purchasing lines. Buying quantities are rounded up to practical supermarket pack sizes.

Cost estimations apply verified benchmark price datasets (retail and wholesale in INR) with support for custom user price overrides. Cooking timelines apply backward topological scheduling from the target meal service time, factoring in preparation overlap, stove burner limits, and resting periods.

## Worked example

For a 50-guest dinner selecting Jeera Rice (200 g rice per 4 servings) and Dal Tadka (200 g dal per 4 servings), the scaling factor is 12.5×.

The planner computes:
- Basmati Rice: 2.50 kg (cooking quantity), rounded to a standard 2.5 kg or 5 kg retail pack.
- Yellow Moong Dal: 2.50 kg (cooking quantity).
- Cumin Seeds: 62.5 g total across both recipes, consolidated into a single shopping item.

Estimated ingredient cost is computed using reference retail prices with variance calculated against your target event budget.

## FAQ

### Can I plan for both small family dinners and large catering events?

Yes. The Food Planner dynamically scales recipes from intimate gatherings of 5 to 10 guests up to large community events and catering functions of several hundred guests.

### How does the shopping list consolidate shared ingredients?

When multiple recipes call for the same ingredient (such as cumin seeds, ghee, or onions), the engine converts each measurement into standard base units, calculates the exact sum, and consolidates them into a single line grouped by grocery aisle.

### Are my menus and custom prices uploaded to any server?

No. All calculations run entirely inside your browser on your device. Your guest lists, custom recipes, prices, and event plans remain 100% private.

## References

- BeyondTheAI Food & Catering Foundation — FP-001, FP-002, FP-003, FP-004 specifications and verified recipe fixtures.
- Exact rational arithmetic for ingredient scaling, unit conversion and cost consolidation.
