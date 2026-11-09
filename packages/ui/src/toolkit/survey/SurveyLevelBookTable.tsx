import {
  DeleteCell,
  DistanceCell,
  handleKeyDown,
  NumericCell,
  StationCell,
} from './SurveyLevelBookCells.tsx';
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

function renderTag(tag: string) {
  let tagCls = s.tag;
  if (tag === 'BM') tagCls = `${s.tag} ${s.tagBM}`;
  else if (tag === 'IS') tagCls = `${s.tag} ${s.tagIS}`;
  else if (tag === 'CP') tagCls = `${s.tag} ${s.tagCP}`;
  else if (tag === 'FS') tagCls = `${s.tag} ${s.tagFS}`;
  return <span class={tagCls}>{tag}</span>;
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
      <StationCell
        station={row.station}
        idx={idx}
        rowError={rowError}
        onChange={(v) => onCellChange(idx, 'station', v)}
        onAddRow={onAddRow}
      />
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
      <DistanceCell
        dist={row.dist}
        idx={idx}
        station={row.station}
        error={
          cellErrors[`observations.${idx}.dist`] ||
          (idx === 0 ? cellErrors['observations.0.dist'] : undefined)
        }
        onChange={(v) => onCellChange(idx, 'dist', v)}
        onAddRow={onAddRow}
      />
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
      <div style={{ marginTop: '6px' }}>
        <button type="button" class={s.miniBtn} onClick={onAddRow} data-add-row="">
          {surveyStrings.addRow}
        </button>
      </div>
    </div>
  );
}
