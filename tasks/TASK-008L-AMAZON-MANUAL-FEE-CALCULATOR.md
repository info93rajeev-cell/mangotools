# TASK-008L / PR 5 — Amazon manual fee calculator contract

## Status, lane and size

- Proposed implementation-ready contract; founder review required. This PR implements nothing.
- Type: documentation/contract. Lane: **docs**. Size: **M** (one document, no code).
- Branch: `docs/008l-amazon-tool-contract`. Base: `e9bc70bbfccaf05f9951cbda473fdfd33a38f483`.
- Prerequisites verified on that main: PRs #118, #119, #120, #121, #122 and #123 are merged.
- Canonical financial contract: `tasks/TASK-008L-MANUAL-PROFITABILITY-ENGINE.md`; actual operation:
  `engines/estimate/src/operations/marketplace-manual-profitability/{schema,operation}.ts`.
- Existing `/profit-margin-calculator`, its preset, engine and superseded PR #99 remain untouched.

## Identity and trust

| Property | Locked decision |
|---|---|
| Name | Amazon India Seller Fee & Profit Estimator |
| Tool id / public slug | `amazon-india-seller-fee-profit-estimator` / `/amazon-india-seller-fee-profit-estimator` |
| Preset id / path | `estimate/amazon.manual-profitability` / `presets/estimate/amazon.manual-profitability.yaml` |
| Category / tier / initial version | `business` / T2 / tool and preset `0.1.0` |
| Operation | `estimate.marketplace.manual-profitability@1`, unchanged |
| Archetype / compute / density | B / live / compact, existing calculator workspace |
| Data class / network | `personal` / `none`: arbitrary category/zone labels may contain personal text; sensitivity is not processing location |
| Saved presets | `ui.userPresets: true`, explicit browser-local saves only |
| Params | `rounding: half-up`, locked; no additional rounding controls |
| Capabilities | Existing calculator Copy result and Print; no exports or cross-tool transfer |
| Processing copy | “Processed locally in your browser. Nothing is uploaded.” Verify the device badge and blocked-network flow before publication |
| Saved-preset copy | “Saved in this browser only.” |
| Fee disclosure | “Fees are manually entered/configured estimates and may differ from Amazon's actual charges.” |

Use the existing professional-disclaimer mechanism, not new legal text. No claim of Amazon verification,
official rates, tax advice or actual payout. User-facing strings belong in preset/content string files.

## Architecture decision and prerequisite boundary

Flow: **flat Amazon form state → small Amazon input adapter → canonical engine input → existing worker operation**.
The adapter only shapes values: no formulas, money arithmetic, rates, network, storage, clock or engine changes.
This is smaller than recursive preset mappings, keeps the engine marketplace-neutral and avoids a new
platform language. Generalisation needs a separate decision only after multiple real consumers emerge.
Ownership: **ui lane**, next to the existing bounded invoice/packing special cases, at
`packages/ui/src/toolkit/amazonManualProfitabilityInput.ts`; split by purpose if code-size limits require it.
Selection is by the exact preset id in the UI tool-island integration, never by marketplace logic in runtime.
Do not create Phase-1-deferred `packages/adapters`, or put tool-specific code in `apps/web`, runtime or schemas.
Use existing field/row/preset-manager primitives, not a new archetype or generic mapping framework.
Actual boundary: `buildRequest` strips `uiOnly` and `createToolStore` has no request-preparation callback.
Its `RunFn` receives an already-shaped request, not an atomic form snapshot. Do not recover values through
a mutable store closure or falsely mark Amazon adapter fields as engine-backed to bypass validation.
Before UI implementation, a separate **platform** task must add an optional caller-owned synchronous
request builder to `ToolStoreOptions` in `packages/runtime/src/tool-state.ts`: proposed signature
`prepareRequest?: (preset: ResolvedPreset, values: Readonly<FieldValues>) => Result<ToolRequest>`.
It receives one immutable form snapshot; success contains existing `input`, `params`, `missing`;
failure is an existing typed `OpError`. Default wraps current `buildRequest`; existing tools are unchanged.
Call it once inside compute before execution, retain cancellation/generation guards and sample/reset paths,
and expose preparation errors without stale results. No Amazon imports, registry or conditionals in runtime.
This exported API addition requires a founder-approved ADR under blueprint §2.3 **before coding**;
this document proposes the boundary, does not accept an ADR or edit frozen architecture.
UI/engine imports remain prohibited, including in UI tests. Adapter output is validated by the existing
worker's `executeOperation` using the real input schema and typed semantic validators. A cross-cutting
integration test in `tests/` can import the adapter and operation descriptor to assert schema acceptance
and execute it; do not copy the engine schema, expose a new schema API or relax generator checks.

