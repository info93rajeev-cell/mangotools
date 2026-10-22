import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Button } from '../primitives/Button.tsx';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmPackage, CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import s from './cbmWorksheet.module.css';
import { cbmWorksheetText as w } from './cbmWorksheetStrings.ts';
import { messageFor } from './presentation.ts';

const dimensions = ['mm', 'cm', 'm', 'in', 'ft'];
const weights = ['kg', 'g', 'lb'];
const columns = [
  'description',
  'length',
  'width',
  'height',
  'unit',
  'quantity',
  'weightPerItem',
  'weightUnit',
] as const;
interface Props {
  className?: string;
  state: CbmSnapshot;
  controller: CbmController;
  preset: ResolvedPreset;
  newRow?: boolean;
}
function fieldChoices(field: string) {
  if (field === 'unit') return dimensions;
  return field === 'weightUnit' ? weights : null;
}
function inputMode(field: string) {
  return field === 'description' ? ('text' as const) : ('decimal' as const);
}
function fieldLimit(field: string) {
  return field === 'description' ? 120 : 64;
}
function RowFields({
  row,
  index,
  state,
  controller,
  preset,
}: Props & { row: CbmPackage; index: number }) {
  return (
    <>
      {columns.map((field) => {
        const id = `cbm-package-${row.id}-${field}`;
        const error =
          state.error?.path === `packages.${index}.${field}`
            ? messageFor(preset, state.error)
            : null;
        const choices = fieldChoices(field);
        return (
          <label key={field} class={s.cell} for={id}>
            <span class={s.fieldLabel}>{t[field]}</span>
            {choices ? (
              <select
                id={id}
                value={row[field]}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(e) => controller.edit(row.id, field, e.currentTarget.value)}
              >
                {choices.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                value={row[field]}
                inputMode={inputMode(field)}
                maxLength={fieldLimit(field)}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                onInput={(e) => controller.edit(row.id, field, e.currentTarget.value)}
              />
            )}
            {error ? (
              <span id={`${id}-error`} class={s.error}>
                {error}
              </span>
            ) : null}
          </label>
        );
      })}
    </>
  );
}
function MobileSummary({ row, index, state }: Props & { row: CbmPackage; index: number }) {
  return (
    <div class={s.mobileSummary}>
      <strong>
        {index + 1} · {row.description.trim() || `${t.package} ${index + 1}`}
      </strong>
      <span>
        {row.length || '—'} × {row.width || '—'} × {row.height || '—'} {row.unit} · {w.quantity}{' '}
        {row.quantity}
      </span>
      <span>
        {row.weightPerItem ? `${row.weightPerItem} ${row.weightUnit} · ` : ''}
        {w.cbm} {state.shipment?.rows[index]?.totalCbm ?? '—'}
      </span>
    </div>
  );
}
function PackageRow(props: Props & { row: CbmPackage; index: number }) {
  const { row, index, state, controller } = props;
  const [editing, setEditing] = useState(
    !!props.newRow || !row.length || !row.width || !row.height,
  );
  const invalid = !!state.error?.path?.startsWith(`packages.${index}.`);
  useEffect(() => {
    if (invalid) setEditing(true);
  }, [invalid]);
  return (
    <fieldset class={s.row} data-package-row={row.id}>
      <legend>
        {t.package} {index + 1}
      </legend>
      <MobileSummary {...props} />
      <span class={s.rowNumber} aria-hidden="true">
        {index + 1}
      </span>
      <div id={`cbm-edit-${row.id}`} class={s.editor} data-open={editing || invalid}>
        <RowFields {...props} />
      </div>
      <output class={s.rowVolume} aria-label={`${t.package} ${index + 1} ${t.rowCbm}`}>
        <span class={s.fieldLabel}>{t.rowCbm}</span>
        {state.shipment?.rows[index]?.totalCbm ?? '—'} <small>m³</small>
      </output>
      <div class={s.rowActions}>
        <Button
          size="sm"
          class={s.editButton}
          aria-label={`${w.edit} ${t.package} ${index + 1}`}
          aria-expanded={editing || invalid}
          aria-controls={`cbm-edit-${row.id}`}
          onClick={() => setEditing(!editing)}
        >
          {w.edit}
        </Button>
        <Button
          size="sm"
          disabled={state.packages.length >= 50}
          aria-label={`${t.duplicate} ${t.package} ${index + 1}`}
          title={t.duplicate}
          onClick={() => controller.duplicate(row.id)}
        >
          <span aria-hidden="true">⧉</span>
        </Button>
        <Button
          size="sm"
          aria-label={`${t.remove} ${t.package} ${index + 1}`}
          title={t.remove}
          onClick={() => controller.remove(row.id)}
        >
          <span aria-hidden="true">×</span>
        </Button>
      </div>
    </fieldset>
  );
}
export function CbmPackageWorksheet(props: Props) {
  const { state, controller, className = '' } = props;
  const initialRows = useRef(new Set(state.packages.map((row) => row.id)));
  const focusAdded = () => {
    controller.add();
    queueMicrotask(() =>
      document
        .querySelector<HTMLInputElement>(
          `#cbm-package-${controller.get().packages.at(-1)?.id}-description`,
        )
        ?.focus(),
    );
  };
  return (
    <section class={`${s.panel} ${className}`} aria-labelledby="cbm-packages-title">
      <div class={s.heading}>
        <h2 id="cbm-packages-title">
          {t.packages} <small>({state.packages.length})</small>
        </h2>
        <Button size="sm" onClick={() => controller.sample()}>
          {t.sample}
        </Button>
      </div>
      <div class={s.rows}>
        <div class={s.tableHeader} data-cbm-worksheet-header="" aria-hidden="true">
          <span>#</span>
          {columns.map((field) => (
            <span key={field}>{field in w ? w[field as keyof typeof w] : t[field]}</span>
          ))}
          <span>{t.rowCbm}</span>
          <span />
        </div>
        {state.packages.map((row, index) => (
          <PackageRow
            key={row.id}
            {...props}
            row={row}
            index={index}
            newRow={!initialRows.current.has(row.id)}
          />
        ))}
      </div>
      <div class={s.toolbar}>
        <Button
          size="sm"
          variant="primary"
          disabled={state.packages.length >= 50}
          onClick={focusAdded}
        >
          {t.add}
        </Button>
        <Button size="sm" onClick={() => controller.clear()}>
          {t.clear}
        </Button>
        <span>{state.packages.length} / 50</span>
      </div>
      {state.packages.length >= 50 ? <p>{t.limit}</p> : null}
    </section>
  );
}
