import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmPackage, CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import s from './cbmWorksheet.module.css';
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
function PackageRow(props: Props & { row: CbmPackage; index: number }) {
  const { row, index, state, controller } = props;
  return (
    <fieldset class={s.row} data-package-row={row.id}>
      <legend>
        {t.package} {index + 1}
      </legend>
      <RowFields {...props} />
      <output class={s.rowVolume} aria-label={`${t.package} ${index + 1} ${t.rowCbm}`}>
        <span class={s.fieldLabel}>{t.rowCbm}</span>
        {state.shipment?.rows[index]?.totalCbm ?? '—'} <small>m³</small>
      </output>
      <div class={s.rowActions}>
        <Button
          size="sm"
          disabled={state.packages.length >= 50}
          aria-label={`${t.duplicate} ${t.package} ${index + 1}`}
          onClick={() => controller.duplicate(row.id)}
        >
          {t.duplicate}
        </Button>
        <Button
          size="sm"
          aria-label={`${t.remove} ${t.package} ${index + 1}`}
          onClick={() => controller.remove(row.id)}
        >
          {t.remove}
        </Button>
      </div>
    </fieldset>
  );
}
export function CbmPackageWorksheet(props: Props) {
  const { state, controller, className = '' } = props;
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
        <h2 id="cbm-packages-title">{t.packages}</h2>
        <Button size="sm" onClick={() => controller.sample()}>
          {t.sample}
        </Button>
      </div>
      <div class={s.rows}>
        {state.packages.map((row, index) => (
          <PackageRow key={row.id} {...props} row={row} index={index} />
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
