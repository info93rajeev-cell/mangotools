import { formatDecimal } from '../format/numbers.ts';
import type { LoadSnapshot } from './containerWorkspaceModel.ts';
import { containerText as t } from './containerWorkspaceStrings.ts';
export const loadMoney = (value: string, currency: string) =>
  `${currency === 'INR' ? '₹' : `${currency} `}${formatDecimal(value, currency === 'INR' ? 'indian' : 'international', 2)}`;
export const packageTitle = (state: LoadSnapshot, index: number) =>
  state.packages[index]?.description.trim() || `${t.select} ${index + 1}`;
export function loadSummary(state: LoadSnapshot) {
  const r = state.result;
  if (!r) return '';
  const lines = [
    t.title,
    `${t.results}: ${t[r.status]}`,
    `${t.containers}: ${r.containersRequired}`,
    `${t.loaded}: ${r.loadedPieces}; ${t.unloaded}: ${r.unloadedPieces}`,
    `${t.volume}: ${r.volumeUtilizationPercent}%`,
    `${t.weightColumn}: ${r.loadedWeight ?? t.unknown} (${r.weightStatus})`,
  ];
  for (const p of r.packages)
    lines.push(
      `${packageTitle(state, p.index)}: ${t.loaded} ${p.loaded}, ${t.unloaded} ${p.unloaded}, ${p.loadedVolume} m³`,
    );
  if (state.cost)
    lines.push(`${t.total}: ${loadMoney(state.cost.estimatedTotal, state.cost.currency)}`);
  return [...lines, t.caveat].join('\n');
}
