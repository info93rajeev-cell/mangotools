import { getCivilTourSteps } from './civilTourSteps.ts';
import { getDataStudioTourSteps } from './data-studio/dataStudioTourSteps.ts';
import { getExportTourSteps } from './exportTourSteps.ts';
import { getImageTourSteps } from './imageTourSteps.ts';
import { getPdfTourSteps, type PdfToolTab } from './pdfTourSteps.ts';
import type { TourStep } from './tourStorage.ts';

const BUSINESS_STEPS: Record<string, TourStep[]> = {
  'gst-calculator': [
    {
      id: 'step-inputs',
      targetSelector: '[data-tour="inputs"], [class*="inputsCard"]',
      stepNumber: 1,
      title: '1. Enter Amount & Quantity',
      description:
        'Type your transaction price, item quantity, discount, and optional shipping charges.',
    },
    {
      id: 'step-slabs',
      targetSelector: '[data-tour="country-options"], [class*="slabsCard"]',
      stepNumber: 2,
      title: '2. Tax Slab & Supply Type',
      description:
        'Select Intra-State (CGST + SGST) or Inter-State (IGST) and choose the applicable GST rate.',
    },
    {
      id: 'step-results',
      targetSelector: '[data-tour="results"], [class*="resultsCard"]',
      stepNumber: 3,
      title: '3. Real-Time Tax Breakdown',
      description: 'Review net taxable value, exact tax breakdown, and visual distribution chart.',
    },
  ],
  'profit-margin-calculator': [
    {
      id: 'step-costs',
      targetSelector: '[class*="leftCard"], [class*="cost"]',
      stepNumber: 1,
      title: '1. Cost of Goods & Selling Price',
      description:
        'Enter item cost price, desired selling price, packaging expenses, and shipping costs.',
    },
    {
      id: 'step-fees',
      targetSelector: '[class*="fees"], [class*="centerCard"]',
      stepNumber: 2,
      title: '2. Marketplace Fees & Tax',
      description: 'Configure marketplace referral percentage, payment gateway charges, and GST.',
    },
    {
      id: 'step-margin',
      targetSelector: '[class*="rightCard"], [class*="result"]',
      stepNumber: 3,
      title: '3. Net Profit Margin & ROI',
      description:
        'Inspect net profit in currency, profit margin %, markup %, and break-even sales price.',
    },
  ],
  'amazon-india-seller-fee-profit-estimator': [
    {
      id: 'step-product',
      targetSelector: '[class*="product"], [class*="left"]',
      stepNumber: 1,
      title: '1. Product Category & Price',
      description:
        'Select Amazon category, listing selling price, and weight tier (Standard/Heavy).',
    },
    {
      id: 'step-fulfillment',
      targetSelector: '[class*="fulfillment"], [class*="center"]',
      stepNumber: 2,
      title: '2. Fulfillment Channel',
      description:
        'Choose FBA, Easy Ship, or Self Ship with accurate pick & pack, closing, and weight handling fees.',
    },
    {
      id: 'step-payout',
      targetSelector: '[class*="payout"], [class*="right"]',
      stepNumber: 3,
      title: '3. Net Seller Payout',
      description:
        'View total Amazon fee deductions, GST on fees, and your net take-home bank disbursement.',
    },
  ],
  'markup-calculator': [
    {
      id: 'step-cost',
      targetSelector: '[class*="cost"], [class*="left"]',
      stepNumber: 1,
      title: '1. Base Cost Price',
      description: 'Enter cost of goods or production expense.',
    },
    {
      id: 'step-markup',
      targetSelector: '[class*="markup"], [class*="center"]',
      stepNumber: 2,
      title: '2. Desired Markup %',
      description:
        'Set desired percentage markup to automatically compute final retail selling price.',
    },
    {
      id: 'step-profit',
      targetSelector: '[class*="profit"], [class*="right"]',
      stepNumber: 3,
      title: '3. Gross Profit & Margin',
      description:
        'Compare markup percentage with gross margin percentage and total profit amount.',
    },
  ],
};

