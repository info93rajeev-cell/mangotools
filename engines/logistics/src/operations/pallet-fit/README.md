# logistics.pallet.fit@1

A basic **footprint and layer fit** for one carton type on a Euro pallet, a US pallet or a custom
pallet, up to a maximum stack height the user states. This is a planning aid, **not** a load-safety,
stability or weight calculation — see the standing warnings below.

## Shared orientation search

The footprint-and-layer search is the exact same 6-orientation, axis-aligned search
`logistics.container.fit@1` uses for a container's three fixed axes, now shared in
`engines/logistics/src/lib/orientation-grid.ts`. A pallet is, mathematically, a "container" whose three
axes are the pallet's length, its width, and the maximum stack height the user allows — `bestOrientation`,
`leftovers` and `floorCount` are reused unchanged.

- `counts[0]` → cartons along the pallet's length
- `counts[1]` → cartons along the pallet's width
- `counts[2]` → layers (cartons stacked to the height limit)
- `total` → cartons per pallet (all three multiplied)

## Pallet defaults

Commonly published **approximate** base dimensions, in centimetres (`pallets.ts`). These vary by pallet
condition, manufacturer and region and are **not yet verified against a specific citable source** (ISO
6780, or EPAL's own specification) — see TASK-003D plan §6 and founder decision 15.
`palletType: custom` accepts any positive length and width instead.

| Type | Length | Width | Footprint |
|---|---|---|---|
| `euro` | 120 cm | 80 cm | 0.96 m² |
| `us` | 121.9 cm | 101.6 cm | 1.239 m² |

**Maximum stack height has no default.** It is always a required input, in the same unit as the pallet
(`palletUnit`, which applies to it regardless of pallet type). It is the load height above the pallet
deck — the pallet's own height is not modelled.

## Outputs

| Output | Formula |
|---|---|
| `bestOrientation` | the orientation with the most cartons per layer (`lwh`, `lhw`, `wlh`, `whl`, `hlw` or `hwl`) |
| `cartonsAlongPalletLength`, `cartonsAlongPalletWidth` | per-axis counts for `bestOrientation` |
| `cartonsPerLayer` | the two counts multiplied together |
| `layers` | `floor(maxStackHeight ÷ carton height on the vertical axis)`, capped to 1 when `stackable: false` |
| `cartonsPerPallet` | `cartonsPerLayer × layers` |
| `palletsRequired` | `ceil(quantity ÷ cartonsPerPallet)` |
| `cartonsOnLastPallet` | `quantity mod cartonsPerPallet`, or a full pallet when the quantity divides exactly |
| `usedAreaPercent` | `(carton footprint × cartonsPerLayer) ÷ pallet footprint × 100` |
| `unusedAreaPercent` | `100 − usedAreaPercent` |
| `estimatedStackHeight` | `layers × carton height on the vertical axis` |
| `leftoverPalletLength`, `leftoverPalletWidth` | pallet axis minus cartons × carton dimension, for `bestOrientation` |

There is no separate volume estimate and no usable-area-percentage input (TASK-003D plan §9): this
operation has one estimate, the grid fit, so there is nothing for a percentage to reduce beforehand.

## Options (params, not input — see below)

- `stackable` (default `true`): `false` caps the height-axis count to 1 in every orientation tried.
- `allowBaseRotation` (default `true`): `false` tries only the carton's given length-along-length,
  width-along-width footprint.
- `keepUpright` (default **`true`**, the opposite default from `container-fit`'s `keepUpright`): only the
  two orientations where the carton's own height stays on the vertical (stacking) axis are tried.
  Turning it **off** allows the carton to lie on its side (up to 6 orientations) — the content and UI
  must say this assumes the carton is safe to lay on its side, which is not true for every carton.

**These three are params, not input**, from this operation's first version — unlike
`logistics.container.fit@1`, which put its equivalent booleans on input in its own PR 1 and had to move
them to params in PR 2, because this codebase's only mechanism for a boolean toggle in a tool's UI is a
preset `userOptions` switch, and the runtime always sends that as params. `pallet-fit` starts where
`container-fit` ended up, deliberately.

**Overhang is not modelled and has no toggle.** Floor division can never place a carton partly off the
pallet, so overhang is impossible by construction, not merely disallowed by a setting.

## Validation

- Carton dimensions and quantity: the same rules as the other three logistics operations (positive,
  ≤ 3 decimal places; quantity a whole number from 1 to 1,000,000).
- Custom pallet: `palletLength` and `palletWidth` are required and must be positive, ≤ 3 decimal places.
- `maxStackHeight`: required, positive, ≤ 3 decimal places, always in `palletUnit`.
- If the carton's footprint does not fit the pallet base in **any** orientation tried (the winning
  orientation's length-axis or width-axis count is 0), the operation returns
  `LOGISTICS_CARTON_EXCEEDS_PALLET_BASE`.
- If the carton is taller than `maxStackHeight` on the vertical axis (the winning orientation's
  height-axis count is 0), the operation returns `LOGISTICS_CARTON_TALLER_THAN_STACK_LIMIT` instead —
  a separate, more specific error than `container-fit`'s single combined
  `LOGISTICS_CARTON_EXCEEDS_CONTAINER`, because a pallet's footprint and its stack-height limit are two
  different, independently useful things for a user to know they got wrong.

## Warnings

Every successful result carries three standing notices, plus one when more than one pallet is needed:

- `LOGISTICS_PALLET_NOT_LOAD_SAFETY` — always
- `LOGISTICS_PALLET_VERIFY_BEFORE_SHIPMENT` — always
- `LOGISTICS_PALLET_DIMENSIONS_VARY` — always
- `LOGISTICS_PALLET_MULTIPLE_PALLETS_REQUIRED` — when `palletsRequired > 1`

## Precision

Multiplication is exact; division keeps 20 decimal places. `usedAreaPercent`, `unusedAreaPercent`,
`estimatedStackHeight`, `leftoverPalletLength` and `leftoverPalletWidth` are rounded once, from their own
full-precision value, to `params.decimals` (default 3) with `params.rounding` (default half-up) — the
same rule as every other operation in this engine. Carton counts (`cartonsAlongPalletLength`,
`cartonsAlongPalletWidth`, `cartonsPerLayer`, `layers`, `cartonsPerPallet`, `palletsRequired`,
`cartonsOnLastPallet`) are exact whole numbers and are never rounded for display.

## Working step formula keys (the preset supplies the templates in PR 2)

- `pf.orientation.<bestOrientation>` (one of the 6 orientation codes)
- `pf.layers`
- `pf.cartonsPerPallet`
- `pf.palletsRequired`
- `pf.cartonsOnLastPallet`
- `pf.usedArea`
- `pf.estimatedStackHeight`
