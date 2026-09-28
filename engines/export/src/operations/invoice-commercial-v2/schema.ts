import { z } from 'zod';

const text = z.union([z.string(), z.number()]);

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

/**
 * One invoice line item. Accepted as a loosely-typed record here (real per-field validation happens
 * in `measure.ts`, same as every scalar field in v1) because rows are authored two different ways:
 * a fixture/test writes a native YAML/JS array of objects, while the browser form encodes the same
 * array as a JSON string (see `invoiceCommercialInputV2.items` below) since a form field can only
 * ever hold a string or boolean.
 */
const itemRecord = z.record(z.string(), z.unknown());

export const invoiceCommercialInputV2 = z.strictObject({
  // Exporter
  exporterName: text.optional(),
  exporterAddress: text.optional(),
  exporterGstin: text.optional(),
  exporterIec: text.optional(),
  exporterContact: text.optional(),
  lutArn: text.optional(),
  authorizedSignatory: text.optional(),
  // Buyer / consignee
  buyerName: text.optional(),
  buyerAddress: text.optional(),
  consigneeName: text.optional(),
  consigneeAddress: text.optional(),
  destinationCountry: text.optional(),
  buyerContact: text.optional(),
  buyerTaxId: text.optional(),
  // Invoice
  invoiceNumber: text.optional(),
  invoiceDate: text.optional(),
  currency: text.optional(),
  paymentTerms: text.optional(),
  orderReference: text.optional(),
  incoterm: text.optional(),
  // Items (v2: one to a few rows; see MAX_ITEMS in measure.ts)
  items: z.union([z.string(), z.array(itemRecord)]).optional(),
  // Shipping
  packageCount: text.optional(),
  grossWeight: text.optional(),
  netWeight: text.optional(),
  shippingMode: text.optional(),
  trackingNumber: text.optional(),
  // Declarations
  gstDeclaration: text.optional(),
  exportDeclaration: text.optional(),
});

export const invoiceCommercialParamsV2 = z.strictObject({
  decimals: z.int().min(0).max(6).default(2),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

const optionalOut = z.string().nullable();

const itemOutput = z.strictObject({
  description: z.string(),
  sku: optionalOut,
  hsn: z.string(),
  quantity: z.string(),
  unit: z.string(),
  unitPrice: z.string(),
  countryOfOrigin: optionalOut,
  netWeight: optionalOut,
  lineAmount: z.string(),
});

export const invoiceCommercialOutputV2 = z.strictObject({
  exporterName: z.string(),
  exporterAddress: z.string(),
  exporterGstin: optionalOut,
  exporterIec: z.string(),
  exporterContact: z.string(),
  lutArn: optionalOut,
  buyerName: z.string(),
  buyerAddress: z.string(),
  consigneeName: optionalOut,
  consigneeAddress: optionalOut,
  destinationCountry: z.string(),
  buyerContact: optionalOut,
  buyerTaxId: optionalOut,
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  currency: z.string(),
  paymentTerms: optionalOut,
  orderReference: optionalOut,
  incoterm: optionalOut,
  items: z.array(itemOutput),
  invoiceSubtotal: z.string(),
  invoiceTotal: z.string(),
  packageCount: optionalOut,
  grossWeight: optionalOut,
  netWeight: optionalOut,
  shippingMode: optionalOut,
  trackingNumber: optionalOut,
  gstDeclaration: optionalOut,
  exportDeclaration: optionalOut,
  signatureArea: z.string(),
  working: z.array(workingStep),
});

export type InvoiceCommercialInputV2 = z.infer<typeof invoiceCommercialInputV2>;
export type InvoiceCommercialParamsV2 = z.infer<typeof invoiceCommercialParamsV2>;
export type InvoiceCommercialOutputV2 = z.infer<typeof invoiceCommercialOutputV2>;
