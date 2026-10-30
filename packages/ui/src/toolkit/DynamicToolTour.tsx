import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { ToolOnboardingTourProps } from './tourStorage.ts';

export function DynamicToolTour(props: ToolOnboardingTourProps) {
  const [Comp, setComp] = useState<ComponentType<ToolOnboardingTourProps> | null>(null);

  useEffect(() => {
    if (props.isOpen && !Comp) {
      void import('./ToolOnboardingTour.tsx').then((m) => {
        setComp(() => m.ToolOnboardingTour);
      });
    }
  }, [props.isOpen, Comp]);

  if (!props.isOpen || !Comp) return null;
  return <Comp {...props} />;
}
