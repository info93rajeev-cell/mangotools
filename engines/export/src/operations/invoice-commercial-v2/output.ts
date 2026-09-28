import type { WorkingStep } from '@mangotools/core';
import type { Computed, Item, Measured } from './types.ts';

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

/** One "Item N line total = ..." step per row, then the subtotal and total steps. */
export function workingSteps(m: Measured, c: Computed): WorkingStep[] {
  const itemSteps = m.items.map((item, index) =>
    step(
      `item-${index}-lineAmount`,
      'invoice.v2.itemLineTotal',
      {
        itemNumber: String(index + 1),
        itemDescription: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        currency: m.currency,
      },
      c.items[index]?.lineAmount ?? '0',
    ),
  );
  return [
    ...itemSteps,
    step(
      'invoiceSubtotal',
      'invoice.v2.subtotal',
      { itemCount: String(m.items.length), currency: m.currency },
      c.invoiceSubtotal,
    ),
    step(
      'invoiceTotal',
      'invoice.v2.total',
      { invoiceSubtotal: c.invoiceSubtotal, currency: m.currency },
      c.invoiceTotal,
    ),
  ];
}

/** A plain-text signature/seal block for the printable preview. */
function signatureArea(m: Measured): string {
  const name = m.authorizedSignatory ?? '______________________';
  return `Authorized Signatory: ${name}\nSignature: ______________________   Date: ______________`;
}

function buildItemOutput(
  item: Item,
  computed: { lineAmount: string },
  shown: (v: string) => string,
) {
  return {
    description: item.description,
    sku: item.sku,
    hsn: item.hsn,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: shown(item.unitPrice),
    countryOfOrigin: item.countryOfOrigin,
    netWeight: item.netWeight,
    lineAmount: shown(computed.lineAmount),
  };
}

export function buildOutput(
  m: Measured,
  c: Computed,
  shown: (value: string) => string,
  working: WorkingStep[],
) {
  return {
    exporterName: m.exporterName,
    exporterAddress: m.exporterAddress,
    exporterGstin: m.exporterGstin,
    exporterIec: m.exporterIec,
    exporterContact: m.exporterContact,
    lutArn: m.lutArn,
    buyerName: m.buyerName,
    buyerAddress: m.buyerAddress,
    consigneeName: m.consigneeName,
    consigneeAddress: m.consigneeAddress,
    destinationCountry: m.destinationCountry,
    buyerContact: m.buyerContact,
    buyerTaxId: m.buyerTaxId,
    invoiceNumber: m.invoiceNumber,
    invoiceDate: m.invoiceDate,
    currency: m.currency,
    paymentTerms: m.paymentTerms,
    orderReference: m.orderReference,
    incoterm: m.incoterm,
    items: m.items.map((item, index) =>
      buildItemOutput(item, c.items[index] ?? { lineAmount: '0' }, shown),
    ),
    invoiceSubtotal: shown(c.invoiceSubtotal),
    invoiceTotal: shown(c.invoiceTotal),
    packageCount: m.packageCount,
    grossWeight: m.grossWeight,
    netWeight: m.netWeight,
    shippingMode: m.shippingMode,
    trackingNumber: m.trackingNumber,
    gstDeclaration: m.gstDeclaration,
    exportDeclaration: m.exportDeclaration,
    signatureArea: signatureArea(m),
    working,
  };
}
