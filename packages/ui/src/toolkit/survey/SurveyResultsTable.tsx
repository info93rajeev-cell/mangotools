import { formatLevelReading } from './surveyLevelingModel.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput } from './surveyLevelingTypes.ts';
import s from './surveyResults.module.css';

export interface SurveyResultsTableProps {
  result: SurveyCalculationOutput | null;
  method?: 'rise-fall' | 'height-of-instrument';
  isStale?: boolean;
  onCopyBook: () => void;
}

interface RowDisplay {
  station: string;
  distText: string;
  hiText: string;
  riseText: string;
  fallText: string;
  rlText: string;
  corrText: string;
  adjRLText: string;
  riseClass?: string;
  fallClass?: string;
}

function computeRiseFallDisplay(
  rise: string | null,
  fall: string | null,
  idx: number,
  styles: Record<string, string>,
): { riseText: string; fallText: string; riseClass?: string; fallClass?: string } {
  if (idx === 0 || (rise === null && fall === null)) {
    return { riseText: '—', fallText: '—' };
  }
  const rVal = rise !== null ? Number(rise) : null;
  const fVal = fall !== null ? Number(fall) : null;
  if (rVal === 0 && fVal === 0) {
    return {
      riseText: '0.000',
      fallText: '0.000',
      riseClass: styles.zeroText,
      fallClass: styles.zeroText,
    };
  }
  if (rVal !== null && rVal > 0) {
    return {
      riseText: formatLevelReading(rise),
      fallText: '—',
      riseClass: styles.riseText,
    };
  }
  if (fVal !== null && fVal > 0) {
    return {
      riseText: '—',
      fallText: formatLevelReading(fall),
      fallClass: styles.fallText,
    };
  }
  return { riseText: '—', fallText: '—' };
}

function computeRowDisplay(
  row: SurveyCalculationOutput['rows'][number],
  idx: number,
  styles: Record<string, string>,
): RowDisplay {
  const station = row.station || `P-${idx + 1}`;
  const rlText = formatLevelReading(row.rl);
  const distText = row.dist ?? (idx === 0 ? '0' : '—');
  const hiText = row.hi ? formatLevelReading(row.hi) : '—';
  const corrText = row.corr ?? '—';
  const adjRLText = row.adjustedRL ? formatLevelReading(row.adjustedRL) : '—';
  const rf = computeRiseFallDisplay(row.rise, row.fall, idx, styles);

  return {
    station,
    distText,
    hiText,
    rlText,
    corrText,
    adjRLText,
    ...rf,
  };
}

function ResultsTableHeader({ isHI }: { isHI: boolean }) {
  return (
    <thead>
      <tr>
        <th style={{ textAlign: 'left' }}>{surveyStrings.colStation}</th>
        <th>{surveyStrings.colDist}</th>
        {isHI ? (
          <th>{surveyStrings.colHI}</th>
        ) : (
          <>
            <th>{surveyStrings.colRise}</th>
            <th>{surveyStrings.colFall}</th>
          </>
        )}
        <th>{surveyStrings.colRL}</th>
        <th>{surveyStrings.colCorr}</th>
        <th style={{ color: '#1d4ed8', fontWeight: 700 }}>{surveyStrings.colAdjRL}</th>
      </tr>
    </thead>
  );
}

function ResultsTableRow({ d, isHI }: { d: RowDisplay; isHI: boolean }) {
  return (
    <tr>
      <td style={{ textAlign: 'left', fontWeight: 600 }}>{d.station}</td>
      <td>{d.distText}</td>
      {isHI ? (
        <td style={{ fontWeight: 600, color: '#0f766e' }}>{d.hiText}</td>
      ) : (
        <>
          <td class={d.riseClass}>{d.riseText}</td>
          <td class={d.fallClass}>{d.fallText}</td>
        </>
      )}
      <td style={{ fontWeight: 600, color: '#334155' }}>{d.rlText}</td>
      <td style={{ fontSize: '11.5px', color: '#475569' }}>{d.corrText}</td>
      <td style={{ fontWeight: 700, color: '#0b1b3f' }}>{d.adjRLText}</td>
    </tr>
  );
}

export function SurveyResultsTable({
  result,
  method = 'rise-fall',
  isStale,
  onCopyBook,
}: SurveyResultsTableProps) {
  const hasRows = Boolean(result && result.rows.length > 0 && !isStale);
  const isHI = method === 'height-of-instrument';

  return (
    <div data-results-table-section="">
      {hasRows && result ? (
        <section
          class={s.resultsTableWrap}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable table container requires keyboard access for WCAG 2.1.1/2.1.3
          tabIndex={0}
          aria-label={surveyStrings.resultsTableAria}
        >
          <table class={s.resultsTable} data-results-table="">
            <ResultsTableHeader isHI={isHI} />
            <tbody>
              {result.rows.map((row, idx) => (
                <ResultsTableRow
                  key={row.station || idx}
                  d={computeRowDisplay(row, idx, s)}
                  isHI={isHI}
                />
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <div class={s.outputActions}>
        <button
          type="button"
          class={hasRows ? s.printBtn : `${s.printBtn} ${s.btnDisabled}`}
          onClick={() => hasRows && window.print()}
          disabled={!hasRows}
          data-print-book-btn=""
        >
          {surveyStrings.print}
        </button>
        <button
          type="button"
          class={hasRows ? s.copyBtn : `${s.copyBtn} ${s.btnDisabled}`}
          onClick={onCopyBook}
          disabled={!hasRows}
          data-copy-book-btn=""
        >
          {surveyStrings.copyBook}
        </button>
      </div>
    </div>
  );
}
