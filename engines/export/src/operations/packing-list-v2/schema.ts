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

/**
 * One packed item. Accepted as a loosely-typed record here (real per-field validation happens in
 * `measure.ts`, same as every scalar field in v1) because rows are authored two different ways: a
 * fixture/test writes a native YAML/JS array of objects, while the browser form encodes the same
 * array as a JSON string (see `packingListInputV2.items` below) since a form field can only ever
 * hold a string or boolean.
 */
const itemRecord = z.record(z.string(), z.unknown());

export const packingListInputV2 = z.strictObject({
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
  // Goods / items (v2: one to a few rows; see MAX_ITEMS in measure.ts)
  items: z.union([z.string(), z.array(itemRecord)]).optional(),
  // Packing / weight — shipment-level, never per item (TASK-009H)
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

export const packingListParamsV2 = z.strictObject({});

const optionalOut = z.string().nullable();

const itemOutput = z.strictObject({
  description: z.string(),
  sku: optionalOut,
  hsn: optionalOut,
  countryOfOrigin: optionalOut,
  quantity: z.string(),
  unit: z.string(),
});

export const packingListOutputV2 = z.strictObject({
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
  items: z.array(itemOutput),
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

export type PackingListInputV2 = z.infer<typeof packingListInputV2>;
export type PackingListParamsV2 = z.infer<typeof packingListParamsV2>;
export type PackingListOutputV2 = z.infer<typeof packingListOutputV2>;
