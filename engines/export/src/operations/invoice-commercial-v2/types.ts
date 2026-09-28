export interface Item {
  description: string;
  sku: string | null;
  hsn: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  countryOfOrigin: string | null;
  netWeight: string | null;
}

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
  items: Item[];
  packageCount: string | null;
  grossWeight: string | null;
  netWeight: string | null;
  shippingMode: string | null;
  trackingNumber: string | null;
  gstDeclaration: string | null;
  exportDeclaration: string | null;
}

export interface ComputedItem {
  lineAmount: string;
}

export interface Computed {
  items: ComputedItem[];
  invoiceSubtotal: string;
  invoiceTotal: string;
}
