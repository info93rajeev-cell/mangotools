import { err, ok, type Result } from '@mangotools/core';
import {
  readDate,
  readOptionalDate,
  readOptionalGstin,
  readOptionalHsn,
  readOptionalText,
  readPositive,
  readPositiveInt,
  readRequiredText,
} from '../../lib/read-input.ts';
import type { PackingListInputV2 } from './schema.ts';
import type { Item, Measured } from './types.ts';

const QTY_DECIMALS = 3;
const WEIGHT_DECIMALS = 3;

/** Deliberately modest for this prototype, matching Invoice's own cap — see TASK-009I's report. */
export const MAX_ITEMS = 5;

type Exporter = Pick<
  Measured,
  'exporterName' | 'exporterAddress' | 'exporterIec' | 'exporterGstin' | 'exporterContact'
>;

function measureExporter(input: PackingListInputV2): Result<Exporter> {
  const exporterName = readRequiredText(input.exporterName, 'exporterName', 120);
  if (!exporterName.ok) return exporterName;
  const exporterAddress = readRequiredText(input.exporterAddress, 'exporterAddress', 300);
  if (!exporterAddress.ok) return exporterAddress;
  const exporterIec = readRequiredText(input.exporterIec, 'exporterIec', 20);
  if (!exporterIec.ok) return exporterIec;
  const exporterGstin = readOptionalGstin(input.exporterGstin, 'exporterGstin');
  if (!exporterGstin.ok) return exporterGstin;
  const exporterContact = readOptionalText(input.exporterContact, 'exporterContact', 120);
  if (!exporterContact.ok) return exporterContact;
  return ok({
    exporterName: exporterName.value,
    exporterAddress: exporterAddress.value,
    exporterIec: exporterIec.value,
    exporterGstin: exporterGstin.value,
    exporterContact: exporterContact.value,
  });
}

type Buyer = Pick<
  Measured,
  'buyerName' | 'buyerAddress' | 'consigneeName' | 'consigneeAddress' | 'destinationCountry'
>;

function measureBuyer(input: PackingListInputV2): Result<Buyer> {
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
  return ok({
    buyerName: buyerName.value,
    buyerAddress: buyerAddress.value,
    consigneeName: consigneeName.value,
    consigneeAddress: consigneeAddress.value,
    destinationCountry: destinationCountry.value,
  });
}

type Document = Pick<
  Measured,
  | 'packingListNumber'
  | 'packingListDate'
  | 'invoiceNumber'
  | 'invoiceDate'
  | 'orderReference'
  | 'shippingMode'
  | 'trackingNumber'
>;

