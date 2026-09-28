import type { WorkingStep } from '@mangotools/core';
import type { Computed, Measured } from './types.ts';

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

/** Working steps with full-precision values (templates come from the tool preset). */
export function workingSteps(m: Measured, c: Computed): WorkingStep[] {
  return [
    step(
      'itemLineTotal',
      'invoice.itemLineTotal',
      {
        itemQuantity: m.itemQuantity,
        itemUnit: m.itemUnit,
        itemUnitPrice: m.itemUnitPrice,
        currency: m.currency,
      },
      c.itemLineTotal,
    ),
    step(
      'invoiceSubtotal',
      'invoice.subtotal',
      { itemLineTotal: c.itemLineTotal, currency: m.currency },
      c.invoiceSubtotal,
    ),
    step(
      'invoiceTotal',
      'invoice.total',
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
    itemDescription: m.itemDescription,
    itemSku: m.itemSku,
    itemHsn: m.itemHsn,
    itemQuantity: m.itemQuantity,
    itemUnit: m.itemUnit,
    itemUnitPrice: shown(m.itemUnitPrice),
    itemCountryOfOrigin: m.itemCountryOfOrigin,
    itemNetWeight: m.itemNetWeight,
    itemLineTotal: shown(c.itemLineTotal),
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
