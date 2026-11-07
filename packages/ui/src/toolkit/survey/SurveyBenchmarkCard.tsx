import { BenchmarkFieldsGrid } from './SurveyBenchmarkFields.tsx';
import { SurveyLevelBookTable } from './SurveyLevelBookTable.tsx';
import sb from './surveyBenchmark.module.css';
import sl from './surveyLevelBook.module.css';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyLevelingRow } from './surveyLevelingTypes.ts';

export interface SurveyBenchmarkCardProps {
  startRL: string;
  setStartRL: (val: string) => void;
  closingRL: string;
  setClosingRL: (val: string) => void;
  kConstant: string;
  setKConstant: (val: string) => void;
  adjBy: 'none' | 'distance' | 'setup';
  setAdjBy: (val: 'none' | 'distance' | 'setup') => void;
  rows: SurveyLevelingRow[];
  errors: string[];
  cellErrors: Record<string, string>;
  handleCellChange: (index: number, field: keyof SurveyLevelingRow, value: string) => void;
  handleAddRow: () => void;
  handleRemoveRow: (index: number) => void;
  calculate: () => void;
  loadSample: () => void;
  reset: () => void;
}

function BenchmarkMethodTabs() {
  return (
    <div class={sb.tabs}>
      <button type="button" class={`${sb.tab} ${sb.tabActive}`}>
        ▤ {surveyStrings.tabRiseFall}
      </button>
      <button
        type="button"
        class={`${sb.tab} ${sb.tabDisabled}`}
        disabled
        title="HI method contract arrives in PR 4"
      >
        ⌖ {surveyStrings.tabHI}
      </button>
    </div>
  );
}

export function SurveyBenchmarkCard({
  startRL,
  setStartRL,
  closingRL,
  setClosingRL,
  kConstant,
  setKConstant,
  adjBy,
  setAdjBy,
  rows,
  errors,
  cellErrors,
  handleCellChange,
  handleAddRow,
  handleRemoveRow,
  calculate,
  loadSample,
  reset,
}: SurveyBenchmarkCardProps) {
  const startRLError = cellErrors.startRL;
  const closeRLError = cellErrors.closingRL;
  const kConstantError = cellErrors.kConstant;
  const adjByError = cellErrors.adjBy;
  const generalRowError =
    errors.length > 0 && !startRLError && !closeRLError && !kConstantError && !adjByError
      ? errors[0]
      : null;

  return (
    <div class={sb.card}>
      <div class={sb.cardHead}>
        <div class={sb.iconWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 20h18M6 20V9l6-5 6 5v11" />
            <path d="M10 20v-5h4v5" />
          </svg>
        </div>
        <h2 class={sb.cardTitle}>{surveyStrings.levelBookTitle}</h2>
        <div class={sb.cardHeadRight}>
          <label for="survey-reading-unit" class={sb.readingUnitLabel}>
            {surveyStrings.readingUnit}
          </label>
          <select
            id="survey-reading-unit"
            aria-label={surveyStrings.readingUnit}
            value="m"
            disabled
            title="Metres boundary in PR 1"
          >
            <option value="m">{surveyStrings.unitMetres}</option>
            <option value="mm">{surveyStrings.unitMillimetres}</option>
          </select>
        </div>
      </div>

      <div class={sb.cardBody}>
        <BenchmarkMethodTabs />

        <BenchmarkFieldsGrid
          startRL={startRL}
          setStartRL={setStartRL}
          closingRL={closingRL}
          setClosingRL={setClosingRL}
          kConstant={kConstant}
          setKConstant={setKConstant}
          adjBy={adjBy}
          setAdjBy={setAdjBy}
          startRLError={startRLError}
          closeRLError={closeRLError}
          kConstantError={kConstantError}
          adjByError={adjByError}
        />

        <div class={sl.secHead}>
          <span>{surveyStrings.fieldReadings}</span>
          <div class={sl.secButtons}>
            <button
              type="button"
              class={`${sl.miniBtn} ${sl.miniBtnHighlight}`}
              onClick={loadSample}
              data-try-sample=""
            >
              ✨ {surveyStrings.trySample}
            </button>
            <button
              type="button"
              class={sl.miniBtn}
              disabled
              title="Clipboard paste arrives in PR 5"
            >
              📋 {surveyStrings.pasteExcel}
            </button>
          </div>
        </div>

        {generalRowError ? (
          <div
            style={{
              padding: '8px 12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#b91c1c',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '10px',
            }}
            role="alert"
            data-survey-error=""
          >
            {generalRowError}
          </div>
        ) : null}

        <SurveyLevelBookTable
          rows={rows}
          cellErrors={cellErrors}
          onCellChange={handleCellChange}
          onAddRow={handleAddRow}
          onRemoveRow={handleRemoveRow}
        />

        <div class={sb.actionRow}>
          <button type="button" class={sb.calcBtn} onClick={calculate} data-calculate-btn="">
            {surveyStrings.calculate}
          </button>
          <button type="button" class={sb.resetBtn} onClick={reset} data-reset-btn="">
            {surveyStrings.reset}
          </button>
        </div>
      </div>
    </div>
  );
}
