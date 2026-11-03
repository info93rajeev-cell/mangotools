# TASK-FP-004 — `food.schedule.generate@1`

| | |
|---|---|
| Type | new operation in existing engine (lane `engine-food`) |
| Size | M |
| Status | Proposed; implemented on branch `feat/fp-004-food-schedule` (stacked on FP-002) for review |
| Decision | `docs/decisions/DECISION-FOOD-PLANNER-DATA.md` §2.5 |
| Depends on | FP-002 (`feat/fp-002-food-engine`): recipes, selection, scaling |

## Goal
A deterministic scheduling engine that builds an end-to-end cooking schedule from selected recipes,
a target meal/serving time, and kitchen capacity (burners and prep stations). It is used by the
Cooking Schedule section of the Food Planner.

## Contract
**Input**
- `recipes[]`: `{ id, version, name, prepMinutes, cookMinutes, steps[] }`, 1–50 items.
- `selection[]`: `{ recipe, recipeVersion }`, 1–50 items.
- `guests`: 1–100 000 (used to estimate prep scaling: large parties require scaled prep time).
- `mealTime`: plain time string `"HH:MM"` (e.g. `"13:00"`) or ISO datetime string.
- `burnersAvailable`: 1–12 (default 4).
- `prepStations`: 1–8 (default 2).

**Params**
- `restMinutes`: minutes between dish completion and serving (default 10).
- `prepScaleFactor`: whether prep duration scales with guests (`none` | `logarithmic` | `linear-capped`, default `logarithmic`).

**Output**
- `timeline[]`: sorted chronologically by start offset (earliest first):
  - `id`: unique task id (e.g. `dal-tadka-prep`, `dal-tadka-cook`, `jeera-rice-cook`)
  - `recipe`: recipe id
  - `recipeName`: recipe display name
  - `phase`: `prep` | `active-cooking` | `simmer-rest`
  - `description`: concise task description derived from recipe steps
  - `durationMinutes`: integer >= 1
  - `startOffsetMinutes`: negative integer relative to meal time (e.g. -90 means 90 min before meal)
  - `endOffsetMinutes`: integer <= 0
  - `startTime`: formatted time string (e.g. `"11:30"`)
  - `endTime`: formatted time string (e.g. `"12:15"`)
  - `station`: assigned station/burner (e.g. `"prep-1"`, `"burner-1"`)
  - `dependsOn`: string[] (ids of predecessor tasks)
- `totalSpanMinutes`: total duration from earliest prep start to meal time
- `earliestStartTime`: formatted time string of schedule start
- `mealTime`: formatted target time
- `criticalPath`: string[] (task ids forming the longest dependency path)
- `capacityBottlenecks`: integer (count of concurrent tasks queued due to burner limits)

**Rules**
1. Validation:
   - Selected recipes must exist in `recipes` at that version (`FOOD_UNKNOWN_RECIPE`).
   - Duplicate selections are rejected (`FOOD_DUPLICATE_SELECTION`).
   - Meal time must be valid `HH:MM` or ISO datetime (`FOOD_INVALID_MEAL_TIME`).
   - `burnersAvailable` and `prepStations` must be positive integers.
2. Topological backward scheduling:
   - A dish finishes cooking at `mealTime - restMinutes`.
   - Active cooking begins at `dishEndTime - cookMinutes`.
   - Prep must finish before cooking can begin (`prepEndTime <= cookStartTime`).
   - Prep begins at `prepEndTime - scaledPrepMinutes`.
3. Station allocation & capacity management:
   - Up to `burnersAvailable` cooking tasks may run in parallel.
   - If more dishes need burners at the same time, tasks are scheduled earlier so dishes hold warm
     before serving (`capacityBottlenecks` incremented, warning `FOOD_CAPACITY_BOTTLENECK` raised).
4. Truth in modeling:
   - All generated timings are deterministic estimates based on recipe metadata and scaling rules.
   - Warning `FOOD_SCHEDULE_ESTIMATE` is always included to state that timings are model estimates,
     not measured kitchen guarantees.

## Acceptance
- Unit tests cover:
  - 3-recipe menu scheduled backward from 13:00 with 4 burners.
  - Burner bottleneck scenario with 1 burner forcing serial cooking.
  - Single-dish schedule.
  - Guest scale factor adjusting prep duration.
  - Dependency ordering: prep always precedes cooking.
  - Critical path calculation.
  - Rejection of unknown recipes, duplicate selection, and invalid times.
- All golden fixtures pass under `engine-fixtures.test.ts`.
- Architecture and typechecks clean.
