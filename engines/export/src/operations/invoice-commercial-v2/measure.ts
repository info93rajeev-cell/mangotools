import { err, ok, type Result } from '@mangotools/core';
import {
  readDate,
  readHsn,
  readOptionalGstin,
  readOptionalNonNegative,
  readOptionalPositiveInt,
  readOptionalText,
  readPositive,
  readRequiredText,
} from '../../lib/read-input.ts';
import type { InvoiceCommercialInputV2 } from './schema.ts';
import type { Item, Measured } from './types.ts';

const QTY_DECIMALS = 3;
const PRICE_DECIMALS = 4;
const WEIGHT_DECIMALS = 3;

/** Deliberately modest for this prototype — see TASK-009G report for why 5, not "unlimited". */
export const MAX_ITEMS = 5;

type Exporter = Pick<
  Measured,
  | 'exporterName'
  | 'exporterAddress'
  | 'exporterGstin'
  | 'exporterIec'
  | 'exporterContact'
  | 'lutArn'
  | 'authorizedSignatory'
>;

function measureExporter(input: InvoiceCommercialInputV2): Result<Exporter> {
  const exporterName = readRequiredText(input.exporterName, 'exporterName', 120);
  if (!exporterName.ok) return exporterName;
  const exporterAddress = readRequiredText(input.exporterAddress, 'exporterAddress', 300);
  if (!exporterAddress.ok) return exporterAddress;
  const exporterGstin = readOptionalGstin(input.exporterGstin, 'exporterGstin');
  if (!exporterGstin.ok) return exporterGstin;
  const exporterIec = readRequiredText(input.exporterIec, 'exporterIec', 20);
  if (!exporterIec.ok) return exporterIec;
  const exporterContact = readRequiredText(input.exporterContact, 'exporterContact', 120);
  if (!exporterContact.ok) return exporterContact;
  const lutArn = readOptionalText(input.lutArn, 'lutArn', 60);
  if (!lutArn.ok) return lutArn;
  const authorizedSignatory = readOptionalText(
    input.authorizedSignatory,
    'authorizedSignatory',
    120,
  );
  if (!authorizedSignatory.ok) return authorizedSignatory;
  return ok({
    exporterName: exporterName.value,
    exporterAddress: exporterAddress.value,
    exporterGstin: exporterGstin.value,
    exporterIec: exporterIec.value,
    exporterContact: exporterContact.value,
    lutArn: lutArn.value,
    authorizedSignatory: authorizedSignatory.value,
  });
}

type Buyer = Pick<
  Measured,
  | 'buyerName'
  | 'buyerAddress'
  | 'consigneeName'
  | 'consigneeAddress'
  | 'destinationCountry'
  | 'buyerContact'
  | 'buyerTaxId'
>;

function measureBuyer(input: InvoiceCommercialInputV2): Result<Buyer> {
  const buyerName = readRequiredText(input.buyerName, 'buyerName', 120);
  if (!buyerName.ok) return buyerName;
  const buyerAddress = readRequiredText(input.buyerAddress, 'buyerAddress', 300);
  if (!buyerAddress.ok) return buyerAddress;
  const consigneeName = readOptionalText(input.consigneeName, 'consigneeName', 120);
  if (!consigneeName.ok) return consigneeName;
  const consigneeAddress = readOptionalText(input.consigneeAddress, 'consigneeAddress', 300);
  if (!consigneeAddress.ok) return consigneeAddress;
  const destinationCountry = readRequiredText(input.destinationCountry, 'destinationCountry', 60);
  if (!destinationCountry.ok) return destinationCountry;
  const buyerContact = readOptionalText(input.buyerContact, 'buyerContact', 120);
  if (!buyerContact.ok) return buyerContact;
  const buyerTaxId = readOptionalText(input.buyerTaxId, 'buyerTaxId', 60);
  if (!buyerTaxId.ok) return buyerTaxId;
  return ok({
    buyerName: buyerName.value,
    buyerAddress: buyerAddress.value,
    consigneeName: consigneeName.value,
    consigneeAddress: consigneeAddress.value,
    destinationCountry: destinationCountry.value,
    buyerContact: buyerContact.value,
    buyerTaxId: buyerTaxId.value,
  });
}