## Information architecture

A. **Product**: selling price, quantity and cost always visible; optional product/context fields on demand.
B. **Amazon Fees**: compact configure control; five controlled fee groups, each initially Off.
C. **Shipping & Fulfillment**: context, resolved weight and seller-controlled costs.
D. **Returns & Adjustments**: scenario always identifiable; adjustment controls collapsed initially.
E. **Taxes**: product GST, fee GST, TCS/TDS and settlement adjustments, initially collapsed.
F. **Profit & Breakdown**: Estimated profit dominant; settlement and ratios compact; detailed breakdown closed.

Use existing switches/conditional fields and accessible native disclosures in the bounded tool layout;
no tab framework or new group syntax in presets. Sections B–E are closed initially. A successful-sale
calculation needs only selling price and product cost (quantity starts at 1). Explicitly identify “no fees
configured” and “product GST not modelled” near results when applicable; never imply those charges are zero in reality.
Disclosure visibility is presentation only: closing a section must not erase or disable configured charges.
Use 60/40 desktop workspace, touch-safe paired fields and compact rows on mobile; no ordinary internal
form scrolling. Advanced expansion may require page scrolling; supporting content stays collapsed.

## Form decision table

Notation: **E** = canonical engine-backed key; **A** = `uiOnly: true` adapter-owned field;
**C** = `uiOnly: true` context, never included in the request. Blank means empty string, not numeric zero.
Money is a normalised decimal string with at most 2 places; rates 4; resolved weight/bounds 3;
quantity is a string integer 1–10000. No JavaScript floating-point money or automatic rounding of input.
Every enum lists an explicit initial option; do not rely on the platform's first-option fallback.

| UI field / key | Form type | Required? | Default | Engine target | Adapter transform | User-visible? | Notes |
|---|---|---|---|---|---|---|---|
| Selling price per unit / `sellingPricePerUnit` | E money INR | Yes | Blank | Same key | Normalise text only | A | Must exceed zero |
| Quantity / `quantity` | E number | Yes | `1` | Same key | Integer text; do not multiply other amounts | A | Structural starting quantity |
| Product cost per unit / `productCostPerUnit` | E money INR | Yes | Blank | Same key | Normalise text only | A | Zero allowed |
| Promotional discount / `promotionalDiscount` | E money INR | No | Blank | Same key | Omit blank; engine default | A expanded | **Whole-order total**, not per-unit cost |
| Coupon discount / `couponDiscount` | E money INR | No | Blank | Same key | Omit blank; engine default | A expanded | Whole-order total; deducted once |
| Product GST rate / `productGstRatePercent` | E percent | No | Blank | Same key | Omit blank; engine default `0` | E expanded | Blank explicitly means GST not modelled, not exempt |
| Price GST mode / `sellingPriceTaxMode` | E enum | Yes | `gst-inclusive` | Same key | Pass inclusive/exclusive enum | E expanded | Explain tax basis; not a rate assumption |
| Fulfillment / `fulfillmentMethod` | C enum | No | `unselected` | None | Strip | C expanded | `unselected`, Easy Ship, Self Ship, FBA; no automatic fees |
| Category label / `productCategoryLabel` | C text | No | Blank | None | Strip | A expanded | User label, no taxonomy/rate lookup |
| Chargeable weight / `chargeableWeightValue` | A number | Conditional | Blank | `chargeableWeight.value` | Construct object only if entered | C expanded | Required for applicable weight slabs |
| Weight unit / `chargeableWeightUnit` | A enum | Conditional | `kg` | `chargeableWeight.unit` | Same unit copied into each weight slab | C expanded | `g` or `kg`; **no conversion** |
| Zone label / `shippingZoneLabel` | C text | No | Blank | None | Strip | C expanded | No zone pricing logic |
| Amazon fee GST rate / `marketplaceFeeGstRatePercent` | E percent | Conditional | Blank | Same key | Omit blank, never invent a rate | E expanded | Required for applicable taxable fee |
| Scenario / `scenario` | E enum | Yes | `successful-sale` | Same key | Pass exact enum | A | Also `customer-return`, `rto`, `cancellation` |
| Section visibility / `showAmazonFees`, `showShipping`, `showAdjustments`, `showTaxes`, `showProductDetails` | C boolean | No | `false` | None | Strip; never controls charging | Compact controls | Existing switch convention |

