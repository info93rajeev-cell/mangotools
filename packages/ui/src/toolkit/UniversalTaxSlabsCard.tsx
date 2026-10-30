import { useState } from 'preact/hooks';
import styles from './universalTax.module.css';
import type { TaxSlab, TaxSystemType } from './universalTaxEngine.ts';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

export interface UniversalTaxSlabsCardProps {
  tax: UseUniversalTaxReturn;
}

const INDIA_GST_OFFICIAL_SLABS = [
  { rate: '0%', title: 'Nil / Exempt', items: 'Fresh milk, fruits, vegetables, bread, salt' },
  { rate: '5%', title: 'Merit Goods', items: 'Tea, coffee, spices, life-saving medicines' },
  { rate: '12%', title: 'Standard I', items: 'Processed foods, business computers, apparel' },
  { rate: '18%', title: 'Standard II', items: 'IT services, software, banking, capital goods' },
  { rate: '28%', title: 'Luxury & Sin', items: 'Automobiles, air conditioners, aerated drinks' },
];

function IndiaGstOfficialSlabsView({ onSwitchToCustom }: { onSwitchToCustom: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
        <table class={styles.slabsTable} aria-label="Official GST Slabs">
          <thead>
            <tr>
              <th>Rate</th>
              <th>Category</th>
              <th>Common Goods & Services</th>
            </tr>
          </thead>
          <tbody>
            {INDIA_GST_OFFICIAL_SLABS.map((slab) => (
              <tr key={slab.rate}>
                <td style={{ fontWeight: 700, color: '#2563eb' }}>{slab.rate}</td>
                <td style={{ fontWeight: 600 }}>{slab.title}</td>
                <td style={{ color: '#475569', fontSize: '11px' }}>{slab.items}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          padding: '8px 10px',
          fontSize: '11px',
          color: '#1e40af',
          lineHeight: '1.4',
        }}
      >
        💡 <strong>Note:</strong> Indian GST applies a flat percentage by commodity HSN code across
        any invoice amount, rather than progressive price slabs.
      </div>

      <button
        type="button"
        class={styles.ghostActionBtn}
        style={{
          alignSelf: 'flex-start',
          color: '#7c3aed',
          borderColor: '#c4b5fd',
          fontSize: '11px',
          padding: '5px 10px',
        }}
        onClick={onSwitchToCustom}
      >
        <span>🌐 Need Progressive Slabs? Switch to Custom Slabs</span>
      </button>
    </div>
  );
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
          <option value="custom_slabs">Custom Slabs (Progressive)</option>
          <option value="vat">VAT (Value Added Tax)</option>
          <option value="sales_tax">Sales Tax</option>
          <option value="gst">GST (Goods & Services Tax)</option>
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

function InlineAddSlabForm({
  onSave,
  onCancel,
}: {
  onSave: (slab: Omit<TaxSlab, 'id'>) => void;
  onCancel: () => void;
}) {
  const [min, setMin] = useState(0);
  const [max, setMax] = useState<number | null>(50000);
  const [rate, setRate] = useState(10);
  const [type, setType] = useState('VAT');
  const [notes, setNotes] = useState('New tier');

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
  deleteTaxSlab,
  currencySymbol,
}: {
  taxSlabs: TaxSlab[];
  deleteTaxSlab: (id: string) => void;
  currencySymbol: string;
}) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
      <table class={styles.slabsTable} aria-label="Tax Slabs Table">
        <thead>
          <tr>
            <th>#</th>
            <th>Min ({currencySymbol})</th>
            <th>Max ({currencySymbol})</th>
            <th>Rate</th>
            <th>Type</th>
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
              <td style={{ textAlign: 'center' }}>
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

export function UniversalTaxSlabsCard({ tax }: UniversalTaxSlabsCardProps) {
  const { taxSystem, setTaxSystem, taxSlabs, addTaxSlab, deleteTaxSlab, currencySymbol, country } =
    tax;
  const [isAddingSlab, setIsAddingSlab] = useState(false);

  const isIndiaGst = country === 'in' && taxSystem === 'gst';

  return (
    <section class={styles.taxCard} aria-label="Universal Tax Setup" data-tax-slabs-card="">
      <div class={styles.cardHeaderRow}>
        <div class={styles.cardTitleWithBadge}>
          <span class={`${styles.stepBadge} ${styles.stepBadge4}`}>4</span>
          <span class={styles.cardTitleText}>
            {isIndiaGst ? 'Official GST Rates & Categories' : 'Universal Tax Setup'}
          </span>
        </div>
      </div>
      <div class={styles.cardHeaderSub}>
        {isIndiaGst
          ? 'Standard GST rate brackets applicable to goods and services in India.'
          : 'Create or edit progressive tax slabs and rules for custom jurisdictions.'}
      </div>

      {isIndiaGst ? (
        <IndiaGstOfficialSlabsView onSwitchToCustom={() => setTaxSystem('custom_slabs')} />
      ) : (
        <>
          <SlabsHeaderControls
            taxSystem={taxSystem}
            setTaxSystem={setTaxSystem}
            isAddingSlab={isAddingSlab}
            setIsAddingSlab={setIsAddingSlab}
          />

          {isAddingSlab && (
            <InlineAddSlabForm
              onSave={(slab) => {
                addTaxSlab(slab);
                setIsAddingSlab(false);
              }}
              onCancel={() => setIsAddingSlab(false)}
            />
          )}

          <SlabsTableView
            taxSlabs={taxSlabs}
            deleteTaxSlab={deleteTaxSlab}
            currencySymbol={currencySymbol}
          />
        </>
      )}
    </section>
  );
}
