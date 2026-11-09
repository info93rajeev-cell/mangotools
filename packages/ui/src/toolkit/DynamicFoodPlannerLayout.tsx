import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { FoodPlannerStudioLayoutProps } from './food-planner/FoodPlannerStudioLayout.tsx';

export function DynamicFoodPlannerLayout(props: FoodPlannerStudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<FoodPlannerStudioLayoutProps> | null>(null);

  useEffect(() => {
    void import('./food-planner/FoodPlannerStudioLayout.tsx').then((m) => {
      setComp(() => m.FoodPlannerStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}