Chargeable weight is manually resolved: “Enter the weight you intend to use for fee calculation.”
Do not invoke `logistics.weight.chargeable@1` or add volumetric weight. Changing g/kg changes the declared
unit, **not** the number: require a clear contextual notice to review weight and bounds; no automatic rescaling.

## Marketplace fee mapping

Input is **`feeLines`**, not `marketplaceFees` (the latter is an output array).
Each prefix below names a fixed form group, not a recursive fee-row editor. Exactly five ids in fixed order.

| UI field / prefix | Form type | Required? | Default | Engine target | Adapter transform | User-visible? | Notes |
|---|---|---|---|---|---|---|---|
| Referral / `referral` | A controls below | When mode not Off | Mode `off` | `feeLines[]`, id `referral` | Modes `percent`, `price-slabs` | B expanded | No fixed-only mode; slab rows percentage-only |
| Closing / `closing` | A controls below | When enabled | Mode `off` | id `closing` | Modes `fixed`, `price-slabs` | B expanded | Scope fixed **per-order**; slab rows fixed-only |
| Weight handling / `weightHandling` | A controls below | When enabled | Mode `off` | id `weight-handling` | Modes `fixed`, `weight-slabs` | B expanded | Editable scope; starts `per-order` |
| Pick & pack / `pickPack` | A controls below | When enabled | Mode `off` | id `pick-pack` | Fixed only | B expanded | Editable per-unit/per-order; starts per-order |
| Other service charge / `otherService` | A controls below | When enabled | Mode `off` | id `other-service` | Single fixed total | B expanded | Editable scope; starts per-order; no nested extra fee lists |

For each prefix `p`, exact fields are `pMode`, `pAmount`, `pRatePercent`, `pQuantityScope`,
`pGstTreatment`, `pPriceSlabs`, `pWeightSlabs` **only where its supported modes require them**.
All are A. Mode enum includes `off`; amount/rate blank; GST enum starts `unselected`, then
`none`, `recoverable`, `non-recoverable`. Show only relevant mode fields, GST and applicability controls.
Changing a mode retains inactive form text for later editing but omits inactive keys from engine input.

| Canonical fee key | Ownership and exact mapping |
|---|---|
| `id` | Contract-selected fixed kebab id above; not editable |
| `enabled` | Contract-selected `true` for every emitted line; Off omits the whole line (including incomplete stale values) |
| `mode` | User `pMode`, excluding Off |
| `amount` | User `pAmount`, only fixed mode; blank enabled value produces validation, not an invented zero |
| `ratePercent` | User `pRatePercent`, only percent mode |
| `quantityScope` | Closing fixed/slabs: locked `per-order`; other fixed/weight lines: user choice; omitted for percentage-only referral |
| `percentageBase` | Referral percent/slabs: locked `realized-customer-value`; otherwise omitted |
| `slabPriceBase` | Referral/closing price slabs: locked `entered-unit-selling-price`; otherwise omitted |
| `priceSlabs` | User `pPriceSlabs` rows JSON → ordered primitive objects; only price-slabs mode |
| `weightSlabs` | User `weightHandlingWeightSlabs` rows JSON → objects with the selected weight unit duplicated per row; only weight-slabs |
| `gstTreatment` | Explicit user choice; `unselected` blocks an enabled fee, never falls back to recoverable/none |
| `scenarios` | User applicability switches described below; explicitly emitted, no engine-default dependence |

The referral base is the **whole-order value after seller-funded discounts**, before any GST-exclusive
addition; it is not always tax-exclusive revenue or invoice value. Make this locked tool choice visible
in concise help. It is a manual modelling basis, not an assertion about Amazon policy.
Closing/referral slab matching uses entered **unit** selling price, before discounts, independently of quantity.

### Slab fields and limits

