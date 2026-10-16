# TASK-008L PR 6C — final production integration evidence

Issue: [#148](https://github.com/info93rajeev-cell/mangotools/issues/148).
Base: `71b8c6bd4f2fd4f9f75cd7f7b65c1267fb71f186`; branch:
`test/008l-amazon-production-evidence-v2`. Tested 2026-10-16.
The base contains merged PRs #143, #145 and #147. No dirty founder checkout was used.
The previous evidence attempt was consulted only as a reference, not used as the base.

## Scope and method

Production path: `/amazon-india-seller-fee-profit-estimator`;
preset: `estimate/amazon.manual-profitability`;
operation: `estimate.marketplace.manual-profitability@1`.

Zero production source, financial fixture, preset, engine, runtime, schema or dependency changes.
Four new test modules extend existing production, hydration, header, network, SEO and axe tests.
One existing header test now awaits removal of the mobile search panel after Escape, before
checking restored focus. This is a real UI-settling signal, not a delay or weaker assertion.
Changed code totals 399 lines including tests; this static report and three PNGs are evidence.

Tests observe actual worker run messages, without mocking the worker or adapter. Canonical
requests must exactly match the real adapter's preparation from independently recorded entered
values. The real exported operation executes that request; displayed financial outputs and fee
table amounts must match its exact decimal-string output. Basic/manual-fee cases also match
unchanged, hand-verified production fixtures 001 and 002. No duplicated UI financial arithmetic.

## First gates: previously fixed blockers

Before adding the new suite, fresh-main canonical browser validation passed 3/3:
the saved-preset reload regression, Amazon 320px header and GST 320px header.

PR #145 coverage proves save, reload, enabled selector, exactly one saved entry, select/load,
exact restoration and recalculation, reset without deletion, persistence after another reload,
empty cookies and no manager on the non-opted-in GST tool. New evidence additionally saves
slab state, resets/loads it, checks exact worker-request/output restoration and unchanged saved
JSON, and inspects every request during this flow.

PR #147 coverage checks zero overflow, visible brand, Tools/search/theme, non-overlap, focus
outline room, mobile-search close/focus restoration and keyboard Tools operation. An extended
run exposed a test race: native dialog focus restoration can precede the queued close handler.
Waiting for the panel's combobox to be removed observes completed UI cleanup before Tools use.
The CSS-id locator checks actual DOM removal even while the native dialog is hidden; a role
locator alone would exclude hidden descendants too early.
No header, dialog or calculator production behavior was changed.

## Calculations

| Case | Exact evidence |
| --- | --- |
| Basic: price 1000, cost 400, quantity 1 | Profit ₹600.00; settlement ₹1,000.00; margin 60.00%; ROI 150.00%; break-even ₹400.00; effective fee 0.00%. Both configuration notices shown. |
| Manual fees: referral 7%, closing 10, packaging 5, fixed TCS 2 | Fees ₹80.00; seller costs ₹5.00; profit ₹515.00; settlement ₹918.00; margin 51.50%; ROI 106.19%; effective fee 8.00%; break-even ₹446.24. Referral and closing rows visible. |
| Product GST | Inclusive/exclusive 12% requests and displayed outputs match the operation; blank is not modelled; explicit zero is configured. |
| Fee GST | Blank rate remains blank and removes stale results when a tax treatment requires a rate; no implicit 18%. At 5% closing-fee GST, recoverable credit ₹0.50 leaves profit ₹515.00; non-recoverable cost ₹0.50 gives ₹514.50. Settlement is unchanged between those treatments. |
| TCS/TDS | Both fixed and percentage modes use explicit values and selected invoice/revenue bases. Displayed deductions/settlement match the real operation; economic profit is unchanged. No rate is prefilled. |
| Return / RTO / cancellation | Each uses all five explicit adjustment types. Revenue, product cost, GST recognition and sale-only fees/costs are zero; profit −₹45.00, settlement ₹10.00. Write-off is economic-only; reimbursement is settlement-only. Switching back to sale gives zero scenario effects. |
| Referral / closing slabs | Two rows; upper endpoint inclusive, lower endpoint exclusive. Matched index 0 then 1 and rendered fee amounts match operation output. |
| Weight slabs | Entered weight selects the correct interval; changing kg to g preserves numeric weight and slab bounds. No volumetric or automatic unit conversion. |
| Collapse | Discount, product/fee GST, tax mode, fees, seller cost and adjustment configured. Closing all five sections changes neither exact canonical request nor exact result; reopening retains entered values. |
| Break-even unavailable | Real browser shows “Not determinable for this scenario” and “Not determinable with price-slab fees”, not raw null/undefined. |

Canonical referral/closing/weight slab errors reveal the owning section and focus the exact
invalid cell. Tax, weight and adjustment errors reveal only their owning section and preserve
the invalid entered value. Invalid edits remove stale primary results. A settled single price
or cost edit emits exactly one additional run request.

## Accessibility and responsive evidence

Existing axe coverage is reused, not duplicated. Supplemental actual-browser axe scans on the
Amazon production page in light/dark themes, initial/populated states, found **zero violations**:
critical 0, serious 0, moderate 0, minor 0 in each of four scans.

Keyboard evidence covers main-field Tab order, native select ArrowDown, section switches via
Space, row Add/Remove via Enter and resulting focus, error reveal/focus, saved-preset controls,
and result disclosures via Enter. This production preset has no segmented/radio controls;
its choice controls are native selects and switches. Existing 320px header coverage includes
keyboard Tools/search and focus restoration.

Populated Amazon layouts at 320, 390 and 1366px have **0px horizontal document overflow**.
Product Details and Amazon Fees are initially open. Rows/results/saved controls remain usable.
Normal vertical scrolling is expected for this substantial manual configuration form.
Supporting information remains collapsed until deliberately opened.

Fresh, visually inspected full-page screenshots:

- [320px](screenshots/amazon-final-320.png)
- [390px](screenshots/amazon-final-390.png)
- [1366px](screenshots/amazon-final-1366.png)

Existing production/header screenshot files are not refreshed unnecessarily.

## Privacy and runtime safety

Every request is checked throughout valid fee/tax/scenario/slab/price/cost edits and preset
save/load flows: same origin, GET only, no query and no body, restricted to the actual built
asset names, production page and theme-init script. Blob/data resources are local only.
The supplemental light/dark interaction audits each inspected 33 requests, all allowed static
GETs. An analytics JavaScript asset loading is not an analytics submission; no submission or
financial/preset payload was observed. No Amazon API, external calculation API, server form
submit or preset sync. No financial data uploaded. No page console messages or exceptions.
Existing CSP/network tests supply additional production security coverage.

Observed local-storage keys: `mt.recent` and `mt.toolPresets`; no new key. Theme preference is
the pre-existing `mt.theme` key only when a user changes theme. No cookie required or created
by the calculation/preset flows. Synthetic test values only; no personal seller data used.

## SEO and trust

Actual local production server responds HTTP 200. Title:
“Amazon India Seller Fee Calculator – Profit & Settlement”. Meta description:
“Estimate Amazon India seller profit and settlement using your own fees, costs, GST and return
adjustments. Browser-local calculation; no fee lookup.”
Canonical: `https://beyondtheai.com/amazon-india-seller-fee-profit-estimator`.
Sitemap includes the route and `/business` links the tool. Existing SEO tests validate real
WebApplication JSON-LD and FAQ JSON-LD against human-facing FAQ content.

The visible device badge exposes “Processed locally in your browser. Nothing is uploaded.”
through its title and accessible text; the same full line is available in How to use.
Saved-preset local-only copy is visible. Opening How to use exposes the manual-estimate
disclaimer and explicit absence of automatic fee lookup. No claim of official/live fee rates,
and no MangoTools/MangoPie public branding leak found. No legal/content edits made.

## Validation and environment

- `pnpm verify`: 84 test files / 1,852 tests passed; lint, generation and typechecks passed.
- Focused UI/runtime/production/preset unit suites: 28 files / 262 tests passed.
- Architecture: 506 source files, zero violations. Existing untouched ToolIsland length warning.
- `pnpm gen`: 32 tools, 39 presets, seven visible categories, 56 generated files; none committed.
- Development `pnpm build`: 48 pages, post-build checks passed.
- Production `pnpm build:deploy`: 45 pages, deployment checks passed.
- Full existing accessibility/SEO projects: 259/259 passed locally (179 a11y, 80 SEO).
- Focused final production/browser/network/layout/privacy suite: 28/28 passed locally.
- Amazon/GST 320px header repetition: 10/10 passed (five independent runs per tool).
- Final browser and cross-browser CI results will be recorded in the PR discussion after publication.

Local Chromium evidence uses installed Chrome via the repository's supported PW_CHROMIUM_PATH
override. Long Windows interaction tracing encountered context-teardown stalls; diagnostic runs
used the CLI `--trace=off` only. No timeout/retry/trace configuration was changed in the repo.
Firefox/WebKit and managed Chromium executables are unavailable locally; the browser installer
download stalled during extraction. These local cases are ENVIRONMENT BLOCKED, not product
failures. Formal supported-browser results must come from CI-provisioned runtimes, with normal
repository tracing/configuration unchanged.

One overlapping local test invocation lost its shared static server when the owning invocation
ended; that environment-only attempt was stopped and the suites rerun serially. It is not counted
as a successful test run. Initial evidence locator/focus assumptions were corrected without
weakening financial equality, skipping tests or changing production code.

No new product defect requiring a production change has been found. Do not merge automatically.
