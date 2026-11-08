import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { SurveyLevelingLayoutProps } from './survey/SurveyLevelingLayout.tsx';

export function DynamicSurveyLevelingLayout(props: SurveyLevelingLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<SurveyLevelingLayoutProps> | null>(null);

  useEffect(() => {
    void import('./survey/SurveyLevelingLayout.tsx').then((m) => {
      setComp(() => m.SurveyLevelingLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}