Each `pPriceSlabs`: A `kind: rows`, minRows 0, maxRows 20, initially empty.
Columns: optional `min`/`max` money; required `chargeMode` enum (only `percent` for referral, only `fixed`
for closing); required `value` decimal text (percent precision for referral, money for closing).
The singleton charge-mode choice is structural, visible in the table heading; it is not a fee default.
Use a percent `value` column for referral and money `value` for closing; no mixed-mode row ambiguity.
`weightHandlingWeightSlabs`: A rows, minRows 0, maxRows 20; optional `min`/`max` number, required
`amount` money. No row-level unit control; use `chargeableWeightUnit` for the entire line and weight.

Blank bounds are omitted. Preserve strings and row order. Match **min < price/weight <= max**.
Either bound may be open, both absent invalid; reversed/overlapping bounds invalid; gaps allowed but
an applicable no-match returns the engine error. Enabled slab mode requires at least one complete row.
Use existing row codec but do not let malformed JSON or partially entered rows disappear as an empty list.
Map engine paths such as `feeLines.1.priceSlabs.0.value` back to prefix/row cells using emitted-id order.
No unlimited or “per additional 500 g” formula: only finite manually configured intervals are supported.

### Applicability and fee GST

For every fee/cost/withholding/scoped settlement prefix `p`, four A boolean fields:
`pApplySale`, `pApplyReturn`, `pApplyRto`, `pApplyCancellation`. Defaults true/false/false/false;
emit selected enums in that order without duplicates. At least one required for an emitted item.
These are advanced controls using existing switches; no JSON scenario editor or new multi-select schema.
Fees remain off until mode selected and fully configured; no numeric fee default, including fee GST.
Recoverable fee GST reduces settlement only; non-recoverable fee GST also reduces profit; none charges
no fee GST. A collapsed section never implies recoverability or exempts an enabled fee from validation.

## Seller-controlled cost mapping

| UI field / key | Form type | Required? | Default | Engine target | Adapter transform | User-visible? | Notes |
|---|---|---|---|---|---|---|---|
| Packaging / `packagingAmount` | A money | No | Blank | `packagingCost` | `{amount, scenarios}` | C expanded | Applicability prefix `packaging` |
| Seller-paid shipping / `sellerShippingAmount` | A money | No | Blank | `sellerShippingCost` | Same | C expanded | Prefix `sellerShipping`; not auto-copied to Amazon weight fee |
| Advertising / `advertisingAmount` | A money | No | Blank | `advertisingCost` | Same | C expanded | Prefix `advertising` |
| Other transaction cost / `otherTransactionAmount` | A money | No | Blank | `otherTransactionCost` | Same | C expanded | Prefix `otherTransaction` |

These are **whole-order economic costs**, not per-unit values and not automatic Amazon settlement
deductions. Omit blank; explicit zero is valid; never multiply by quantity in the adapter. Configure
a settlement-only line explicitly if a separate cash deduction is intended. Show concise guidance not
to enter the same shipping charge in both an Amazon fee and seller cost. No non-success defaults.

## Settlement / tax mapping

| UI field / prefix | Form type | Required? | Default | Engine target | Adapter transform | User-visible? | Notes |
|---|---|---|---|---|---|---|---|
| TCS / `tcs` | A enum + decimal | Conditional | Mode `off`; value blank | `tcs` | `{mode,value,percentageBase?,scenarios}` | E expanded | Fields `tcsMode`, `tcsValue`, `tcsPercentageBase` |
| TDS / `tds` | A enum + decimal | Conditional | Mode `off`; value blank | `tds` | Same | E expanded | Analogous `tds*` fields |
| Other deductions / `otherSettlementAmount` | A money | No | Blank | `otherSettlementDeductions` | `{amount,scenarios}` | E expanded | Applicability prefix `otherSettlement` |
| Settlement credits / `settlementCreditAmount` | A money | No | Blank | `settlementCredits` | Same | E expanded | Prefix `settlementCredit` |

TCS/TDS modes Off/fixed/percent. Fixed value is whole-order money; percent value a rate. Percentage
base starts `unselected` and requires explicit `tax-exclusive-revenue` or `customer-invoice-value`;
omit base in fixed mode. Off omits object. Scenarios use the four switches above. No tax-law rates,
thresholds or automatic applicability; all four lines affect settlement **only**, not economic profit.

## Scenario adjustment mapping

Five controlled groups, no arbitrary nested adjustments. Amount blank omits the group; positive amount
required to activate. No negative direction encoding. Advanced applicability fields `pApplyReturn`,
`pApplyRto`, `pApplyCancellation` start false; require at least one explicit selection, never infer it
from the selected scenario. No successful-sale applicability control for these adjustments.

