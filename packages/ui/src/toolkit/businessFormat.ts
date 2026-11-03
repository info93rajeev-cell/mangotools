/** Display only: engine decimal strings formatted for India. Values are never recalculated. */
export const inr = (v: string | null, digits = 2) => {
  if (v === null) return '—';
  const n = Number(v);
  const text = Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${n < 0 ? '−' : ''}₹${text}`;
};
export const pct = (v: string | null) => (v === null ? '—' : `${v}%`);
