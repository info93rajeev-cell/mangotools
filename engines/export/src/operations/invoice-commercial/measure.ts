import { ok, type Result } from '@mangotools/core';
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
import type { InvoiceCommercialInput } from './schema.ts';
import type { Measured } from './types.ts';

const QTY_DECIMALS = 3;
const PRICE_DECIMALS = 4;
const WEIGHT_DECIMALS = 3;

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

function measureExporter(input: InvoiceCommercialInput): Result<Exporter> {
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

function measureBuyer(input: InvoiceCommercialInput): Result<Buyer> {
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

function measureInvoiceDetails(input: InvoiceCommercialInput): Result<InvoiceDetails> {
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

type Item = Pick<
  Measured,
  | 'itemDescription'
  | 'itemSku'
  | 'itemHsn'
  | 'itemQuantity'
  | 'itemUnit'
  | 'itemUnitPrice'
  | 'itemCountryOfOrigin'
  | 'itemNetWeight'
>;

function measureItem(input: InvoiceCommercialInput): Result<Item> {
  const itemDescription = readRequiredText(input.itemDescription, 'itemDescription', 200);
  if (!itemDescription.ok) return itemDescription;
  const itemSku = readOptionalText(input.itemSku, 'itemSku', 40);
  if (!itemSku.ok) return itemSku;
  const itemHsn = readHsn(input.itemHsn, 'itemHsn');
  if (!itemHsn.ok) return itemHsn;
  const itemQuantity = readPositive(input.itemQuantity, 'itemQuantity', QTY_DECIMALS);
  if (!itemQuantity.ok) return itemQuantity;
  const itemUnit = readRequiredText(input.itemUnit, 'itemUnit', 20);
  if (!itemUnit.ok) return itemUnit;
  const itemUnitPrice = readPositive(input.itemUnitPrice, 'itemUnitPrice', PRICE_DECIMALS);
  if (!itemUnitPrice.ok) return itemUnitPrice;
  const itemCountryOfOrigin = readOptionalText(
    input.itemCountryOfOrigin,
    'itemCountryOfOrigin',
    60,
  );
  if (!itemCountryOfOrigin.ok) return itemCountryOfOrigin;
  const itemNetWeight = readOptionalNonNegative(
    input.itemNetWeight,
    'itemNetWeight',
    WEIGHT_DECIMALS,
  );
  if (!itemNetWeight.ok) return itemNetWeight;
  return ok({
    itemDescription: itemDescription.value,
    itemSku: itemSku.value,
    itemHsn: itemHsn.value,
    itemQuantity: itemQuantity.value,
    itemUnit: itemUnit.value,
    itemUnitPrice: itemUnitPrice.value,
    itemCountryOfOrigin: itemCountryOfOrigin.value,
    itemNetWeight: itemNetWeight.value,
  });
}

type Shipping = Pick<
  Measured,
  'packageCount' | 'grossWeight' | 'netWeight' | 'shippingMode' | 'trackingNumber'
>;

function measureShipping(input: InvoiceCommercialInput): Result<Shipping> {
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

function measureDeclarations(input: InvoiceCommercialInput): Result<Declarations> {
  const gstDeclaration = readOptionalText(input.gstDeclaration, 'gstDeclaration', 300);
  if (!gstDeclaration.ok) return gstDeclaration;
  const exportDeclaration = readOptionalText(input.exportDeclaration, 'exportDeclaration', 300);
  if (!exportDeclaration.ok) return exportDeclaration;
  return ok({ gstDeclaration: gstDeclaration.value, exportDeclaration: exportDeclaration.value });
}

/** Reads every field group, stopping at the first invalid one. */
export function measure(input: InvoiceCommercialInput): Result<Measured> {
  const exporter = measureExporter(input);
  if (!exporter.ok) return exporter;
  const buyer = measureBuyer(input);
  if (!buyer.ok) return buyer;
  const invoiceDetails = measureInvoiceDetails(input);
  if (!invoiceDetails.ok) return invoiceDetails;
  const item = measureItem(input);
  if (!item.ok) return item;
  const shipping = measureShipping(input);
  if (!shipping.ok) return shipping;
  const declarations = measureDeclarations(input);
  if (!declarations.ok) return declarations;
  return ok({
    ...exporter.value,
    ...buyer.value,
    ...invoiceDetails.value,
    ...item.value,
    ...shipping.value,
    ...declarations.value,
  });
}
