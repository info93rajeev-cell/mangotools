import { useEffect, useState } from 'preact/hooks';
import type { DisplayOptions } from './CbmOptionsPanel.tsx';
import { moveItem } from './cbmRowUnits.ts';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { movePackage } from './cbmWorksheetActions.ts';

const afterRender = (run: () => void) => requestAnimationFrame(() => requestAnimationFrame(run));

/**
 * Presentation state of the workbench: display options, selected rows (for Duplicate selected),
 * the row the illustration shows, and the quick actions. Calculation state stays in the controller.
 */
export function useCbmWorkbench(state: CbmSnapshot, controller: CbmController) {
  const [options, setOptions] = useState<DisplayOptions>({
    weightUnit: 'kg',
    showTotalRow: false,
    showVisualization: true,
  });
  const [optionsOpen, setOptionsOpen] = useState(true);
  const [picked, setPicked] = useState<ReadonlySet<number>>(new Set());
  const [activeId, setActiveId] = useState<number | null>(null);
  useEffect(() => {
    if (matchMedia('(max-width: 700px)').matches) setOptionsOpen(false);
  }, []);
  const ids = state.packages.map((row) => row.id);
  const selected = new Set(ids.filter((id) => picked.has(id)));
  const activeIndex = Math.max(0, ids.indexOf(activeId ?? -1));
  const toggle = (id: number) => {
    const next = new Set(selected);
    if (!next.delete(id)) next.add(id);
    setPicked(next);
    setActiveId(id);
  };
  /** Contents move while row ids stay in place, so selection and the active row follow content. */
  const move = (from: number, to: number) => {
    const flags = moveItem(
      ids.map((id) => selected.has(id)),
      from,
      to,
    );
    const contents = moveItem(ids, from, to);
    setPicked(new Set(ids.filter((_, index) => flags[index])));
    setActiveId(ids[contents.indexOf(ids[activeIndex] ?? -1)] ?? null);
    movePackage(controller, from, to);
    afterRender(() =>
      document
        .querySelectorAll<HTMLElement>('[data-package-row] button[aria-pressed]')
        [to]?.focus(),
    );
  };
  const showVisualization = () => {
    setOptions((current) => ({ ...current, showVisualization: true }));
    afterRender(() => {
      document.getElementById('cbm-visual-title')?.scrollIntoView({ block: 'center' });
      document.querySelector<HTMLElement>('[data-cbm-views] [aria-pressed="true"]')?.focus();
    });
  };
  const showUnits = () => {
    setOptionsOpen(true);
    afterRender(() => {
      const unit = document.getElementById('cbm-dimension-unit');
      unit?.scrollIntoView({ block: 'center' });
      unit?.focus();
    });
  };
  return {
    options,
    setOptions: (patch: Partial<DisplayOptions>) => setOptions({ ...options, ...patch }),
    optionsOpen,
    setOptionsOpen,
    selected,
    activeIndex,
    setActiveId,
    toggle,
    move,
    showVisualization,
    showUnits,
  };
}
