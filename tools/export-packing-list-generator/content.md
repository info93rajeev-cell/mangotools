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
   you can type its number and date as a reference — this is a plain text reference only, not a link.
4. Enter the item being packed: description, quantity, and unit. This version supports one item row
   per packing list.
5. Enter the number of packages, and net and gross weight in the unit you choose. Add shipping marks,
   package type, and dimensions if useful.
6. Edit or clear the declaration text, then read the packing-list draft. Copy or print it.

## Method

This is primarily a **document generator, not a calculator**. Every field in the output is either a
direct echo of what you typed, or a fixed printable signature block — this tool does not calculate
duties, taxes, freight, forex, customs value, or regulatory eligibility, and it does not total package
weights or quantities across rows, since this version supports only one item row.

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
GST, FEMA, or banking compliance advice. **It also does not automatically pull data from, or send data
to, the Export Commercial Invoice Generator** — the optional invoice number/date fields here are a
plain text reference you type yourself, with no shared profile, sync, or autofill between the two
tools. Always verify the final packing list, and confirm your export route's own requirements, with
your courier, freight forwarder, customs broker, CA, bank, or the official portal before filing or
shipping.

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

No, not automatically. You can type the commercial invoice number and date here as a plain text
reference, but nothing is transferred, synced, or autofilled between the two tools — each one is filled
in independently.

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

Not in this version. This packing list generator supports one item row per packing list draft.

## References

- General packing-list content (exporter, buyer/consignee, item, packages, net/gross weight):
  common international trade documentation practice.
- Field groups and compliance boundary: this platform's own `TASK-009A-EXPORT-IMPORT-DOCUMENTS-FOUNDATION-PLANNER.md`, itself researched against secondary summaries of CBIC, DGFT, and GST notifications (see that document's own source list and disclosed research limitations).