type InvoiceDetails = Pick<
  Measured,
  'invoiceNumber' | 'invoiceDate' | 'currency' | 'paymentTerms' | 'orderReference' | 'incoterm'
>;

function measureInvoiceDetails(input: InvoiceCommercialInputV2): Result<InvoiceDetails> {
  const invoiceNumber = readRequiredText(input.invoiceNumber, 'invoiceNumber', 40);
  if (!invoiceNumber.ok) return invoiceNumber;
  const invoiceDate = readDate(input.invoiceDate, 'invoiceDate');
  if (!invoiceDate.ok) return invoiceDate;
  const currency = readRequiredText(input.currency, 'currency', 10);
  if (!currency.ok) return currency;
  const paymentTerms = readOptionalText(input.paymentTerms, 'paymentTerms', 120);
  if (!paymentTerms.ok) return paymentTerms;
  const orderReference = readOptionalText(input.orderReference, 'orderReference', 60);
  if (!orderReference.ok) return orderReference;
  const incoterm = readOptionalText(input.incoterm, 'incoterm', 20);
  if (!incoterm.ok) return incoterm;
  return ok({
    invoiceNumber: invoiceNumber.value,
    invoiceDate: invoiceDate.value,
    currency: currency.value,
    paymentTerms: paymentTerms.value,
    orderReference: orderReference.value,
    incoterm: incoterm.value,
  });
}

/** One row's raw shape, loose enough to accept whatever `parseItems` handed it. */
type RawItem = Record<string, unknown>;

const asRaw = (v: unknown, path: string): Result<RawItem> =>
  v !== null && typeof v === 'object' && !Array.isArray(v)
    ? ok(v as RawItem)
    : err('EXPORT_INVALID_ITEMS', { path });

function measureItem(raw: unknown, index: number): Result<Item> {
  const path = (field: string) => `items[${index}].${field}`;
  const row = asRaw(raw, path('(row)'));
  if (!row.ok) return row;
  const r = row.value;
  const description = readRequiredText(
    r.description as string | number | undefined,
    path('description'),
    200,
  );
  if (!description.ok) return description;
  const sku = readOptionalText(r.sku as string | number | undefined, path('sku'), 40);
  if (!sku.ok) return sku;
  const hsn = readHsn(r.hsn as string | number | undefined, path('hsn'));
  if (!hsn.ok) return hsn;
  const quantity = readPositive(
    r.quantity as string | number | undefined,
    path('quantity'),
    QTY_DECIMALS,
  );
  if (!quantity.ok) return quantity;
  const unit = readRequiredText(r.unit as string | number | undefined, path('unit'), 20);
  if (!unit.ok) return unit;
  const unitPrice = readPositive(
    r.unitPrice as string | number | undefined,
    path('unitPrice'),
    PRICE_DECIMALS,
  );
  if (!unitPrice.ok) return unitPrice;
  const countryOfOrigin = readOptionalText(
    r.countryOfOrigin as string | number | undefined,
    path('countryOfOrigin'),
    60,
  );
  if (!countryOfOrigin.ok) return countryOfOrigin;
  const netWeight = readOptionalNonNegative(
    r.netWeight as string | number | undefined,
    path('netWeight'),
    WEIGHT_DECIMALS,
  );
  if (!netWeight.ok) return netWeight;
  return ok({
    description: description.value,
    sku: sku.value,
    hsn: hsn.value,
    quantity: quantity.value,
    unit: unit.value,
    unitPrice: unitPrice.value,
    countryOfOrigin: countryOfOrigin.value,
    netWeight: netWeight.value,
  });
}

/**
 * Rows arrive two ways: a fixture/unit test writes a native array of row objects; the browser form
 * encodes the same array as JSON text, because a form field only ever holds a string. Either way,
 * every element is still validated field-by-field below — this only normalizes the outer shape.
 */
