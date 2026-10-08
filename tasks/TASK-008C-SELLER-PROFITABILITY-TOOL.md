# TASK-008C — Seller Profitability Tool Foundation

## Lane

tools

## Size

M

## Goal

Upgrade the existing Profit Margin Calculator into a Seller Profitability Calculator using the
already-merged operation:

`estimate.seller.profitability@1`

Preserve the simple offline cost/selling-price workflow while adding optional seller-cost and
settlement inputs.

This task is only the local deterministic Phase-1 tool/preset layer.

## In scope

- new preset for `estimate.seller.profitability@1`
- update the existing `profit-margin-calculator` manifest to use it
- tool copy/content needed for the revised calculator
- compact 60/40 generated UI using existing platform capabilities
- local deterministic calculation
- progressive disclosure using existing supported preset/UI patterns
- source/status explanatory copy where static/manual values are entered
- tests and screenshots

## Out of scope

Do not implement:

- product URL import
- marketplace scraping
- network access
- live fee refresh
- Amazon fee database
- Flipkart fee database
- Meesho fee database
- Myntra fee database
- seller account integrations
- HSN/GST lookup database
- source-provenance backend
- adapters
- authentication
- Firebase
- storage
- new dependencies
- custom web-app code
- engine changes

Future tasks will add marketplace data/import capabilities separately.

## Tool identity

Existing slug remains:

`profit-margin-calculator`

Recommended visible name:

Seller Profitability Calculator

Short name:

Seller Profitability

The calculator must still support the simple user who only wants:

- Product cost
- Selling price

and immediate:

- Profit
- Margin
- Markup

Do not force marketplace complexity on that user.

## Preset

Create a new preset based on:

`estimate.seller.profitability@1`

Recommended preset id:

`estimate/seller.profitability`

Use only fields supported by the approved operation.

## Core inputs

Required visible core:

- Selling price
- Product cost

Optional/progressive fields:

- Marketplace fees
- Shipping/logistics
- Seller expenses
- Expected return/RTO cost
- Non-recoverable tax cost
- Settlement-only deductions

All optional fields default to zero.

## Field meaning

Marketplace fees:

Already-resolved marketplace economic fees entered by the user.

Shipping/logistics:

Forward or other shipping/logistics economic cost.

Seller expenses:

Packaging, ads, labour, rent allocation, and custom seller operating expenses already combined by
the user at this Phase-1 stage.

Expected return/RTO cost:

Probability-adjusted expected cost already resolved by the user.

Non-recoverable tax cost:

Tax/service-tax amount that is genuinely an economic cost.

Settlement-only deductions:

Cash-flow deductions such as TCS/TDS or other recoverable/creditable settlement deductions.

Explicitly explain:

Settlement-only deductions reduce expected cash payout, but do not reduce economic profit.

## Outputs

Primary result:

- Economic profit

Secondary:

- Cash settlement/payout
- Profit margin
- Markup
- Total economic cost
- Total settlement deductions

The UI must clearly distinguish profit from cash settlement.

## Progressive disclosure

Initial/default view:

- Selling price
- Product cost
- Primary result

Advanced seller-cost fields should be collapsed or progressively disclosed using existing supported
UI patterns.

Do not expose all fields at once.

Suggested grouping:

- Core
- Seller/marketplace costs
- Settlement deductions

Do not invent unsupported custom controls.

## UI

Use the existing approved compact 60/40 workspace.

Desktop:

- At 1366×768, keep the core workflow and primary result visible without required page scroll where
  practical.

Mobile:

- Test at 360×800.
- Normal vertical scrolling is allowed.
- There must be zero horizontal overflow.

No custom app-specific UI code unless existing repository patterns explicitly support it.

## Content and disclaimers

Explain briefly:

- Economic profit is selling price minus economic costs.
- Cash settlement is selling proceeds minus marketplace, logistics, and settlement deductions.
- TCS/TDS-style settlement deductions are not automatically business expenses.
- Marketplace fee rates vary by platform, category, seller agreement, and time.
- At this Phase-1 stage, rates are manually entered.

Do not claim live marketplace rates.

## Version

Target existing tool version:

`0.3.0`

New preset:

`0.1.0`, or the repository-standard initial version if the playbook requires another value.

Do not invent version rules; follow repository convention.

## Test and acceptance coverage

The later implementation must cover:

1. simple cost + selling price
2. marketplace fee input
3. shipping/logistics
4. seller expense
5. expected return/RTO cost
6. non-recoverable tax
7. settlement-only deduction
8. economic profit
9. cash settlement
10. margin
11. markup
12. zero product-cost handling
13. 1366×768
14. 360×800
15. accessibility
16. `pnpm verify`
17. architecture

Do not create a redundant test matrix.

## PR #99

PR #99 is an older compact Profit Margin implementation.

Do not modify or merge it as part of this contract task.

The later implementation task should explicitly decide whether PR #99 is superseded and should be
closed.

## Acceptance criteria

- Contract clearly authorizes the preset and existing-tool migration.
- Uses `estimate.seller.profitability@1` only.
- No engine changes.
- No network.
- No marketplace-specific fee knowledge.
- Simple offline workflow remains easy.
- Economic profit and cash settlement are visibly distinct.
- Tool remains browser-local.
- One lane only.
- No dependency changes.
