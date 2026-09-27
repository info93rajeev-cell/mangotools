# TASK-009A — Export & Import Documents Foundation Planner

> **Planning document only. No app code has been written, no schema, engine, preset, manifest or content
> file has been created, no dependency added, no new category or tool implemented, and no existing tool
> has been touched.** This plans a new future section — **Export & Import Documents** — aimed at repeat
> exporters (retail exporters, ecommerce exporters, small business exporters, MSMEs), building on the
> plan → PR → PR → report lifecycle this project has used since TASK-002. Implementation does not start
> in this task; it starts, at the earliest, in TASK-009B, and only after the founder approves the
> decisions this planner proposes.

## Research method and a disclosed limitation

This planner is based on live web research done at the time of writing (September 2026), primarily via
web search, because this session's network egress is restricted to a proxy that **blocked direct fetches
of several official domains** attempted during research, including `indiapost.gov.in`, `dgft.gov.in`, and
`courier.cbic.gov.in`, as well as a law-firm summary site. Where a primary government page or PDF could
not be fetched directly, this planner relies on **search-engine summaries of secondary sources**
(tax/trade-compliance advisory sites, legal-update trackers, and one Indian public-broadcaster news
article) that themselves describe or quote the underlying CBIC/DGFT/RBI notifications and circulars, with
the notification/circular numbers cited wherever the secondary source names them. This is disclosed
plainly here and flagged again at each point in §4 and §7–§10 where a claim rests only on such secondary
sourcing rather than a primary text this session directly verified. **No official form field, exact form
name, or figure in this document should be treated as final** — see the Compliance Boundary below and
§7's own field-by-field caveat.

## Compliance boundary (applies to the whole future section, not just this document)

**This section helps users prepare documents and maintain records. It does not file documents with
Customs, India Post, DGFT, ICEGATE, DNK, ECCS, banks, or any government portal. Users must verify final
documents with the official portal, India Post, courier, customs broker, CA, bank, or relevant authority
before shipping or filing.**

The future section, and every tool in it, must avoid these claims:
- "customs-compliant" (guaranteed)
- "government-approved format"
- "guaranteed clearance"
- "automatic filing"
- legal advice
- tax advice
- bank/FEMA compliance guaranteed

The future section, and every tool in it, should use this wording instead:
- "document preparation helper"
- "field checklist"
- "invoice generator"
- "packing list generator"
- "shipment record helper"
- "verify before filing/shipping"

---

# 1. Summary

Export & Import Documents is a **new planned section**, not yet built. It is suited to **repeat users**,
not one-time users: an exporter who ships every week needs the same invoice, packing list, and buyer
record again and again, unlike a one-time GST or unit calculation. It should **start with export document
preparation and records** — commercial invoice first, packing list second — rather than with import tools
or with postal/courier filing integrations, because export documentation is the smallest, most
universally-needed unit of the workflow and does not require picking a single logistics route (postal vs.
courier vs. cargo) before it is useful.

This must be **planner-first** because export documentation touches official government workflows (Postal
Bill of Export, Courier Shipping Bill, GST/LUT, IEC, AD code, FEMA export realisation) where getting field
names, scope claims, or the compliance boundary wrong is a materially worse failure than a wrong unit
conversion in a civil calculator — it could mislead a small exporter about what has and has not been
filed with customs. **No implementation starts in this task.** TASK-009A produces only this document.

# 2. Current platform status and deferred journey

**Current platform status (confirmed after PR #60 merged into `main`, verified by running `pnpm gen` on a
fresh `main` checkout for this task):**
- Visible tools: **29**
- Visible categories: **6**
- Presets: **29**

Category counts as given in this task's brief (Civil & Construction membership independently re-confirmed
against `main`: Concrete Quantity Calculator, Excavation Calculator, Brickwork Calculator, Plaster
Calculator, Tile / Flooring Calculator, Paint Calculator — 6 tools, matching the brief exactly):

