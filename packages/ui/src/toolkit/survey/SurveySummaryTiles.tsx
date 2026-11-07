import {
  computeValidatedDistance,
  formatLevelReading,
  formatMeasuredLineLength,
  formatMisclosure,
} from './surveyLevelingModel.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';
import s from './surveyResults.module.css';

export interface SurveySummaryTilesProps {
  result: SurveyCalculationOutput | null;
  closingRLInput: string;
}

function renderAllowableSub(result: SurveyCalculationOutput | null) {
  if (!result) return surveyStrings.tileAllowableSub;
  if (!result.closingRL) return surveyStrings.tileClosingRLOpen;
  if (result.closureStatus === 'pass') {
    return (
      <span style={{ color: '#15803d', fontWeight: 600 }}>✓ {surveyStrings.statusWithinLimit}</span>
    );
  }
  if (result.closureStatus === 'fail') {
    return (
      <span style={{ color: '#b91c1c', fontWeight: 600 }}>
        ✕ {surveyStrings.statusOutsideLimit}
      </span>
    );
  }
  if (result.closureStatus === 'criterion-not-provided') {
    return (
      <span style={{ color: '#b45309', fontWeight: 500 }}>
        {surveyStrings.statusCriterionNotProvided}
      </span>
    );
  }
  if (result.closureStatus === 'distance-not-provided') {
    return (
      <span style={{ color: '#b45309', fontWeight: 500 }}>
        {surveyStrings.statusDistanceNotProvided}
      </span>
    );
  }
  return surveyStrings.tileAllowableSub;
}

function formatLineSub(result: SurveyCalculationOutput | null) {
  if (!result) {
    return surveyStrings.tileSetupsSub
      .replace('{cps}', '0')
      .replace('{s}', '')
      .replace('{count}', '0');
  }
  const cps = result.rows.filter((r) => r.isChangePoint).length;
  const cpStr = `${cps} change point${cps === 1 ? '' : 's'}`;
  const validated = computeValidatedDistance(result.rows);
  if (validated.isValid && validated.totalM !== null) {
    const lengthStr = formatMeasuredLineLength(validated.totalM, result.totalDistanceKm);
    return `${lengthStr} · ${cpStr}`;
  }
  return `No measured length · ${cpStr}`;
}

export function SurveySummaryTiles({ result, closingRLInput }: SurveySummaryTilesProps) {
  const setups = result ? `${result.setupsCount} setup${result.setupsCount === 1 ? '' : 's'}` : '—';
  const setupsSub = formatLineSub(result);
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
  const allowableVal = result?.allowableError ? `±${result.allowableError} mm` : '—';
  const allowableSub = renderAllowableSub(result);

  return (
    <div class={s.tilesGrid} data-summary-tiles="">
      <div class={s.tile}>
        <div class={s.tileHead}>
          <span class={s.iconWrap} style={{ background: '#e9f8ef', color: '#15803d' }}>
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
        <div
          class={s.tileValue}
          data-tile-allowable=""
          style={result?.allowableError ? undefined : { color: '#64748b' }}
        >
          {allowableVal}
        </div>
        <div class={s.tileSub} data-tile-allowable-sub="">
          {allowableSub}
        </div>
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
        <div class={s.tileValue} data-tile-setups="">
          {setups}
        </div>
        <div class={s.tileSub} data-tile-setups-sub="">
          {setupsSub}
        </div>
      </div>
    </div>
  );
}
