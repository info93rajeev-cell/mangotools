import type { WeightUnit } from './schema.ts';

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
  itemDescription: string;
  itemSku: string | null;
  itemHsn: string | null;
  itemCountryOfOrigin: string | null;
  itemQuantity: string;
  itemUnit: string;
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
