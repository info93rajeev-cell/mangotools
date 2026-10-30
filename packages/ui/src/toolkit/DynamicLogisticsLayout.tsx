import type { ResolvedPreset } from '@mangotools/schemas';
import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { ToolIslandProps } from './ToolIsland.tsx';
import { isTourCompleted, ToolOnboardingTour, type TourStep } from './ToolOnboardingTour.tsx';

const CBM_STEPS: TourStep[] = [
  {
    id: 'cbm-step-worksheet',
    targetSelector: '[data-cbm-workspace] [class*="leftCard"]',
    stepNumber: 1,
    title: '1. Package Dimensions & Count',
    description: 'Enter length, width, height, weight, and quantity of your boxes or crates.',
    hint: 'Add multiple line items to calculate an entire consolidated shipment.',
  },
  {
    id: 'cbm-step-options',
    targetSelector: '[data-cbm-workspace] [class*="optionsSlot"]',
    stepNumber: 2,
    title: '2. Units & Freight Rates',
    description:
      'Switch between cm/in and kg/lb, set ocean freight or air freight divisors, and enter rate per CBM.',
  },
  {
    id: 'cbm-step-results',
    targetSelector: '[data-cbm-workspace] [class*="resultsSlot"]',
    stepNumber: 3,
    title: '3. Instant Total CBM & Chargeable Weight',
    description:
      'Review total cubic volume, gross weight, dimensional weight, and freight cost calculations.',
    hint: '100% in-browser calculations with zero precision loss.',
  },
  {
    id: 'cbm-step-actions',
    targetSelector: '[data-cbm-workspace] [class*="outputActionsSlot"]',
    stepNumber: 4,
    title: '4. Export & 3D Visualizer',
    description:
      'Copy a structured shipment summary, print a clean manifest, or toggle the interactive 3D box view.',
  },
];

const CONTAINER_STEPS: TourStep[] = [
  {
    id: 'container-step-cargo',
    targetSelector: '[data-container-workspace] [class*="left"]',
    stepNumber: 1,
    title: '1. Cargo Specifications',
    description:
      'Input box dimensions, unit weights, and max allowed stacking height or orientations.',
  },
  {
    id: 'container-step-selection',
    targetSelector: '[data-container-workspace] [class*="selection"]',
    stepNumber: 2,
    title: '2. Select Ocean Container',
    description:
      'Choose standard 20ft Dry, 40ft Dry, 40ft High Cube, or custom container dimensions.',
  },
  {
    id: 'container-step-results',
    targetSelector: '[data-container-workspace] [class*="right"]',
    stepNumber: 3,
    title: '3. Capacity & 3D Stacking Plan',
    description:
      'Inspect maximum box capacity, total volume utilization %, remaining space, and interactive 3D container plan.',
  },
];

const PALLET_STEPS: TourStep[] = [
  {
    id: 'pallet-step-inputs',
    targetSelector: '[data-pallet-loading-workspace] [class*="palletInputs"]',
    stepNumber: 1,
    title: '1. Pallet Type & Carton Sizes',
    description:
      'Select standard Euro Pallet (EUR 1), US Industrial, or custom pallet dimensions, then enter box sizes.',
  },
  {
    id: 'pallet-step-results',
    targetSelector: '[data-pallet-loading-workspace] [class*="palletResults"]',
    stepNumber: 2,
    title: '2. Pallet Capacity & Efficiency',
    description:
      'View cartons per layer, total layers, total load weight, and volume efficiency percentage.',
  },
  {
    id: 'pallet-step-3d',
    targetSelector: '[data-pallet-loading-workspace] [class*="canvasCard"]',
    stepNumber: 3,
    title: '3. 3D Pallet Stacking Inspection',
    description:
      'Rotate and zoom the 3D model to inspect interlocking patterns and verify overhang limits.',
  },
];

const VOLUMETRIC_STEPS: TourStep[] = [
  {
    id: 'volumetric-step-items',
    targetSelector: '[data-volumetric-weight-workspace] [class*="left"]',
    stepNumber: 1,
    title: '1. Package Measurements',
    description:
      'Enter your package dimensions (length, width, height) and actual dead scale weight.',
  },
  {
    id: 'volumetric-step-results',
    targetSelector: '[data-volumetric-weight-workspace] [class*="right"]',
    stepNumber: 2,
    title: '2. Courier Divisors & Billable Weight',
    description:
      'Compare IATA Air Freight (6000), Express Courier (5000), and Sea Freight to find your billable chargeable weight.',
  },
];

function getLogisticsTour(toolId: string): { toolId: string; steps: TourStep[] } | null {
  if (toolId === 'pallet-loading-calculator' || toolId === 'logistics/pallet') {
    return { toolId: 'pallet-loading-calculator', steps: PALLET_STEPS };
  }
  if (toolId === 'volumetric-weight-calculator' || toolId === 'logistics/volumetric') {
    return { toolId: 'volumetric-weight-calculator', steps: VOLUMETRIC_STEPS };
  }
  if (toolId === 'cbm-calculator' || toolId === 'logistics/cbm-shipment') {
    return { toolId: 'cbm-calculator', steps: CBM_STEPS };
  }
  if (toolId === 'container-loading-calculator' || toolId === 'logistics/container-load') {
    return { toolId: 'container-loading-calculator', steps: CONTAINER_STEPS };
  }
  return null;
}

/**
 * Unified lazy loader for logistics studio workspaces.
 * Keeps entry bundles well under strict post-build JS budgets.
 */
export function DynamicLogisticsLayout(props: ToolIslandProps) {
  const [Comp, setComp] = useState<ComponentType<{ preset?: ResolvedPreset }> | null>(null);
  const toolKey = props.toolId || props.preset.id;
  const tour = getLogisticsTour(toolKey);
  const [isTourOpen, setIsTourOpen] = useState(() =>
    tour ? !isTourCompleted(tour.toolId) : false,
  );

  useEffect(() => {
    const id = props.toolId || props.preset.id;
    if (id === 'pallet-loading-calculator' || id === 'logistics/pallet') {
      void import('./PalletLoadingLayout.tsx').then((m) => {
        setComp(() => m.PalletLoadingLayout);
      });
    } else if (id === 'volumetric-weight-calculator' || id === 'logistics/volumetric') {
      void import('./VolumetricWeightLayout.tsx').then((m) => {
        setComp(() => m.VolumetricWeightLayout);
      });
    } else if (id === 'cbm-calculator' || id === 'logistics/cbm-shipment') {
      void import('./CbmShipmentLayout.tsx').then((m) => {
        setComp(() => m.CbmShipmentLayout);
      });
    } else {
      void import('./ContainerLoadingLayout.tsx').then((m) => {
        setComp(() => m.ContainerLoadingLayout);
      });
    }
  }, [props.toolId, props.preset.id]);

  if (!Comp) return null;
  return (
    <>
      <Comp preset={props.preset} />
      {tour ? (
        <ToolOnboardingTour
          toolId={tour.toolId}
          steps={tour.steps}
          isOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
        />
      ) : null}
    </>
  );
}

export {
  DynamicLogisticsLayout as DynamicContainerLoadingLayout,
  DynamicLogisticsLayout as DynamicCbmShipmentLayout,
  DynamicLogisticsLayout as DynamicPalletLoadingLayout,
  DynamicLogisticsLayout as DynamicVolumetricWeightLayout,
};
