# logistics.container.load@1

**Actual rectangular placement** of one or more package types into identical containers. Physical fit
always comes from placement geometry — never from comparing total CBM with container CBM, and the
container count is never `ceil(total CBM ÷ container CBM)`.

This is a deterministic, rule-based planning aid. It is not guaranteed to find the most efficient
arrangement, and it does not check weight distribution, centre of gravity, load securing, door access
or crushing.

## Inputs

- `packages` — 1 to 50 package types, in order. Each has an optional `description` (≤ 120 characters),
  `length`, `width`, `height` and `unit` (`mm`, `cm`, `m`, `in`, `ft`), `quantity` (a whole number,
  1–100,000; at most 250,000 pieces in total), and an optional `weight` of ONE piece with `weightUnit`
  (`kg`, `g`, `lb`; at most 100,000 kg).
- `containerType` — `20gp`, `40gp`, `40hc` or `custom`. Standard types use the approximate internal
  dimensions in `../container-fit/containers.ts` (not verified against a specific carrier or ISO
  source — TASK-003C decision 13); `custom` needs `containerUnit` and the three internal dimensions.
- `maxPayload` + `payloadUnit` — optional maximum cargo weight per container (≤ 1,000,000 kg).
- `maxStackHeight` + `stackHeightUnit` — optional highest point cargo may reach; a value above the
  container height uses the container height (with a notice).
-
Params: `allowRotation` (default true: all six axis-aligned orientations), `keepUpright` (only the two
orientations that keep a piece's own height vertical), `stackable` (false: one layer, nothing on top),
and output places for volumes (3), percentages (1) and weights (2).

## Method

All geometry is exact `bigint` arithmetic in 0.1 µm sub-units, so a value with up to three decimals in
any supported unit is exact (1 in = 254,000; 1 ft = 3,048,000). Converted 12-place values round to the
nearest 0.1 µm. Weights are compared in nanograms: piece weights round up, payloads round down, so
rounding can never let a plan exceed a payload.

1. A package that fits an empty container in no allowed orientation is not loaded
   (`no-feasible-orientation`); one piece heavier than the payload is not loaded
   (`weight-exceeds-payload`).
2. A container starts as one free space. The most recently created free space is filled first.
3. For that space, each package with pieces left is tried in each allowed orientation. Its block is a
   grid of whole pieces at the space's back-left-floor corner: complete walls across the space if it
   has enough pieces, else complete columns, else one partial column — capped by the pieces left and
   by the payload still available. The block holding the most cargo volume wins; ties keep the
   earlier package, then the earlier orientation.
4. The rest of the space is split into three non-overlapping spaces: in front of the block (full width
   and height), beside it, and on top of it. The space on top has exactly the block's footprint, so
   every piece stands on the floor or fully on a complete block below.
5. When no free space can take any remaining piece, the next identical container is opened. Planning
   stops at 20 containers (`container-limit`) or 5,000 blocks (`plan-limit`); pieces left are reported
   as unloaded with that reason.

## Outputs

- `status` — `complete` (every piece placed), `partial` or `none`.
- Containers required (containers that hold at least one piece), total / loaded / unloaded pieces.
- Volumes in m³: requested, loaded, available (`containers × container internal volume`).
- `volumeUtilizationPercent` — **combined** across the containers used: loaded volume ÷ (containers ×
  container internal volume) × 100. Each entry of `containers` has its own container-specific figure.
- Weight: `weightStatus` (`complete`, `partial` — some packages have no weight — or `none`), loaded
  weight of the weighed pieces, payload, payload capacity (`payload × containers`) and
  `weightUtilizationPercent` (only when a payload and at least one weight are given).
- `packages` — per package: requested, loaded, unloaded, volumes, weights, `unloadedReason` and pieces
  per container (`byContainer`).
- `containers` — per container: pieces, volume, weight, utilizations, and whether pieces were still
  waiting because of weight (`weightLimitReached`) or space (`spaceLimitReached`) when it closed.
- `blocks` — the placement itself: container, package, orientation, origin `x`/`y`/`z` and piece size in
  cm, and the grid counts. `x` runs along the length from the end wall, `y` across the width, `z` up
  from the floor. Every piece's coordinates follow from its block.

## Cost

Not part of this operation. The freight estimate is the separate shared operation
`logistics.cost.estimate@1` (rate basis `per-container`); a caller passes it `containersRequired` from
this result — the placement-derived count — and only for a `complete` plan.

## Precision

Volumes, weights and percentages are exact decimals until each output is rounded once. Working steps
carry the exact values.
