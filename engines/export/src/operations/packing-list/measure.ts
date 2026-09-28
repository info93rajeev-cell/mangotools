import { ok, type Result } from '@mangotools/core';
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
import type { PackingListInput } from './schema.ts';
import type { Measured } from './types.ts';

const QTY_DECIMALS = 3;
const WEIGHT_DECIMALS = 3;

type Exporter = Pick<
  Measured,
  'exporterName' | 'exporterAddress' | 'exporterIec' | 'exporterGstin' | 'exporterContact'
>;

function measureExporter(input: PackingListInput): Result<Exporter> {
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

function measureBuyer(input: PackingListInput): Result<Buyer> {
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

function measureDocument(input: PackingListInput): Result<Document> {
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

type Item = Pick<
  Measured,
  'itemDescription' | 'itemSku' | 'itemHsn' | 'itemCountryOfOrigin' | 'itemQuantity' | 'itemUnit'
>;

function measureItem(input: PackingListInput): Result<Item> {
  const itemDescription = readRequiredText(input.itemDescription, 'itemDescription', 200);
  if (!itemDescription.ok) return itemDescription;
  const itemSku = readOptionalText(input.itemSku, 'itemSku', 40);
  if (!itemSku.ok) return itemSku;
  const itemHsn = readOptionalHsn(input.itemHsn, 'itemHsn');
  if (!itemHsn.ok) return itemHsn;
  const itemCountryOfOrigin = readOptionalText(
    input.itemCountryOfOrigin,
    'itemCountryOfOrigin',
    60,
  );
  if (!itemCountryOfOrigin.ok) return itemCountryOfOrigin;
  const itemQuantity = readPositive(input.itemQuantity, 'itemQuantity', QTY_DECIMALS);
  if (!itemQuantity.ok) return itemQuantity;
  const itemUnit = readRequiredText(input.itemUnit, 'itemUnit', 20);
  if (!itemUnit.ok) return itemUnit;
  return ok({
    itemDescription: itemDescription.value,
    itemSku: itemSku.value,
    itemHsn: itemHsn.value,
    itemCountryOfOrigin: itemCountryOfOrigin.value,
    itemQuantity: itemQuantity.value,
    itemUnit: itemUnit.value,
  });
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

function measurePacking(input: PackingListInput): Result<Packing> {
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

function measureDeclaration(input: PackingListInput): Result<Declaration> {
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
export function measure(input: PackingListInput): Result<Measured> {
  const exporter = measureExporter(input);
  if (!exporter.ok) return exporter;
  const buyer = measureBuyer(input);
  if (!buyer.ok) return buyer;
  const doc = measureDocument(input);
  if (!doc.ok) return doc;
  const item = measureItem(input);
  if (!item.ok) return item;
  const packing = measurePacking(input);
  if (!packing.ok) return packing;
  const declaration = measureDeclaration(input);
  if (!declaration.ok) return declaration;
  return ok({
    ...exporter.value,
    ...buyer.value,
    ...doc.value,
    ...item.value,
    ...packing.value,
    ...declaration.value,
  });
}
