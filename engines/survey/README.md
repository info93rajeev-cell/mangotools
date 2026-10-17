# engines/survey

Pure Survey calculations through `@mangotools/core` operation descriptors.
For the implemented `survey.leveling.reduce@1` Rise & Fall operation, measurements/RLs cross the
boundary as decimal strings and arithmetic uses only the existing exact public Numeric family.
Its behavior, checks, rounding and fixtures remain unchanged.
The separately approved closed-traverse design (#158) uses binary64 metre/decimal-degree
geometry through Numeric's narrowly governed `degreesToRadians`, `sinDegrees`, `cosDegrees` and
`hypot2` family. `survey.traverse.compute@1` implements only raw unadjusted computation;
`survey.traverse.adjust.bowditch@1` remains unimplemented.
See [Numeric geometry decision](../../docs/decisions/DECISION-NUMERIC-GEOMETRY-KERNEL.md);
The Numeric prerequisite shipped in PR #172; #173 records the approved compute source gate.
No Grid/Units, DOM, network, storage, clock, randomness or logging.
Optional station/remarks make inputs personal.

| Operation | Scope |
|---|---|
| `survey.leveling.reduce@1` | Rise & Fall only, exact checks and optional signed closing misclosure |
| `survey.traverse.compute@1` | Ordered unadjusted closed-loop components, coordinates and closure |

Contract: [TASK-010A](../../tasks/TASK-010A-SURVEY-LEVELING-CONTRACT.md).
Boundary: [accepted Survey decision](../../docs/decisions/DECISION-SURVEY-LEVELING-ENGINE.md).
See the [operation README](src/operations/leveling-reduce/README.md) for numerical rules and sources.
English error catalogue: `src/errors.ts`. Colocated golden fixtures are discovered by the existing
engine fixture runner. Descriptors declare worker/node, internal exposure and light cost.
Traverse contract, source provenance and numeric-layer distinction:
[operation README](src/operations/traverse-compute/README.md).

## Changelog

- 0.2.0 — Add `survey.traverse.compute@1` with three founder-approved professional raw cases,
  typed ordered validation and exact cross-runtime fixture evidence (TASK-011B, issue #173).
- 0.1.0 — Add `survey.leveling.reduce@1`, Rise & Fall only (TASK-010B, issue #156).

HI, Bowditch, automatic adjustment, UI/archetype C, presets and tool publication are not
implemented by this engine PR. No production calculator is published.
