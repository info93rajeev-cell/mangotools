# Trust promises → product rules

**Status:** Founder-approved principle. This document records it; it adds no code.
**Applies to:** all website wording, tool content, the future Trust/About/Privacy pages (TASK-008) and all
future features.

## 1. Principle

We are not copying any enterprise website. We are learning **how enterprise and commercial buyers decide
to trust a vendor**: they trust claims that are specific, limited and provable.

So **every public trust promise must map to all six of these**:

1. **Website wording**: the exact public text
2. **Product rule**: what the product must always or never do
3. **Technical enforcement**: what in the code or build makes the rule true
4. **Test / proof**: what fails CI if the rule breaks, or what a user can check themselves
5. **Policy / report evidence**: where the promise is written down for buyers (privacy page, report
   block, Trust Center)
6. **Phase status**: **Phase 1** (true today) or **Future** (not yet built)

A promise with no enforcement and no test **may not be published**.
**Future features are never described as current features.** Future items may appear only under a clearly
labelled "Planned" heading, if at all.

## 2. Promise map

Legend for the status column: ✅ enforced and tested now · 🟡 partly in place (limits noted) · 🔜 future
only, must not be claimed.

### 2.1 Files are processed on your device where possible — ✅ Phase 1

| | |
|---|---|
| Wording | "Files and numbers are processed in your browser." (Use "where possible" only once a tool exists that genuinely cannot work locally, and label that tool.) |
| Product rule | Every tool computes on the device. A tool that needs a server must say so on its page before the user adds any data. |
| Enforcement | Engines run in same-origin module workers (`packages/runtime`). There is no server API in Phase 1: `apps/api` is a forbidden folder (`scripts/validate/rules.ts`). |
| Test / proof | `tests/e2e/network.spec.ts` (no third-party requests and no request bodies, on all three browsers). The user can go offline after the page loads and the tool still works. |
| Evidence | Privacy page (TASK-008). The tool page's "Processed on your device" note. |
| Limits | Phase 1 tools take typed or pasted input. File tools arrive in TASK-004/005 and must extend the network test to cover files. |

### 2.2 No uploads unless clearly stated — ✅ Phase 1

| | |
|---|---|
| Wording | "No unnecessary uploads." / "Nothing is uploaded unless the tool clearly says so." |
| Product rule | No user content leaves the device unless the user starts an upload that is labelled on the page. There are no background uploads, and user content is never sent for "analysis" or "improvement". |
| Enforcement | CSP `default-src 'self'; connect-src 'self'` (`apps/web/astro.config.mjs`, `_headers` written by `scripts/check/postbuild.ts`). There is no upload endpoint. `AGENTS.md` golden rule 8. |
| Test / proof | The network test asserts no request bodies. The post-build checks fail if the CSP is loosened. |
| Evidence | Privacy page. Future: Egress Registry and ledger (security architecture §18.12.1–2). |
| Future rule | Any feature that uploads (for example encrypted sync) must be declared in the Egress Registry and disclosed on the page before it is used. |

### 2.3 No ads or trackers — ✅ Phase 1

| | |
|---|---|
| Wording | "No ads · No trackers." |
| Product rule | No display ads, ever, on any page. No third-party scripts, pixels, session replay or cross-site identifiers (product architecture §9.8). |
| Enforcement | CSP blocks third-party scripts and connections. The analytics catalogue in `packages/runtime` makes **no network calls** in Phase 1. Fonts and icons are self-hosted. |
| Test / proof | The network test asserts no third-party requests. The SEO suite checks the CSP header, and the post-build checks fail on `'unsafe-inline'` scripts. |
| Evidence | Privacy page. |
| Watch-out | If TASK-008 adds analytics, it must be **first-party, cookieless and content-free**, limited to catalogue events, and disclosed on the privacy page. If the founder considers any counting to be "tracking", keep analytics off or change the wording. **Founder decision needed before TASK-008.** |

### 2.4 No AI in calculations — ✅ Phase 1

| | |
|---|---|
| Wording | "No AI in calculations." |
| Product rule | Every result comes from a deterministic engine operation. No model, LLM or AI service takes part in computing, rounding, validating or choosing a result. |
| Enforcement | Engines are pure: `ENGINE_BANNED` in `scripts/validate/rules.ts` bans DOM, network, `Date`, `Math.random` and more. `packages/adapters` (the AI adapters) is a forbidden folder in Phase 1. New dependencies need an approved `risk:dependency` issue. |
| Test / proof | Architecture check (`pnpm verify`). Determinism suite. Golden fixtures. |
| Evidence | Tool pages ("How it works"). Future: the report provenance block. |
| Future rule | Security architecture §18.8.4 already says "AI never enters the calculation path". Keep that rule even if optional AI features are ever added elsewhere. See the brand decision's open question 1. |

