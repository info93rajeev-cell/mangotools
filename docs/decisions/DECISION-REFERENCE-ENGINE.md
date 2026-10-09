# DECISION — Reference Engine Family (`engines/reference`)

| | |
|---|---|
| **Status** | Proposed (ADR-lite). Becomes the accepted decision when the founder merges it. |
| **Date** | 2026-10-09 |
| **Decided by** | Founder (on merge) |
| **Required by** | Blueprint "Add engine" playbook (ADR required before `engines/<name>` exists) and `DECISION-MARKETPLACE-FEE-REFERENCE-DATA.md` §5 and §9 (task B0) |
| **Contract** | `tasks/TASK-008G-REFERENCE-RESOLVER-ENGINE.md` |
| **Affects** | Approves one new engine family and its dependency boundary. Changes no code, schema, whitelist, data, preset, tool or UI. |

## 1. Context

`DECISION-MARKETPLACE-FEE-REFERENCE-DATA.md` assigns effective-date resolution of reference records to a
pure engine, `engines/reference`, named by the architecture (`platform-security-architecture.md` §3.8).
The repository requires an ADR before any new engine (`repository-blueprint.md` §9, "Add engine"), and
engine dependencies are a whitelist enforced by `scripts/validate/rules.ts` (`ENGINE_IMPORTS`) and the
blueprint's §2.4 table.

## 2. Decision

1. **Approve the engine family `engines/reference`** (package `@mangotools/engine-reference`, engine id
   `reference`, error-code prefix `REFERENCE_`), lane `engine-reference`.
2. **Purpose:** deterministic selection of versioned reference-data records by effective date and
   explicit conditions. It is **domain-neutral**: it knows records, dates, exact selectors and
   numeric ranges — never marketplaces, fees, taxes, products or any dataset vocabulary.
3. **First operation:** `reference.record.resolve@1`, specified in TASK-008G. Further operations need
   their own approved task contracts; this decision does not pre-approve them.
4. **Purity:** the general engine rules apply without exception — no DOM, network, files, storage,
   clock, randomness, console, authentication or logging; datasets and the effective date arrive as
   explicit input; typed errors, never throws for user input. `runtimes: ['worker', 'node']`.
   Portable engine: uses the shared engine `tsconfig.base.json` setup with no DOM types, like
   `engines/search` and `engines/data`.
5. **Allowed imports:** `zod`, `@mangotools/core`, and `@mangotools/engine-numeric` (decimal comparison of
   range bounds; never JavaScript numbers for decimal values). No npm dependency is added.
6. **Who may depend on it:** only `packages/runtime` (via the generated engine loaders, as for every
   engine) and `scripts/` tests. No engine imports `engines/reference`;
   `estimate.seller.profitability@1` stays unchanged and receives already-resolved numbers.
7. **Public boundary:** `engines/reference/src/index.ts` exports `engine` (with `engineId: 'reference'`)
   and the operation objects only. No internal paths are imported by any other package.

## 3. Governance consequences

- **Whitelist change required, in a separate platform PR:** add
  `reference: ['@mangotools/engine-numeric']` to `ENGINE_IMPORTS` in `scripts/validate/rules.ts`.
  `scripts/` belongs to the `platform` lane, and one PR may touch one lane only, so this cannot ride
  with the engine implementation. It must merge before (or be the first commit approved alongside)
  the engine PR's CI run.
- **Human-only updates (founder):** add `reference` to the blueprint §2.4 engine-edge table
  (`reference | core, numeric`) and to `.github/CODEOWNERS` for its `schema.ts` and `fixtures/` paths,
  matching other engines. Agents must not edit those files.
- The implementation PR adds a workspace package, so `pnpm-lock.yaml` gains a workspace entry. This
  is not a new external dependency.
- Engine README changelog is used instead of changesets (Phase-1 notes).

## 4. Alternatives considered

| Alternative | Why not |
|---|---|
| Resolver inside `engines/estimate` | Puts dataset and date knowledge into the platform-agnostic profitability engine (TASK-008B) |
| Resolver in `packages/runtime` | Calculation logic outside engines, golden fixtures and the determinism suite |
| A marketplace-specific engine | Hard-codes one dataset family; the architecture wants one reference resolver for all effective-dated data |
| Most-specific-match scoring | Hidden precedence rules are hard to audit; see TASK-008G "Specificity" |

## 5. Non-goals

No engine code, datasets, marketplace or HSN/GST data, whitelist edit, schema, network, UI, adapters,
storage, authentication, seller credentials, profitability changes or online refresh.
