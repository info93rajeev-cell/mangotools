# logistics.container.fit@1

A basic **volume estimate plus a simple axis-aligned loading grid** for one carton type inside a
20 ft standard, 40 ft standard, 40 ft high-cube or custom container. This is a planning aid, **not**
a 3D bin-packing solver and not a guaranteed loading plan — see the standing warnings below.

## Container defaults

Commonly published **approximate** internal dimensions, in centimetres (`containers.ts`). These vary by
carrier, manufacturer and container condition and are **not yet verified against a specific citable
source** (ISO 668:2020 or a named carrier's specification sheet) — see TASK-003C plan §6 and founder
decision 13. `containerType: custom` accepts any positive length, width and height instead.

| Type | Length | Width | Height | Volume (computed) |
|---|---|---|---|---|
| `20gp` | 589.8 cm | 235.2 cm | 239.3 cm | ≈ 33.196 m³ |
| `40gp` | 1203.2 cm | 235.2 cm | 239.3 cm | ≈ 67.720 m³ |
| `40hc` | 1203.2 cm | 235.2 cm | 269.8 cm | ≈ 76.351 m³ |

## Outputs

**Volume estimate:**

| Output | Formula |
|---|---|
| `cartonCbm` | carton length × width × height, in m³ |
| `containerCbm` | container length × width × height, in m³ |
| `totalCbm` | `cartonCbm × quantity` |
| `usableCbm` | `containerCbm × usablePercent ÷ 100` |
| `cartonsByVolume` | `floor(usableCbm ÷ cartonCbm)` |
| `remainingCbm` | `usableCbm − totalCbm` (negative when the requested quantity is over capacity) |
| `volumeFillPercent` | `totalCbm ÷ usableCbm × 100` |

**Simple loading grid** (evaluated in centimetres): for each orientation tried, cartons along each
container axis = `floor(container axis ÷ carton dimension on that axis)`, multiplied together.
`usablePercent` is **not** applied to the grid — see "Options" below.

| Output | Meaning |
|---|---|
| `bestOrientation` | which orientation gave the most cartons: `lwh`, `lhw`, `wlh`, `whl`, `hlw` or `hwl` (carton length/width/height mapped, in that order, to the container's length/width/height axis) |
| `cartonsAlongLength`, `cartonsAlongWidth`, `cartonsAlongHeight` | per-axis counts for `bestOrientation` |
| `maxCartonsByGrid` | the three counts multiplied together |
| `cartonsLeftAfterGrid` | `max(quantity − maxCartonsByGrid, 0)` |
| `leftoverLength`, `leftoverWidth`, `leftoverHeight` | container axis minus (count × carton dimension), for `bestOrientation` |

## Options (founder decisions, TASK-003C §15)

- `stackable` (default `true`): when `false`, the container's height-axis count is capped to 1 in every
  orientation tried — cartons that cannot stack occupy a single layer.
- `allowRotation` (default `true`): when `false`, only the carton's given length × width × height
  orientation (`lwh`) is tried — no permutation search.
- `keepUpright` (default `false`): when `true` (and rotation is allowed), only the two orientations
  where the carton's own height stays on the container's height axis are tried (`lwh`, `wlh`) — the
  carton's height is never rotated onto a horizontal axis.
- `usablePercent`: a whole number from 1 to 100, applied **only** to the volume estimate. It does not
  reduce the grid's container dimensions (TASK-003C §15 decision 5) — a physical carton either fits in
  a grid cell or it does not; "90% usable" does not shrink a grid cell.

## Validation

- Carton dimensions and quantity: same rules as `logistics.cbm.compute` (positive, ≤ 3 decimal places;
  quantity a whole number from 1 to 1,000,000).
- Custom container: `containerUnit`, `containerLength`, `containerWidth` and `containerHeight` are all
  required and must be positive, ≤ 3 decimal places.
- `usablePercent`: required, a whole number from 1 to 100 (`LOGISTICS_USABLE_PERCENT_OUT_OF_RANGE`
  otherwise; ≤ 0 is `LOGISTICS_NOT_POSITIVE` instead, as with the other whole-number-range fields).
- If the carton does not fit the container in **any** orientation tried (every axis floors to 0 in every
  permitted orientation), the operation returns `LOGISTICS_CARTON_EXCEEDS_CONTAINER` rather than a
  result of zero.

## Warnings

Every successful result carries three standing notices, plus either over-capacity warning when it
applies:

- `LOGISTICS_CONTAINER_VOLUME_NOT_GUARANTEED` — always
- `LOGISTICS_CONTAINER_GRID_NOT_ADVANCED_PLANNING` — always
- `LOGISTICS_CONTAINER_VERIFY_PROFESSIONAL` — always
- `LOGISTICS_CONTAINER_OVER_CAPACITY_VOLUME` — when `totalCbm > usableCbm`
- `LOGISTICS_CONTAINER_OVER_CAPACITY_GRID` — when `quantity > maxCartonsByGrid`

## Precision

Multiplication is exact; division keeps 20 decimal places. Every CBM, percentage and leftover-length
output is rounded once, from its own full-precision value, to `params.decimals` (default 3) with
`params.rounding` (default half-up) — the same rule as CBM and Volumetric Weight. Carton counts
(`cartonsByVolume`, the per-axis grid counts, `maxCartonsByGrid`, `cartonsLeftAfterGrid`) are exact whole
numbers from `floor` division and are never rounded for display.

## Working step formula keys (the preset supplies the templates in PR 2)

- `cf.cartonVolume`
- `cf.containerVolume.<containerType>` (`20gp`, `40gp`, `40hc` or `custom`)
- `cf.usableVolume`
- `cf.totalVolume`
- `cf.cartonsByVolume`
- `cf.remainingVolume`
- `cf.orientation.<bestOrientation>` (one of the 6 orientation codes)
