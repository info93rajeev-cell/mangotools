import { useState } from 'preact/hooks';
import s from './containerWorksheet.module.css';
import c from './containerWorkspace.module.css';
import type { LoadControllerHandle } from './containerWorkspaceController.ts';
import type { LoadPackage, LoadSnapshot } from './containerWorkspaceModel.ts';
import { containerText as t } from './containerWorkspaceStrings.ts';

interface Props {
  state: LoadSnapshot;
  controller: LoadControllerHandle;
}
const keys = [
  'description',
  'length',
  'width',
  'height',
  'quantity',
  'weight',
  'unit',
  'weightUnit',
] as const;
function PackageFields({
  row,
  index,
  state,
  controller,
}: { row: LoadPackage; index: number } & Props) {
  return (
    <div class={s.editor}>
      {keys.map((key) => (
        <label key={key} for={`load-${row.id}-${key}`}>
          <span class={s.fieldLabel}>{t[key]}</span>
          {key === 'unit' || key === 'weightUnit' ? (
            <select
              id={`load-${row.id}-${key}`}
              aria-label={`${t[key]} ${index + 1}`}
              value={row[key]}
              onChange={(e) => controller.edit(row.id, key, e.currentTarget.value)}
            >
              {(key === 'unit' ? ['mm', 'cm', 'm', 'in', 'ft'] : ['kg', 'g', 'lb']).map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          ) : (
            <input
              id={`load-${row.id}-${key}`}
              aria-label={`${t[key]} ${index + 1}`}
              value={row[key]}
              inputMode={key === 'description' ? 'text' : 'decimal'}
              maxLength={key === 'description' ? 120 : 64}
              aria-invalid={state.error?.path === `packages.${index}.${key}`}
              onInput={(e) => controller.edit(row.id, key, e.currentTarget.value)}
            />
          )}
        </label>
      ))}
    </div>
  );
}
function PackageRow({
  row,
  index,
  state,
  controller,
  selected,
  onSelect,
}: { row: LoadPackage; index: number; selected: number; onSelect: (id: number) => void } & Props) {
  const [editing, setEditing] = useState(row.id >= 4 || !row.length);
  const invalid = !!state.error?.path?.startsWith(`packages.${index}.`);
  return (
    <fieldset class={s.packageRow} data-load-package={row.id}>
      <legend class={s.sr}>
        {t.select} {index + 1}
      </legend>
      <label class={s.selectRow}>
        <input
          type="radio"
          name="load-selected"
          aria-label={`${t.select} ${index + 1}`}
          checked={selected === row.id}
          onChange={() => onSelect(row.id)}
        />
        <span>{index + 1}</span>
      </label>
      <button
        type="button"
        class={s.packageSummary}
        aria-label={t.edit}
        aria-expanded={editing || invalid}
        aria-controls={`load-editor-${row.id}`}
        onClick={() => setEditing(!editing)}
      >
        <strong>{row.description || `${t.select} ${index + 1}`}</strong>
        <span>
          {row.length || '—'} × {row.width || '—'} × {row.height || '—'} {row.unit} · {t.quantity}{' '}
          {row.quantity}
        </span>
        <span>
          {row.weight ? `${row.weight} ${row.weightUnit}` : '—'} · {t.cbm}{' '}
          {state.result?.packages[index]?.requestedVolume ?? '—'}
        </span>
        <small>{t.edit}</small>
      </button>
      <div id={`load-editor-${row.id}`} class={s.rowEditor} data-open={editing || invalid}>
        <PackageFields row={row} index={index} state={state} controller={controller} />
      </div>
      <div class={s.rowButtons}>
        <button
          type="button"
          aria-label={`${t.remove} ${index + 1}`}
          onClick={() => controller.remove(row.id)}
        >
          ×
        </button>
      </div>
    </fieldset>
  );
}
export function ContainerPackageWorksheet({ state, controller }: Props) {
  const [selected, setSelected] = useState(0);
  return (
    <section
      class={`${c.card} ${c.worksheet} ${s.worksheet}`}
      aria-labelledby="load-packages-title"
    >
      <div class={c.heading}>
        <h2 id="load-packages-title">
          {t.packages} <small>({state.packages.length})</small>
        </h2>
        <button type="button" class={s.danger} onClick={controller.clear}>
          {t.clear}
        </button>
      </div>
      <div class={s.packageRows}>
        <div class={s.tableHeader} aria-hidden="true">
          <span>#</span>
          {keys.map((key) => (
            <span key={key}>
              {key === 'weight'
                ? t.weightShort
                : key === 'unit'
                  ? t.unitShort
                  : key === 'weightUnit'
                    ? t.weightUnitShort
                    : t[key]}
            </span>
          ))}
          <span />
        </div>
        {state.packages.map((row, index) => (
          <PackageRow
            key={row.id}
            row={row}
            index={index}
            state={state}
            controller={controller}
            selected={selected}
            onSelect={setSelected}
          />
        ))}
      </div>
      <div class={s.toolbar}>
        <button type="button" disabled={state.packages.length >= 50} onClick={controller.add}>
          + {t.add}
        </button>
        <button
          type="button"
          disabled={state.packages.length >= 50 || !state.packages.some((p) => p.id === selected)}
          onClick={() => controller.duplicate(selected)}
        >
          {t.duplicate}
        </button>
        <span>
          {t.rows}: {state.packages.length}/50
        </span>
      </div>
      {state.packages.length >= 50 ? <p>{t.limit}</p> : null}
    </section>
  );
}
