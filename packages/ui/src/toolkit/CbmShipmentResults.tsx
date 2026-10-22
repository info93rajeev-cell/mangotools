import { volumeShare } from './cbmComposition.ts';
import s from './cbmResults.module.css';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
export function CbmShipmentResults({ state }: { state: CbmSnapshot }) {
  const result = state.shipment;
  return (
    <>
      <section
        class={s.panel}
        aria-labelledby="cbm-summary-title"
        aria-live="polite"
        aria-busy={state.pending}
      >
        <h2 id="cbm-summary-title">{t.summary}</h2>
        {result ? (
          <dl class={s.metrics}>
            <div class={s.primary}>
              <dt>{t.volume}</dt>
              <dd data-cbm-total="">
                {result.totalCbm} <small>m³</small>
              </dd>
            </div>
            <div>
              <dt>{t.cft}</dt>
              <dd>{result.totalCft} ft³</dd>
            </div>
            <div>
              <dt>{t.pieces}</dt>
              <dd>{result.totalPieces}</dd>
            </div>
            <div>
              <dt>{result.weightCoverage === 'partial' ? t.partialWeight : t.packedWeight}</dt>
              <dd>
                {result.knownPackedWeightKg === null
                  ? t.unknown
                  : `${result.knownPackedWeightKg} kg`}
              </dd>
            </div>
          </dl>
        ) : (
          <p>{state.pending ? t.pending : t.empty}</p>
        )}
      </section>
      <section class={s.panel} aria-labelledby="cbm-composition-title">
        <h2 id="cbm-composition-title">{t.composition}</h2>
        {result ? (
          <ul class={s.composition}>
            {result.rows.map((row, index) => (
              <li key={state.packages[index]?.id}>
                <span>{state.packages[index]?.description || `${t.package} ${index + 1}`}</span>
                <strong>{row.totalCbm} m³</strong>
                <span>{volumeShare(row.totalCbmExact, result.totalCbmExact)}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t.empty}</p>
        )}
        <small>{t.rounding}</small>
      </section>
    </>
  );
}
