import { z } from 'zod';

const text = z.union([z.string(), z.number()]);

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

export const invoiceCommercialInput = z.strictObject({
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
  // Product / item (v1: one item row)
  itemDescription: text.optional(),
  itemSku: text.optional(),
  itemHsn: text.optional(),
  itemQuantity: text.optional(),
  itemUnit: text.optional(),
  itemUnitPrice: text.optional(),
  itemCountryOfOrigin: text.optional(),
  itemNetWeight: text.optional(),
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

export const invoiceCommercialParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(2),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

const optionalOut = z.string().nullable();

export const invoiceCommercialOutput = z.strictObject({
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
  itemDescription: z.string(),
  itemSku: optionalOut,
  itemHsn: z.string(),
  itemQuantity: z.string(),
  itemUnit: z.string(),
  itemUnitPrice: z.string(),
  itemCountryOfOrigin: optionalOut,
  itemNetWeight: optionalOut,
  itemLineTotal: z.string(),
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

export type InvoiceCommercialInput = z.infer<typeof invoiceCommercialInput>;
export type InvoiceCommercialParams = z.infer<typeof invoiceCommercialParams>;
export type InvoiceCommercialOutput = z.infer<typeof invoiceCommercialOutput>;
