import { volumeShare } from './cbmComposition.ts';
import type { LoadResult } from './containerWorkspaceModel.ts';

const SCALE = 10n ** 12n;
const cm = (text: string) => {
  const [whole = '', fraction = ''] = text.split('.');
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(12, '0').slice(0, 12));
};
const DENOM = 10n ** 42n;
function volumeText(value: bigint) {
  const rounded = (value * 1000n + DENOM / 2n) / DENOM;
  return `${rounded / 1000n}.${String(rounded % 1000n).padStart(3, '0')}`;
}
/** Selected-container allocation from exact engine block geometry in cm, not CBM ratios. */
export function containerAllocation(result: LoadResult, container: number) {
  const values = result.packages.map(() => 0n);
  for (const block of result.blocks) {
    if (block.container !== container) continue;
    values[block.package] =
      (values[block.package] ?? 0n) +
      cm(block.pieceLength) * cm(block.pieceWidth) * cm(block.pieceHeight) * BigInt(block.count);
  }
  const total = values.reduce((sum, value) => sum + value, 0n);
  return values.map((value) => ({
    volume: volumeText(value),
    share: total > 0n ? volumeShare(String(value), String(total)) : '0.0',
  }));
}
