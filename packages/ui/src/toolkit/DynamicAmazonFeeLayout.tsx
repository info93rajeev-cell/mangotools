import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { AmazonFeeEstimatorStudioLayoutProps } from './AmazonFeeEstimatorStudioLayout.tsx';

export function DynamicAmazonFeeLayout(props: AmazonFeeEstimatorStudioLayoutProps) {
  const [Comp, setComp] = useState<ComponentType<AmazonFeeEstimatorStudioLayoutProps> | null>(null);

  useEffect(() => {
    void import('./AmazonFeeEstimatorStudioLayout.tsx').then((m) => {
      setComp(() => m.AmazonFeeEstimatorStudioLayout);
    });
  }, []);

  if (!Comp) return null;
  return <Comp {...props} />;
}
