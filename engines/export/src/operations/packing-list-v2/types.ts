import type { WeightUnit } from './schema.ts';

export interface Item {
  description: string;
  sku: string | null;
  hsn: string | null;
  countryOfOrigin: string | null;
  quantity: string;
  unit: string;
}

export interface Measured {
  exporterName: string;
  exporterAddress: string;
  exporterIec: string;
  exporterGstin: string | null;
  exporterContact: string | null;
  buyerName: string;
  buyerAddress: string;
  consigneeName: string | null;
  consigneeAddress: string | null;
  destinationCountry: string;
  packingListNumber: string;
  packingListDate: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  orderReference: string | null;
  shippingMode: string | null;
  trackingNumber: string | null;
  items: Item[];
  packageCount: string;
  packageType: string | null;
  shippingMarks: string | null;
  weightUnit: WeightUnit;
  netWeight: string;
  grossWeight: string;
  dimensions: string | null;
  declarationText: string | null;
  authorizedSignatory: string | null;
}
