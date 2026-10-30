import { useState } from 'preact/hooks';
import styles from './universalTax.module.css';
import { COUNTRIES, type CountryProfile } from './universalTaxEngine.ts';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

export interface UniversalTaxCountryOptionsCardProps {
  tax: UseUniversalTaxReturn;
}

function IndiaGstOptionsSection({ tax }: { tax: UseUniversalTaxReturn }) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  return (
    <>
      <div class={styles.formFieldGroup}>
        <span class={styles.fieldLabel}>Supply type</span>
        <div class={styles.segmentedControl}>
          <button
            type="button"
            class={styles.segmentBtn}
            data-active={String(tax.supplyType === 'intra')}
            onClick={() => tax.setSupplyType('intra')}
            aria-pressed={tax.supplyType === 'intra'}
          >
            Intra-state (CGST + SGST)
          </button>
          <button
            type="button"
            class={styles.segmentBtn}
            data-active={String(tax.supplyType === 'inter')}
            onClick={() => tax.setSupplyType('inter')}
            aria-pressed={tax.supplyType === 'inter'}
          >
            Inter-state (IGST)
          </button>
        </div>
      </div>

      <div class={styles.fieldsGrid2Col}>
        <div class={styles.formFieldGroup}>
          <label class={styles.fieldLabel} for="gst-rate-select">
            GST rate
          </label>
          <select
            id="gst-rate-select"
            class={styles.fieldInput}
            value={tax.gstRate}
            disabled={tax.isComposition}
            onChange={(e) => tax.setGstRate(Number((e.target as HTMLSelectElement).value))}
          >
            <option value={0}>0% (Nil)</option>
            <option value={5}>5%</option>
            <option value={12}>12%</option>
            <option value={18}>18% (Standard)</option>
            <option value={28}>28% (Luxury)</option>
          </select>
        </div>

        <div class={styles.formFieldGroup}>
          <label class={styles.fieldLabel} for="cess-rate-select">
            Cess (optional)
          </label>
          <select
            id="cess-rate-select"
            class={styles.fieldInput}
            value={tax.cessRate}
            disabled={tax.isComposition}
            onChange={(e) => tax.setCessRate(Number((e.target as HTMLSelectElement).value))}
          >
            <option value={0}>0% (No cess)</option>
            <option value={1}>1%</option>
            <option value={3}>3%</option>
            <option value={5}>5%</option>
            <option value={12}>12%</option>
            <option value={15}>15%</option>
            <option value={22}>22%</option>
          </select>
        </div>
      </div>

      <div class={styles.formFieldGroup}>
        <button
          type="button"
          class={styles.advancedToggleRow}
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          aria-expanded={isAdvancedOpen}
        >
          <span>⚙️ Advanced options (composition scheme, rounding)</span>
          <span>{isAdvancedOpen ? '▲' : '▼'}</span>
        </button>
        {isAdvancedOpen && (
          <div class={styles.advancedDrawer}>
            <label class={styles.advancedCheckboxRow}>
              <input
                type="checkbox"
                checked={tax.isComposition}
                onChange={(e) => tax.setIsComposition((e.target as HTMLInputElement).checked)}
              />
              <span>Composition Scheme (Flat 1% aggregate rate)</span>
            </label>
          </div>
        )}
      </div>
    </>
  );
}

function UsaSalesTaxOptionsSection({
  tax,
  profile,
}: {
  tax: UseUniversalTaxReturn;
  profile: CountryProfile;
}) {
  return (
    <div class={styles.fieldsGrid2Col}>
      <div class={styles.formFieldGroup}>
        <label class={styles.fieldLabel} for="us-state-select">
          State jurisdiction
        </label>
        <select
          id="us-state-select"
          class={styles.fieldInput}
          value={tax.selectedStateIndex}
          onChange={(e) => tax.setSelectedStateIndex(Number((e.target as HTMLSelectElement).value))}
        >
          {profile.subdivisions?.map((st, idx) => (
            <option key={st.name} value={idx}>
              {st.name} ({st.rate}%)
            </option>
          ))}
        </select>
      </div>

      <div class={styles.formFieldGroup}>
        <label class={styles.fieldLabel} for="us-local-tax">
          City / Local tax (%)
        </label>
        <input
          id="us-local-tax"
          type="number"
          min="0"
          max="15"
          step="0.1"
          class={styles.fieldInput}
          value={tax.localTaxRate}
          onInput={(e) => tax.setLocalTaxRate(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>
    </div>
  );
}

function CanadaTaxOptionsSection({
  tax,
  profile,
}: {
  tax: UseUniversalTaxReturn;
  profile: CountryProfile;
}) {
  return (
    <div class={styles.formFieldGroup}>
      <label class={styles.fieldLabel} for="ca-province-select">
        Province / Territory
      </label>
      <select
        id="ca-province-select"
        class={styles.fieldInput}
        value={tax.selectedStateIndex}
        onChange={(e) => {
          const idx = Number((e.target as HTMLSelectElement).value);
          tax.setSelectedStateIndex(idx);
          const prov = profile.subdivisions?.[idx];
          if (prov) tax.setGstRate(prov.rate);
        }}
      >
        {profile.subdivisions?.map((pr, idx) => (
          <option key={pr.name} value={idx}>
            {pr.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function GeneralVatOptionsSection({
  tax,
  profile,
}: {
  tax: UseUniversalTaxReturn;
  profile: CountryProfile;
}) {
  return (
    <div class={styles.formFieldGroup}>
      <label class={styles.fieldLabel} for="standard-rate-input">
        {profile.defaultTaxSystem.toUpperCase()} Rate (%)
      </label>
      <select
        id="standard-rate-input"
        class={styles.fieldInput}
        value={tax.gstRate}
        onChange={(e) => tax.setGstRate(Number((e.target as HTMLSelectElement).value))}
      >
        {profile.rates.map((r) => (
          <option key={r} value={r}>
            {r}% {r === profile.defaultRate ? '(Standard)' : r === 0 ? '(Zero rate)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export function UniversalTaxCountryOptionsCard({ tax }: UniversalTaxCountryOptionsCardProps) {
  const currentProfile = COUNTRIES.find((c) => c.id === tax.country) ?? COUNTRIES[0];

  return (
    <section class={styles.taxCard} aria-label="Country Tax Options" data-country-options-card="">
      <div class={styles.cardHeaderRow}>
        <div class={styles.cardTitleWithBadge}>
          <span class={`${styles.stepBadge} ${styles.stepBadge2}`}>2</span>
          <span class={styles.cardTitleText}>
            {currentProfile.flag} {currentProfile.name} Tax Options
          </span>
        </div>
        <span
          style={{ fontSize: '12px', color: '#64748b', cursor: 'help' }}
          title="Configure jurisdiction-specific tax rules"
          role="img"
          aria-label="Tax options help"
        >
          ❔
        </span>
      </div>

      {tax.country === 'in' && <IndiaGstOptionsSection tax={tax} />}
      {tax.country === 'us' && <UsaSalesTaxOptionsSection tax={tax} profile={currentProfile} />}
      {tax.country === 'ca' && <CanadaTaxOptionsSection tax={tax} profile={currentProfile} />}
      {tax.country !== 'in' && tax.country !== 'us' && tax.country !== 'ca' && (
        <GeneralVatOptionsSection tax={tax} profile={currentProfile} />
      )}
    </section>
  );
}