### 2.5 Same input gives the same output — ✅ Phase 1

| | |
|---|---|
| Wording | "Deterministic results — the same input always gives the same output." |
| Product rule | For a given operation version, identical input and parameters give byte-identical output on every supported browser and on Node. |
| Enforcement | Decimal-string money in `engines/numeric` (no floating point for money). Banned non-deterministic APIs. Versioned operations (`id@major`). |
| Test / proof | `tests/determinism/determinism.spec.ts`: canonical SHA-256 hashes of all engine fixtures match across Node, Chromium, Firefox and WebKit. CI run on Node 24 was green (PR #1). |
| Evidence | Tool page note. Future: the calculation lock in project revisions (security architecture §0.1). |

### 2.6 Every calculation is checkable — 🟡 Phase 1 (calculators)

| | |
|---|---|
| Wording | "Every result shows its working, so you can check it." |
| Product rule | Calculators show working steps and the formula. Transforms show a result the user can reverse or compare (for example Swap). Every tool has cited references. |
| Enforcement | Working-step templates are validated by `pnpm gen` against each step's variables. Content references are required, and fixtures cite a source. |
| Test / proof | `tests/e2e/tools.spec.ts` checks working steps on GST and Profit Margin. The tool fixture tests. |
| Evidence | Tool page "Working" and "References" sections. |
| Limit | Say "calculators show their working", not "every tool", until each archetype has an equivalent. |

### 2.7 Reference data and formulas are versioned — 🟡 Phase 1 (partial)

| | |
|---|---|
| Wording (Phase 1) | "Each tool has a version and a changelog." |
| Product rule | Any change to a formula, rate table or rounding rule is a new tool version with a changelog entry. Existing fixture values never change silently. |
| Enforcement | Manifest `version` and `changelog` (for example `tools/gst-calculator/manifest.yaml`). Operation `id@major`. `AGENTS.md` golden rule 4 (fixtures are truth). |
| Test / proof | Fixture tests. Registry validation. |
| Future | Signed, immutable datasets with source, version and effective dates (security architecture §3). **Do not claim "signed datasets" yet.** |

### 2.8 Reports show formula, data, version and revision — 🔜 Future

| | |
|---|---|
| Wording | None in Phase 1. Phase 1 has no reports. |
| Product rule (future) | Every professional report carries the provenance block: engine version, dataset version, standard, rate source, revision, prepared/checked/approved by (security architecture §2.4, §18.11). |
| Enforcement / test | Report engine plus provenance tests, in a future phase. |

### 2.9 Business admin, device and policy control — 🔜 Future

| | |
|---|---|
| Wording | None until built. "Planned" only. |
| Product rule (future) | Organisation policies for sync, updates, telemetry, extensions and datasets (security architecture §18.8). Device registry and seat control. |

### 2.10 Hybrid, private and air-gapped deployment — 🔜 Future

| | |
|---|---|
| Wording | None until built. Enterprise sales conversations only, clearly labelled "planned". |
| Product rule (future) | The four deployment modes (security architecture §18.3). Signed update packages (§18.9). |

## 3. Wording rules

**Never publish:**

- "HIPAA compliant", "GDPR compliant", "DPDP compliant" or any certification claim (product architecture §13)
- "100% secure", "unhackable", "military-grade"
- "Works fully offline" (the model is a bounded grace window; see
  `docs/phase-1/AUTO-LOCK-OFFLINE-LICENSING-NOTES.md`)
- "We never collect anything" if any first-party analytics is enabled
- Any 🔜 future item written in the present tense

**Prefer:** short, factual, testable sentences that name the limit ("where possible", "unless the tool
clearly says so").

## 4. Process

1. A new public promise needs a new row in §2, with all six fields, before its wording ships.
2. A PR that changes wording in `copy.ts` or tool content that makes a trust claim must link to the row.
3. A PR that weakens an enforcement (CSP, forbidden folders, banned APIs, network test) is a **stop
   condition** (`AGENTS.md`: "touches CSP, privacy guards or legal text"). It needs founder approval, and
   the matching wording changes in the same PR.
4. Review this document at TASK-008 (Trust, Privacy and Disclaimer pages) and at every phase change.
