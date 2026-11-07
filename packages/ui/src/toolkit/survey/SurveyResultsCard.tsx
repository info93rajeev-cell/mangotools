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

function resolveResultsBadge(
  isStale: boolean | undefined,
  isCalculated: boolean,
  isError: boolean,
  checksPassed: boolean,
  closureStatus: SurveyCalculationOutput['closureStatus'] | undefined,
  styles: Record<string, string>,
): { badgeClass: string; badgeText: string } {
  if (isStale) {
    return { badgeClass: styles.statusIdle, badgeText: 'Recalculate required' };
  }
  if (isError) {
    return { badgeClass: styles.statusFail, badgeText: surveyStrings.statusCheckInputs };
  }
  if (!isCalculated) {
    return { badgeClass: styles.statusIdle, badgeText: surveyStrings.statusNotCalculated };
  }
  if (!checksPassed) {
    return { badgeClass: styles.statusFail, badgeText: surveyStrings.statusArithmeticError };
  }
  switch (closureStatus) {
    case 'pass':
      return { badgeClass: styles.statusPass, badgeText: `✓ ${surveyStrings.statusWithinLimit}` };
    case 'fail':
      return { badgeClass: styles.statusFail, badgeText: `✕ ${surveyStrings.statusOutsideLimit}` };
    case 'criterion-not-provided':
      return {
        badgeClass: styles.statusWarning,
        badgeText: surveyStrings.statusCriterionNotProvided,
      };
    case 'distance-not-provided':
      return {
        badgeClass: styles.statusWarning,
        badgeText: surveyStrings.statusDistanceNotProvided,
      };
    default:
      return { badgeClass: styles.statusPass, badgeText: surveyStrings.statusCalculated };
  }
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
  const { badgeClass, badgeText } = resolveResultsBadge(
    isStale,
    isCalculated,
    isError,
    checksPassed,
    result?.closureStatus,
    s,
  );

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
