import s from './surveyLeveling.module.css';
import { formatReading } from './surveyLevelingModel.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';

export interface SurveyResultsTableProps {
  result: SurveyCalculationOutput | null;
  onCopyBook: () => void;
}

export function SurveyResultsTable({ result, onCopyBook }: SurveyResultsTableProps) {
  if (!result || result.rows.length === 0) return null;

  return (
    <div data-results-table-section="">
      <div style={{ overflowX: 'auto' }}>
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
              const hasRise = row.rise !== null && Number(row.rise) > 0;
              const hasFall = row.fall !== null && Number(row.fall) > 0;
              return (
                <tr key={idx}>
                  <td style={{ textAlign: 'left', fontWeight: 600 }}>
                    {row.station || `P-${idx + 1}`}
                  </td>
                  <td class={hasRise ? s.riseText : undefined}>
                    {hasRise ? formatReading(row.rise) : '—'}
                  </td>
                  <td class={hasFall ? s.fallText : undefined}>
                    {hasFall ? formatReading(row.fall) : '—'}
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatReading(row.rl)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div class={s.outputActions}>
        <button type="button" class={s.printBtn} onClick={() => window.print()} data-print-btn="">
          {surveyStrings.print}
        </button>
        <button type="button" class={s.copyBtn} onClick={onCopyBook} data-copy-book-btn="">
          {surveyStrings.copyBook}
        </button>
      </div>
    </div>
  );
}
