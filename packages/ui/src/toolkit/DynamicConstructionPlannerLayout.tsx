import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { ConstructionPlannerStudioLayoutProps } from './construction-planner/ConstructionPlannerStudioLayout.tsx';

export function DynamicConstructionPlannerLayout(props: ConstructionPlannerStudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<ConstructionPlannerStudioLayoutProps> | null>(
    null,
  );

  useEffect(() => {
    void import('./construction-planner/ConstructionPlannerStudioLayout.tsx').then((m) => {
      setComp(() => m.ConstructionPlannerStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}
