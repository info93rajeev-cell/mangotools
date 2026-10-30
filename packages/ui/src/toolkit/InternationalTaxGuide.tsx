import styles from './universalTax.module.css';
import type { CountryCode } from './universalTaxEngine.ts';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

export interface InternationalTaxGuideProps {
  tax: UseUniversalTaxReturn;
  onSwitchToCustom: () => void;
}

function UsaTaxGuideSection() {
  return (
    <div class={styles.complianceList}>
      <div class={styles.complianceItem}>
        <span class={styles.complianceItemTitle}>🏛️ State vs Local Sales Tax</span>
        <span class={styles.complianceItemBody}>
          The US has no federal sales tax or VAT. Combined sales tax consists of State Tax
          (0%–7.25%) plus county/city local taxes (up to 5%).
        </span>
      </div>
      <div class={styles.complianceItem}>
        <span class={styles.complianceItemTitle}>🚫 5 States With 0% State Tax (NOMAD)</span>
        <span class={styles.complianceItemBody}>
          New Hampshire, Oregon, Montana, Alaska, and Delaware charge 0% state sales tax.
        </span>
      </div>
      <div class={styles.complianceItem}>
        <span class={styles.complianceItemTitle}>📦 Economic Nexus Thresholds</span>
        <span class={styles.complianceItemBody}>
          Remote sellers must collect sales tax once reaching $100,000 in sales or 200 transactions
          in a given state (Wayfair ruling).
        </span>
      </div>
    </div>
  );
}

function UkTaxGuideSection() {
  return (
    <div class={styles.complianceList}>
      <div class={styles.complianceItem}>
        <span class={styles.complianceItemTitle}>🇬🇧 UK VAT Rates (HMRC)</span>
        <span class={styles.complianceItemBody}>
          • <strong>Standard (20%):</strong> Most goods and services.
          <br />• <strong>Reduced (5%):</strong> Domestic energy, children's car seats.
          <br />• <strong>Zero (0%):</strong> Most food, books, children's clothes.
        </span>
      </div>
      <div class={styles.complianceItem}>
        <span class={styles.complianceItemTitle}>📋 Registration Threshold</span>
        <span class={styles.complianceItemBody}>
          Mandatory VAT registration when taxable turnover exceeds £90,000 in any 12-month rolling
          period.
        </span>
      </div>
    </div>
  );
}

function UaeTaxGuideSection() {
  return (
    <div class={styles.complianceList}>
      <div class={styles.complianceItem}>
        <span class={styles.complianceItemTitle}>🇦🇪 UAE Federal Tax Authority (FTA)</span>
        <span class={styles.complianceItemBody}>
          • Standard rate is 5% across mainland and free zones.
          <br />• 0% Zero-rated: Exports of goods/services, international transport, healthcare.
          <br />• Mandatory registration threshold: AED 375,000; Voluntary: AED 187,500.
        </span>
      </div>
    </div>
  );
}

function AusCanadaTaxGuideSection({ country }: { country: CountryCode }) {
  if (country === 'au') {
    return (
      <div class={styles.complianceList}>
        <div class={styles.complianceItem}>
          <span class={styles.complianceItemTitle}>🇦🇺 Australian GST (ATO)</span>
          <span class={styles.complianceItemBody}>
            • Flat 10% GST on taxable supplies.
            <br />• Basic food, medical care, and exports are GST-free.
            <br />• Registration threshold: AUD $75,000 gross annual turnover.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div class={styles.complianceList}>
      <div class={styles.complianceItem}>
        <span class={styles.complianceItemTitle}>🇨🇦 Canada GST/HST (CRA)</span>
        <span class={styles.complianceItemBody}>
          • Federal GST: 5% (Alberta, BC, Quebec, Saskatchewan, Territories).
          <br />• Harmonized Sales Tax (HST): 13% in Ontario; 15% in Atlantic Provinces.
          <br />• Small supplier threshold: CAD $30,000 per year.
        </span>
      </div>
    </div>
  );
}

export function InternationalTaxGuide({ tax, onSwitchToCustom }: InternationalTaxGuideProps) {
  const { country } = tax;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {country === 'us' && <UsaTaxGuideSection />}
      {country === 'uk' && <UkTaxGuideSection />}
      {country === 'ae' && <UaeTaxGuideSection />}
      {(country === 'au' || country === 'ca') && <AusCanadaTaxGuideSection country={country} />}

      <button
        type="button"
        class={styles.ghostActionBtn}
        style={{
          alignSelf: 'flex-start',
          color: '#7c3aed',
          borderColor: '#c4b5fd',
          fontSize: '11px',
          padding: '4px 8px',
        }}
        onClick={onSwitchToCustom}
      >
        <span>🌐 Need Progressive Multi-Tier Slabs? Switch to Custom Slabs</span>
      </button>
    </div>
  );
}
