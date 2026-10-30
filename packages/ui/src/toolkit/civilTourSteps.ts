import type { TourStep } from './tourStorage.ts';

const BRICKWORK_STEPS: TourStep[] = [
  {
    id: 'brickwork-step-1',
    targetSelector: '[class*="civil-input-column"] .input-card, [data-civil-tool] form',
    stepNumber: 1,
    title: '1. Wall Dimensions & Brick Specs',
    description:
      'Choose Single Wall, Multiple Walls, or Room. Set unit (m or ft), brick standard (Modular, UK, Custom), and mortar ratio.',
    hint: 'Add openings to automatically deduct door and window cutouts.',
  },
  {
    id: 'brickwork-step-2',
    targetSelector: '[class*="pricing"], [class*="advanced-list"]',
    stepNumber: 2,
    title: '2. Optional Cost Estimation',
    description:
      'Enter rates for bricks, cement bags, sand, and masonry labor to calculate total project expense.',
  },
  {
    id: 'brickwork-step-3',
    targetSelector: '[class*="civil-result-column"] .results',
    stepNumber: 3,
    title: '3. Total Bricks & Mortar Requirements',
    description:
      'Review total bricks needed (including wastage), cement bags count, and sand volume in cubic meters/feet.',
  },
  {
    id: 'brickwork-step-4',
    targetSelector: '[class*="civil-result-column"] .output, .output',
    stepNumber: 4,
    title: '4. Print Requisition & Copy',
    description:
      'Print a clean on-site material requisition sheet for contractors or copy a structured summary.',
  },
];

const CONCRETE_STEPS: TourStep[] = [
  {
    id: 'concrete-step-1',
    targetSelector: '[class*="civil-input-column"] .input-card, [data-civil-tool] form',
    stepNumber: 1,
    title: '1. Member Type & Dimensions',
    description:
      'Select Slab, Footing, Column, Beam, or Retaining Wall and enter length, width, and depth.',
  },
  {
    id: 'concrete-step-2',
    targetSelector: '[class*="field-group"], [class*="input-card"]',
    stepNumber: 2,
    title: '2. Concrete Mix Ratio',
    description:
      'Choose standard nominal mix grade (M15, M20, M25, etc.) and specify dry volume factor (1.54×).',
  },
  {
    id: 'concrete-step-3',
    targetSelector: '[class*="civil-result-column"] .results',
    stepNumber: 3,
    title: '3. Cement, Sand & Aggregate Quantities',
    description:
      'Inspect wet volume, total dry volume, required cement bags, sand volume, and coarse aggregate metric tonnes.',
  },
  {
    id: 'concrete-step-4',
    targetSelector: '[class*="civil-result-column"] .output, .output',
    stepNumber: 4,
    title: '4. Batching Sheet & Summary',
    description: 'Print or copy site batching instructions with zero network uploads.',
  },
];

const EXCAVATION_STEPS: TourStep[] = [
  {
    id: 'excavation-step-1',
    targetSelector: '[class*="civil-input-column"] .input-card, [data-civil-tool] form',
    stepNumber: 1,
    title: '1. Trench & Pit Dimensions',
    description:
      'Specify pit length, width, excavation depth, and side slope angle for safe embankment stability.',
  },
  {
    id: 'excavation-step-2',
    targetSelector: '[class*="field-group"], [class*="input-card"]',
    stepNumber: 2,
    title: '2. Soil Type & Swell Factor',
    description:
      'Select soil classification (Ordinary Soil, Hard Rock, Sand) to calculate swell / expansion volume.',
  },
  {
    id: 'excavation-step-3',
    targetSelector: '[class*="civil-result-column"] .results',
    stepNumber: 3,
    title: '3. Earthwork Volume & Truck Loads',
    description:
      'Calculate Bank Cubic Meters (BCM), loose volume after digging, and estimated tipper truck trips.',
  },
  {
    id: 'excavation-step-4',
    targetSelector: '[class*="civil-result-column"] .output, .output',
    stepNumber: 4,
    title: '4. Export Excavation Estimate',
    description: 'Print clean earthwork report or copy volume specs for excavation contractors.',
  },
];

