---
lastReviewed: 2026-09-28
example: 001-cushion-covers-usd
---

## How to use

This export commercial invoice generator prepares a commercial invoice **draft** for an export
shipment — a practical commercial invoice generator and export invoice generator for retail exporters,
ecommerce exporters, small businesses, and MSMEs shipping through India Post, a courier, or cargo.

1. Enter your business (exporter) details: name, address, GSTIN if applicable, IEC, and a phone or
   email.
2. Enter the buyer's details, and the consignee's details if the actual receiver abroad is different
   from the buyer.
3. Enter the invoice number, date, and currency, plus any payment terms or incoterm you use.
4. Enter each item being shipped: description, HSN code, quantity, unit, and unit price. Use **Add
   item** for more than one product, up to 5 items per invoice.
5. Optionally enter shipping details (package count, weights, shipping mode) and edit or clear the
   declaration text.
6. Read the invoice draft, including the calculated item and invoice totals. Copy or print it.

## Method

- Each item's line amount = quantity × unit price, in the invoice currency you entered.
- Invoice subtotal = the exact sum of every item's line amount (up to 5 items).
- Invoice total = invoice subtotal. **No tax, duty, or foreign-exchange conversion is calculated or
  added** — this is a plain export-value total, not a tax-inclusive or landed-cost figure.

**Field guidance for a few identifiers that often cause confusion:**
- **IEC** — Import Export Code issued by DGFT. Verify before use.
- **GSTIN** — your business GST registration number, if applicable. Not every exporter is
  GST-registered, so this field is optional.
- **HSN** — the product classification code. Verify the correct HSN with your CA or customs broker if
  unsure; this tool only checks that it looks like a plausible numeric code (4, 6 or 8 digits), not
  that it is the *correct* code for your product.
- **LUT ARN** — your GST Letter of Undertaking reference, if you export without paying IGST, where
  applicable.
- **Consignee** — the actual receiver abroad, which may be different from the buyer named on the
  invoice.
- **Gross weight** — the packed shipment weight, including packaging. **Net weight** — the product
  weight, excluding packaging.
- **Country of origin** — the country where the goods originate or are manufactured.

**What this tool does not do:** this is a document preparation helper only. It does not file anything
with Customs, India Post, DGFT, ICEGATE, DNK, ECCS, or any bank or government portal, it does not
generate a Postal Bill of Export or Courier Shipping Bill, and it does not provide legal, tax, or
FEMA/bank compliance advice. It also does not calculate tax, duty, cost, or a bill of quantities. The
invoice draft this tool produces is meant to feed into your own postal export (India Post / Dak Ghar
Niryat Kendra), courier export, or cargo process — always verify the final invoice, and confirm your
export route's own filing requirements, with India Post, your courier, your customs broker, your CA,
your bank, or the official portal before filing or shipping.

## Worked example

500 hand-block printed cotton cushion covers at USD 3.50 each, HSN 630490, exported under LUT:

## FAQ

### Is this a customs filing tool?

No. This is a document preparation helper. It never files anything with Customs or any government
portal — you (or your customs broker) file separately, through the relevant official channel.

### Does it file PBE/DNK?

No. This tool does not file a Postal Bill of Export and does not integrate with the Dak Ghar Niryat
Kendra portal or any India Post login. It only helps you prepare the invoice data you would separately
enter there.

### Does it file CSB/ECCS?

No. This tool does not file a Courier Shipping Bill and does not integrate with the Express Cargo
Clearance System or any courier's own system.

### Can I use it for India Post exports?

Yes, as a starting point. Prepare your invoice draft here, then use it to help fill in your Postal Bill
of Export through India Post or the Dak Ghar Niryat Kendra process, verifying every field yourself.

### Can I use it for courier exports?

Yes, as a starting point. Prepare your invoice draft here, then hand it to your authorized courier
along with the other details they need to file your shipment.

### What is IEC?

The Import Export Code, issued by DGFT. Most exporters need one to export from India. Verify your own
IEC before use.

### What is HSN?

A numeric product classification code used for customs and GST purposes. Verify the correct HSN for
your specific product with your CA or customs broker — this tool only checks the code's basic shape.

### What is LUT ARN?

The Application Reference Number for a GST Letter of Undertaking, which lets an exporter ship goods
without paying IGST upfront, where applicable. Leave it blank if it doesn't apply to you.

### Does this store my data?

No. This version does not save, store, or upload anything — nothing you type is sent to a server or
kept after you close or refresh the page. Autofill and saved records are planned for a later version.

### Do I need to sign up?

No. This tool works without an account, sign-up, or login.

## References

- General commercial-invoice content and arithmetic (exporter, buyer/consignee, item, totals): common
  international trade documentation practice.
- Field groups and compliance boundary: this platform's own `TASK-009A-EXPORT-IMPORT-DOCUMENTS-FOUNDATION-PLANNER.md`, itself researched against secondary summaries of CBIC, DGFT, and GST notifications (see that document's own source list and disclosed research limitations).