| Category | Tools |
|---|---|
| Developer & Data | 6 |
| Business & Finance | 3 |
| Logistics | 4 |
| PDF & Documents | 3 |
| Image & Media | 7 |
| Civil & Construction | 6 |

## Deferred journey items — recorded, not started

These are **recorded here for future completion**. None of them are started, planned in detail, or
implemented in TASK-009A. They remain part of the project's journey and should not be lost between
sessions.

**Civil future:**
- Rebar Weight Calculator
- Formwork / Shuttering Calculator
- Cement Sand Aggregate Calculator
- Civil ecosystem planner later
- Survey Leveling / Rise & Fall
- Bowditch Traverse Adjustment
- BOQ / PDF / Excel exports later

**PDF future:**
- PDF to JPG remains blocked until PDF renderer dependency approval
- PDF to PNG later
- PDF Compress / Rotate / Metadata Remover later

**Developer/Data future:**
- Regex Tester
- JWT Decoder
- Hash Generator
- Text Diff Checker

**Media future:**
- only search-worthy tools
- no AI video ever
- no server-side video now
- paid server-side video only uncertain/future

**Business future:**
- Fix & Growth is not now
- subscription/power-user limits later

# 3. Why Export & Import Documents is valuable

The tools shipped so far (civil calculators, logistics calculators, PDF utilities, image utilities,
developer/data converters) are each typically used **once per task**: a user computes a concrete volume,
converts one file, and leaves. Export & Import Documents is structurally different — the same exporter
needs the platform **repeatedly**, because:

- Exporters repeatedly create **invoices** — one per shipment or per order, often several a week for an
  active small exporter.
- Exporters repeatedly create **packing lists** — one per invoice/shipment, referencing the same product
  data.
- Exporters repeatedly reuse **product records** (the same SKUs, HSN codes, descriptions, unit prices,
  and countries of origin, shipment after shipment).
- Exporters repeatedly reuse **buyer/consignee records** (the same handful of overseas buyers, order
  after order).
- Exporters need a running **shipment record** — a log of what was sent, to whom, when, and its
  documentation and tracking status.

This "repeat use of the same underlying data, invoked over and over" pattern is exactly the shape that
supports a **free limit → repeated use → future subscription** model: a free tier that lets a user
generate one invoice and store a small number of records is enough to prove value, while the natural
growth of an active exporter's own record set (more products, more buyers, more invoices) creates the
demand for a paid tier — without ever needing to withhold correctness or basic usefulness from the free
tier. This is a materially stronger retention mechanic than a platform made only of random one-time
calculators, each of which is used once and then forgotten until the next unrelated need arises.

