import type { Measured } from './types.ts';

/** A plain-text signature/seal block for the printable preview. */
function signatureArea(m: Measured): string {
  const name = m.authorizedSignatory ?? '______________________';
  return `Authorized Signatory: ${name}\nSignature: ______________________   Date: ______________`;
}

/**
 * This is a document generator, not a calculator — every field below is either a direct echo of what
 * the exporter typed, or (signatureArea) a fixed printable boilerplate block. No duty, tax, freight,
 * forex, customs-value, or weight-total calculation is performed; `working` is empty on purpose, which
 * hides the "Show calculation" control in the UI.
 */
export function buildOutput(m: Measured) {
  return {
    exporterName: m.exporterName,
    exporterAddress: m.exporterAddress,
    exporterIec: m.exporterIec,
    exporterGstin: m.exporterGstin,
    exporterContact: m.exporterContact,
    buyerName: m.buyerName,
    buyerAddress: m.buyerAddress,
    consigneeName: m.consigneeName,
    consigneeAddress: m.consigneeAddress,
    destinationCountry: m.destinationCountry,
    packingListNumber: m.packingListNumber,
    packingListDate: m.packingListDate,
    invoiceNumber: m.invoiceNumber,
    invoiceDate: m.invoiceDate,
    orderReference: m.orderReference,
    shippingMode: m.shippingMode,
    trackingNumber: m.trackingNumber,
    itemDescription: m.itemDescription,
    itemSku: m.itemSku,
    itemHsn: m.itemHsn,
    itemCountryOfOrigin: m.itemCountryOfOrigin,
    itemQuantity: m.itemQuantity,
    itemUnit: m.itemUnit,
    packageCount: m.packageCount,
    packageType: m.packageType,
    shippingMarks: m.shippingMarks,
    weightUnit: m.weightUnit,
    netWeight: m.netWeight,
    grossWeight: m.grossWeight,
    dimensions: m.dimensions,
    declarationText: m.declarationText,
    signatureArea: signatureArea(m),
    working: [],
  };
}