function parseItems(raw: InvoiceCommercialInputV2['items']): Result<unknown[]> {
  if (Array.isArray(raw)) return ok(raw);
  if (typeof raw === 'string') {
    if (raw.trim() === '') return err('EXPORT_TOO_FEW_ITEMS', { path: 'items' });
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return ok(parsed);
    } catch {
      // falls through to the invalid-items error below
    }
    return err('EXPORT_INVALID_ITEMS', { path: 'items' });
  }
  return err('EXPORT_TOO_FEW_ITEMS', { path: 'items' });
}

function measureItems(raw: InvoiceCommercialInputV2['items']): Result<Item[]> {
  const parsed = parseItems(raw);
  if (!parsed.ok) return parsed;
  if (parsed.value.length === 0) return err('EXPORT_TOO_FEW_ITEMS', { path: 'items' });
  if (parsed.value.length > MAX_ITEMS) {
    return err('EXPORT_TOO_MANY_ITEMS', { path: 'items', details: { max: MAX_ITEMS } });
  }
  const items: Item[] = [];
  for (const [index, row] of parsed.value.entries()) {
    const item = measureItem(row, index);
    if (!item.ok) return item;
    items.push(item.value);
  }
  return ok(items);
}

type Shipping = Pick<
  Measured,
  'packageCount' | 'grossWeight' | 'netWeight' | 'shippingMode' | 'trackingNumber'
>;

function measureShipping(input: InvoiceCommercialInputV2): Result<Shipping> {
  const packageCount = readOptionalPositiveInt(input.packageCount, 'packageCount');
  if (!packageCount.ok) return packageCount;
  const grossWeight = readOptionalNonNegative(input.grossWeight, 'grossWeight', WEIGHT_DECIMALS);
  if (!grossWeight.ok) return grossWeight;
  const netWeight = readOptionalNonNegative(input.netWeight, 'netWeight', WEIGHT_DECIMALS);
  if (!netWeight.ok) return netWeight;
  const shippingMode = readOptionalText(input.shippingMode, 'shippingMode', 40);
  if (!shippingMode.ok) return shippingMode;
  const trackingNumber = readOptionalText(input.trackingNumber, 'trackingNumber', 40);
  if (!trackingNumber.ok) return trackingNumber;
  return ok({
    packageCount: packageCount.value,
    grossWeight: grossWeight.value,
    netWeight: netWeight.value,
    shippingMode: shippingMode.value,
    trackingNumber: trackingNumber.value,
  });
}

type Declarations = Pick<Measured, 'gstDeclaration' | 'exportDeclaration'>;

function measureDeclarations(input: InvoiceCommercialInputV2): Result<Declarations> {
  const gstDeclaration = readOptionalText(input.gstDeclaration, 'gstDeclaration', 300);
  if (!gstDeclaration.ok) return gstDeclaration;
  const exportDeclaration = readOptionalText(input.exportDeclaration, 'exportDeclaration', 300);
  if (!exportDeclaration.ok) return exportDeclaration;
  return ok({ gstDeclaration: gstDeclaration.value, exportDeclaration: exportDeclaration.value });
}

/** Reads every field group, stopping at the first invalid one. */
export function measure(input: InvoiceCommercialInputV2): Result<Measured> {
  const exporter = measureExporter(input);
  if (!exporter.ok) return exporter;
  const buyer = measureBuyer(input);
  if (!buyer.ok) return buyer;
  const invoiceDetails = measureInvoiceDetails(input);
  if (!invoiceDetails.ok) return invoiceDetails;
  const items = measureItems(input.items);
  if (!items.ok) return items;
  const shipping = measureShipping(input);
  if (!shipping.ok) return shipping;
  const declarations = measureDeclarations(input);
  if (!declarations.ok) return declarations;
  return ok({
    ...exporter.value,
    ...buyer.value,
    ...invoiceDetails.value,
    items: items.value,
    ...shipping.value,
    ...declarations.value,
  });
}
