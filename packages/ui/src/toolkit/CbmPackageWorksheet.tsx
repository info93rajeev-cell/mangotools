import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef, useState } from 'preact/hooks';
import { Button } from '../primitives/Button.tsx';
import { Icon } from '../primitives/Icon.tsx';
import { CbmPackageRow } from './CbmPackageRow.tsx';
import { isBlock, PASTE_COLUMNS, type PasteField, parseGrid, withoutHeader } from './cbmPaste.ts';
import { groupFigure } from './cbmResultFormat.ts';
import { fillText } from './cbmResultStrings.ts';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import { cbmWorkbenchText as w } from './cbmWorkbenchStrings.ts';
import s from './cbmWorksheet.module.css';
import { addPackage, duplicatePackages, pasteBlock } from './cbmWorksheetActions.ts';
import { cbmWorksheetText as ws } from './cbmWorksheetStrings.ts';
import { useRowDrag } from './useRowDrag.ts';

export interface WorksheetProps {
  className?: string;
  state: CbmSnapshot;
  controller: CbmController;
  preset: ResolvedPreset;
  weightUnit: string;
  selected: ReadonlySet<number>;
  activeId: number | undefined;
  showTotalRow: boolean;
  onToggle: (id: number) => void;
  onMove: (from: number, to: number) => void;
  onActivate: (id: number) => void;
}

function TableHeader({ unit }: { unit: string }) {
  const sized = (label: string) => (
    <span>
      {label}
      <small>({unit})</small>
    </span>
  );
  return (
    <div class={s.tableHeader} data-cbm-worksheet-header="" aria-hidden="true">
      <span>#</span>
      <span>
        {t.description}
        <small>{w.optional}</small>
      </span>
      {sized(t.length)}
      {sized(t.width)}
      {sized(t.height)}
      <span>{ws.quantity}</span>
      <span class={s.weightHead}>
        {w.weightPerCarton}
        <small>{w.optional}</small>
      </span>
      <span>{t.rowCbm}</span>
      <span />
    </div>
  );
}

function TotalRow({ state }: { state: CbmSnapshot }) {
  const result = state.shipment;
  if (!result) return null;
  const weight = result.knownPackedWeightKg;
  return (
    <div class={s.totalRow} data-cbm-total-row="">
      <strong>{w.total}</strong>
      <span class={s.totalPieces}>{groupFigure(result.totalPieces)}</span>
      <span class={s.totalWeight}>{weight === null ? '—' : `${groupFigure(weight)} kg`}</span>
      <strong class={s.totalCbm}>{`${groupFigure(result.totalCbm)} m³`}</strong>
    </div>
  );
}

/** Reads the cell a paste starts in: the package position and the worksheet column. */
function pasteStart(target: EventTarget | null): { index: number; field: PasteField } | null {
  const input = target instanceof HTMLInputElement ? target : null;
  const field = input?.dataset.field as PasteField | undefined;
  if (!input || !field || !PASTE_COLUMNS.includes(field)) return null;
  return { index: Number(input.dataset.index), field };
}

export function CbmPackageWorksheet(props: WorksheetProps) {
  const { state, controller, className = '', selected, weightUnit } = props;
  const list = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<number | null>(
    () => state.packages.find((row) => !row.length || !row.width || !row.height)?.id ?? null,
  );
  const [status, announce] = useState('');
  const [listOpen, setListOpen] = useState(true);
  const { drag, handlers } = useRowDrag(list, state.packages.length, props.onMove, (index) => {
    const row = state.packages[index];
    if (row) props.onToggle(row.id);
  });
  const onPaste = (event: ClipboardEvent) => {
    const text = event.clipboardData?.getData('text/plain') ?? '';
    const start = pasteStart(event.target);
    if (!start || !isBlock(text)) return;
    event.preventDefault();
    const count = pasteBlock(controller, start, withoutHeader(parseGrid(text)), weightUnit);
    announce(fillText(w.pasted, { count }));
  };
  const add = () => {
    const id = addPackage(controller, weightUnit);
    setOpenId(id ?? null);
    queueMicrotask(() => document.getElementById(`cbm-package-${id}-description`)?.focus());
  };
  const count = state.packages.length;
  return (
    <section
      class={`${s.panel} ${className}`}
      aria-labelledby="cbm-packages-title"
      data-collapsed={!listOpen}
    >
      <div class={s.heading}>
        <h2 id="cbm-packages-title">
          <span class={s.long}>{w.cartonsTitle}</span>
          <span class={s.short}>{w.cartonsShort}</span>{' '}
          <small class={s.long}>{fillText(w.items, { count })}</small>
          <small class={s.short}>({count})</small>
        </h2>
        <Button size="sm" class={s.clear} onClick={() => controller.clear()}>
          {t.clear}
        </Button>
        <button
          type="button"
          class={s.collapse}
          aria-expanded={listOpen}
          aria-controls="cbm-carton-list"
          aria-label={fillText(w.toggleSection, { section: w.cartonsShort })}
          onClick={() => setListOpen(!listOpen)}
        >
          <Icon name={listOpen ? 'chevron-up' : 'chevron-down'} />
        </button>
      </div>
      <div id="cbm-carton-list" class={s.table} ref={list} onPaste={onPaste}>
        <TableHeader unit={state.unit} />
        {state.packages.map((row, index) => (
          <CbmPackageRow
            key={row.id}
            {...props}
            row={row}
            index={index}
            selected={selected.has(row.id)}
            dragging={drag?.from === index}
            dropTarget={!!drag && drag.over === index && drag.from !== index}
            editing={openId === row.id}
            onEdit={setOpenId}
            handle={handlers(index)}
          />
        ))}
        {props.showTotalRow ? <TotalRow state={state} /> : null}
      </div>
      <div class={s.toolbar}>
        <Button size="sm" icon="plus" class={s.add} disabled={count >= 50} onClick={add}>
          {w.addCarton}
        </Button>
        <Button
          size="sm"
          icon="copy"
          class={s.duplicate}
          disabled={count >= 50}
          onClick={() =>
            duplicatePackages(
              controller,
              selected.size
                ? selected
                : new Set(props.activeId === undefined ? [] : [props.activeId]),
            )
          }
        >
          {w.duplicateSelected}
        </Button>
        <Button size="sm" class={s.footerClear} onClick={() => controller.clear()}>
          {t.clear}
        </Button>
        <span class={s.count}>{fillText(w.rows, { count })}</span>
        <span class={s.tip}>
          <b>{w.tipLabel}</b> {w.tipText}
        </span>
      </div>
      {count >= 50 ? <p class={s.limit}>{t.limit}</p> : null}
      <p id="cbm-move-hint" class="visually-hidden">
        {w.moveHint}
      </p>
      <p class="visually-hidden" role="status">
        {status}
      </p>
    </section>
  );
}
