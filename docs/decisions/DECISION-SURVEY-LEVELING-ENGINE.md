# DECISION — Survey Leveling Engine (`engines/survey`)

| | |
|---|---|
| **Status** | Proposed (ADR-lite). Becomes accepted when the founder merges it. |
| **Date** | 2026-10-16 |
| **Decided by** | Founder (on merge) |
| **Issue** | [#150](https://github.com/info93rajeev-cell/mangotools/issues/150) |
| **Required by** | `repository-blueprint.md` §9.9: ADR before a new engine; separate platform boundary PR. |
| **Contract** | [TASK-010A](../../tasks/TASK-010A-SURVEY-LEVELING-CONTRACT.md) |
| **Scope** | Docs lane, size S. Engine implementation is not authorized by this PR or its merge. |

## Context

The Phase-1 plan names Rise & Fall (T1, archetype C), a later HI variant (T4), and Bowditch.
At main `177db9fc26a45542f8313552e14b45fd5e5671a7`, `engines/survey`, `engines/grid` and
`engines/units` do not exist. There is no production leveling operation/preset/tool, implemented
archetype C, or `ENGINE_IMPORTS.survey` entry. Existing TASK-006/006A files concern Civil quantities.
Legacy HTML is neither the production contract nor reusable implementation.

The blueprint §4.3/§6.5 and glossary already specify one change-point row carrying incoming FS
and outgoing BS. This decision preserves that model, but bounds the first capability to Rise & Fall.

## Decision

1. Approve the future engine family `engines/survey`, package `@mangotools/engine-survey`, engine id
   `survey`, lane `engine-survey`, and error prefix `SURVEY_LEVELING_` for its first operation.
2. First operation: `survey.leveling.reduce@1`, contract in TASK-010A. Initially only `rise-fall`;
   HI, Bowditch, adjustment and other survey operations require separate approval.
3. Boundary: `zod`, `@mangotools/core` and `@mangotools/engine-numeric`, public package entries only.
   No direct `big.js`, new external dependency, units/grid engine, or UI-owned arithmetic.
4. Pure, deterministic, portable engine: worker/node, `exposure: internal`, light cost; no DOM,
   network, files, storage, time, randomness, console, or logging of survey values. No analytics.
   Only runtime/generated loaders and scripts/tests consume its public descriptors; UI never
   imports it directly. Phase-1 engine README changelog replaces changesets.
5. Measurements and RLs use exact decimal strings through the existing numeric engine, not JS
   floating-point arithmetic. This is a **survey-leveling-only departure** from blueprint §1.1
   ADR-0003's float64/tolerance sketch and §3.4's plain-number boundary. It changes neither the
   numeric engine nor the repository-wide model. Reduction needs addition/subtraction, not trig.
6. `startRL`/`closingRL` are calculation inputs, not params, following `docs/playbooks/add-tool.md`.
   This explicitly supersedes that placement in the older blueprint §4.3 sketch for this operation.
   The method remains a param. Exact row/error/output semantics belong only to TASK-010A.
7. Conservatively classify the future operation `personal`: optional unrestricted station/remarks
   can carry identifying content (add-tool privacy rule). Browser-local processing is not a
   sensitivity classification; no data is uploaded or recorded by the engine.

## Prerequisites and ownership

- Follow the precedent in [Reference Engine decision](DECISION-REFERENCE-ENGINE.md): a separate
  **platform PR** must add `survey: ['@mangotools/engine-numeric']` to
  `scripts/validate/rules.ts`'s `ENGINE_IMPORTS` before the engine implementation can pass CI.
- **Founder-owned, human-only updates:** reconcile blueprint §2.4's survey dependency row and the
  narrowly scoped numeric/input exceptions above; add survey schema/fixture ownership in
  `.github/CODEOWNERS`. This docs PR does not edit those files or grant agents permission to do so.
- Obtain founder-approved professional sources as TASK-010A requires, then separately authorize
  the size-M **engine-survey PR**. No implementation begins merely because these docs merge.
- Public T1/archetype-C publication remains later work: current `ToolPage.astro` rejects C and
  `ToolIsland` supports A/B/D only. Platform contracts/dispatch, UI workbench/results and tools
  publication must have bounded, separately approved lane PRs. Do not quietly ship a B substitute.
  Generic primitive input rows exist; they are not a complete C workbench or result renderer.

## Alternatives and limits

- Reusing legacy HTML would violate root instructions and bypass fixtures/current contracts.
- Floating-point rounding/tolerances are unnecessary for a bounded addition/subtraction reduction.
- Creating units/grid/trig infrastructure first would expand beyond this first capability.
- Implementing all survey methods together would violate the approved small-task boundary.

No code, schemas, whitelist, numeric behavior, presets, tools, UI, reference data or dependencies
change here. No professional source has been verified in this pass; the decision is architectural,
not a claim of surveying certification. Accepted architectural changes still require founder review.