const PAINT_STEPS: TourStep[] = [
  {
    id: 'paint-step-1',
    targetSelector: '[class*="civil-input-column"] .input-card, [data-civil-tool] form',
    stepNumber: 1,
    title: '1. Room & Wall Dimensions',
    description:
      'Enter wall perimeter, height, ceiling area, and deduct doors and windows automatically.',
  },
  {
    id: 'paint-step-2',
    targetSelector: '[class*="field-group"], [class*="input-card"]',
    stepNumber: 2,
    title: '2. Paint Type & Number of Coats',
    description:
      'Select Interior Emulsion, Exterior Weatherproof, or Primer and enter spreading coverage rate.',
  },
  {
    id: 'paint-step-3',
    targetSelector: '[class*="civil-result-column"] .results',
    stepNumber: 3,
    title: '3. Liters Needed & Can Sizes',
    description:
      'Review total paint liters required, recommended commercial can sizes (1L, 4L, 10L, 20L), and total cost.',
  },
  {
    id: 'paint-step-4',
    targetSelector: '[class*="civil-result-column"] .output, .output',
    stepNumber: 4,
    title: '4. Procurement List',
    description: 'Print or copy paint quantity list ready for the hardware store.',
  },
];

const PLASTER_STEPS: TourStep[] = [
  {
    id: 'plaster-step-1',
    targetSelector: '[class*="civil-input-column"] .input-card, [data-civil-tool] form',
    stepNumber: 1,
    title: '1. Plaster Surface Area',
    description:
      'Input surface area (wall/ceiling), plaster thickness (12mm internal, 15/20mm external), and deductions.',
  },
  {
    id: 'plaster-step-2',
    targetSelector: '[class*="field-group"], [class*="input-card"]',
    stepNumber: 2,
    title: '2. Cement-Sand Ratio',
    description:
      'Select mortar mix ratio (1:3, 1:4, 1:6) with dry volume conversion factor (1.33×).',
  },
  {
    id: 'plaster-step-3',
    targetSelector: '[class*="civil-result-column"] .results',
    stepNumber: 3,
    title: '3. Cement Bags & Sand Volume',
    description:
      'Calculate exact cement bags required and sand volume in cubic feet or cubic meters.',
  },
  {
    id: 'plaster-step-4',
    targetSelector: '[class*="civil-result-column"] .output, .output',
    stepNumber: 4,
    title: '4. Print Material Requisition',
    description: 'Print or copy plastering materials manifest for construction site inventory.',
  },
];

const TILE_STEPS: TourStep[] = [
  {
    id: 'tile-step-1',
    targetSelector: '[class*="civil-input-column"] .input-card, [data-civil-tool] form',
    stepNumber: 1,
    title: '1. Floor Dimensions & Tile Sizes',
    description:
      'Input room length, width, tile dimensions (e.g. 600×600 mm, 300×300 mm), and grout joint width.',
  },
  {
    id: 'tile-step-2',
    targetSelector: '[class*="field-group"], [class*="input-card"]',
    stepNumber: 2,
    title: '2. Wastage & Skirting Allowance',
    description:
      'Configure cutting waste percentage (5-10% standard, 15% herringbone) and wall skirting perimeter.',
  },
  {
    id: 'tile-step-3',
    targetSelector: '[class*="civil-result-column"] .results',
    stepNumber: 3,
    title: '3. Total Tiles & Box Count',
    description:
      'View total tiles count, full boxes to purchase, adhesive bags, and grout quantity required.',
  },
  {
    id: 'tile-step-4',
    targetSelector: '[class*="civil-result-column"] .output, .output',
    stepNumber: 4,
    title: '4. Tile Procurement Sheet',
    description: 'Print or copy tile order sheet for showroom ordering.',
  },
];

export function getCivilTourSteps(toolId: string): TourStep[] | null {
  if (toolId === 'brickwork-calculator') return BRICKWORK_STEPS;
  if (toolId === 'concrete-quantity-calculator') return CONCRETE_STEPS;
  if (toolId === 'excavation-calculator') return EXCAVATION_STEPS;
  if (toolId === 'paint-calculator') return PAINT_STEPS;
  if (toolId === 'plaster-calculator') return PLASTER_STEPS;
  if (toolId === 'tile-flooring-calculator') return TILE_STEPS;
  return null;
}
