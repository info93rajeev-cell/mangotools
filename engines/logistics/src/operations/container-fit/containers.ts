export const containerTypes = ['20gp', '40gp', '40hc', 'custom'] as const;
export type ContainerType = (typeof containerTypes)[number];

export type StandardContainerType = Exclude<ContainerType, 'custom'>;

/**
 * Commonly published approximate internal dimensions, in centimetres. These vary by carrier,
 * manufacturer and container condition. Per TASK-003C founder decision 13, these are reference
 * defaults only and must be verified against a specific citable source (for example ISO 668:2020
 * or a named carrier's container specification sheet) before they are relied on for a shipment.
 */
export const STANDARD_CONTAINERS: Readonly<
  Record<StandardContainerType, { length: string; width: string; height: string }>
> = {
  '20gp': { length: '589.8', width: '235.2', height: '239.3' },
  '40gp': { length: '1203.2', width: '235.2', height: '239.3' },
  '40hc': { length: '1203.2', width: '235.2', height: '269.8' },
};
