import { inr } from './businessFormat.ts';
import styles from './businessStudio.module.css';
import {
  AMAZON_CATEGORY_PRESETS,
  type AmazonFeeEstimatorState,
  type AmazonInputs,
  type FulfilmentMode,
} from './useAmazonFeeEstimator.ts';

type NumberKey = {
  [K in keyof AmazonInputs]: AmazonInputs[K] extends number ? K : never;
}[keyof AmazonInputs];

/** One ₹ (or count) input bound to a numeric field of the studio state. */
function NumberField(props: {
  state: AmazonFeeEstimatorState;
  field: NumberKey;
  id: string;
  label: string;
  numeric?: boolean;
}) {
  const { state, field } = props;
  return (
    <div class={styles.field}>
      <label class={styles.label} for={props.id}>
        {props.label}
      </label>
      <input
        id={props.id}
        type="number"
        inputMode={props.numeric ? 'numeric' : 'decimal'}
        class={styles.fieldInput}
        value={state[field]}
        onInput={(e) => state.set(field, Number((e.target as HTMLInputElement).value) || 0)}
      />
    </div>
  );
}

/** A value the engine calculated, shown in the same style as an input but not editable. */
function EngineValue(props: { id: string; label: string; value: string | null }) {
  return (
    <div class={styles.field}>
      <label class={styles.label} for={props.id}>
        {props.label}
      </label>
      <input
        id={props.id}
        class={styles.fieldInput}
        value={props.value === null ? '…' : inr(props.value)}
        readOnly
      />
    </div>
  );
}

const MODES: [FulfilmentMode, string][] = [
  ['fba', 'FBA'],
  ['easy_ship', 'Easy Ship'],
  ['self_ship', 'Self Ship'],
];

export function AmazonListingFulfilmentCard({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <section class={styles.card} aria-label="Listing & Fulfilment">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoViolet}`}>▣</span>
        <span>Listing & Fulfilment</span>
      </div>
      <div class={styles.tabs} role="tablist" aria-label="Fulfilment Mode">
        {MODES.map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={state.fulfilmentMode === m}
            class={`${styles.tab} ${state.fulfilmentMode === m ? styles.tabActive : ''}`}
            onClick={() => state.set('fulfilmentMode', m)}
          >
            {label}
          </button>
        ))}
      </div>
      <p class={styles.muted} data-fulfilment-hint="">
        Amazon's fees differ by method and packed weight. The method and weight here are for your
        own fee lookup: enter the closing and weight-handling fees for{' '}
        {MODES.find(([m]) => m === state.fulfilmentMode)?.[1] ?? 'your method'} from Seller Central
        below.
      </p>
      <NumberField state={state} field="sellingPrice" id="amz-sp" label="Selling price (₹)" />
      <div class={styles.grid2} style={{ marginTop: '8px' }}>
        <NumberField state={state} field="productCost" id="amz-cost" label="Product cost (₹)" />
        <NumberField state={state} field="packagingCost" id="amz-packaging" label="Packaging (₹)" />
        <NumberField
          state={state}
          field="packedWeight"
          id="amz-weight"
          label="Packed weight (g, for fee lookup)"
          numeric
        />
        <NumberField state={state} field="monthlyQty" id="amz-qty" label="Sales / month" numeric />
      </div>
      <div class={styles.field} style={{ marginTop: '8px' }}>
        <label class={styles.label} for="amz-product-gst">
          GST in your price
        </label>
        <select
          id="amz-product-gst"
          class={styles.fieldInput}
          value={String(state.productGstRate)}
          onChange={(e) =>
            state.set('productGstRate', Number((e.target as HTMLSelectElement).value))
          }
        >
          <option value="18">18% (standard)</option>
          <option value="5">5%</option>
          <option value="40">40%</option>
          <option value="3">3% (gold, silver)</option>
          <option value="0">0% / not registered</option>
        </select>
      </div>
    </section>
  );
}

export function AmazonFeeInputsCard({ state }: { state: AmazonFeeEstimatorState }) {
  const fees = state.result?.marketplaceFees ?? [];
  const byCategory = AMAZON_CATEGORY_PRESETS.find((c) => c.id === state.category)?.rate != null;
  const registered = state.productGstRate > 0;
  return (
    <section class={styles.card} aria-label="Manual Amazon Fee Inputs">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoBlue}`}>⚙</span>
        <span>Amazon Fees</span>
      </div>
      <div class={styles.field}>
        <label class={styles.label} for="amz-category">
          Referral fee
        </label>
        <select
          id="amz-category"
          class={styles.fieldInput}
          value={state.category}
          onChange={(e) => state.set('category', (e.target as HTMLSelectElement).value)}
        >
          {AMAZON_CATEGORY_PRESETS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div class={styles.grid2} style={{ marginTop: '8px' }}>
        {byCategory ? (
          <EngineValue
            id="amz-ref-fee"
            label="Referral fee (₹)"
            value={fees.find((f) => f.id === 'referral')?.amount ?? null}
          />
        ) : (
          <NumberField
            state={state}
            field="referralFee"
            id="amz-ref-fee"
            label="Referral fee (₹)"
          />
        )}
        <NumberField
          state={state}
          field="closingFee"
          id="amz-closing-fee"
          label="Closing fee (₹)"
        />
        <NumberField
          state={state}
          field="weightHandling"
          id="amz-weight-handling"
          label="Weight handling (₹)"
        />
        <EngineValue
          id="amz-fee-gst"
          label="GST on fees · 18%"
          value={state.result?.marketplaceFeeGstTotal ?? null}
        />
      </div>
      {registered ? (
        <label class={styles.checkRow} style={{ marginTop: '9px' }}>
          <input
            type="checkbox"
            id="amz-itc"
            checked={state.claimFeeGstCredit}
            onChange={(e) => state.set('claimFeeGstCredit', (e.target as HTMLInputElement).checked)}
          />
          <span>I claim the GST on Amazon's fees back as input tax credit (ITC)</span>
        </label>
      ) : null}
      <div class={styles.note} style={{ marginTop: '9px' }}>
        Category rates are a starting point; confirm every fee in Seller Central. No live fees are
        fetched.
      </div>
    </section>
  );
}

const showResult = () =>
  document
    .querySelector('[aria-label="Profit and Settlement Estimate"]')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export function AmazonOtherCostsCard({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <section class={styles.card} aria-label="Other Costs">
      <div class={styles.heading}>
        <span class={`${styles.ico} ${styles.icoAmber}`}>₹</span>
        <span>Other Costs</span>
      </div>
      <div class={styles.grid2}>
        <NumberField state={state} field="adsPerOrder" id="amz-ads" label="Ads / order (₹)" />
        <NumberField
          state={state}
          field="returnsPerOrder"
          id="amz-returns"
          label="Expected returns / order (₹)"
        />
      </div>
      <button type="button" class={styles.btn} style={{ marginTop: '10px' }} onClick={showResult}>
        <span>▦ Estimate Seller Profit</span>
      </button>
    </section>
  );
}

export function AmazonFeeLeftCards({ state }: { state: AmazonFeeEstimatorState }) {
  return (
    <div class={styles.stack}>
      <AmazonListingFulfilmentCard state={state} />
      <AmazonFeeInputsCard state={state} />
      <AmazonOtherCostsCard state={state} />
    </div>
  );
}

export const AmazonFeeMarketplaceCard = AmazonFeeInputsCard;
