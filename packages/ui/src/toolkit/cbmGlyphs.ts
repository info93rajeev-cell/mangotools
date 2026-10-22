/** 24 × 24 outline glyphs for the result cards, drawn in the same carton language. */
export const GLYPHS = {
  pieces:
    'M4 9.5 9 7l5 2.5L9 12Z M4 9.5V15l5 2.5V12 M14 9.5V15l-5 2.5 M10 14.5l5-2.5 5 2.5-5 2.5Z M10 14.5V19l5 2.5V17 M20 14.5V19l-5 2.5',
  volume: 'M12 3 20 7.5 12 12 4 7.5Z M4 7.5v9L12 21v-9 M20 7.5v9L12 21',
  weight: 'M9.5 8a2.5 2.5 0 1 1 5 0 M7 8h10l2.5 12h-15Z',
  average: 'M12 5 18 8.5 12 12 6 8.5Z M6 8.5v6.5l6 3.5v-6.5 M18 8.5V15l-6 3.5 M3 21h18',
} as const;
export type GlyphName = keyof typeof GLYPHS;
