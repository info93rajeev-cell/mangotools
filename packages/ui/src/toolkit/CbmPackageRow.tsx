import type { ResolvedPreset } from '@mangotools/schemas';
import { Icon } from '../primitives/Icon.tsx';
import c from './cbmPackageCard.module.css';
import { fillText } from './cbmResultStrings.ts';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmPackage, CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import { WEIGHT_UNITS, cbmWorkbenchText as w } from './cbmWorkbenchStrings.ts';
import s from './cbmWorksheet.module.css';
import { cbmWorksheetText as ws } from './cbmWorksheetStrings.ts';
import { messageFor } from './presentation.ts';
import type { RowHandle } from './useRowDrag.ts';

const FIELDS = ['description', 'length', 'width', 'height', 'quantity', 'weightPerItem'] as const;
type Field = (typeof FIELDS)[number] | 'weightUnit';

export interface PackageRowProps {
  row: CbmPackage;
  index: number;
  state: CbmSnapshot;
  controller: CbmController;
  preset: ResolvedPreset;
  selected: boolean;
  dragging: boolean;
  dropTarget: boolean;
  editing: boolean;
  onEdit: (id: number | null) => void;
  handle: RowHandle;
  onActivate: (id: number) => void;
}

const nameOf = (index: number) => `${w.carton} ${index + 1}`;
const describedName = (row: CbmPackage, index: number) => row.description.trim() || nameOf(index);

function FieldCell({
  row,
  index,
  state,
  controller,
  preset,
  field,
}: PackageRowProps & { field: Field }) {
  const id = `cbm-package-${row.id}-${field}`;
  const path = `packages.${index}.${field}`;
  const error = state.error?.path === path ? messageFor(preset, state.error) : null;
  const shared = {
    id,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${id}-error` : undefined,
  };
  return (
    <label class={`${s.cell} ${s[field] ?? ''}`} for={id}>
      <span class={s.fieldLabel}>{t[field]}</span>
      {field === 'weightUnit' ? (
        <select
          {...shared}
          value={row.weightUnit}
          onChange={(e) => controller.edit(row.id, field, e.currentTarget.value)}
        >
          {WEIGHT_UNITS.map(([value]) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...shared}
          value={row[field]}
          data-field={field}
          data-index={index}
          inputMode={field === 'description' ? 'text' : 'decimal'}
          maxLength={field === 'description' ? 120 : 64}
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
}

function CardSummary({ row, index, state }: PackageRowProps) {
  const cbm = state.shipment?.rows[index]?.totalCbm ?? '—';
  return (
    <>
      <span class={c.number} aria-hidden="true">
        {index + 1}
      </span>
      <span class={c.text}>
        <strong>{describedName(row, index)}</strong>
        <span>
          {`${row.length || '—'} × ${row.width || '—'} × ${row.height || '—'} ${row.unit} | ${ws.quantity}: ${row.quantity || '—'}`}
        </span>
        <span>
          {row.weightPerItem ? `${row.weightPerItem} ${row.weightUnit} | ` : ''}
          <b>{`CBM: ${cbm}`}</b>
        </span>
      </span>
    </>
  );
}

/** One package: a dense table row on desktop, a tappable summary card on phones. */
export function CbmPackageRow(props: PackageRowProps) {
  const { row, index, state, controller, selected, dragging, dropTarget, handle } = props;
  const invalid = !!state.error?.path?.startsWith(`packages.${index}.`);
  const name = nameOf(index);
  const open = props.editing || invalid;
  return (
    <fieldset
      class={s.row}
      data-package-row={row.id}
      data-selected={selected}
      data-dragging={dragging}
      data-drop={dropTarget}
      onFocusIn={() => props.onActivate(row.id)}
    >
      <legend>{name}</legend>
      <button
        type="button"
        class={s.handle}
        aria-pressed={selected}
        aria-label={fillText(w.select, { name })}
        aria-describedby="cbm-move-hint"
        {...handle}
      >
        <Icon name="grip-vertical" />
        <span>{index + 1}</span>
      </button>
      <button
        type="button"
        class={c.summary}
        aria-label={fillText(w.edit, { name })}
        aria-expanded={open}
        aria-controls={`cbm-edit-${row.id}`}
        onClick={() => props.onEdit(open ? null : row.id)}
      >
        <CardSummary {...props} />
      </button>
      <div id={`cbm-edit-${row.id}`} class={s.editor} data-open={open}>
        {[...FIELDS, 'weightUnit' as const].map((field) => (
          <FieldCell key={field} {...props} field={field} />
        ))}
        <button
          type="button"
          class={c.duplicate}
          disabled={state.packages.length >= 50}
          aria-label={`${t.duplicate} ${name}`}
          onClick={() => controller.duplicate(row.id)}
        >
          <Icon name="copy" />
          {t.duplicate}
        </button>
      </div>
      <output class={s.rowVolume} aria-label={`${name} ${t.rowCbm}`}>
        {state.shipment?.rows[index]?.totalCbm ?? '—'}
      </output>
      <button
        type="button"
        class={s.delete}
        aria-label={fillText(w.delete, { name })}
        title={t.remove}
        onClick={() => controller.remove(row.id)}
      >
        <Icon name="trash-2" />
      </button>
    </fieldset>
  );
}
