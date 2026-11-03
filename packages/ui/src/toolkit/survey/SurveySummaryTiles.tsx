import { formatLevelReading, formatMisclosure } from './surveyLevelingModel.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';
import s from './surveyResults.module.css';

export interface SurveySummaryTilesProps {
  result: SurveyCalculationOutput | null;
  closingRLInput: string;
}

function countSetupsAndCPs(result: SurveyCalculationOutput | null) {
  if (!result)
    return {
      setups: '—',
      sub: surveyStrings.tileSetupsSub
        .replace('{cps}', '0')
        .replace('{s}', '')
        .replace('{count}', '0'),
    };
  const cps = result.rows.filter((r) => r.isChangePoint).length;
  const setups = cps + 1;
  const sub = surveyStrings.tileSetupsSub
    .replace('{cps}', String(cps))
    .replace('{s}', cps === 1 ? '' : 's')
    .replace('{count}', String(result.rows.length));
  return { setups: `${setups} setup${setups === 1 ? '' : 's'}`, sub };
}

export function SurveySummaryTiles({ result, closingRLInput }: SurveySummaryTilesProps) {
  const { setups, sub: setupsSub } = countSetupsAndCPs(result);
  const endRL = result ? `${formatLevelReading(result.endingRL)} m` : '—';
  const endSub = result?.closingRL
    ? surveyStrings.tileClosingRLKnown.replace('{value}', formatLevelReading(result.closingRL))
    : closingRLInput.trim()
      ? surveyStrings.tileClosingRLKnown.replace('{value}', closingRLInput.trim())
      : surveyStrings.tileClosingRLOpen;

  const { val: misVal, subKey } = result
    ? formatMisclosure(result.misclosure)
    : {
        val: '—',
        subKey: closingRLInput.trim()
          ? ('tileMisclosureSub' as const)
          : ('tileMisclosureAddBM' as const),
      };
  const misSub = surveyStrings[subKey];

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
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4l3 3" />
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
          <span class={s.iconWrap} style={{ background: '#fffbeb', color: '#d97706' }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-5-6.5 5 2-7.5L2 9h7z" />
            </svg>
          </span>
          {surveyStrings.tileAllowable}
        </div>
        <div class={s.tileValue} style={{ color: '#64748b' }}>
          —
        </div>
        <div class={s.tileSub}>{surveyStrings.tileAllowableSub}</div>
      </div>

      <div class={s.tile}>
        <div class={s.tileHead}>
          <span class={s.iconWrap} style={{ background: '#f3e8ff', color: '#7c3aed' }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </span>
          {surveyStrings.tileSetups}
        </div>
        <div class={s.tileValue}>{setups}</div>
        <div class={s.tileSub}>{setupsSub}</div>
      </div>
    </div>
  );
}
