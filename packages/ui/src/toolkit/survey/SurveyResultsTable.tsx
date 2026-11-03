import { formatLevelReading } from './surveyLevelingModel.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';
import s from './surveyResults.module.css';

export interface SurveyResultsTableProps {
  result: SurveyCalculationOutput | null;
  isStale?: boolean;
  onCopyBook: () => void;
}

interface RowDisplay {
  station: string;
  riseText: string;
  fallText: string;
  rlText: string;
  riseClass?: string;
  fallClass?: string;
}

function computeRowDisplay(
  row: SurveyCalculationOutput['rows'][number],
  idx: number,
  styles: Record<string, string>,
): RowDisplay {
  const station = row.station || `P-${idx + 1}`;
  const rlText = formatLevelReading(row.rl);
  if (idx === 0 || (row.rise === null && row.fall === null)) {
    return { station, riseText: '—', fallText: '—', rlText };
  }
  const rVal = row.rise !== null ? Number(row.rise) : null;
  const fVal = row.fall !== null ? Number(row.fall) : null;
  if (rVal === 0 && fVal === 0) {
    return {
      station,
      riseText: '0.000',
      fallText: '0.000',
      rlText,
      riseClass: styles.zeroText,
      fallClass: styles.zeroText,
    };
  }
  if (rVal !== null && rVal > 0) {
    return {
      station,
      riseText: formatLevelReading(row.rise),
      fallText: '—',
      rlText,
      riseClass: styles.riseText,
    };
  }
  if (fVal !== null && fVal > 0) {
    return {
      station,
      riseText: '—',
      fallText: formatLevelReading(row.fall),
      rlText,
      fallClass: styles.fallText,
    };
  }
  return { station, riseText: '—', fallText: '—', rlText };
}

export function SurveyResultsTable({ result, isStale, onCopyBook }: SurveyResultsTableProps) {
  const hasRows = Boolean(result && result.rows.length > 0 && !isStale);

  return (
    <div data-results-table-section="">
      {hasRows && result ? (
        <div class={s.resultsTableWrap}>
          <table class={s.resultsTable} data-results-table="">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>{surveyStrings.colStation}</th>
                <th>{surveyStrings.colRise}</th>
                <th>{surveyStrings.colFall}</th>
                <th>{surveyStrings.colRL}</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, idx) => {
                const d = computeRowDisplay(row, idx, s);
                return (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', fontWeight: 600 }}>{d.station}</td>
                    <td class={d.riseClass}>{d.riseText}</td>
                    <td class={d.fallClass}>{d.fallText}</td>
                    <td style={{ fontWeight: 600 }}>{d.rlText}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <div class={s.resultsActions}>
        <button
          type="button"
          class={hasRows ? s.btnSecondary : `${s.btnSecondary} ${s.btnDisabled}`}
          onClick={onCopyBook}
          disabled={!hasRows}
          data-copy-book-btn=""
        >
          {surveyStrings.copyBook}
        </button>
        <button
          type="button"
          class={hasRows ? s.btnSecondary : `${s.btnSecondary} ${s.btnDisabled}`}
          onClick={() => hasRows && window.print()}
          disabled={!hasRows}
          data-print-book-btn=""
        >
          {surveyStrings.print}
        </button>
      </div>
    </div>
  );
}
