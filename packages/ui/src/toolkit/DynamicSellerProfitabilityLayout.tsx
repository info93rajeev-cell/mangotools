import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { SellerProfitabilityStudioLayoutProps } from './SellerProfitabilityStudioLayout.tsx';

export function DynamicSellerProfitabilityLayout(props: SellerProfitabilityStudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<SellerProfitabilityStudioLayoutProps> | null>(
    null,
  );

  useEffect(() => {
    void import('./SellerProfitabilityStudioLayout.tsx').then((m) => {
      setComp(() => m.SellerProfitabilityStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}
