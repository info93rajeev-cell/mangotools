import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { UniversalTaxStudioLayoutProps } from './UniversalTaxStudioLayout.tsx';

export function DynamicUniversalTaxLayout(props: UniversalTaxStudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<UniversalTaxStudioLayoutProps> | null>(null);

  useEffect(() => {
    void import('./UniversalTaxStudioLayout.tsx').then((m) => {
      setComp(() => m.UniversalTaxStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}
