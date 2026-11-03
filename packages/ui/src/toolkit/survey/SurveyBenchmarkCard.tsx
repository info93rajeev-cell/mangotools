import { SurveyLevelBookTable } from './SurveyLevelBookTable.tsx';
import s from './surveyLeveling.module.css';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyLevelingRow } from './surveyLevelingTypes.ts';

export interface SurveyBenchmarkCardProps {
  startRL: string;
  setStartRL: (val: string) => void;
  closingRL: string;
  setClosingRL: (val: string) => void;
  rows: SurveyLevelingRow[];
  cellErrors: Record<string, string>;
  handleCellChange: (index: number, field: keyof SurveyLevelingRow, value: string) => void;
  handleAddRow: () => void;
  handleRemoveRow: (index: number) => void;
  calculate: () => void;
  loadSample: () => void;
  reset: () => void;
}

export function SurveyBenchmarkCard({
  startRL,
  setStartRL,
  closingRL,
  setClosingRL,
  rows,
  cellErrors,
  handleCellChange,
  handleAddRow,
  handleRemoveRow,
  calculate,
  loadSample,
  reset,
}: SurveyBenchmarkCardProps) {
  return (
    <div class={s.card}>
      <div class={s.cardHead}>
        <div class={s.iconWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 20h18M6 20V9l6-5 6 5v11" />
            <path d="M10 20v-5h4v5" />
          </svg>
        </div>
        <h2 class={s.cardTitle}>{surveyStrings.levelBookTitle}</h2>
        <div class={s.cardHeadRight}>
          <label for="survey-reading-unit" class={s.readingUnitLabel}>
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

      <div class={s.cardBody}>
        <div class={s.tabs}>
          <button type="button" class={`${s.tab} ${s.tabActive}`}>
            ▤ {surveyStrings.tabRiseFall}
          </button>
          <button
            type="button"
            class={`${s.tab} ${s.tabDisabled}`}
            disabled
            title="HI method contract arrives in PR 4"
          >
            ⌖ {surveyStrings.tabHI}
          </button>
        </div>

        <div class={s.fieldsGrid}>
          <div class={s.field}>
            <label class={s.fieldLabel} for="survey-startRL">
              {surveyStrings.startRL}
            </label>
            <div class={s.inputWrap}>
              <input
                id="survey-startRL"
                type="text"
                inputMode="decimal"
                value={startRL}
                data-input-start-rl=""
                onInput={(e) => setStartRL((e.target as HTMLInputElement).value)}
              />
              <em class={s.unitSuffix}>m</em>
            </div>
          </div>

          <div class={s.field}>
            <label class={s.fieldLabel} for="survey-closeRL">
              {surveyStrings.closingRL}
            </label>
            <div class={s.inputWrap}>
              <input
                id="survey-closeRL"
                type="text"
                inputMode="decimal"
                placeholder={surveyStrings.closingRLPlaceholder}
                value={closingRL}
                data-input-close-rl=""
                onInput={(e) => setClosingRL((e.target as HTMLInputElement).value)}
              />
              <em class={s.unitSuffix}>m</em>
            </div>
          </div>

          <div class={s.field}>
            <label class={s.fieldLabel} for="survey-allowable-const">
              {surveyStrings.allowableConstant}
            </label>
            <div class={s.inputWrap}>
              <input
                id="survey-allowable-const"
                type="text"
                value="24"
                disabled
                title="Requires PR 2 allowable error contract"
              />
              <em class={s.unitSuffix}>mm·√K</em>
            </div>
          </div>

          <div class={s.field}>
            <label class={s.fieldLabel} for="survey-adjust-by">
              {surveyStrings.adjustBy}
            </label>
            <div class={s.inputWrap}>
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

        <div class={s.secHead}>
          <span>{surveyStrings.fieldReadings}</span>
          <div class={s.secButtons}>
            <button
              type="button"
              class={`${s.miniBtn} ${s.miniBtnHighlight}`}
              onClick={loadSample}
              data-try-sample=""
            >
              ✨ {surveyStrings.trySample}
            </button>
            <button type="button" class={s.miniBtn} disabled title="Excel paste arrives in PR 5">
              📋 {surveyStrings.pasteExcel}
            </button>
          </div>
        </div>

        <SurveyLevelBookTable
          rows={rows}
          cellErrors={cellErrors}
          onCellChange={handleCellChange}
          onAddRow={handleAddRow}
          onRemoveRow={handleRemoveRow}
        />

        <div class={s.actionRow}>
          <button type="button" class={s.calcBtn} onClick={calculate} data-calculate-btn="">
            {surveyStrings.calculate}
          </button>
          <button type="button" class={s.resetBtn} onClick={reset} data-reset-btn="">
            {surveyStrings.reset}
          </button>
        </div>
      </div>
    </div>
  );
}
