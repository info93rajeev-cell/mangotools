import { SurveyArithmeticChecks } from './SurveyArithmeticChecks.tsx';
import { SurveyResultsTable } from './SurveyResultsTable.tsx';
import { SurveySummaryTiles } from './SurveySummaryTiles.tsx';
import s from './surveyLeveling.module.css';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';

export interface SurveyResultsCardProps {
  phase: string;
  result: SurveyCalculationOutput | null;
  closingRL: string;
  onCopyBook: () => void;
}

function StatusBadge({
  phase,
  hasResult,
  checksPass,
}: {
  phase: string;
  hasResult: boolean;
  checksPass: boolean;
}) {
  if (phase === 'error') {
    return (
      <span class={`${s.statusBadge} ${s.statusFail}`}>{surveyStrings.statusCheckInputs}</span>
    );
  }
  if (!hasResult) {
    return (
      <span class={`${s.statusBadge} ${s.statusIdle}`}>{surveyStrings.statusNotCalculated}</span>
    );
  }
  if (!checksPass) {
    return (
      <span class={`${s.statusBadge} ${s.statusFail}`}>{surveyStrings.statusArithmeticError}</span>
    );
  }
  return <span class={`${s.statusBadge} ${s.statusPass}`}>{surveyStrings.statusCalculated}</span>;
}

export function SurveyResultsCard({
  phase,
  result,
  closingRL,
  onCopyBook,
}: SurveyResultsCardProps) {
  const checksPass = Boolean(result?.checks.every((c) => c.status === 'pass'));

  return (
    <div class={s.card} data-results-card="">
      <div class={s.cardHead}>
        <div class={s.iconWrap} style={{ background: '#16a34a' }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 11l3 3 8-8" />
            <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
          </svg>
        </div>
        <h2 class={s.cardTitle}>{surveyStrings.resultsTitle}</h2>
        <div class={s.cardHeadRight}>
          <StatusBadge phase={phase} hasResult={Boolean(result)} checksPass={checksPass} />
        </div>
      </div>

      <div class={s.cardBody}>
        <SurveySummaryTiles result={result} closingRLInput={closingRL} />
        <SurveyArithmeticChecks result={result} />
        <SurveyResultsTable result={result} onCopyBook={onCopyBook} />
      </div>
    </div>
  );
}
