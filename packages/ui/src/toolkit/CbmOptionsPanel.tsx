import { Icon } from '../primitives/Icon.tsx';
import s from './cbmInputs.module.css';
import type { CbmController } from './cbmShipmentController.ts';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import { DIMENSION_UNITS, WEIGHT_UNITS, cbmWorkbenchText as w } from './cbmWorkbenchStrings.ts';
import { setDimensionUnit, setWeightUnit } from './cbmWorksheetActions.ts';

export interface DisplayOptions {
  weightUnit: string;
  showTotalRow: boolean;
  showVisualization: boolean;
}

interface Props {
  className?: string;
  state: CbmSnapshot;
  controller: CbmController;
  options: DisplayOptions;
  open: boolean;
  onOpen: (open: boolean) => void;
  onOptions: (patch: Partial<DisplayOptions>) => void;
}

function Choice({
  label,
  id,
  value,
  choices,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  choices: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  return (
    <label for={id}>
      {label}
      <select
        id={id}
        value={value}
        aria-describedby="cbm-unit-help"
        onChange={(e) => onChange(e.currentTarget.value)}
      >
        {choices.map(([option, text]) => (
          <option key={option} value={option}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Units & Display Options: one dimension and weight unit for the worksheet, and what is shown. */
export function CbmOptionsPanel({
  state,
  controller,
  options,
  open,
  onOpen,
  onOptions,
  className = '',
}: Props) {
  return (
    <section
      class={`${s.panel} ${s.optionsPanel} ${className}`}
      aria-labelledby="cbm-options-title"
    >
      <h2 id="cbm-options-title" class={s.collapseTitle}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="cbm-options-body"
          onClick={() => onOpen(!open)}
        >
          <Icon name="settings" />
          <span class={s.long}>{t.options}</span>
          <span class={s.short}>{w.optionsShort}</span>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} class={s.chevron} />
        </button>
      </h2>
      <div id="cbm-options-body" class={s.options} hidden={!open}>
        <Choice
          label={w.dimensionUnit}
          id="cbm-dimension-unit"
          value={state.unit}
          choices={DIMENSION_UNITS}
          onChange={(unit) => setDimensionUnit(controller, unit)}
        />
        <Choice
          label={w.weightUnit}
          id="cbm-weight-unit"
          value={options.weightUnit}
          choices={WEIGHT_UNITS}
          onChange={(weightUnit) => {
            setWeightUnit(controller, weightUnit);
            onOptions({ weightUnit });
          }}
        />
        <Choice
          label={t.precision}
          id="cbm-precision"
          value={state.precision}
          choices={['2', '3', '4'].map((places) => [places, places] as const)}
          onChange={(places) => controller.setPrecision(places)}
        />
        <label class={s.check}>
          <input
            type="checkbox"
            checked={options.showTotalRow}
            onChange={(e) => onOptions({ showTotalRow: e.currentTarget.checked })}
          />
          {w.showTotalRow}
        </label>
        <label class={s.check}>
          <input
            type="checkbox"
            checked={options.showVisualization}
            onChange={(e) => onOptions({ showVisualization: e.currentTarget.checked })}
          />
          {w.showVisualization}
        </label>
        <p id="cbm-unit-help" class="visually-hidden">
          {w.unitHelp}
        </p>
      </div>
    </section>
  );
}
