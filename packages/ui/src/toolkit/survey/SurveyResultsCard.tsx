import { SurveyArithmeticChecks } from './SurveyArithmeticChecks.tsx';
import { SurveyResultsTable } from './SurveyResultsTable.tsx';
import { SurveySummaryTiles } from './SurveySummaryTiles.tsx';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput, SurveyLevelingState } from './surveyLevelingTypes.ts';
import s from './surveyResults.module.css';

export interface SurveyResultsCardProps {
  result: SurveyCalculationOutput | null;
  phase: SurveyLevelingState['phase'];
  isStale?: boolean;
  closingRLInput: string;
  onCopyBook: () => void;
}

export function SurveyResultsCard({
  result,
  phase,
  isStale,
  closingRLInput,
  onCopyBook,
}: SurveyResultsCardProps) {
  const isCalculated = phase === 'result' && result !== null && !isStale;
  const isError = phase === 'error';
  const checksPassed = result?.checks.every((c) => c.status === 'pass') ?? false;

  let badgeClass = s.statusIdle;
  let badgeText: string = surveyStrings.statusNotCalculated;

  if (isStale) {
    badgeClass = s.statusIdle;
    badgeText = 'Recalculate required';
  } else if (isCalculated) {
    badgeClass = checksPassed ? s.statusPass : s.statusFail;
    badgeText = checksPassed ? surveyStrings.statusCalculated : surveyStrings.statusArithmeticError;
  } else if (isError) {
    badgeClass = s.statusFail;
    badgeText = surveyStrings.statusCheckInputs;
  }

  return (
    <div class={s.card} data-results-card="">
      <div class={s.cardHead}>
        <div class={s.iconWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <h2 class={s.cardTitle}>{surveyStrings.resultsTitle}</h2>
        <div class={s.cardHeadRight}>
          <span class={`${s.statusBadge} ${badgeClass}`} data-results-badge="">
            {badgeText}
          </span>
        </div>
      </div>

      <div class={s.cardBody}>
        {isStale ? (
          <div class={s.staleNotice} data-stale-notice="">
            {surveyStrings.staleNotice}
          </div>
        ) : null}

        <SurveySummaryTiles result={isStale ? null : result} closingRLInput={closingRLInput} />

        {!isStale && result ? <SurveyArithmeticChecks result={result} /> : null}

        <SurveyResultsTable result={result} isStale={isStale} onCopyBook={onCopyBook} />
      </div>
    </div>
  );
}
