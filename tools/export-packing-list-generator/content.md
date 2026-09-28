---
lastReviewed: 2026-09-28
example: 001-cushion-covers-10-cartons
---

## How to use

This export packing list generator prepares a packing-list **draft** for an export shipment — a
practical packing list generator for retail exporters, ecommerce exporters, small businesses, and
MSMEs shipping through India Post, a courier, or cargo.

1. Enter your business (exporter) details: name, address, IEC, and GSTIN or phone/email if you use
   them.
2. Enter the buyer's details, and the consignee's details if the actual receiver abroad is different
   from the buyer.
3. Enter the packing list number and date. If you already have a commercial invoice for this shipment,
   you can type its number and date as a reference yourself — or, if you arrived here from the Export
   Commercial Invoice Generator's "Create Packing List" action, some of these details are already
   filled in for you (see "Does it link to the Export Commercial Invoice Generator?" below).
4. Enter each item being packed: description, quantity, and unit. Use **Add item** for more than one
   product, up to 5 items per packing list.
5. Enter the number of packages, and net and gross weight for the whole shipment, in the unit you
   choose. Add shipping marks, package type, and dimensions if useful.
6. Edit or clear the declaration text, then read the packing-list draft. Copy or print it.

## Method

This is primarily a **document generator, not a calculator**. Every field in the output is either a
direct echo of what you typed, or a fixed printable signature block — this tool does not calculate
duties, taxes, freight, forex, customs value, or regulatory eligibility, and it does not total item
quantities across rows, since the units may not even be compatible (for example 10 PCS and 20 KG on
the same packing list). Package count and net/gross weight are always a single figure for the whole
shipment, not totalled from the item rows.

The one check this tool does perform is a plain data-integrity check, not a calculation: **gross weight
cannot be less than net weight**, since a packed shipment cannot weigh less than the goods inside it.

**Field guidance for a few terms that often cause confusion:**
- **IEC** — Import Export Code issued by DGFT. Verify before use.
- **GSTIN** — your business GST registration number, if applicable. Not every exporter is
  GST-registered, so this field is optional.
- **Consignee** — the actual receiver abroad, which may be different from the buyer named on the
  packing list.
- **HSN** — the product classification code, optional on a packing list. Verify the correct HSN with
  your CA or customs broker if unsure.
- **Country of origin** — the country where the goods originate or are manufactured.
- **Package count** — the total number of packages, cartons, or pallets in the shipment.
- **Shipping marks / marks and numbers** — the marks and numbers stencilled or labelled on the
  packages, for example a buyer code and package range.
- **Net weight vs. gross weight** — net weight is the product weight, **excluding** packaging. Gross
  weight is the packed shipment weight, **including** packaging. Gross weight is always the larger (or
  equal) figure.
- **AWB / BL / tracking number** — the air waybill, bill of lading, or courier/consignment number for
  the shipment, once available.

**What this tool does not do:** this is a document preparation helper only. It does not file anything
with Customs, India Post, DGFT, ICEGATE, DNK, ECCS, or any bank or government portal, it does not
generate an official or government-approved packing list, and it does not provide legal, tax, customs,
GST, FEMA, or banking compliance advice. **It can optionally receive selected details from the Export
Commercial Invoice Generator**, through that tool's own "Create Packing List" action — a one-time copy
of exporter, buyer, and (for a single-item invoice) item-identity details, made once when you follow
that link. The two documents are never kept in sync afterward: editing one does not update the other,
there is no shared profile or saved data, and nothing is verified for correctness automatically. Item
quantities, package counts, and weights are never copied — you must enter and verify what was actually
packed yourself, since it can legitimately differ from what was invoiced. If your invoice has more than
one item, its item details are not copied at all; enter each item here yourself. Always verify the
final packing list, and confirm your export route's own requirements, with your courier, freight
forwarder, customs broker, CA, bank, or the official portal before filing or shipping.

## Worked example

500 hand-block printed cotton cushion covers, packed into 10 cartons, 125 kg net / 135 kg gross:

## FAQ

### Is this a customs filing tool?

No. This is a document preparation helper. It never files anything with Customs or any government
portal — you (or your customs broker, courier, or freight forwarder) file or submit separately, through
the relevant official channel.

### Does it file PBE, ECCS, or ICEGATE paperwork?

No. This tool does not integrate with the Dak Ghar Niryat Kendra, Postal Bill of Export, Express Cargo
Clearance System, ICEGATE, or any courier's own filing system. It only helps you prepare a packing-list
draft.

### Does it link to the Export Commercial Invoice Generator?

It can, if you use that tool's "Create Packing List" action: exporter, buyer, and (for a single-item
invoice) item-identity details are copied here once, as a starting point. You still need to review what
was copied, and enter the actual packed quantity, package count, and weights yourself — these are never
copied, since what you invoiced and what you actually pack can differ. After this one-time copy, the two
documents are independent: editing one does not update the other. If you open this tool directly, or
type your own commercial invoice number and date as a reference, nothing is transferred at all.

### What is the difference between net weight and gross weight?

Net weight is the weight of the goods only, excluding packaging. Gross weight is the packed shipment
weight, including packaging — so gross weight is always the larger (or equal) figure. This tool rejects
a gross weight entered lower than the net weight.

### What is IEC?

The Import Export Code, issued by DGFT. Most exporters need one to export from India. Verify your own
IEC before use.

### Do I need to enter a GSTIN or HSN code?

No, both are optional on this packing list. Enter them if you have them; leave them blank otherwise.

### Can I use it for India Post or courier exports?

Yes, as a starting point. Prepare your packing-list draft here, then use it alongside your invoice when
handing your shipment to India Post, your courier, or your freight forwarder — verifying every field
yourself.

### Does this store my data?

No. This version does not save, store, or upload anything — nothing you type is sent to a server or
kept after you close or refresh the page.

### Do I need to sign up?

No. This tool works without an account, sign-up, or login.

### Can it handle more than one item?

Yes, up to 5 items per packing list. Use **Add item** to add a row for each product, and **Remove
item** to take one out. Package count and net/gross weight stay a single figure for the whole
shipment, not a total per item.

## References

- General packing-list content (exporter, buyer/consignee, item, packages, net/gross weight):
  common international trade documentation practice.
- Field groups and compliance boundary: this platform's own `TASK-009A-EXPORT-IMPORT-DOCUMENTS-FOUNDATION-PLANNER.md`, itself researched against secondary summaries of CBIC, DGFT, and GST notifications (see that document's own source list and disclosed research limitations).
