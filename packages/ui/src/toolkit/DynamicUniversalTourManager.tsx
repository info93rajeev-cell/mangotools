import { useEffect, useState } from 'preact/hooks';
import { DynamicToolTour } from './DynamicToolTour.tsx';
import type { TourStep } from './tourStorage.ts';

export const TOOLS_WITH_BUILTIN_TOUR = new Set([
  'gst-calculator',
  'profit-margin-calculator',
  'amazon-india-seller-fee-profit-estimator',
  'markup-calculator',
  'pdf-merge',
  'pdf-split',
  'compress-pdf',
  'pdf-to-word',
  'word-to-pdf',
  'jpg-to-pdf',
  'cbm-calculator',
  'container-loading-calculator',
  'pallet-loading-calculator',
  'volumetric-weight-calculator',
]);

export interface DynamicUniversalTourManagerProps {
  toolId: string;
}

export function DynamicUniversalTourManager({ toolId }: DynamicUniversalTourManagerProps) {
  const normId = toolId.replace(/^(data|logistics|pdf|image|export)\//, '');
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [steps, setSteps] = useState<TourStep[] | null>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const custom = e as CustomEvent<{ toolId?: string }>;
      if (
        !custom.detail?.toolId ||
        custom.detail.toolId === normId ||
        custom.detail.toolId === toolId
      ) {
        setIsTourOpen(true);
      }
    };
    window.addEventListener('mangotools:open-tour', handleOpen);
    return () => window.removeEventListener('mangotools:open-tour', handleOpen);
  }, [normId, toolId]);

  useEffect(() => {
    if (isTourOpen && !steps) {
      void import('./toolTourRegistry.ts').then((m) => {
        const found = m.getTourStepsForTool(normId) || m.getTourStepsForTool(toolId);
        setSteps(found);
      });
    }
  }, [isTourOpen, steps, normId, toolId]);

  if (!isTourOpen || !steps || steps.length === 0) return null;

  return (
    <DynamicToolTour
      toolId={normId}
      steps={steps}
      isOpen={isTourOpen}
      onClose={() => setIsTourOpen(false)}
    />
  );
}
