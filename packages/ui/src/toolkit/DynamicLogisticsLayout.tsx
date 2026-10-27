import type { ResolvedPreset } from '@mangotools/schemas';
import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { ToolIslandProps } from './ToolIsland.tsx';

/**
 * Unified lazy loader for logistics studio workspaces.
 * Keeps entry bundles well under strict post-build JS budgets.
 */
export function DynamicLogisticsLayout(props: ToolIslandProps) {
  const [Comp, setComp] = useState<ComponentType<{ preset?: ResolvedPreset }> | null>(null);

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
  return <Comp preset={props.preset} />;
}

export {
  DynamicLogisticsLayout as DynamicContainerLoadingLayout,
  DynamicLogisticsLayout as DynamicCbmShipmentLayout,
  DynamicLogisticsLayout as DynamicPalletLoadingLayout,
  DynamicLogisticsLayout as DynamicVolumetricWeightLayout,
};