function measureDocument(input: PackingListInputV2): Result<Document> {
  const packingListNumber = readRequiredText(input.packingListNumber, 'packingListNumber', 40);
  if (!packingListNumber.ok) return packingListNumber;
  const packingListDate = readDate(input.packingListDate, 'packingListDate');
  if (!packingListDate.ok) return packingListDate;
  const invoiceNumber = readOptionalText(input.invoiceNumber, 'invoiceNumber', 40);
  if (!invoiceNumber.ok) return invoiceNumber;
  const invoiceDate = readOptionalDate(input.invoiceDate, 'invoiceDate');
  if (!invoiceDate.ok) return invoiceDate;
  const orderReference = readOptionalText(input.orderReference, 'orderReference', 60);
  if (!orderReference.ok) return orderReference;
  const shippingMode = readOptionalText(input.shippingMode, 'shippingMode', 40);
  if (!shippingMode.ok) return shippingMode;
  const trackingNumber = readOptionalText(input.trackingNumber, 'trackingNumber', 60);
  if (!trackingNumber.ok) return trackingNumber;
  return ok({
    packingListNumber: packingListNumber.value,
    packingListDate: packingListDate.value,
    invoiceNumber: invoiceNumber.value,
    invoiceDate: invoiceDate.value,
    orderReference: orderReference.value,
    shippingMode: shippingMode.value,
    trackingNumber: trackingNumber.value,
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
  const hsn = readOptionalHsn(r.hsn as string | number | undefined, path('hsn'));
  if (!hsn.ok) return hsn;
  const countryOfOrigin = readOptionalText(
    r.countryOfOrigin as string | number | undefined,
    path('countryOfOrigin'),
    60,
  );
  if (!countryOfOrigin.ok) return countryOfOrigin;
  const quantity = readPositive(
    r.quantity as string | number | undefined,
    path('quantity'),
    QTY_DECIMALS,
  );
  if (!quantity.ok) return quantity;
  const unit = readRequiredText(r.unit as string | number | undefined, path('unit'), 20);
  if (!unit.ok) return unit;
  return ok({
    description: description.value,
    sku: sku.value,
    hsn: hsn.value,
    countryOfOrigin: countryOfOrigin.value,
    quantity: quantity.value,
    unit: unit.value,
  });
}

/**
 * Rows arrive two ways: a fixture/unit test writes a native array of row objects; the browser form
 * encodes the same array as JSON text, because a form field only ever holds a string. Either way,
 * every element is still validated field-by-field below — this only normalizes the outer shape.
 */
function parseItems(raw: PackingListInputV2['items']): Result<unknown[]> {
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

function measureItems(raw: PackingListInputV2['items']): Result<Item[]> {
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

type Packing = Pick<
  Measured,
  | 'packageCount'
  | 'packageType'
  | 'shippingMarks'
  | 'weightUnit'
  | 'netWeight'
  | 'grossWeight'
  | 'dimensions'
>;

function measurePacking(input: PackingListInputV2): Result<Packing> {
  const packageCount = readPositiveInt(input.packageCount, 'packageCount');
  if (!packageCount.ok) return packageCount;
  const packageType = readOptionalText(input.packageType, 'packageType', 40);
  if (!packageType.ok) return packageType;
  const shippingMarks = readOptionalText(input.shippingMarks, 'shippingMarks', 200);
  if (!shippingMarks.ok) return shippingMarks;
  const netWeight = readPositive(input.netWeight, 'netWeight', WEIGHT_DECIMALS);
  if (!netWeight.ok) return netWeight;
  const grossWeight = readPositive(input.grossWeight, 'grossWeight', WEIGHT_DECIMALS);
  if (!grossWeight.ok) return grossWeight;
  const dimensions = readOptionalText(input.dimensions, 'dimensions', 60);
  if (!dimensions.ok) return dimensions;
  return ok({
    packageCount: packageCount.value,
    packageType: packageType.value,
    shippingMarks: shippingMarks.value,
    weightUnit: input.weightUnit,
    netWeight: netWeight.value,
    grossWeight: grossWeight.value,
    dimensions: dimensions.value,
  });
}

type Declaration = Pick<Measured, 'declarationText' | 'authorizedSignatory'>;

function measureDeclaration(input: PackingListInputV2): Result<Declaration> {
  const declarationText = readOptionalText(input.declarationText, 'declarationText', 300);
  if (!declarationText.ok) return declarationText;
  const authorizedSignatory = readOptionalText(
    input.authorizedSignatory,
    'authorizedSignatory',
    120,
  );
  if (!authorizedSignatory.ok) return authorizedSignatory;
  return ok({
    declarationText: declarationText.value,
    authorizedSignatory: authorizedSignatory.value,
  });
}

/** Reads every field group, stopping at the first invalid one. */
export function measure(input: PackingListInputV2): Result<Measured> {
  const exporter = measureExporter(input);
  if (!exporter.ok) return exporter;
  const buyer = measureBuyer(input);
  if (!buyer.ok) return buyer;
  const doc = measureDocument(input);
  if (!doc.ok) return doc;
  const items = measureItems(input.items);
  if (!items.ok) return items;
  const packing = measurePacking(input);
  if (!packing.ok) return packing;
  const declaration = measureDeclaration(input);
  if (!declaration.ok) return declaration;
  return ok({
    ...exporter.value,
    ...buyer.value,
    ...doc.value,
    items: items.value,
    ...packing.value,
    ...declaration.value,
  });
}
