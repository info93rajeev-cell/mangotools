import sb from './surveyBenchmark.module.css';
import { surveyStrings } from './surveyLevelingStrings.ts';

function StartRLField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  return (
    <div class={sb.field}>
      <label class={sb.fieldLabel} for="survey-startRL">
        {surveyStrings.startRL}
      </label>
      <div class={sb.inputWrap}>
        <input
          id="survey-startRL"
          type="text"
          inputMode="decimal"
          value={value}
          class={error ? sb.inputError : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'survey-startRL-error' : undefined}
          data-input-start-rl=""
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        />
        <em class={sb.unitSuffix}>m</em>
      </div>
      {error ? (
        <span id="survey-startRL-error" class={sb.fieldErrorMessage} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function CloseRLField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  return (
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
          value={value}
          class={error ? sb.inputError : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'survey-closeRL-error' : undefined}
          data-input-close-rl=""
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        />
        <em class={sb.unitSuffix}>m</em>
      </div>
      {error ? (
        <span id="survey-closeRL-error" class={sb.fieldErrorMessage} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function AllowableConstField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  return (
    <div class={sb.field}>
      <label class={sb.fieldLabel} for="survey-allowable-const">
        {surveyStrings.allowableConstant}
      </label>
      <div class={sb.inputWrap}>
        <input
          id="survey-allowable-const"
          type="text"
          inputMode="decimal"
          placeholder={surveyStrings.allowableConstantPlaceholder}
          value={value}
          class={error ? sb.inputError : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error
              ? 'survey-allowable-const-err survey-allowable-const-help'
              : 'survey-allowable-const-help'
          }
          data-input-allowable-const=""
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        />
        <em class={sb.unitSuffix}>mm·√K</em>
      </div>
      {error ? (
        <span id="survey-allowable-const-err" class={sb.fieldErrorMessage} role="alert">
          {error}
        </span>
      ) : null}
      <span id="survey-allowable-const-help" class={sb.fieldHelperText}>
        {surveyStrings.allowableConstantHelper}
      </span>
    </div>
  );
}

function AdjustByField({
  value,
  onChange,
  error,
}: {
  value: 'none' | 'distance' | 'setup';
  onChange: (val: 'none' | 'distance' | 'setup') => void;
  error?: string;
}) {
  return (
    <div class={sb.field}>
      <label class={sb.fieldLabel} for="survey-adjust-by">
        {surveyStrings.adjustBy}
      </label>
      <div class={sb.inputWrap}>
        <select
          id="survey-adjust-by"
          value={value}
          class={error ? sb.inputError : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'survey-adjust-by-err' : undefined}
          data-select-adjust-by=""
          onChange={(e) =>
            onChange((e.target as HTMLSelectElement).value as 'none' | 'distance' | 'setup')
          }
        >
          <option value="none">{surveyStrings.adjustNone}</option>
          <option value="distance">{surveyStrings.adjustDistance}</option>
          <option value="setup">{surveyStrings.adjustSetups}</option>
        </select>
      </div>
      {error ? (
        <span id="survey-adjust-by-err" class={sb.fieldErrorMessage} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export interface BenchmarkFieldsGridProps {
  startRL: string;
  setStartRL: (val: string) => void;
  closingRL: string;
  setClosingRL: (val: string) => void;
  kConstant: string;
  setKConstant: (val: string) => void;
  adjBy: 'none' | 'distance' | 'setup';
  setAdjBy: (val: 'none' | 'distance' | 'setup') => void;
  startRLError?: string;
  closeRLError?: string;
  kConstantError?: string;
  adjByError?: string;
}

export function BenchmarkFieldsGrid({
  startRL,
  setStartRL,
  closingRL,
  setClosingRL,
  kConstant,
  setKConstant,
  adjBy,
  setAdjBy,
  startRLError,
  closeRLError,
  kConstantError,
  adjByError,
}: BenchmarkFieldsGridProps) {
  return (
    <div class={sb.fieldsGrid}>
      <StartRLField value={startRL} onChange={setStartRL} error={startRLError} />
      <CloseRLField value={closingRL} onChange={setClosingRL} error={closeRLError} />
      <AllowableConstField value={kConstant} onChange={setKConstant} error={kConstantError} />
      <AdjustByField value={adjBy} onChange={setAdjBy} error={adjByError} />
    </div>
  );
}
