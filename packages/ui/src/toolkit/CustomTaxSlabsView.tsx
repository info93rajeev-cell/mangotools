import { useState } from 'preact/hooks';
import styles from './universalTax.module.css';
import type { TaxSlab, TaxSystemType } from './universalTaxEngine.ts';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

export interface CustomTaxSlabsViewProps {
  tax: UseUniversalTaxReturn;
}

function SlabsHeaderControls({
  taxSystem,
  setTaxSystem,
  isAddingSlab,
  setIsAddingSlab,
}: {
  taxSystem: TaxSystemType;
  setTaxSystem: (s: TaxSystemType) => void;
  isAddingSlab: boolean;
  setIsAddingSlab: (v: boolean) => void;
}) {
  return (
    <div class={styles.slabsHeaderRow}>
      <div class={styles.formFieldGroup} style={{ flex: 1 }}>
        <label class={styles.fieldLabel} for="slabs-tax-system-select">
          Tax system
        </label>
        <select
          id="slabs-tax-system-select"
          class={styles.fieldInput}
          value={taxSystem}
          onChange={(e) => setTaxSystem((e.target as HTMLSelectElement).value as TaxSystemType)}
        >
          <option value="vat">VAT (Value Added Tax)</option>
          <option value="sales_tax">Sales Tax</option>
          <option value="gst">India GST</option>
          <option value="custom_slabs">Custom Slabs (Progressive)</option>
        </select>
      </div>

      <button
        type="button"
        class={styles.ghostActionBtn}
        style={{
          alignSelf: 'flex-end',
          padding: '6px 10px',
          color: '#7c3aed',
          borderColor: '#c4b5fd',
        }}
        onClick={() => setIsAddingSlab(!isAddingSlab)}
      >
        <span>+ Add Tax Slab</span>
      </button>
    </div>
  );
}

