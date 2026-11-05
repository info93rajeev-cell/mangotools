import {
  layerPattern,
  PALLET_BASE_HEIGHT_CM,
  PALLET_TARE_KG,
  type PalletLoadingResult,
} from './palletLoadingModel.ts';
import {
  type ResultKpi,
  ResultKpiCards,
  ResultsHeading,
  resultCardClass,
  resultDetailsClass,
  ShareBar,
} from './ResultKpiCards.tsx';

const fmt = (n: number, d = 1) => {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString('en-IN', { maximumFractionDigits: d });
};

function kpis(r: PalletLoadingResult, heightLimitCm: number): ResultKpi[] {
  const h = r.loadedDimensions.height;
  const heightPct = heightLimitCm > 0 ? (h / heightLimitCm) * 100 : 0;
  return [
    {
      tone: 'amber',
      icon: 'package',
      label: 'Total Boxes',
      value: fmt(r.totalBoxes, 0),
      sub: `${r.boxesPerLayer} per layer`,
      percent: r.totalBoxes > 0 ? 100 : 0,
      meter: `${r.totalLayers} layers`,
    },
    {
      tone: 'green',
      icon: 'box',
      label: 'Space Used',
      value: `${fmt(r.spaceUtilizationPercent)}%`,
      sub: 'Pallet footprint',
      percent: r.spaceUtilizationPercent,
      meter: `${Math.round(r.spaceUtilizationPercent)}%`,
    },
    {
      tone: 'blue',
      icon: 'ruler',
      label: 'Loaded Height',
      value: `${fmt(h)} cm`,
      sub: `Limit ${fmt(heightLimitCm)} cm`,
      percent: heightPct,
      meter: `${Math.round(heightPct)}%`,
    },
    {
      tone: 'red',
      icon: 'weight',
      label: 'Gross Weight',
      value: `${fmt(r.weightBreakdown.totalGrossWeightKg)} kg`,
      sub: `Incl. ${PALLET_TARE_KG} kg pallet`,
      percent:
        r.weightBreakdown.totalGrossWeightKg > 0
          ? (r.weightBreakdown.totalBoxesWeightKg / r.weightBreakdown.totalGrossWeightKg) * 100
          : 0,
      meter: '',
    },
  ];
}

/** Loading Results for one pallet, in the approved Container Loading design. */
export function PalletResultsCard(props: {
  result: PalletLoadingResult;
  heightLimitCm: number;
  box: { l: number; w: number; h: number; unit: string; kg: number };
}) {
  const r = props.result;
  const ok = !r.issue && r.totalBoxes > 0;
  const palletDeck = PALLET_BASE_HEIGHT_CM;
  const cargo = Math.max(0, r.loadedDimensions.height - palletDeck);
  const free = Math.max(0, props.heightLimitCm - r.loadedDimensions.height);
  const total = palletDeck + cargo + free || 1;
  return (
    <section class={resultCardClass} aria-labelledby="pallet-results-title">
      <ResultsHeading
        id="pallet-results-title"
        title="Loading Results"
        status={ok ? 'Pallet plan fits' : (r.issue ?? 'Nothing fits')}
        ok={ok}
        line={
          <>
            <strong>{r.totalLayers}</strong> layers · <strong>{r.boxesPerLayer}</strong> boxes per
            layer
          </>
        }
      />
      <ResultKpiCards items={kpis(r, props.heightLimitCm)} idPrefix="pallet" />
      <ShareBar
        title="Height Allocation on Pallet"
        parts={[
          {
            label: 'Pallet deck',
            color: '#8b5e34',
            share: palletDeck / total,
            note: `${fmt(palletDeck)} cm`,
          },
          {
            label: 'Cartons',
            color: '#1a66e8',
            share: cargo / total,
            note: `${fmt(cargo)} cm · ${r.totalLayers} layers`,
          },
          {
            label: 'Free height',
            color: '#22c37a',
            share: free / total,
            note: `${fmt(free)} cm to the limit`,
          },
        ]}
      />
      <details class={resultDetailsClass} open>
        <summary>
          Pallet Loading Details <small>· one pallet</small>
        </summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Dimensions</th>
              <th scope="col">Qty</th>
              <th scope="col">Weight (kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Carton</td>
              <td>
                {props.box.l} × {props.box.w} × {props.box.h} {props.box.unit}
              </td>
              <td>{r.totalBoxes}</td>
              <td>{fmt(r.weightBreakdown.totalBoxesWeightKg, 2)}</td>
            </tr>
            <tr>
              <td>Pallet</td>
              <td>
                {fmt(r.loadedDimensions.length)} × {fmt(r.loadedDimensions.width)} cm
              </td>
              <td>1</td>
              <td>{PALLET_TARE_KG}</td>
            </tr>
            <tr>
              <td>
                <strong>Loaded pallet</strong>
              </td>
              <td>
                {fmt(r.loadedDimensions.length)} × {fmt(r.loadedDimensions.width)} ×{' '}
                {fmt(r.loadedDimensions.height)} cm
              </td>
              <td>—</td>
              <td>
                <strong>{fmt(r.weightBreakdown.totalGrossWeightKg, 2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </details>
    </section>
  );
}
