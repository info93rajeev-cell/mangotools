# engines/survey

Pure Survey calculations through `@mangotools/core` operation descriptors. Decimal strings cross
the boundary; only the public `@mangotools/engine-numeric` API performs arithmetic. No Grid/Units,
DOM, network, storage, clock, randomness or logging. Optional station/remarks make inputs personal.

| Operation | Scope |
|---|---|
| `survey.leveling.reduce@1` | Rise & Fall only, exact checks and optional signed closing misclosure |

Contract: [TASK-010A](../../tasks/TASK-010A-SURVEY-LEVELING-CONTRACT.md).
Boundary: [accepted Survey decision](../../docs/decisions/DECISION-SURVEY-LEVELING-ENGINE.md).
See the [operation README](src/operations/leveling-reduce/README.md) for numerical rules and sources.
English error catalogue: `src/errors.ts`. Colocated golden fixtures are discovered by the existing
engine fixture runner. Descriptors declare worker/node, internal exposure and light cost.

## Changelog

- 0.1.0 — Add `survey.leveling.reduce@1`, Rise & Fall only (TASK-010B, issue #156).

HI, Bowditch/traverse, automatic adjustment, UI/archetype C, presets and tool publication are not
implemented or authorized by this engine PR. No production calculator is published.
