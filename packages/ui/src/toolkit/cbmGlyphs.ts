/** 24 × 24 KPI icons from the approved reference: carton, CBM cube, weight and average cube. */
export const GLYPHS = {
  pieces: 'M12 2.8 20.5 7.4v9.2L12 21.2l-8.5-4.6V7.4Z M3.5 7.4 12 12l8.5-4.6 M12 12v9.2',
  volume: 'M12 2.8 20.5 7.4v9.2L12 21.2l-8.5-4.6V7.4Z M3.5 7.4 12 12l8.5-4.6 M12 12v9.2',
  weight: 'M9.2 7.2a2.8 2.8 0 1 1 5.6 0 M6.2 7.2h11.6l2.6 13H3.6Z M12 11.2v5 M9.5 13.7h5',
  average: 'M12 2.8 20.5 7.4v9.2L12 21.2l-8.5-4.6V7.4Z M3.5 7.4 12 12l8.5-4.6 M12 12v9.2',
} as const;
export type GlyphName = keyof typeof GLYPHS;
