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

interface BenchmarkFieldsGridProps {
  startRL: string;
  setStartRL: (val: string) => void;
  closingRL: string;
  setClosingRL: (val: string) => void;
  startRLError?: string;
  closeRLError?: string;
}

function BenchmarkFieldsGrid({
  startRL,
  setStartRL,
  closingRL,
  setClosingRL,
  startRLError,
  closeRLError,
}: BenchmarkFieldsGridProps) {
  return (
    <div class={sb.fieldsGrid}>
      <div class={sb.field}>
        <label class={sb.fieldLabel} for="survey-startRL">
          {surveyStrings.startRL}
        </label>
        <div class={sb.inputWrap}>
          <input
            id="survey-startRL"
            type="text"
            inputMode="decimal"
            value={startRL}
            class={startRLError ? sb.inputError : undefined}
            aria-invalid={startRLError ? 'true' : undefined}
            aria-describedby={startRLError ? 'survey-startRL-error' : undefined}
            data-input-start-rl=""
            onInput={(e) => setStartRL((e.target as HTMLInputElement).value)}
          />
          <em class={sb.unitSuffix}>m</em>
        </div>
        {startRLError ? (
          <span id="survey-startRL-error" class={sb.fieldErrorMessage} role="alert">
            {startRLError}
          </span>
        ) : null}
      </div>

      <div class={sb.field}>
        <label class={sb.fieldLabel} for="survey-closeRL">
          {surveyStrings.closingRL}
        </label>
        <div class={sb.inputWrap}>
          <input
            id="survey-closeRL"
            type="text"
            inputMode="decimal"
            placeholder={surveyStrings.closingRLPlaceholder}
            value={closingRL}
            class={closeRLError ? sb.inputError : undefined}
            aria-invalid={closeRLError ? 'true' : undefined}
            aria-describedby={closeRLError ? 'survey-closeRL-error' : undefined}
            data-input-close-rl=""
            onInput={(e) => setClosingRL((e.target as HTMLInputElement).value)}
          />
          <em class={sb.unitSuffix}>m</em>
        </div>
        {closeRLError ? (
          <span id="survey-closeRL-error" class={sb.fieldErrorMessage} role="alert">
            {closeRLError}
          </span>
        ) : null}
      </div>

      <div class={sb.field}>
        <label class={sb.fieldLabel} for="survey-allowable-const">
          {surveyStrings.allowableConstant}
        </label>
        <div class={sb.inputWrap}>
          <input
            id="survey-allowable-const"
            type="text"
            value="24"
            disabled
            title="Requires PR 2 allowable error contract"
          />
          <em class={sb.unitSuffix}>mm·√K</em>
        </div>
      </div>

      <div class={sb.field}>
        <label class={sb.fieldLabel} for="survey-adjust-by">
          {surveyStrings.adjustBy}
        </label>
        <div class={sb.inputWrap}>
          <select
            id="survey-adjust-by"
            value="none"
            disabled
            title="Requires PR 2 adjustment contract"
          >
            <option value="none">{surveyStrings.adjustNone}</option>
            <option value="dist">{surveyStrings.adjustDistance}</option>
            <option value="setup">{surveyStrings.adjustSetups}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function SurveyBenchmarkCard({
  startRL,
  setStartRL,
  closingRL,
  setClosingRL,
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
  const generalRowError = errors.length > 0 && !startRLError && !closeRLError ? errors[0] : null;

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
          startRLError={startRLError}
          closeRLError={closeRLError}
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