**Possible future paid hooks** (not implemented now, listed for future planning only):
- saved exporter profile (business details reused across every document)
- product master (SKU-level product records reused across invoices/packing lists)
- buyer master (consignee/buyer records reused across invoices)
- invoice numbering (sequential, per-exporter numbering series)
- document history (past invoices/packing lists, searchable)
- export register (a running log of shipments for the exporter's own records)
- PDF packs (bundled invoice + packing list + checklist as one downloadable set)
- Excel/CSV export (of the product master, buyer master, or shipment register)
- monthly reports (a periodic summary of the exporter's own shipment activity)
- higher record limits (more saved products, buyers, invoices than the free tier)

# 4. Indian export process research map

This section is a high-level map of the Indian export document landscape relevant to a small exporter,
built from the research described above. It intentionally stays high-level: the goal is to understand
**which route an exporter is on** (postal, courier, or cargo) and **what data each route commonly needs**,
not to reproduce the full regulatory text.

## India Post / DNK / postal export route

- **Dak Ghar Niryat Kendra (DNK)** is described as a joint initiative of the Department of Posts and CBIC
  providing "end-to-end export facilitation under one roof," with over a thousand DNKs reported as
  operational across India, aimed at exporters — particularly MSMEs, artisans, start-ups, and small
  exporters — who depend on the postal network for low- and medium-value international consignments
  reaching 228 countries by air parcel, speed post, and similar postal export products (India Post
  documents and a Deccan Herald report on new DNKs opening in Mangaluru; see Sources). A public-broadcaster
  news report additionally states that exporters using India Post can now access government export
  benefits — duty drawback, remission of duties and taxes on exported products, and rebate of state and
  central taxes and levies — effective from 15 January (year as reported), under CBIC notifications; this
  claim comes from a secondary summary of that article (direct fetch of the source was blocked in this
  session) and should be treated as **directionally correct but not independently verified against the
  primary CBIC notification** before it is repeated as a compliance claim in any future tool's content.
- **Postal Bill of Export (PBE)** is the postal-route equivalent of a shipping bill: the customs
  declaration an exporter (or India Post, on the exporter's behalf) files for goods leaving India through
  the postal network. CBIC's **Postal Export (Electronic Declaration and Processing) Regulations, 2022**
  (reported as notified via Notification No. 104/2022-Customs (N.T.) dated 9 December 2022, with
  clarifying Circular No. 25/2022-Customs of the same date) established a **PBE Automated System**,
  developed jointly by CBIC and the Department of Posts, intended to let an exporter file the PBE
  electronically from their own premises and simply hand the consignment to a nearby post office, rather
  than travelling to a Foreign Post Office (FPO) to file in person.
- **PBE e-commerce vs. non-e-commerce distinction — confirmed as existing, but with a genuine
  discrepancy between secondary sources on exact form numbering.** Every source found agrees the
  regulation **does distinguish e-commerce postal exports from other (non-e-commerce) postal exports**
  with separate forms. However:
  - One secondary source (a 2022-era circular summary) describes the distinction as **PBE-III** for
    postal exports "effected through e-commerce" and **PBE-IV** for "all other postal exports," under the
    2022 regulations.
  - Another secondary source (summarising the same 2022 regulation) instead names **PBE-I** as covering
    "e-commerce and commercial postal exports" and a distinct **PBE-II** for "export product details."
  - A separate, older primary-form PDF found in this research (`taxindiaonline.com`, hosting what is
    titled "FORM-I (see regulation 4) Postal Bill of Export – I (PBE-I)") appears to predate the 2022
    regulations, referencing a 2018 customs notification number in its filename — suggesting PBE-I/PBE-II
    may be the **pre-2022 form numbering**, superseded or supplemented by PBE-III/PBE-IV under the 2022
    electronic system, but this session could not directly confirm that superseding relationship against
    the primary 2022 notification text (fetch blocked).
  - **This is marked as an open uncertainty.** Before any postal-route tool names a specific PBE form
    number in user-facing content, this must be resolved against the primary CBIC notification text
    (Notification No. 104/2022-Customs (N.T.)) or an official CBIC/India Post page, not a secondary
    summary. Until resolved, any future tool should refer generically to "the Postal Bill of Export (PBE)"
    without committing to a specific form-number/e-commerce mapping.
- **What a MangoTools tool could help prepare:** the underlying data a PBE needs regardless of its exact
  form number and numbering scheme — exporter identity and registration details, buyer/consignee details,
  invoice value and currency, item description and HSN, package count and weight — all of which map
  directly onto the Commercial Invoice and Packing List field groups planned in §7–§8.
- **What this platform cannot and will not do:** file the PBE itself, integrate with the PBE Automated
  System or any DNK login, or submit anything to a Foreign Post Office. See the Compliance Boundary above.

## Courier export route

- **Express Cargo Clearance System (ECCS)** is CBIC's electronic system for courier-mode export/import
  clearance, hosted at `courier.cbic.gov.in` (page content could not be fetched directly in this session
  — egress blocked — so this description rests on secondary summaries and the page's own advertised
  regulation-PDF filename, "Courier Imports And Exports (Electronic Declaration And Processing)
  Regulations"). Under ECCS, an **authorised courier** — not the exporter directly — electronically files
  the shipping bill on the exporter's behalf.
- **Courier Shipping Bill (CSB) types**, per secondary sources summarising the ECCS regulations:
  - **CSB-III** — for export of documents.
  - **CSB-IV** — for non-commercial exports such as gifts, samples, and prototypes.
  - **CSB-V** — for commercial-goods courier exports, including where the exporter wants to claim
    government export benefits (duty drawback / remission schemes).
  - One source additionally cites a **value/eligibility limit**: goods where the consignment value
    exceeds ₹10 lakh and a foreign-exchange transaction is involved are **not permitted through courier
    mode** at all, and goods subject to export duty are also excluded from courier mode. This is a
    secondary-source claim and should be re-verified against the primary regulation text before it is
    stated as a hard rule in any future tool's content or validation logic.
- **Data commonly needed for a courier export**, based on the above: exporter IEC and GST details, buyer
  details, invoice value and currency, item description and HSN, and — where the exporter is claiming
  export benefits — an **AD (Authorised Dealer) Code** registered with the relevant port, obtained from
  the exporter's own bank, per general IEC/AD-code guidance (see below). This planner does **not** assert
  a specific data schema for CSB-IV/CSB-V; it only identifies that a future "Courier Export Field Helper"
  (see §10) would collect the same underlying business data the Commercial Invoice already needs.
- **What this platform cannot and will not do:** file a CSB, integrate with ECCS, or act as, or replace,
  an authorised courier. See the Compliance Boundary above.

## Cargo/ICEGATE route (high level only)

- **ICEGATE** (Indian Customs Electronic Commerce Gateway) is the digital platform for filing customs
  documents — including the standard cargo **Shipping Bill** — for exports going through the sea/air cargo
  route rather than post or courier. The general process, per secondary sources, is: the exporter (or
  their customs broker) files the shipping bill electronically along with supporting documents (invoice,
  packing list) via ICEGATE and its e-Sanchit document-upload facility; Customs' Risk Management System
  screens the shipment; low-risk shipments typically clear by self-assessment; a "Let Export Order" (LEO)
  is then issued, after which the goods can be loaded for export.
- This route is **materially more complex** than the postal or courier route — it typically involves a
  licensed **customs broker/CHA**, more extensive documentation, and duty/benefit-scheme processing that
  is outside this platform's initial scope. **This planner does not recommend cargo/ICEGATE-specific
  tooling for the initial MVP.** It is mentioned here only so the future section's scope boundary is
  explicit: MangoTools' export document tools are aimed at the postal and courier routes an MSME/small
  exporter is most likely to use, not full cargo-shipment customs brokerage.

## Supporting identifiers referenced above

- **IEC (Import Export Code):** a DGFT-issued code required, with limited exemptions, for any person
  exporting from or importing into India; used by customs for clearance, by DGFT for export-scheme
  benefits, and by banks for foreign-currency receipt.
- **AD (Authorised Dealer) Code:** issued by the exporter's own bank, registered at each port the
  exporter ships from, needed for customs clearance and foreign-exchange transactions at that port.
- **GSTIN and LUT (Letter of Undertaking):** an exporter typically files an LUT (GST Form RFD-11) once
  per financial year to export goods/services without paying IGST upfront; the GST portal issues an
  Application Reference Number (ARN) confirming the LUT filing.
- **FEMA export realisation:** RBI/FEMA rules require export proceeds to be realised and repatriated to
  India within a specified period. Secondary sources describe an ongoing change here — a 9-month limit
  for exports before 1 October 2026, extending to 15 months (18 months if invoiced/settled in INR) for
  exports from that date — which this planner flags as a **live-moving figure that must be re-checked
  against the primary RBI notification at build time**, not hard-coded into any future tool's content
  from this research alone.

# 5. Proposed new section: Export & Import Documents

**Category name:** Export & Import Documents

**Positioning:** Practical document generators and record helpers for small exporters, ecommerce sellers,
and retail businesses.

**Safe public promise:** Prepare export invoices, packing lists, shipment records, and field checklists.
Verify final documents with official portals or professionals before filing.

This is a **name and positioning proposal only** — no category is created in the taxonomy or generator in
this task. Creating the category is implementation work for TASK-009B or later, once the founder approves
this planner.

# 6. First tool sequence

Recommended build sequence, in order:

1. **Export Commercial Invoice Generator**
2. **Export Packing List Generator**
3. **Export Product Master / Local Autofill**
4. **Buyer / Consignee Master**
5. **Export Shipment Record**
6. **Postal Export Field Helper**
7. **Courier Export Field Helper**
8. **Import Landed Cost Calculator** (later)

**Why Commercial Invoice comes first:** every downstream document and record depends on it. A packing
list references an invoice number and the same product/buyer data; a shipment record references an
invoice; the postal and courier field helpers both need the same exporter, buyer, product, and
value/currency data an invoice already collects. Building the invoice generator first means its field
groups (§7) become the shared data shape that the product master, buyer master, packing list, and both
route-specific helpers can all reuse — rather than each tool inventing its own overlapping field set.
Commercial Invoice is also the single document every export route (postal, courier, or cargo) needs
regardless of which one the user is on, so it is useful before the platform commits to postal- or
courier-specific scope at all. Product/buyer masters and the shipment record are sequenced right after it
because they are what make the invoice generator *repeatable* (§3's retention logic) rather than a
one-shot form; the two route-specific field helpers come after, once the underlying data model already
exists to reuse in them; the import-side tool is explicitly last because import is more duty/tax-sensitive
(§11) and should not be started before the export foundation is solid.

# 7. Export Commercial Invoice Generator — planned fields

**These fields are a planning proposal, not an official or final schema.** They are grouped by role and
will need validation against actual invoice templates/requirements before implementation; no field list
here should be treated as legally sufficient or as copying an official government form.

**Exporter profile:**
- business name
- address
- GSTIN
- IEC
- phone/email
- LUT ARN (if applicable)
- bank details (if needed)
- authorized signatory

**Buyer / consignee:**
- buyer name
- buyer address
- consignee name (if different from buyer)
- consignee address
- country
- email/phone
- tax/VAT ID (if applicable)

**Invoice:**
- invoice number
- invoice date
- currency
- incoterm / delivery term (if used)
- payment term
- export type / purpose (if needed)
- order/reference number

**Products:**
- item description
- SKU
- HSN
- quantity
- unit
- unit price
- total value
- country of origin
- net weight (if needed)

**Shipping:**
- package count
- gross weight
- net weight
- dimensions
- shipping mode
- tracking number (later)

**Declarations:**
- GST/LUT/IGST statement placeholder
- export declaration placeholder
- signature/seal area

# 8. Export Packing List Generator — planned fields

**Planned fields (proposal, not final):**
- invoice number/date reference
- exporter
- buyer/consignee
- package number
- item/SKU
- quantity per package
- net weight
- gross weight
- dimensions
- total packages
- total net/gross weight
- remarks

**Invoice–packing-list matching:** the packing list must reference the same invoice number, exporter, and
buyer/consignee as the commercial invoice it accompanies, and its per-package item quantities should sum
to the same total quantity per item as the invoice. This matching is a correctness expectation for the
eventual implementation (e.g. a validation warning if the packing list's total quantity for an item does
not match the referenced invoice), not something implemented in this planning task.

# 9. Postal Export Field Helper — planned scope

A future helper that **prepares data** for postal export entry — it does not file anything.

**Planned scope includes:**
- exporter details
- buyer/consignee details
- invoice details
- item details
- HSN
- weight/value
- package count
- GST/LUT/IEC details (where relevant)
- a declarations checklist

**Explicitly out of scope for this helper, always:**
- no PBE filing
- no DNK login integration
- no customs submission
- the user must verify the final submission on DNK / India Post / the customs process themselves

# 10. Courier Export Field Helper — planned scope

A future helper that prepares a **checklist and field set** for a courier export shipment — it does not
file anything or integrate with any courier or customs system.

**Planned scope includes:**
- courier export shipment checklist
- buyer/consignee
- product/HSN
- value/currency
- IEC/GST
- AD code (where applicable/supported by the exporter's own bank and port)
- a note directing the user to their authorized courier for actual submission
- a high-level CSB/ECCS distinction (per §4) shown as user-facing explanation, not as a filing mechanism

**Explicitly out of scope for this helper, always:**
- no CSB filing
- no ECCS integration
- no courier API integration in v1

# 11. Import tools later

Planned for a later wave, after the export foundation is solid:
- Import Landed Cost Calculator
- customs duty checklist
- bill of entry field helper
- import shipment record
- supplier/product master

**Why import comes later:** import is more duty/tax-sensitive than export — getting a customs-duty or
landed-cost figure wrong has a more direct financial-mistake consequence for the user than a
document-preparation helper does, and it depends on the same exporter-side record-keeping patterns
(product master, shipment record) that this planner sequences the export side to build first. Import
tooling should build on that already-proven record foundation rather than duplicate it from scratch.

# 12. Regular data autofill system

Planned in three levels. **No storage is implemented in this task.**

**Level 1 — no-login local autofill:**
- exporter profile
- product master
- buyer/consignee master
- last invoice number
- recent terms/currency
- stored in browser/local storage, if implemented later

**Level 2 — local records:**
- invoice record
- packing list record
- shipment register
- payment/remittance status
- tracking number
- document status
- manual backup/export

**Level 3 — paid/pro later:**
- cloud sync
- PDF packs
- Excel export
- bulk invoices
- monthly export register
- saved templates
- higher record limits
- multi-user/team later

# 13. Column explanatory / field guidance system

Every field in every future document tool should eventually carry structured guidance, not just a bare
label. Each field's guidance should cover:
- field name
- what to fill
- example
- required/optional
- where to get it
- common mistake
- used in which document

**Example fields this guidance system should cover** (guidance content itself is not written in this
planning task):
- IEC
- GSTIN
- HSN
- LUT ARN
- invoice currency
- consignee
- gross weight
- net weight
- package count
- country of origin
- AD code (if applicable)
- invoice number

# 14. Free vs paid limit strategy

**Free (planned):**
- generate a single document
- limited saved local records
- manual copy/download
- basic invoice/packing list

**Future paid (planned, not implemented):**
- more saved profiles
- more invoice records
- product master expansion
- buyer master expansion
- monthly export register
- PDF document pack
- Excel/CSV export
- recurring document templates
- batch invoice generation

No payment or subscription mechanism is implemented in this task or planned for near-term implementation
without separate founder approval.

# 15. Data/privacy/storage notes

Export records inherently contain business and customer data (buyer names, addresses, invoice values,
bank details), which is more sensitive than the anonymous numeric/text input every existing tool on this
platform handles. Accordingly:

- **No server storage in the first phase.**
- **Browser-local storage only**, if and when storage is implemented.
- A **clear export/delete data** option should be planned for later, once storage exists.
- **No claim of government-grade compliance** (data-protection, security-certification, or similar) should
  ever be made about this feature.
- **Avoid sensitive document uploads** in the early MVP — the first tools should be data-entry-driven
  (the user types values in) rather than accepting uploaded existing invoices/IDs/bank documents, which
  would raise materially higher privacy and security stakes than this platform has handled before.

# 16. MVP implementation recommendation

Recommended first implementation, **after this planner**:

**TASK-009B — Export Commercial Invoice Generator**

This should only begin after the founder approves, specifically:
- the section name (Export & Import Documents) and its positioning/safe public promise (§5)
- the compliance boundary wording (top of this document)
- the field groups for the Commercial Invoice (§7)
- the local-autofill scope for the first version (§12, Level 1 only)
- the free vs. paid limits to apply at launch (§14)
- the first tool's exact scope (§7, and confirmation that no postal/courier filing logic is included)

# 17. Out of scope for TASK-009A

- No app code
- No new category implementation
- No invoice generator implementation
- No autofill implementation
- No government filing
- No DNK/ECCS/ICEGATE integration
- No PDF pack generation
- No payment/subscription
- No Civil/PDF/Developer/Image/video/audio work

# 18. Decision summary

- Export & Import Documents should be planned as a **repeat-user document/record ecosystem**, not a
  one-shot calculator category.
- **Start with the export commercial invoice** — every other planned tool in this section either depends
  on its data shape or is a route-specific helper built on top of it.
- **Keep postal/courier helpers as preparation/checklist tools, not filing tools** — they collect and
  organise the data an exporter needs for the Postal Bill of Export or Courier Shipping Bill process, but
  never file, submit, or integrate with DNK, PBE, ECCS, ICEGATE, or any courier/customs system.
- **Keep all deferred journey items recorded** (§2) for future completion — none of them are started here.

---

## Sources consulted

Primary-source fetches attempted and blocked in this session are marked (blocked); all other links were
reachable via web search and used to inform the claims above, with uncertainty flagged inline in §4 where
secondary sources disagreed or could not be cross-checked against a primary text.

- India Post — https://www.indiapost.gov.in/ (blocked — direct fetch)
- DNK / Mangaluru postal division report — https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fthree-dak-ghar-niryat-kendras-open-in-mangaluru-postal-division-3226245
- India Post export benefits news report — https://www.newsonair.gov.in/people-exporting-products-via-india-post-can-now-avail-govt-export-benefits/ (blocked — direct fetch; used via search summary only)
- Postal Export (Electronic Declaration and Processing) Regulations, 2022 summary — https://www.vjmglobal.com/blog/postal-export-electronic-declaration-processing-regulations-2022-implementation-pbe-automated-system (blocked — direct fetch; used via search summary only)
- PBE Automated System overview — https://studycafe.in/know-all-about-postal-bill-of-export-pbe-automation-system-276934.html
- CBIC Circular No. 25/2022-Customs summary — https://worldtradescanner.com/25-CBIC%20Circular-09.12.2022.htm
- Postal Bill of Export – I (PBE-I) form (pre-2022 numbering, dated by filename to a 2018 notification) — https://taxindiaonline.com/RC2/pdfdocs/csnt48-2018_form.pdf
- CBIC courier ECCS regulation page — https://courier.cbic.gov.in/ECCS/regulation.jsp (blocked — direct fetch; used via search summary only)
- CSB-IV vs CSB-V explainer — https://shipglobal.in/blogs/csb-4-vs-csb-5/
- ICEGATE / shipping bill overview — https://www.icegate.gov.in/help/faq
- IEC (Import Export Code) — DGFT profile management page — https://www.dgft.gov.in/CP/?opt=iec-profile-management (blocked — direct fetch; used via search summary only)
- AD Code explainer — https://onpattison.com/news/2026/jan/26/iec-and-ad-code-registration-complete-guide-for-exporters-in-india/
- LUT / GST Form RFD-11 official user guide — https://tutorial.gst.gov.in/userguide/refund/Furnishing_of_Letter_of_Undertaking_for_Export_of_Goods_or_Services.htm
- RBI/FEMA export realisation period change (9 → 15 months) — https://www.taxmann.com/post/blog/rbi-extends-the-time-period-for-realisation-of-full-export-from-9-to-15-months
