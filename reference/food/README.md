# reference/food — Food Planner reference data

Data only, with no formulas. The shapes are defined in `schemas/src/food.ts` and
`schemas/src/food-menu.ts`, and are checked by `tests/unit/food-reference.test.ts`. The rules are
in `docs/decisions/DECISION-FOOD-PLANNER-DATA.md`.

| Path | What |
|---|---|
| `ingredients.yaml` | Ingredient catalogue: dimension (mass / volume / count), aisle, allergens, unsuitable diets |
| `recipes/<id>.yaml` | One recipe per file, named after its id. Original steps, ≥ 2 sources, verification status |
| `fixtures/` | Golden fixtures for the proposed `engines/food`. Never change an expected value; add a new fixture instead |
| `menus/<category>/<version-id>.yaml` | Shared menu versions (none yet). Immutable once published |

## Rules for recipes
- Write the steps yourself. Never copy instructions from a source.
- Cite at least two published recipes, and say what each was used to check.
- Quantities use metric kitchen measures (1 tsp = 5 ml, 1 tbsp = 15 ml, 1 cup = 250 ml), or grams
  and pieces.
- Agents may set `draft` or `source-checked`. Only a person who cooked the recipe sets
  `kitchen-tested`, and only the founder sets `approved`.
- A changed recipe gets a new `version`; published menus keep pointing at the old one.

## Rules for evidence
- `verified-foundation`, `seasonal` and `observed-trend` reasons are never mixed up.
- Trend observations are copied exactly from the collected feed, never typed in by hand.
- Prices are labelled `wholesale-reference`, `retail-reference` or `user-entered`. No live store
  price is ever invented.