| UI field / prefix | Form type | Required? | Default | Engine target | Adapter transform | User-visible? | Notes |
|---|---|---|---|---|---|---|---|
| Return charge / `returnCharge` | A money + enums/switches | If entered | Blank amount; effects unselected | `scenarioAdjustments[]`, id `return-charge` | Fixed direction `charge` | D expanded | User chooses effect |
| Reverse logistics / `reverseLogistics` | A money + enums/switches | If entered | Same | id `reverse-logistics` | Fixed `charge` | D expanded | Do not duplicate weight-handling fee |
| Reimbursement / `reimbursement` | A money + enums/switches | If entered | Same | id `reimbursement` | Fixed `credit` | D expanded | User chooses effect; not automatically inventory recovery |
| Inventory write-off / `inventoryWriteOff` | A money + switches | If entered | Blank amount | id `inventory-write-off` | Fixed `charge`, economic true, settlement false | D expanded | Explicit lost/damaged stock cost, not automatic product cost |
| Other adjustment / `otherAdjustment` | A money + enums/switches | If entered | Blank; direction/effects unselected | id `other-adjustment` | Explicit charge/credit and effects | D expanded | No signed money |

Exact common keys `pAmount`, `pEffects`; only Other has `otherAdjustmentDirection`.
`pEffects` is `unselected`/`economic`/`settlement`/`both`, except inventory has no effects selector.
Emit `economic`/`settlement` booleans accordingly and `scenarios` from selected switches; no effect false/false.
On non-success outcomes the existing engine recognises zero revenue, product cost and product GST;
costs/fees apply only if explicitly configured, and inventory loss must be entered separately.

## Output contract

Never recalculate outputs in the adapter or UI. Money uses existing INR two-place/Indian-grouping
presentation; ratios retain the engine's two-place strings. Keep negative profit/settlement visible.

| Priority / label | Exact output key |
|---|---|
| Primary: Estimated profit | `economicProfit` |
| Prominent secondary: **Estimated Amazon settlement** | `estimatedSettlement` |
| Compact: Profit margin / ROI / Break-even selling price / Effective marketplace fee % | `profitMarginPercent` / `roiPercent` / `breakEvenSellingPrice` / `effectiveMarketplaceFeePercent` |
| Breakdown: Gross customer value / Discounts / After discounts / Customer invoice | `grossCustomerValue` / `sellerFundedReduction` / `realizedCustomerValue` / `customerInvoiceValue` |
| Tax-exclusive revenue / Product GST / Recognized product GST liability | `taxExclusiveRevenue` / `orderProductGstAmount` / `productGstLiabilityRecognised` |
| Recognized revenue / Recognized product cost / Economic investment | `revenueRecognised` / `productCostRecognised` / `totalEconomicInvestment` |
| Amazon fees / Fee GST / Recoverable GST credit / Non-recoverable fee GST | `marketplaceFeesTotal` / `marketplaceFeeGstTotal` / `recoverableMarketplaceFeeGst` / `nonRecoverableMarketplaceFeeGst` |
| Seller-controlled costs / TCS / TDS | `sellerControlledCostsTotal` / `tcsAmount` / `tdsAmount` |
| Other deductions / Settlement credits / Total settlement deductions | `otherSettlementDeductionsApplied` / `settlementCreditsApplied` / `totalSettlementDeductions` |
| Scenario economic costs/credits and settlement deductions/credits | `scenarioEconomicCosts` / `scenarioEconomicCredits` / `scenarioSettlementDeductions` / `scenarioSettlementCredits` |
| Per-fee details / Show calculation | `marketplaceFees` / `working` |

Profit measures economic performance; settlement estimates cash deductions/credits and is **not** profit
or actual Amazon payout. A credit for recoverable GST is not automatically cash paid in this settlement.
Render `marketplaceFees` as a bounded tool-specific table, not a fabricated scalar preset output.
Break-even null uses `ESTIMATE_BREAK_EVEN_NOT_DETERMINABLE` warning reason: `scenario` → unavailable
for non-success outcome; `price-slabs` → unavailable with applicable price slabs; `no-positive-solution`
→ no positive solution. Show “Not determinable” plus reason, never ₹0. Null ratios show unavailable
with the existing margin/ROI/effective-fee warning, not zero. Breakdown, Show calculation, Important notes,
Disclaimer, How to use, Method, Worked example, FAQ, Related tools and References are closed initially.

