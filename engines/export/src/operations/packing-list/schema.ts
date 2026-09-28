import { z } from 'zod';

const text = z.union([z.string(), z.number()]);

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

export const weightUnits = ['kg', 'lb'] as const;
export type WeightUnit = (typeof weightUnits)[number];

export const packingListInput = z.strictObject({
  // Exporter
  exporterName: text.optional(),
  exporterAddress: text.optional(),
  exporterIec: text.optional(),
  exporterGstin: text.optional(),
  exporterContact: text.optional(),
  // Buyer / consignee
  buyerName: text.optional(),
  buyerAddress: text.optional(),
  consigneeName: text.optional(),
  consigneeAddress: text.optional(),
  destinationCountry: text.optional(),
  // Document / shipment
  packingListNumber: text.optional(),
  packingListDate: text.optional(),
  invoiceNumber: text.optional(),
  invoiceDate: text.optional(),
  orderReference: text.optional(),
  shippingMode: text.optional(),
  trackingNumber: text.optional(),
  // Goods / item (v1: one item row)
  itemDescription: text.optional(),
  itemSku: text.optional(),
  itemHsn: text.optional(),
  itemCountryOfOrigin: text.optional(),
  itemQuantity: text.optional(),
  itemUnit: text.optional(),
  // Packing / weight
  packageCount: text.optional(),
  packageType: text.optional(),
  shippingMarks: text.optional(),
  weightUnit: z.enum(weightUnits),
  netWeight: text.optional(),
  grossWeight: text.optional(),
  dimensions: text.optional(),
  // Declaration / signature
  declarationText: text.optional(),
  authorizedSignatory: text.optional(),
});

export const packingListParams = z.strictObject({});

const optionalOut = z.string().nullable();

export const packingListOutput = z.strictObject({
  exporterName: z.string(),
  exporterAddress: z.string(),
  exporterIec: z.string(),
  exporterGstin: optionalOut,
  exporterContact: optionalOut,
  buyerName: z.string(),
  buyerAddress: z.string(),
  consigneeName: optionalOut,
  consigneeAddress: optionalOut,
  destinationCountry: z.string(),
  packingListNumber: z.string(),
  packingListDate: z.string(),
  invoiceNumber: optionalOut,
  invoiceDate: optionalOut,
  orderReference: optionalOut,
  shippingMode: optionalOut,
  trackingNumber: optionalOut,
  itemDescription: z.string(),
  itemSku: optionalOut,
  itemHsn: optionalOut,
  itemCountryOfOrigin: optionalOut,
  itemQuantity: z.string(),
  itemUnit: z.string(),
  packageCount: z.string(),
  packageType: optionalOut,
  shippingMarks: optionalOut,
  weightUnit: z.enum(weightUnits),
  netWeight: z.string(),
  grossWeight: z.string(),
  dimensions: optionalOut,
  declarationText: optionalOut,
  signatureArea: z.string(),
  working: z.array(workingStep),
});

export type PackingListInput = z.infer<typeof packingListInput>;
export type PackingListParams = z.infer<typeof packingListParams>;
export type PackingListOutput = z.infer<typeof packingListOutput>;
