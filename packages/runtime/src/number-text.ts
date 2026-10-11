/** Removes grouping and symbols people type ("₹1,00,000", "18 %") before the engine parses it. */
export function normalizeNumberText(raw: string): string {
  return raw.replace(/[\s,_₹%]/g, '');
}
