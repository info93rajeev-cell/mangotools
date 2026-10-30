import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { MarkupCalculatorStudioLayoutProps } from './MarkupCalculatorStudioLayout.tsx';

export function DynamicMarkupCalculatorLayout(props: MarkupCalculatorStudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<MarkupCalculatorStudioLayoutProps> | null>(null);

  useEffect(() => {
    void import('./MarkupCalculatorStudioLayout.tsx').then((m) => {
      setComp(() => m.MarkupCalculatorStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}
