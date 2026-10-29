import styles from './universalTax.module.css';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

export interface UniversalTaxInputsCardProps {
  tax: UseUniversalTaxReturn;
}

function PriceModeToggle({
  priceMode,
  setPriceMode,
}: {
  priceMode: UseUniversalTaxReturn['priceMode'];
  setPriceMode: UseUniversalTaxReturn['setPriceMode'];
}) {
  return (
    <div class={styles.segmentedControl}>
      <button
        type="button"
        class={styles.segmentBtn}
        data-active={String(priceMode === 'exclusive')}
        onClick={() => setPriceMode('exclusive')}
        aria-pressed={priceMode === 'exclusive'}
      >
        Exclusive Price
      </button>
      <button
        type="button"
        class={styles.segmentBtn}
        data-active={String(priceMode === 'inclusive')}
        onClick={() => setPriceMode('inclusive')}
        aria-pressed={priceMode === 'inclusive'}
      >
        Inclusive Price
      </button>
    </div>
  );
}

function AmountQuantityRow({
  amount,
  setAmount,
  quantity,
  setQuantity,
  currencySymbol,
}: {
  amount: number;
  setAmount: (v: number) => void;
  quantity: number;
  setQuantity: (v: number) => void;
  currencySymbol: string;
}) {
  return (
    <div class={styles.fieldsGrid2Col}>
      <div class={styles.formFieldGroup}>
        <label class={styles.fieldLabel} for="tax-input-amount">
          Amount ({currencySymbol})
        </label>
        <input
          id="tax-input-amount"
          type="number"
          min="0"
          step="any"
          class={styles.fieldInput}
          value={amount}
          onInput={(e) => setAmount(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>

      <div class={styles.formFieldGroup}>
        <label class={styles.fieldLabel} for="tax-input-qty">
          Quantity (optional)
        </label>
        <input
          id="tax-input-qty"
          type="number"
          min="1"
          step="1"
          class={styles.fieldInput}
          value={quantity}
          onInput={(e) =>
            setQuantity(Math.max(1, Number((e.target as HTMLInputElement).value) || 1))
          }
        />
      </div>
    </div>
  );
}

function DiscountShippingRow({
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  shippingCharges,
  setShippingCharges,
  currencySymbol,
}: {
  discountType: UseUniversalTaxReturn['discountType'];
  setDiscountType: UseUniversalTaxReturn['setDiscountType'];
  discountValue: number;
  setDiscountValue: (v: number) => void;
  shippingCharges: number;
  setShippingCharges: (v: number) => void;
  currencySymbol: string;
}) {
  return (
    <div class={styles.fieldsGrid2Col}>
      <div class={styles.formFieldGroup}>
        <label class={styles.fieldLabel} for="tax-input-discount">
          Discount ({currencySymbol} or %)
        </label>
        <div class={styles.discountInputRow}>
          <select
            class={styles.discountTypeSelect}
            value={discountType}
            onChange={(e) =>
              setDiscountType((e.target as HTMLSelectElement).value as 'currency' | 'percent')
            }
            aria-label="Discount type"
          >
            <option value="currency">{currencySymbol}</option>
            <option value="percent">%</option>
          </select>
          <input
            id="tax-input-discount"
            type="number"
            min="0"
            step="any"
            class={styles.discountValInput}
            value={discountValue}
            onInput={(e) => setDiscountValue(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </div>
      </div>

      <div class={styles.formFieldGroup}>
        <label class={styles.fieldLabel} for="tax-input-shipping">
          Shipping / Extra charges ({currencySymbol})
        </label>
        <input
          id="tax-input-shipping"
          type="number"
          min="0"
          step="any"
          class={styles.fieldInput}
          value={shippingCharges}
          onInput={(e) => setShippingCharges(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
    </div>
  );
}

export function UniversalTaxInputsCard({ tax }: UniversalTaxInputsCardProps) {
  return (
    <section class={styles.taxCard} aria-label="Calculation Inputs" data-tax-inputs-card="">
      <div class={styles.cardHeaderRow}>
        <div class={styles.cardTitleWithBadge}>
          <span class={`${styles.stepBadge} ${styles.stepBadge1}`}>1</span>
          <span class={styles.cardTitleText}>Calculation Inputs</span>
        </div>
      </div>

      <PriceModeToggle priceMode={tax.priceMode} setPriceMode={tax.setPriceMode} />

      <AmountQuantityRow
        amount={tax.amount}
        setAmount={tax.setAmount}
        quantity={tax.quantity}
        setQuantity={tax.setQuantity}
        currencySymbol={tax.currencySymbol}
      />

      <DiscountShippingRow
        discountType={tax.discountType}
        setDiscountType={tax.setDiscountType}
        discountValue={tax.discountValue}
        setDiscountValue={tax.setDiscountValue}
        shippingCharges={tax.shippingCharges}
        setShippingCharges={tax.setShippingCharges}
        currencySymbol={tax.currencySymbol}
      />
    </section>
  );
}