## State, defaults and validation

Persist only existing flat `FieldValues`: product fields, context, fee modes/values, row JSON, GST,
costs, applicability and presentation controls. Existing per-tool saved-preset limits apply (20 presets,
60-character name, 16000-character serialized value limit); surface limits instead of truncating slabs.
No computed outputs, warnings, errors or working steps are saved. Reset restores defaults, not saved-list deletion.
Restore validates allowed keys/types, then adapter and engine validation on calculation; tampering never bypasses them.
Keep engine-backed `sample.input` canonical and strict. Adapter fields in `sample.uiState` are declared
uiOnly and represented as strings/booleans; rows use JSON strings, not new nested sample metadata.
Basic sample can use only canonical scalar input; advanced samples must test parity between canonical
input and adapter output from their uiState. Never pass context or uiState keys to the worker.

Defaults are only those explicitly listed above: quantity 1; success; inclusive mode; weight unit kg;
fees/withholdings Off; other monetary inputs blank; no slabs; applicability success-only for ordinary
items and none for adjustments; GST/direction/effects unselected where required; advanced sections closed.
Blank optional discounts/product GST rely on existing engine neutral defaults, not marketplace rates.
Unknown enums, malformed row JSON, unsupported keys and missing enabled configuration show deterministic
field errors; semantic bounds, overlaps, precision and financial validation remain canonical typed engine
errors. Reuse existing Result/error conventions, no new public error catalogue. Map paths to visible
fields and reveal the relevant closed section for correction without changing charging applicability.

## Later implementation acceptance and sequence

Focused adapter tests: basic success; referral percent; closing fixed and price slabs; referral slabs;
weight slabs/units; pick-pack; other fee; recoverable/non-recoverable fee GST; fulfillment/category/zone
labels inert; return/RTO/cancellation; reimbursement and inventory write-off; TCS/TDS both modes/bases;
discounts and quantity >1; blank/off fee omitted, enabled incomplete fee rejected; no double-count shipping;
no invented rates; slab bounds/overlap/no-match; applicability; exact canonical request snapshot and schema
acceptance plus operation execution. Saved-preset round-trip includes slab JSON and applicability;
sample/reset and rapidly changing fields prove atomic requests and no stale result. Preserve generic tools.
Browser acceptance: basic/advanced keyboard flow, local storage denied/corrupt/limited, fresh populated
1366×768 and 360×800 evidence, no horizontal overflow, accurate null/warning displays and no user-input
network requests. Repository-required verify/build/E2E/a11y and architecture must pass before publication.
Tool fixtures cite hand-verified TASK-008L arithmetic, at least two T2 fixtures; no historical fixture edits.

Smallest legal remaining sequence (separate tasks/branches, each S/M; split if code exceeds M):
1. **PR 6A0 — docs:** founder-reviewed ADR for the optional runtime callback and bounded UI adapter exception.
2. **PR 6A1 — platform:** callback, focused atomic/default/error tests; no Amazon mapping or tool files.
3. **PR 6A2 — ui:** pure Amazon adapter, bounded grouped layout/error/result integration using shared
   primitives, UI tests; operation runs through runtime only. No public tool data or engine edits.
4. **PR 6B — tools:** scaffold with `pnpm new:tool`; preset/manifest/content/strings/hand-verified fixtures;
   opt in to user presets and the completed UI integration. No UI/runtime changes.
5. **PR 6C — platform tests:** `tests/` adapter-to-real-operation integration, browser/network/a11y evidence;
   UI corrections, if found, return to a separate ui-lane PR before founder approval. Do not publish unverified.

No financial founder questions remain; contract and ADR acceptance are required approvals, not permission
to implement in this docs PR. Public-contract implementation must stop until that ADR is accepted.

## Explicitly deferred

TASK-008J reference data stays separate: no autofill or official numeric fee population. No Amazon API,
Seller Central login/credentials, scraping, sync/live refresh, marketplace/HSN/GST databases, URLs/product
lookup, settlement import, bulk ASIN, CSV/PDF export, operation composition/volumetric calculation,
cloud presets, recursive nested mappings, generic adapter scripting, dependencies or engine changes.
No edits to existing Seller Profitability, PR #99, other tools, Civil, Logistics or Rebar.
