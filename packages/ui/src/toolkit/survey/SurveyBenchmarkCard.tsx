import { useRef } from 'preact/hooks';
import { BenchmarkFieldsGrid } from './SurveyBenchmarkFields.tsx';
import { SurveyLevelBookTable } from './SurveyLevelBookTable.tsx';
import sb from './surveyBenchmark.module.css';
import sl from './surveyLevelBook.module.css';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyLevelingRow } from './surveyLevelingTypes.ts';

export interface SurveyBenchmarkCardProps {
  method: 'rise-fall' | 'height-of-instrument';
  setMethod: (val: 'rise-fall' | 'height-of-instrument') => void;
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
  onOpenPasteModal?: () => void;
}

interface BenchmarkMethodTabsProps {
  method: 'rise-fall' | 'height-of-instrument';
  setMethod: (m: 'rise-fall' | 'height-of-instrument') => void;
}

function handleTabKeyDown(
  e: KeyboardEvent,
  method: 'rise-fall' | 'height-of-instrument',
  setMethod: (m: 'rise-fall' | 'height-of-instrument') => void,
  rfRef: { current: HTMLButtonElement | null },
  hiRef: { current: HTMLButtonElement | null },
) {
  let target: 'rise-fall' | 'height-of-instrument' | null = null;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    target = method === 'rise-fall' ? 'height-of-instrument' : 'rise-fall';
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    target = method === 'height-of-instrument' ? 'rise-fall' : 'height-of-instrument';
  } else if (e.key === 'Home') {
    target = 'rise-fall';
  } else if (e.key === 'End') {
    target = 'height-of-instrument';
  }
  if (target) {
    e.preventDefault();
    setMethod(target);
    const btn = target === 'rise-fall' ? rfRef.current : hiRef.current;
    btn?.focus();
  }
}

function BenchmarkMethodTabs({ method, setMethod }: BenchmarkMethodTabsProps) {
  const isRf = method === 'rise-fall';
  const rfRef = useRef<HTMLButtonElement>(null);
  const hiRef = useRef<HTMLButtonElement>(null);

  const onKeyDown = (e: KeyboardEvent) => handleTabKeyDown(e, method, setMethod, rfRef, hiRef);

  return (
    <div class={sb.tabs} role="tablist" aria-label="Reduction method">
      <button
        ref={rfRef}
        id="survey-tab-rise-fall"
        type="button"
        role="tab"
        aria-selected={isRf}
        tabIndex={isRf ? 0 : -1}
        class={`${sb.tab} ${isRf ? sb.tabActive : ''}`}
        onClick={() => setMethod('rise-fall')}
        onKeyDown={onKeyDown}
        data-method-tab="rise-fall"
        data-method-rf=""
      >
        ▤ {surveyStrings.tabRiseFall}
      </button>
      <button
        ref={hiRef}
        id="survey-tab-height-of-instrument"
        type="button"
        role="tab"
        aria-selected={!isRf}
        tabIndex={!isRf ? 0 : -1}
        class={`${sb.tab} ${!isRf ? sb.tabActive : ''}`}
        onClick={() => setMethod('height-of-instrument')}
        onKeyDown={onKeyDown}
        data-method-tab="height-of-instrument"
        data-method-hi=""
      >
        ⌖ {surveyStrings.tabHI}
      </button>
    </div>
  );
}

export function SurveyBenchmarkCard({
  method,
  setMethod,
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
  onOpenPasteModal,
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
        <BenchmarkMethodTabs method={method} setMethod={setMethod} />

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
              onClick={onOpenPasteModal}
              data-paste-excel=""
              title={surveyStrings.pasteExcel}
            >
              📋 {surveyStrings.pasteExcel}
            </button>
          </div>
        </div>

        {generalRowError ? (
          <div class={sb.generalRowError} role="alert" data-survey-error="">
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
