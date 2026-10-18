# Future Ideas Backlog — Working Idea Book

**Status:** Working future-ideas/backlog document. Last updated: 2026-10-18.

This is not architecture authority, a replacement roadmap, or an implementation queue.
The protected [product architecture](../architecture/product-architecture.md), including its
[future roadmap](../architecture/product-architecture.md#10-future-roadmap), remains the source of
truth. This document does not rewrite that roadmap or override repository rules, merged contracts
or founder approval gates. Each future implementation needs its own approved, bounded task.

## Opportunity, Tender & Form Intelligence Ecosystem

**Status:** Approved future direction; supporting research completed. **Not Phase-1 implementation.**
Do not start until the current MangoTools launch milestone is complete and implementation is
separately authorized. The research conclusions are GO for form/compliance, the dual-product split
and competitor/tender intelligence; opportunity-to-readiness/follow-up is GO with guided submission,
not autonomous final submission. This does not approve specific APIs, dependencies or integrations.

- **MangoTools — stateless public utilities:** open → upload/paste → analyze/prepare → download →
  leave, with no permanent account required for the core utility. Future candidates include Smart
  Form Filler, Government Form Readiness Checker, Tender Analyzer, Tender Eligibility Checker,
  Competitor Analyzer, Bid/No-Bid Analyzer, Tender Compliance Matrix, Tender Document Checklist,
  Document Conflict Checker, photo/signature/document preparation and CSB-V/export-bank helpers.
- **FixAndGrowth — persistent recurring workspace:** Business Profile → Business Capability Graph →
  Product Catalogue → Document Vault → Opportunity Finder/Fit → Competitor/Tender Intelligence →
  Bid/No-Bid → Tender Readiness → Missing Document Resolution → Guided Submission Handoff →
  Post-Submission Tracking → Outcome Learning → Growth Gap Analyzer. Future recurring value includes
  an Opportunity Inbox, matching, document-expiry monitoring, competitor watch, buyer intelligence,
  price history, bid pipeline, corrigenda/clarification alerts and business-readiness tracking.
- **Shared-engine concept:** reuse future forms, documents, tender, competitor, opportunity/match
  and profile/data capabilities rather than duplicate logic. MangoTools consumes them statelessly;
  FixAndGrowth adds persistence, encrypted business/document vaults, history, monitoring, recurring
  alerts and lifecycle orchestration. These are concepts, not new package or schema contracts.
- **Capacity-based fit:** consider products/specifications, manufacturer/trader/OEM status, turnover,
  EMD/PBG capacity, working capital, order-value range, geography/logistics, lead time, certifications,
  experience, service capability and margin floor—not keywords alone. Intended decisions are BID,
  BID WITH CONDITIONS, SKIP and INSUFFICIENT DATA; missing evidence must not imply eligibility.
- **Future MVP:** Business Profile + Document Vault + user-supplied tender URL/PDF → Opportunity Fit,
  Eligibility, Technical Match, Competitor Intelligence, Bid/No-Bid, Missing Documents, Tender
  Readiness and Bid Dossier. Nationwide scraping is not Day 1; feeds/aggregation come later.
- **Human-controlled submission:** Tender Ready → Review & Submit → guided/browser-assisted handoff.
  Do not promise universal autonomous submission. CAPTCHA, OTP, DSC, payments, legal declarations
  and final irreversible submission remain human-controlled. Future integrations need separate review.

### Research references

Detailed studies remain external and unchanged; do not duplicate them here. These founder-provided
local paths are not repository-hosted downloads and may not be available on another machine.

- Form/compliance feasibility: `E:\Research Doc\Form_and_Compliance_Completion_Engine_Feasibility_Study.md`
- Product split/shared-engine direction: `E:\Research Doc\MangoTools_FixAndGrowth_Ecosystem_Study.md`
- Opportunity/tender workflow: `E:\Research Doc\FixAndGrowth_Tender_Opportunity_Feasibility_Study.md`
- Launch boundary: `E:\Research Doc\MangoTools_Phase1_Launch_Freeze_Study.md`

The studies' historical tool counts, operation names, market and regulatory claims are not revalidated
by this entry. Use current registry/merged contracts for repository status and perform appropriate
source, privacy, security and legal review when a future task is authorized. No launch scope is added.
