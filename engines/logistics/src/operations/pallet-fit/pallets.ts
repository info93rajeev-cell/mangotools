export const palletTypes = ['euro', 'us', 'custom'] as const;
export type PalletType = (typeof palletTypes)[number];

export type StandardPalletType = Exclude<PalletType, 'custom'>;

/**
 * Commonly published approximate pallet base dimensions, in centimetres. These vary by pallet
 * condition, manufacturer and region. Per TASK-003D founder decision 15, these are reference defaults
 * only and must be verified against a specific citable source (for example ISO 6780, or EPAL's own
 * pallet specification) before they are relied on for a shipment.
 */
export const STANDARD_PALLETS: Readonly<
  Record<StandardPalletType, { length: string; width: string }>
> = {
  euro: { length: '120', width: '80' },
  us: { length: '121.9', width: '101.6' },
};
