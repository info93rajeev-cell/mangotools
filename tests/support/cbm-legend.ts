import type { Locator } from '@playwright/test';

/** Record real layout: a scrollable container need not overflow at every viewport/font metric. */
export const legendMetrics = (legend: Locator) =>
  legend.evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
    scrollLeft: node.scrollLeft,
    overflowX: getComputedStyle(node).overflowX,
  }));