function SlabFormInputs({
  min,
  setMin,
  max,
  setMax,
  rate,
  setRate,
  type,
  setType,
}: {
  min: number;
  setMin: (v: number) => void;
  max: number | null;
  setMax: (v: number | null) => void;
  rate: number;
  setRate: (v: number) => void;
  type: string;
  setType: (v: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px' }}>
      <div>
        <label class={styles.fieldLabel} for="slab-new-min">
          Min
        </label>
        <input
          id="slab-new-min"
          type="number"
          class={styles.fieldInput}
          value={min}
          onInput={(e) => setMin(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
      <div>
        <label class={styles.fieldLabel} for="slab-new-max">
          Max
        </label>
        <input
          id="slab-new-max"
          type="number"
          class={styles.fieldInput}
          value={max ?? ''}
          placeholder="∞"
          onInput={(e) => {
            const val = (e.target as HTMLInputElement).value;
            setMax(val === '' ? null : Number(val));
          }}
        />
      </div>
      <div>
        <label class={styles.fieldLabel} for="slab-new-rate">
          Rate %
        </label>
        <input
          id="slab-new-rate"
          type="number"
          class={styles.fieldInput}
          value={rate}
          onInput={(e) => setRate(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
      <div>
        <label class={styles.fieldLabel} for="slab-new-type">
          Type
        </label>
        <select
          id="slab-new-type"
          class={styles.fieldInput}
          value={type}
          onChange={(e) => setType((e.target as HTMLSelectElement).value)}
        >
          <option value="VAT">VAT</option>
          <option value="Sales Tax">Sales Tax</option>
          <option value="GST">GST</option>
          <option value="Custom">Custom</option>
        </select>
      </div>
    </div>
  );
}

function InlineAddSlabForm({
  initialSlab,
  onSave,
  onCancel,
}: {
  initialSlab?: TaxSlab | null;
  onSave: (slab: Omit<TaxSlab, 'id'>) => void;
  onCancel: () => void;
}) {
  const [min, setMin] = useState(initialSlab?.minAmount ?? 0);
  const [max, setMax] = useState<number | null>(initialSlab?.maxAmount ?? 50000);
  const [rate, setRate] = useState(initialSlab?.rate ?? 10);
  const [type, setType] = useState(initialSlab?.taxType ?? 'VAT');
  const [notes, setNotes] = useState(initialSlab?.notes ?? 'New tier');

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <SlabFormInputs
        min={min}
        setMin={setMin}
        max={max}
        setMax={setMax}
        rate={rate}
        setRate={setRate}
        type={type}
        setType={setType}
      />
      <div style={{ display: 'flex', gap: '5px' }}>
        <input
          type="text"
          placeholder="Notes"
          class={styles.fieldInput}
          value={notes}
          onInput={(e) => setNotes((e.target as HTMLInputElement).value)}
        />
        <button
          type="button"
          class={styles.calculateBtn}
          style={{ padding: '4px 10px', fontSize: '11px' }}
          onClick={() => onSave({ minAmount: min, maxAmount: max, rate, taxType: type, notes })}
        >
          Save
        </button>
        <button
          type="button"
          class={styles.ghostActionBtn}
          style={{ padding: '4px 8px', fontSize: '11px' }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SlabsTableView({
  taxSlabs,
  onEditSlab,
  deleteTaxSlab,
  currencySymbol,
}: {
  taxSlabs: TaxSlab[];
  onEditSlab: (slab: TaxSlab) => void;
  deleteTaxSlab: (id: string) => void;
  currencySymbol: string;
}) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
      <table class={styles.slabsTable} aria-label="Tax Slabs Table">
        <thead>
          <tr>
            <th>#</th>
            <th>Min Amount ({currencySymbol})</th>
            <th>Max Amount ({currencySymbol})</th>
            <th>Rate</th>
            <th>Tax Type</th>
            <th>Notes</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {taxSlabs.map((slab, idx) => (
            <tr key={slab.id}>
              <td>{idx + 1}</td>
              <td>{slab.minAmount.toLocaleString()}</td>
              <td>{slab.maxAmount !== null ? slab.maxAmount.toLocaleString() : '∞'}</td>
              <td>{slab.rate}%</td>
              <td>{slab.taxType}</td>
              <td style={{ color: '#64748b' }}>{slab.notes}</td>
              <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                <button
                  type="button"
                  class={styles.slabsIconBtn}
                  onClick={() => onEditSlab(slab)}
                  title="Edit Slab"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  class={styles.slabsIconBtn}
                  onClick={() => deleteTaxSlab(slab.id)}
                  title="Delete Slab"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CustomTaxSlabsView({ tax }: CustomTaxSlabsViewProps) {
  const {
    taxSystem,
    setTaxSystem,
    taxSlabs,
    addTaxSlab,
    updateTaxSlab,
    deleteTaxSlab,
    currencySymbol,
  } = tax;
  const [isAddingSlab, setIsAddingSlab] = useState(false);
  const [editingSlab, setEditingSlab] = useState<TaxSlab | null>(null);

  const handleSave = (slabData: Omit<TaxSlab, 'id'>) => {
    if (editingSlab) {
      updateTaxSlab(editingSlab.id, slabData);
      setEditingSlab(null);
    } else {
      addTaxSlab(slabData);
      setIsAddingSlab(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <SlabsHeaderControls
        taxSystem={taxSystem}
        setTaxSystem={setTaxSystem}
        isAddingSlab={isAddingSlab || editingSlab !== null}
        setIsAddingSlab={(open) => {
          setIsAddingSlab(open);
          if (!open) setEditingSlab(null);
        }}
      />

      {(isAddingSlab || editingSlab !== null) && (
        <InlineAddSlabForm
          initialSlab={editingSlab}
          onSave={handleSave}
          onCancel={() => {
            setIsAddingSlab(false);
            setEditingSlab(null);
          }}
        />
      )}

      <SlabsTableView
        taxSlabs={taxSlabs}
        onEditSlab={(s) => setEditingSlab(s)}
        deleteTaxSlab={deleteTaxSlab}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
