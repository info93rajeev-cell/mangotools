import type { PresetField, ResolvedPreset, RowsSpec } from '@mangotools/schemas';
import { Button, RepeatableRows } from '@mangotools/ui';
import { useMemo, useState } from 'preact/hooks';

const spec: RowsSpec = {
  columns: {
    description: { labelKey: 'dev.rows.description', kind: 'text' },
    quantity: { labelKey: 'dev.rows.quantity', kind: 'number' },
    amount: { labelKey: 'dev.rows.amount', kind: 'money' },
    rate: { labelKey: 'dev.rows.rate', kind: 'percent' },
    mode: {
      labelKey: 'dev.rows.mode',
      kind: 'enum',
      options: [
        { value: 'fixed', labelKey: 'dev.rows.mode.fixed' },
        { value: 'percent', labelKey: 'dev.rows.mode.percent' },
      ],
      default: 'fixed',
    },
  },
  minRows: 1,
  maxRows: 3,
};

const field: PresetField = {
  labelKey: 'dev.rows.label',
  kind: 'rows',
  order: 1,
  rows: spec,
};

const STRINGS = {
  'dev.rows.label': 'Fee lines',
  'dev.rows.label.row': 'Fee line {number}',
  'dev.rows.label.add': 'Add fee line',
  'dev.rows.description': 'Description',
  'dev.rows.quantity': 'Quantity',
  'dev.rows.amount': 'Amount',
  'dev.rows.rate': 'Rate',
  'dev.rows.mode': 'Charge mode',
  'dev.rows.mode.fixed': 'Fixed',
  'dev.rows.mode.percent': 'Percent',
};

export function RowsHarness({ preset }: { preset: ResolvedPreset }) {
  const [value, setValue] = useState('');
  const harnessPreset = useMemo(
    () => ({ ...preset, strings: { ...preset.strings, ...STRINGS } }),
    [preset],
  );
  return (
    <div data-rows-harness="" data-rows-value={value}>
      <RepeatableRows
        id="dev-fee-lines"
        name="feeLines"
        field={field}
        spec={spec}
        preset={harnessPreset}
        value={value}
        error={null}
        errorPath={undefined}
        onValue={setValue}
      />
      <div class="dev-rows-actions">
        <Button size="sm" variant="ghost" onClick={() => setValue('')}>
          Reset rows
        </Button>
        <output aria-live="polite">
          {value === '' ? 'Default row' : `${JSON.parse(value).length} rows serialized`}
        </output>
      </div>
    </div>
  );
}