const LOGISTICS_STEPS: Record<string, TourStep[]> = {
  'cbm-calculator': [
    {
      id: 'cbm-1',
      targetSelector: '[data-cbm-workspace] [class*="leftCard"]',
      stepNumber: 1,
      title: '1. Package Dimensions & Count',
      description: 'Enter length, width, height, weight, and quantity of your boxes or crates.',
    },
    {
      id: 'cbm-2',
      targetSelector: '[data-cbm-workspace] [class*="optionsSlot"]',
      stepNumber: 2,
      title: '2. Units & Freight Rates',
      description: 'Switch between cm/in and kg/lb, set ocean freight or air freight divisors.',
    },
    {
      id: 'cbm-3',
      targetSelector: '[data-cbm-workspace] [class*="resultsSlot"]',
      stepNumber: 3,
      title: '3. Total CBM & Chargeable Weight',
      description: 'Review total cubic volume, gross weight, dimensional weight, and freight cost.',
    },
  ],
  'container-loading-calculator': [
    {
      id: 'cnt-1',
      targetSelector: '[data-container-workspace] [class*="left"]',
      stepNumber: 1,
      title: '1. Cargo Specifications',
      description: 'Input box dimensions, unit weights, and max allowed stacking height.',
    },
    {
      id: 'cnt-2',
      targetSelector: '[data-container-workspace] [class*="selection"]',
      stepNumber: 2,
      title: '2. Select Ocean Container',
      description: 'Choose standard 20ft Dry, 40ft Dry, 40ft High Cube, or custom container.',
    },
    {
      id: 'cnt-3',
      targetSelector: '[data-container-workspace] [class*="right"]',
      stepNumber: 3,
      title: '3. Capacity & 3D Stacking Plan',
      description: 'Inspect maximum box capacity, volume utilization %, and interactive 3D plan.',
    },
  ],
  'pallet-loading-calculator': [
    {
      id: 'plt-1',
      targetSelector: '[data-pallet-loading-workspace] [class*="palletInputs"]',
      stepNumber: 1,
      title: '1. Pallet Type & Carton Sizes',
      description:
        'Select Euro Pallet (EUR 1), US Industrial, or custom pallet, then enter box sizes.',
    },
    {
      id: 'plt-2',
      targetSelector: '[data-pallet-loading-workspace] [class*="palletResults"]',
      stepNumber: 2,
      title: '2. Pallet Capacity & Efficiency',
      description:
        'View cartons per layer, total layers, total load weight, and volume efficiency.',
    },
    {
      id: 'plt-3',
      targetSelector: '[data-pallet-loading-workspace] [class*="canvasCard"]',
      stepNumber: 3,
      title: '3. 3D Pallet Stacking Inspection',
      description: 'Rotate and zoom the 3D model to inspect interlocking patterns.',
    },
  ],
  'volumetric-weight-calculator': [
    {
      id: 'vol-1',
      targetSelector: '[data-volumetric-weight-workspace] [class*="left"]',
      stepNumber: 1,
      title: '1. Package Measurements',
      description: 'Enter package dimensions (length, width, height) and actual dead scale weight.',
    },
    {
      id: 'vol-2',
      targetSelector: '[data-volumetric-weight-workspace] [class*="right"]',
      stepNumber: 2,
      title: '2. Courier Divisors & Billable Weight',
      description: 'Compare IATA Air (6000), Courier (5000), and Sea Freight chargeable weights.',
    },
  ],
};

function getPdfStepsByToolId(toolId: string): TourStep[] | null {
  const map: Record<string, PdfToolTab> = {
    'pdf-merge': 'merge',
    'pdf-split': 'split',
    'compress-pdf': 'compress',
    'pdf-to-word': 'pdfToWord',
    'word-to-pdf': 'wordToPdf',
  };
  const tab = map[toolId];
  if (tab) return getPdfTourSteps(tab);
  if (toolId === 'jpg-to-pdf') {
    return [
      {
        id: 'jpg2pdf-step-1',
        targetSelector: '[data-tour="pdf-upload"]',
        stepNumber: 1,
        title: '1. Select JPG Images',
        description: 'Upload your photos or documents. You can select multiple images at once.',
      },
      {
        id: 'jpg2pdf-step-2',
        targetSelector: '[data-tour="pdf-arrange"]',
        stepNumber: 2,
        title: '2. Arrange Page Order',
        description: 'Reorder pages using the arrow buttons or drag handles to set page sequence.',
      },
      {
        id: 'jpg2pdf-step-3',
        targetSelector: '[data-tour="pdf-action"]',
        stepNumber: 3,
        title: '3. Create & Download PDF',
        description: 'Configure page size (A4/Letter), margins, and click "Create PDF".',
      },
    ];
  }
  return null;
}

export function getTourStepsForTool(toolId: string): TourStep[] | null {
  const normId = toolId.replace(/^(data|logistics|pdf|image|export)\//, '');
  const pdfSteps = getPdfStepsByToolId(toolId) || getPdfStepsByToolId(normId);
  if (pdfSteps) return pdfSteps;

  const logistics = LOGISTICS_STEPS[toolId] || LOGISTICS_STEPS[normId];
  if (logistics) return logistics;

  const business = BUSINESS_STEPS[toolId] || BUSINESS_STEPS[normId];
  if (business) return business;

  const dataSteps = getDataStudioTourSteps(toolId) || getDataStudioTourSteps(normId);
  if (dataSteps) return dataSteps;

  const imageSteps = getImageTourSteps(toolId) || getImageTourSteps(normId);
  if (imageSteps) return imageSteps;

  const exportSteps = getExportTourSteps(toolId) || getExportTourSteps(normId);
  if (exportSteps) return exportSteps;

  const civilSteps = getCivilTourSteps(toolId) || getCivilTourSteps(normId);
  if (civilSteps) return civilSteps;

  return null;
}
