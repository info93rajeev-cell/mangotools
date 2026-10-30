import type { TourStep } from './tourStorage.ts';

const INVOICE_STEPS: TourStep[] = [
  {
    id: 'invoice-step-details',
    targetSelector: '[class*="calculator"] [class*="panel"]:first-child',
    stepNumber: 1,
    title: '1. Exporter & Buyer Information',
    description:
      'Enter exporter, consignee/buyer name, invoice number, invoice date, currency, and payment terms.',
  },
  {
    id: 'invoice-step-items',
    targetSelector: '[class*="itemRows"], [class*="itemsForm"], form',
    stepNumber: 2,
    title: '2. Product Line Items & HS Codes',
    description:
      'Add up to 5 export merchandise items with HS Code, unit price, quantity, packages count, and description.',
  },
  {
    id: 'invoice-step-results',
    targetSelector: '[class*="InvoiceItemsResult"], [class*="result"]',
    stepNumber: 3,
    title: '3. FOB/CIF Totals & Official Draft',
    description:
      'Verify calculated merchandise totals, freight charges, insurance, and print or export an official invoice draft.',
  },
];

const PACKING_LIST_STEPS: TourStep[] = [
  {
    id: 'packing-step-details',
    targetSelector: '[class*="calculator"] [class*="panel"]:first-child',
    stepNumber: 1,
    title: '1. Transport & Vessel Details',
    description:
      'Enter vessel / flight details, bill of lading / airway bill, port of loading, and port of discharge.',
  },
  {
    id: 'packing-step-items',
    targetSelector: '[class*="itemRows"], [class*="itemsForm"], form',
    stepNumber: 2,
    title: '2. Carton Marks & Dimensions',
    description:
      'Enter box marks, numbers, outer packaging types, gross weight, net weight, and dimensional measurements.',
  },
  {
    id: 'packing-step-results',
    targetSelector: '[class*="PackingListResult"], [class*="result"]',
    stepNumber: 3,
    title: '3. Total CBM & Shipping Manifest',
    description:
      'Inspect total packages, total gross weight, net weight, and total volume (CBM). Print or copy shipping manifest.',
  },
];

export function getExportTourSteps(toolId: string): TourStep[] | null {
  if (toolId === 'export-commercial-invoice-generator' || toolId === 'export/invoice-commercial') {
    return INVOICE_STEPS;
  }
  if (toolId === 'export-packing-list-generator' || toolId === 'export/packing-list') {
    return PACKING_LIST_STEPS;
  }
  return null;
}
