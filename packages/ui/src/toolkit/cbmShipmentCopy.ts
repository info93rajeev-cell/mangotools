import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
export function shipmentSummary(state: CbmSnapshot): string {
  const result = state.shipment;
  if (!result) return '';
  const weight =
    result.knownPackedWeightKg === null ? t.unknown : `${result.knownPackedWeightKg} kg`;
  const lines = [
    t.branding,
    '',
    t.shipment,
    `${t.volume}: ${result.totalCbm} m³`,
    `${t.cft}: ${result.totalCft} ft³`,
    `${t.pieces}: ${result.totalPieces}`,
    `${result.weightCoverage === 'partial' ? t.partialWeight : t.packedWeight}: ${weight}`,
  ];
  if (state.costInput.enabled && state.cost) {
    const cost = state.cost;
    lines.push(
      '',
      t.costTitle,
      `${t.currency}: ${cost.currency}`,
      `${t.rate}: ${cost.rate} ${t.basis}`,
      `${t.base}: ${cost.baseCharge}`,
      `${t.minimumCharge}: ${cost.minimumCharge ?? t.notSupplied}`,
      `${t.minimumApplied}: ${cost.minimumApplied ? t.yes : t.no}`,
      `${t.freight}: ${cost.freightCharge}`,
      `${t.otherCharges}: ${cost.otherCharges}`,
      `${t.total}: ${cost.estimatedTotal}`,
      t.rateNote,
      t.costDisclaimer,
    );
  }
  if (state.costInput.enabled && !state.cost) lines.push('', t.unavailable);
  for (const [index, row] of state.packages.entries()) {
    const name = row.description.replace(/[\r\n]+/g, ' ').trim() || `${t.package} ${index + 1}`;
    if (row.weightPerItem.trim())
      lines.push(`${name}: ${t.weightPerItem} ${row.weightPerItem} ${row.weightUnit}`);
    lines.push(
      `${name}: ${row.quantity} × ${row.length}×${row.width}×${row.height} ${row.unit} = ${result.rows[index]?.totalCbm} m³`,
    );
  }
  lines.push('', t.methodology, t.fitDisclaimer, t.variation);
  return lines.join('\n');
}
