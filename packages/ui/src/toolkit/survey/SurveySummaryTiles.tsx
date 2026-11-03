import s from './surveyLeveling.module.css';
import { formatReading } from './surveyLevelingModel.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';

export interface SurveySummaryTilesProps {
  result: SurveyCalculationOutput | null;
  closingRLInput: string;
}

function countSetupsAndCPs(result: SurveyCalculationOutput | null) {
  if (!result) return { setups: '—', cps: 0, stations: 0 };
  const cps = result.rows.filter((r) => r.isChangePoint).length;
  const setups = cps + 1;
  return {
    setups: `${setups} setups`,
    cps,
    stations: result.rows.length,
  };
}

export function SurveySummaryTiles({ result, closingRLInput }: SurveySummaryTilesProps) {
  const { setups, cps, stations } = countSetupsAndCPs(result);
  const endRL = result ? `${formatReading(result.endingRL)} m` : '—';
  const endSub = result?.closingRL
    ? surveyStrings.tileClosingRLKnown.replace('{value}', formatReading(result.closingRL))
    : surveyStrings.tileClosingRLObserved;

  let misVal = '—';
  let misSub = closingRLInput.trim()
    ? surveyStrings.tileMisclosureSub
    : surveyStrings.tileMisclosureAddBM;
  if (result?.misclosure !== null && result?.misclosure !== undefined) {
    const mm = Number(result.misclosure) * 1000;
    const sign = mm > 0 ? '+' : mm < 0 ? '−' : '';
    misVal = `${sign}${Math.abs(Math.round(mm))} mm`;
    misSub = surveyStrings.tileMisclosureSub;
  }

  return (
    <div class={s.tilesGrid} data-summary-tiles="">
      <div class={s.tile}>
        <div class={s.tileHead}>
          <span class={s.iconWrap} style={{ background: '#e9f8ef', color: '#16a34a' }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20h16M12 4v12M8 12l4 4 4-4" />
            </svg>
          </span>
          {surveyStrings.tileClosingRL}
        </div>
        <div class={s.tileValue} data-tile-closing-rl="">
          {endRL}
        </div>
        <div class={s.tileSub}>{endSub}</div>
      </div>

      <div class={s.tile}>
        <div class={s.tileHead}>
          <span class={s.iconWrap} style={{ background: '#eaf1fe', color: '#1a6ef5' }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M12 5v14" />
            </svg>
          </span>
          {surveyStrings.tileMisclosure}
        </div>
        <div class={s.tileValue} data-tile-misclosure="">
          {misVal}
        </div>
        <div class={s.tileSub}>{misSub}</div>
      </div>

      <div class={s.tile}>
        <div class={s.tileHead}>
          <span class={s.iconWrap} style={{ background: '#fff6e5', color: '#d97706' }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3l9 16H3z" />
              <path d="M12 10v4M12 17v.5" />
            </svg>
          </span>
          {surveyStrings.tileAllowable}
        </div>
        <div class={s.tileValue}>—</div>
        <div class={s.tileSub}>{surveyStrings.tileAllowableSub}</div>
      </div>

      <div class={s.tile}>
        <div class={s.tileHead}>
          <span class={s.iconWrap} style={{ background: '#fdecec', color: '#dc2626' }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v4l3 2" />
            </svg>
          </span>
          {surveyStrings.tileSetups}
        </div>
        <div class={s.tileValue}>{setups}</div>
        <div class={s.tileSub}>
          {result
            ? surveyStrings.tileSetupsSub
                .replace('{cps}', String(cps))
                .replace('{s}', cps === 1 ? '' : 's')
                .replace('{count}', String(stations))
            : '—'}
        </div>
      </div>
    </div>
  );
}
