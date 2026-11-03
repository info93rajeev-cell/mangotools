import s from './surveyLevelBook.module.css';
import { detectRowTag, isChangePointRow } from './surveyLevelingModel.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyLevelingRow } from './surveyLevelingTypes.ts';

export interface SurveyLevelBookTableProps {
  rows: SurveyLevelingRow[];
  cellErrors: Record<string, string>;
  onCellChange: (index: number, field: keyof SurveyLevelingRow, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
}

function handleKeyDown(e: KeyboardEvent, onAddRow: () => void) {
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

function renderTag(tag: string) {
  let tagCls = s.tag;
  if (tag === 'BM') tagCls = `${s.tag} ${s.tagBM}`;
  else if (tag === 'IS') tagCls = `${s.tag} ${s.tagIS}`;
  else if (tag === 'CP') tagCls = `${s.tag} ${s.tagCP}`;
  else if (tag === 'FS') tagCls = `${s.tag} ${s.tagFS}`;
  return <span class={tagCls}>{tag}</span>;
}

function NumericCell({
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

function DeleteCell({
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

function LevelBookRow({
  row,
  idx,
  total,
  cellErrors,
  canDelete,
  onCellChange,
  onAddRow,
  onRemoveRow,
}: {
  row: SurveyLevelingRow;
  idx: number;
  total: number;
  cellErrors: Record<string, string>;
  canDelete: boolean;
  onCellChange: (index: number, field: keyof SurveyLevelingRow, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
}) {
  const tag = detectRowTag(row, idx, total);
  const isCP = isChangePointRow(row);
  const rowError = cellErrors[`observations.${idx}`];
  return (
    <tr key={row.id} class={isCP ? s.cpRow : undefined} data-row-index={idx}>
      <td class={s.idxCol} style={{ textAlign: 'center' }}>
        {renderTag(tag)}
      </td>
      <td>
        <input
          type="text"
          placeholder="Station"
          value={row.station}
          id={`survey-obs-${idx}-station`}
          data-cell={`station-${idx}`}
          class={rowError ? s.inputError : undefined}
          aria-label={`${surveyStrings.colStation} ${idx + 1}`}
          aria-invalid={rowError ? 'true' : undefined}
          onInput={(e) => onCellChange(idx, 'station', (e.target as HTMLInputElement).value)}
          onKeyDown={(e) => handleKeyDown(e, onAddRow)}
        />
      </td>
      <NumericCell
        field="bs"
        value={row.bs}
        idx={idx}
        station={row.station}
        error={cellErrors[`observations.${idx}.bs`]}
        onChange={(v) => onCellChange(idx, 'bs', v)}
        onAddRow={onAddRow}
      />
      <NumericCell
        field="is"
        value={row.is}
        idx={idx}
        station={row.station}
        error={cellErrors[`observations.${idx}.is`]}
        onChange={(v) => onCellChange(idx, 'is', v)}
        onAddRow={onAddRow}
      />
      <NumericCell
        field="fs"
        value={row.fs}
        idx={idx}
        station={row.station}
        error={cellErrors[`observations.${idx}.fs`]}
        onChange={(v) => onCellChange(idx, 'fs', v)}
        onAddRow={onAddRow}
      />
      <td class={s.inputNumber}>
        <input
          type="text"
          inputMode="decimal"
          value={row.dist}
          disabled
          aria-label={`${surveyStrings.colStation} ${row.station || idx + 1} ${surveyStrings.colDist}`}
          title="Distance column is in internal preview (requires PR 2 contract)"
          placeholder="—"
          onInput={(e) => onCellChange(idx, 'dist', (e.target as HTMLInputElement).value)}
        />
      </td>
      <td class={s.remCol}>
        <input
          type="text"
          placeholder="—"
          value={row.remarks}
          id={`survey-obs-${idx}-remarks`}
          data-cell={`remarks-${idx}`}
          aria-label={`${surveyStrings.colStation} ${row.station || idx + 1} ${surveyStrings.colRemarks}`}
          onInput={(e) => onCellChange(idx, 'remarks', (e.target as HTMLInputElement).value)}
          onKeyDown={(e) => handleKeyDown(e, onAddRow)}
        />
      </td>
      <DeleteCell canDelete={canDelete} idx={idx} onRemoveRow={onRemoveRow} />
    </tr>
  );
}

export function SurveyLevelBookTable({
  rows,
  cellErrors,
  onCellChange,
  onAddRow,
  onRemoveRow,
}: SurveyLevelBookTableProps) {
  return (
    <div class={s.tableContainer}>
      <div class={s.tableWrap}>
        <table class={s.levelBookTable} data-level-book-table="">
          <thead>
            <tr>
              <th class={`${s.thIdx} ${s.idxCol}`}>{surveyStrings.colIndex}</th>
              <th class={s.thStation}>{surveyStrings.colStation}</th>
              <th class={s.thReading}>{surveyStrings.colBS}</th>
              <th class={s.thReading}>{surveyStrings.colIS}</th>
              <th class={s.thReading}>{surveyStrings.colFS}</th>
              <th class={s.thDist}>{surveyStrings.colDist}</th>
              <th class={`${s.thRem} ${s.remCol}`}>{surveyStrings.colRemarks}</th>
              <th class={s.thDel}>
                <span class={s.srOnly}>{surveyStrings.colDelete}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <LevelBookRow
                key={row.id}
                row={row}
                idx={idx}
                total={rows.length}
                cellErrors={cellErrors}
                canDelete={rows.length > 2}
                onCellChange={onCellChange}
                onAddRow={onAddRow}
                onRemoveRow={onRemoveRow}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div class={s.hint}>{surveyStrings.hintKeyboard}</div>
      <div style={{ marginTop: '8px' }}>
        <button type="button" class={s.miniBtn} onClick={onAddRow} data-add-row="">
          {surveyStrings.addRow}
        </button>
      </div>
    </div>
  );
}
