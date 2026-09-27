export interface Measured {
  exporterName: string;
  exporterAddress: string;
  exporterGstin: string | null;
  exporterIec: string;
  exporterContact: string;
  lutArn: string | null;
  authorizedSignatory: string | null;
  buyerName: string;
  buyerAddress: string;
  consigneeName: string | null;
  consigneeAddress: string | null;
  destinationCountry: string;
  buyerContact: string | null;
  buyerTaxId: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  currency: string;
  paymentTerms: string | null;
  orderReference: string | null;
  incoterm: string | null;
  itemDescription: string;
  itemSku: string | null;
  itemHsn: string;
  itemQuantity: string;
  itemUnit: string;
  itemUnitPrice: string;
  itemCountryOfOrigin: string | null;
  itemNetWeight: string | null;
  packageCount: string | null;
  grossWeight: string | null;
  netWeight: string | null;
  shippingMode: string | null;
  trackingNumber: string | null;
  gstDeclaration: string | null;
  exportDeclaration: string | null;
}

export interface Computed {
  itemLineTotal: string;
  invoiceSubtotal: string;
  invoiceTotal: string;
}
