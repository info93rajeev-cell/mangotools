import styles from './universalTax.module.css';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

export interface UniversalTaxFormulaCardProps {
  tax: UseUniversalTaxReturn;
}

export function UniversalTaxFormulaCard({ tax }: UniversalTaxFormulaCardProps) {
  const { formulaTab, setFormulaTab } = tax;

  return (
    <section class={styles.taxCard} aria-label="Formula and Notes" data-tax-formula-card="">
      <div class={styles.cardHeaderRow}>
        <div class={styles.cardTitleWithBadge}>
          <span class={`${styles.stepBadge} ${styles.stepBadge5}`}>5</span>
          <span class={styles.cardTitleText}>Formula / Important Notes</span>
        </div>
      </div>

      {/* TABS FOR TAX SYSTEM FORMULAS */}
      <div class={styles.formulaTabsRow} role="tablist" aria-label="Formula Reference Tabs">
        <button
          type="button"
          class={styles.formulaTabBtn}
          data-active={String(formulaTab === 'in')}
          onClick={() => setFormulaTab('in')}
          role="tab"
          aria-selected={formulaTab === 'in'}
        >
          India GST
        </button>
        <button
          type="button"
          class={styles.formulaTabBtn}
          data-active={String(formulaTab === 'vat')}
          onClick={() => setFormulaTab('vat')}
          role="tab"
          aria-selected={formulaTab === 'vat'}
        >
          VAT
        </button>
        <button
          type="button"
          class={styles.formulaTabBtn}
          data-active={String(formulaTab === 'sales_tax')}
          onClick={() => setFormulaTab('sales_tax')}
          role="tab"
          aria-selected={formulaTab === 'sales_tax'}
        >
          Sales Tax
        </button>
        <button
          type="button"
          class={styles.formulaTabBtn}
          data-active={String(formulaTab === 'custom')}
          onClick={() => setFormulaTab('custom')}
          role="tab"
          aria-selected={formulaTab === 'custom'}
        >
          Custom
        </button>
      </div>

      {/* DYNAMIC FORMULA CONTENT */}
      {formulaTab === 'in' && (
        <div class={styles.formulaContentCard}>
          <div>
            <strong>📄 India GST Formula</strong>
          </div>
          <div>• Intra-state: CGST + SGST (e.g. 9% + 9% = 18%)</div>
          <div>• Inter-state: IGST (e.g. 18%)</div>
          <div>• Final Amount = Taxable Amount + Total Tax + Cess (if any)</div>
          <div>• You can choose inclusive or exclusive price mode.</div>
        </div>
      )}

      {formulaTab === 'vat' && (
        <div class={styles.formulaContentCard}>
          <div>
            <strong>📄 Value Added Tax (VAT) Formula</strong>
          </div>
          <div>• Exclusive VAT: Tax = Taxable Base × (Rate ÷ 100)</div>
          <div>• Inclusive VAT: Tax = Gross Amount × Rate ÷ (100 + Rate)</div>
          <div>• Standard UK rate is 20%; UAE rate is 5%.</div>
          <div>
            • Registered businesses can claim input VAT refund on legitimate business expenses.
          </div>
        </div>
      )}

      {formulaTab === 'sales_tax' && (
        <div class={styles.formulaContentCard}>
          <div>
            <strong>📄 Sales Tax Formula (USA / Canada)</strong>
          </div>
          <div>• Total Sales Tax = State/Provincial Tax + Local City Tax</div>
          <div>• Tax is generally charged only on final retail sales to consumers.</div>
          <div>• 5 US states (NH, OR, MT, AK, DE) charge 0% state sales tax.</div>
          <div>• Canada applies GST (5%), HST (13–15%), or GST + PST/QST by province.</div>
        </div>
      )}

      {formulaTab === 'custom' && (
        <div class={styles.formulaContentCard}>
          <div>
            <strong>📄 Custom Progressive Slabs Formula</strong>
          </div>
          <div>• Tax is evaluated tier-by-tier across configured amount brackets.</div>
          <div>• Bracket Tax = Math.max(0, Math.min(Amount, Max) − Min) × Rate%</div>
          <div>• Total Tax = Sum of taxes computed across all active brackets.</div>
        </div>
      )}
    </section>
  );
}
