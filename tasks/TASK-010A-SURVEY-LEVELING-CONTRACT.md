# TASK-010A — Survey Leveling Contract

## Status, lane and size

Proposed; founder review/acceptance on merge. Issue [#150](https://github.com/info93rajeev-cell/mangotools/issues/150).
**This PR:** docs lane, size S; only this contract and the linked decision. **Later implementation:**
engine-survey lane, size M, separately authorized; merging these docs does not start it.

## Goal and prerequisites

Define one deterministic `survey.leveling.reduce@1` operation, Rise & Fall only. Intended later
consumer: `survey/leveling.rise-fall`, `rise-and-fall-calculator`, Surveying, T1/archetype C.
HI remains the planned T4 variant, not part of this implementation scope.

The [engine decision](../docs/decisions/DECISION-SURVEY-LEVELING-ENGINE.md) owns the new engine,
dependency/numeric exceptions, privacy class and lane prerequisites. Before engine implementation:
that decision, separate platform whitelist PR, required founder-owned updates and professional
source verification must be complete, followed by explicit implementation authorization.

The Phase-1 build plan and blueprint §4.3/§6.5 supply direction, not an implemented operation.
At the recorded base in the decision, survey/grid/units and archetype C are absent. TASK-006/006A
names are already Civil tasks, hence the new TASK-010A identifier. No legacy code is reused.

## Strict input and params

All objects are strict; unknown keys fail, never disappear silently. Canonical inputs are:

| Input | Contract |
|---|---|
| `startRL` | Required decimal string, metres; signed, including zero; no default benchmark. |
| `closingRL` | Optional decimal string, metres; signed, including zero. Omission means unknown. |
| `observations` | Required ordered array of 2–50 strict row objects. No sorting, merging or IDs. |
| Row `station` | Optional string; echoed unchanged when supplied, never used to pair observations. |
| Row `remarks` | Optional string; echoed unchanged when supplied, no semantic interpretation. |
| Row `bs`, `is`, `fs` | Optional decimal strings, metres; supplied readings must be non-negative. |

`startRL`/`closingRL` are inputs because the user calculates with them, per the add-tool playbook;
this deliberately differs from the blueprint's old parameter sketch, as recorded in the decision.
No units selector, conversion, distance, setup object, benchmark lookup or project metadata.

Params are a strict object with only `method`, default `rise-fall`, accepting exactly `rise-fall`.
`height-of-instrument` is the reserved future spelling, **not accepted** in this first release.
No `showWorking`, display precision, tolerance or distribution params; working is always returned.

### Decimal boundary

Use `parseDecimal(text, { maxDecimals: 6 })` conventions from the existing numeric engine: trim outer
whitespace, accept ordinary decimal notation (including `.5` and `1.`), reject exponents, grouping,
plus signs and non-numeric text. Fractional precision counts typed trailing zeros too.
Wrong types are structural errors; empty/missing `startRL` is a domain missing-input error.
An absent optional numeric field is not zero; a supplied empty reading/closing RL is invalid.
The UI may omit empty cells before the boundary but must never convert blank to zero.

Keep exact decimal values throughout addition, subtraction, sums and comparisons. No fixed internal
rounding scale or binary-float conversion is introduced; these operations need no division.
Numeric outputs are normalized decimal strings, without exponent notation, redundant fractional
zeros or negative zero. For example `100.000` becomes `100`, not a display-format guarantee.
Later UI presentation defaults to three decimals, half-up, independently of exact engine data.
Reject excess input precision; never round/truncate it or feed displayed values into calculation.

## Row sequence and change points

| Position | Exactly these supplied readings |
|---|---|
| First | BS only |
| Interior ordinary point | IS only |
| Interior change point | FS + BS |
| Last | FS only |

No empty canonical row, BS+IS, IS+FS, or all-three combination is valid. Interior BS-only or
FS-only rows are incomplete setup transitions. The final point closes the final setup, even when
its true RL is unknown; a known closing benchmark is optional. One-row books are not accepted.
Zero-valued supplied readings count as present. Duplicate station labels are allowed and do not
link/split setups. Row position and FS+BS determine the change-point marker; no independent flag.

One physical change point has incoming FS from the previous setup and outgoing BS from the next.
This preserves blueprint §6.5 and its CP/TP glossary, uses primitive row columns and permits later
HI-method reuse without changing observations. Professional-source verification is still gated.

## Reduction and arithmetic checks

1. First row RL = `startRL`; previous usable reading = its BS. No first-row rise/fall.
2. At each later row take its IS, or its incoming FS at a change point/final point.
   `difference = previous usable reading - incoming reading`.
3. Positive difference: rise = difference, fall = `0`; negative: rise = `0`, fall = -difference;
   zero: both `0`. `RL(next) = RL(previous) + rise - fall`.
4. After an ordinary row, previous reading = its IS. After a change point, previous reading =
   its BS **without another RL transition**. The final FS ends reduction.

**Never compare FS with BS on the same row.** They observe the same point from different setups.
Consecutive change-point rows are valid: compare the previous CP's BS with the next CP's FS.

Sum every supplied BS (first + CPs), every FS (CPs + last), and all computed rises/falls except
the first row. IS never enters BS/FS sums. Define exact deltas:

- `bsFsDelta = sumBS - sumFS`
- `riseFallDelta = sumRise - sumFall`
- `rlDelta = endingRL - startingRL`

Use existing core `Check` fields, not a new framework. Return these two ordered checks:

| `id` | `labelKey` | `expected` | `actual` |
|---|---|---|---|
| `arithmetic-rise-fall` | `leveling.check.riseFall` | `bsFsDelta` value | `riseFallDelta` value |
| `arithmetic-first-last` | `leveling.check.firstLast` | `bsFsDelta` value | `rlDelta` value |

Each status is `pass` for exact decimal equality, otherwise `fail`; the two checks establish the
three-way equality. No tolerance, rounding, silent correction or new warning code. A correct reducer
passes both for every valid book; a failure indicates reduction inconsistency, not a way to locate
bad field readings. A pass does **not** certify field observations or eliminate survey misclosure.

If `closingRL` exists, `misclosure = endingRL - closingRL`; positive means computed RL is higher.
Otherwise closing RL and misclosure outputs are null. No allowable-error threshold, pass/fail
misclosure assessment, automatic adjustment, distribution or claim of survey compliance.

### Hand-computed planning example (not a professional reference or fixture)

Starting RL `100`, known closing RL `100`; `—` denotes an absent/inapplicable cell, not zero:

| Station | BS | IS | FS | Rise | Fall | RL |
|---|---|---|---|---|---|---|
| BM | 1.5 | — | — | — | — | 100 |
| A | — | 1.2 | — | 0.3 | 0 | 100.3 |
| CP1 | 0.8 | — | 2 | 0 | 0.8 | 99.5 |
| B | — | 1.1 | — | 0 | 0.3 | 99.2 |
| CP2 | 2.3 | — | 0.6 | 0.5 | 0 | 99.7 |
| END | — | — | 2.2 | 0.1 | 0 | 99.8 |

Sums BS `4.6`, FS `4.8`, rise `0.9`, fall `1.1`; all three deltas and misclosure are `-0.2`.
CP1's `2` and `0.8` are never compared to each other, nor CP2's `0.6` and `2.3`.
This illustrates the contract only; the professional-source gate below still applies.

## Strict output

All listed top-level keys are required; no additional keys. Every measured value is an exact
normalized decimal string unless explicitly nullable. Rows preserve input order and cardinality.

- `rows`: one strict result row with `station?`/`remarks?` only when supplied (unchanged strings);
  `bs`, `is`, `fs` each string or null; `rise`, `fall` each string or null; `rl` string;
  `isChangePoint` boolean. Missing readings are null, **not fabricated zero**.
  First-row rise/fall are null; later zero rise/fall cells are real computed `0` values.
  First/last `isChangePoint` = false; interior FS+BS = true.
- `startingRL`, `endingRL`, `sumBS`, `sumFS`, `sumRise`, `sumFall`, `bsFsDelta`,
  `riseFallDelta`, `rlDelta`: strings with the meanings above.
- `closingRL`, `misclosure`: strings when the closing input exists, otherwise both null.
- `checks`: the two core Check-shaped entries above; only `id`, `labelKey`, `status`, `expected`,
  `actual` are populated. Keys resolve to future UI strings, never engine prose.
- `working`: one core WorkingStep-shaped entry per row after the first, in input order:
  `ref: observations.<index>.rl`, `formulaKey: leveling.working.rl`, `variables` containing only
  `previousRL`, `previousReading`, `incomingReading`, `rise`, `fall` as exact strings, and
  `result` = that row's RL. No labels/remarks, HTML, additional keys or optional note is included.

Use the existing `ok(output)` / `err(OpError)` envelope and core IR types. The later operation's
own `schema.ts` is the source for its Zod/JSON schemas, as in existing engine operations.
No global Table/PlotSpec, UI renderer, schema package or public Result/error redesign is needed.

## Validation order and typed errors

Follow `executeOperation`: strict input structural validation first, then strict params validation,
then domain validation; a structural error wins over domain errors. Reuse `INVALID_INPUT` and
`INVALID_PARAMS` with the existing schema issue path conventions; no stripping unknown keys.
Permit an omitted `startRL` in the structural schema solely to return its typed domain error,
following existing engines; it remains required for successful calculation. Other supplied numeric
values must be strings. Missing/non-array observations or non-object rows are structural errors.

Domain stages run in the order below, stopping at the first error. Numeric traversal order is
`startRL`, `closingRL` if supplied, then rows in order with columns `bs`, `is`, `fs`.
For each numeric value: parse error, excess precision, then forbidden negative value.

| Stage / code | Condition / path |
|---|---|
| 1. `SURVEY_LEVELING_MISSING_START_RL` | Absent or whitespace-only start; `startRL`. |
| 2. `SURVEY_LEVELING_EMPTY_OBSERVATIONS` | Zero rows; `observations`. |
| 2. `SURVEY_LEVELING_TOO_FEW_OBSERVATIONS` | One row; `observations`. |
| 2. `SURVEY_LEVELING_TOO_MANY_OBSERVATIONS` | More than 50; `observations`, no truncation. |
| 3. `SURVEY_LEVELING_INVALID_DECIMAL` | Invalid supplied decimal; exact field/cell path. |
| 3. `SURVEY_LEVELING_TOO_MANY_DECIMALS` | More than six fractional digits; exact path. |
| 3. `SURVEY_LEVELING_NEGATIVE_READING` | Staff reading below zero; exact path; signed RL allowed. |
| 4. `SURVEY_LEVELING_INVALID_READING_COMBINATION` | No reading, BS+IS, IS+FS, all three; `observations.<i>`. |
| 5. `SURVEY_LEVELING_INVALID_SEQUENCE` | Otherwise legal combination but first not BS-only or last not FS-only; first row checked before last; `observations.<i>`. |
| 6. `SURVEY_LEVELING_CHANGE_POINT_INCONSISTENT` | Interior BS-only or FS-only; `observations.<i>`. |

Combination stage visits every row before positional stages. Each row is inspected in array order.
An invalid cell example is `observations.2.bs` (zero-based). The later survey `errors.ts` owns the
bounded catalogue and English messages using existing `errors.<code>` conventions. Never throw
for user input; do not echo labels, remarks, readings or RLs in errors/details/logs/analytics.
Unsupported `height-of-instrument`/other methods and unknown params return `INVALID_PARAMS`.

## Sources and later tests — implementation gate

No web research has been performed or authorized here. No professional source is yet verified.
Before fixtures/content or engine implementation, obtain founder-approved reference verification:
a recognized surveying textbook (author, title, edition, page/example) or authoritative surveying
field manual (issuing body, edition/date, section/page). It must establish the field-book, CP
handling, Rise & Fall reduction, arithmetic equality and closing-misclosure sign/convention.
If a source contradicts this proposed contract, STOP for founder review; do not adjust fixtures.

Blueprint §6.5's 100 m example ends at 99.980 m, all deltas -0.020 m. It is internal reference
material only, not a verified textbook citation. Legacy marketing links are not approved sources.

Require at least three professionally cited golden cases: simple rise/fall, intermediate sights,
and multiple change points with materially different FS/BS. Supplement with minimal hand-verified
edge/error tests for zeros (not blanks), negative RL, six-place precision, every validation stage,
consecutive CPs, repeated labels, unchanged inputs, optional signed closing misclosure and no
adjustment. Assert the three exact deltas, row values, checks and WorkingSteps; prove display
rounding cannot alter equality. No test/fixture files are created in this documentation PR.

Later engine validation: focused operation/fixture tests, `pnpm verify`/architecture and Node versus
Chromium/Firefox/WebKit canonical-output hashes. Future UI validation separately covers row entry,
errors/focus, keyboard/axe, mobile layout, local-only network evidence and rendering nullable cells.

## Separate future lane sequence

1. Docs contract/decision acceptance; required sources and founder-owned architecture/ownership
   reconciliation, without agents editing protected files.
2. Separate platform whitelist PR, then separately authorized engine-survey-only implementation
   (size M). No presets/tools or platform edits ride with the engine.
3. Separately authorized platform/UI archetype-C prerequisites, then tools-lane preset/manifest/
   content/fixtures publication. Preserve C direction; no unapproved B substitute. HI remains later,
   reusing observations with a separately approved `height-of-instrument` extension and tests.

## Exclusions and documentation acceptance

No code, engines/platform/schema/runtime/UI changes, presets/manifests/routes/production pages,
fixtures/tests or dependencies here. No HI/Bowditch/traverse, grid/units construction, CSV/XLSX
import/export, PDF reports, automatic adjustment/distribution/least squares, benchmark lookup,
GPS/total-station import, CRS/maps/geolocation, profiles/cross-sections/plots, earthwork quantities,
persistent/cloud projects, network/storage/analytics changes or unrelated Civil/Logistics/Business/
Rebar work. No surveying values are uploaded; engine storage is forbidden.

Acceptance: issue-linked two-file docs-only diff; unambiguous row/CP/precision/output/error contract;
engine-boundary exception and human/platform gates recorded; sources honestly unverified and gated;
no implied HI/C implementation or professional certification; independent advisory review required
by blueprint §9.13/B.7; `git diff --check` and `pnpm verify` including architecture green.
No version bump/changeset is needed for docs-only work. Founder reviews; do not merge automatically.
