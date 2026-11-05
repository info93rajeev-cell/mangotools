import s from './surveyLevelBook.module.css';
import { surveyStrings } from './surveyLevelingStrings.ts';

export function handleKeyDown(e: KeyboardEvent, onAddRow: () => void) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const current = e.target as HTMLElement;
  const container = current.closest('[data-level-book-table]');
  if (!container) return;
  const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('input:not([disabled])'));
  const index = inputs.indexOf(current as HTMLInputElement);
  if (index >= 0 && index < inputs.length - 1) {
    inputs[index + 1]?.focus();
  } else if (index === inputs.length - 1) {
    onAddRow();
    setTimeout(() => {
      const nextInputs = container.querySelectorAll<HTMLInputElement>('input:not([disabled])');
      nextInputs[index + 1]?.focus();
    }, 50);
  }
}

export function NumericCell({
  field,
  value,
  idx,
  station,
  error,
  onChange,
  onAddRow,
}: {
  field: 'bs' | 'is' | 'fs';
  value: string;
  idx: number;
  station: string;
  error?: string;
  onChange: (v: string) => void;
  onAddRow: () => void;
}) {
  const fieldName =
    field === 'bs'
      ? surveyStrings.colBS
      : field === 'is'
        ? surveyStrings.colIS
        : surveyStrings.colFS;
  const label = `${surveyStrings.colStation} ${station || idx + 1} ${fieldName}`;
  const inputId = `survey-obs-${idx}-${field}`;
  return (
    <td class={s.inputNumber}>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        id={inputId}
        class={error ? s.inputError : undefined}
        data-cell={`${field}-${idx}`}
        aria-label={label}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-err` : undefined}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => handleKeyDown(e, onAddRow)}
      />
      {error ? (
        <span id={`${inputId}-err`} class={s.fieldErrorMessage} role="alert">
          {error}
        </span>
      ) : null}
    </td>
  );
}

export function DistanceCell({
  dist,
  idx,
  station,
  error,
  onChange,
  onAddRow,
}: {
  dist: string;
  idx: number;
  station: string;
  error?: string;
  onChange: (v: string) => void;
  onAddRow: () => void;
}) {
  const inputId = `survey-obs-${idx}-dist`;
  const label = `${surveyStrings.colStation} ${station || idx + 1} ${surveyStrings.colDist}`;
  return (
    <td class={s.inputNumber}>
      <input
        type="text"
        inputMode="decimal"
        value={dist}
        id={inputId}
        data-cell={`dist-${idx}`}
        class={error ? s.inputError : undefined}
        aria-label={label}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-err` : undefined}
        placeholder={idx === 0 ? '0' : '—'}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => handleKeyDown(e, onAddRow)}
      />
      {error ? (
        <span id={`${inputId}-err`} class={s.fieldErrorMessage} role="alert">
          {error}
        </span>
      ) : null}
    </td>
  );
}

export function StationCell({
  station,
  idx,
  rowError,
  onChange,
  onAddRow,
}: {
  station: string;
  idx: number;
  rowError?: string;
  onChange: (v: string) => void;
  onAddRow: () => void;
}) {
  return (
    <td>
      <input
        type="text"
        placeholder="Station"
        value={station}
        id={`survey-obs-${idx}-station`}
        data-cell={`station-${idx}`}
        class={rowError ? s.inputError : undefined}
        aria-label={`${surveyStrings.colStation} ${idx + 1}`}
        aria-invalid={rowError ? 'true' : undefined}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => handleKeyDown(e, onAddRow)}
      />
    </td>
  );
}

export function DeleteCell({
  canDelete,
  idx,
  onRemoveRow,
}: {
  canDelete: boolean;
  idx: number;
  onRemoveRow: (index: number) => void;
}) {
  return (
    <td style={{ textAlign: 'center' }}>
      {canDelete ? (
        <button
          type="button"
          class={s.deleteBtn}
          title={surveyStrings.colDelete}
          aria-label={`${surveyStrings.colDelete} ${idx + 1}`}
          onClick={() => onRemoveRow(idx)}
        >
          ×
        </button>
      ) : null}
    </td>
  );
}
