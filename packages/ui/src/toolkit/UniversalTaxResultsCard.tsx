import styles from './universalTax.module.css';
import { formatCurrencyNumber } from './universalTaxEngine.ts';
import type { UseUniversalTaxReturn } from './useUniversalTax.ts';

export interface UniversalTaxResultsCardProps {
  tax: UseUniversalTaxReturn;
}

function HeadlineHeroBox({
  finalAmount,
  effectiveRate,
  currencySymbol,
}: {
  finalAmount: number;
  effectiveRate: number;
  currencySymbol: string;
}) {
  return (
    <div class={styles.headlineHeroCard}>
      <div class={styles.headlineTextGroup}>
        <span class={styles.headlineSub}>Final amount (including tax)</span>
        <span class={styles.headlineAmount}>
          {formatCurrencyNumber(finalAmount, currencySymbol)}
        </span>
      </div>
      <div class={styles.headlineRateBadge}>
        <span>↗ +{effectiveRate.toFixed(2)}%</span>
        <span class={styles.effectiveRateSub}>Effective tax rate</span>
      </div>
    </div>
  );
}

function KpiMetricsGrid({
  taxableAmount,
  totalTax,
  effectiveRate,
  finalAmount,
  currencySymbol,
}: {
  taxableAmount: number;
  totalTax: number;
  effectiveRate: number;
  finalAmount: number;
  currencySymbol: string;
}) {
  return (
    <div class={styles.kpiMetricsGrid}>
      <div class={styles.kpiCard}>
        <div class={styles.kpiHeader}>
          <span style={{ color: '#2563eb' }}>◆</span>
          <span>Taxable</span>
        </div>
        <span class={styles.kpiVal} title={formatCurrencyNumber(taxableAmount, currencySymbol)}>
          {formatCurrencyNumber(taxableAmount, currencySymbol)}
        </span>
      </div>

      <div class={styles.kpiCard}>
        <div class={styles.kpiHeader}>
          <span style={{ color: '#f59e0b' }}>◆</span>
          <span>Total tax</span>
        </div>
        <span class={styles.kpiVal} title={formatCurrencyNumber(totalTax, currencySymbol)}>
          {formatCurrencyNumber(totalTax, currencySymbol)}
        </span>
      </div>

      <div class={styles.kpiCard}>
        <div class={styles.kpiHeader}>
          <span style={{ color: '#9333ea' }}>⏱</span>
          <span>Rate</span>
        </div>
        <span class={styles.kpiVal}>{effectiveRate.toFixed(2)}%</span>
      </div>

      <div class={styles.kpiCard}>
        <div class={styles.kpiHeader}>
          <span style={{ color: '#ec4899' }}>🎯</span>
          <span>Final</span>
        </div>
        <span class={styles.kpiVal} title={formatCurrencyNumber(finalAmount, currencySymbol)}>
          {formatCurrencyNumber(finalAmount, currencySymbol)}
        </span>
      </div>
    </div>
  );
}

function DonutBreakdownSection({
  results,
  currencySymbol,
  country,
  isComposition,
  cessRate,
}: {
  results: UseUniversalTaxReturn['results'];
  currencySymbol: string;
  country: UseUniversalTaxReturn['country'];
  isComposition: boolean;
  cessRate: number;
}) {
  const radius = 36;
  const strokeWidth = 14;
  const center = 45;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const slices = results.components.map((comp) => {
    const strokeDasharray = `${(comp.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += comp.percentage;
    return { ...comp, strokeDasharray, strokeDashoffset };
  });

  const displayComponents = [...results.components];
  if (
    country === 'in' &&
    !isComposition &&
    cessRate === 0 &&
    !displayComponents.some((c) => c.name.startsWith('CESS'))
  ) {
    displayComponents.push({
      name: 'CESS @ 0%',
      rate: 0,
      amount: 0,
      percentage: 0,
      color: '#f43f5e',
    });
  }

  return (
    <div>
      <div class={styles.breakdownTitleRow}>
        <span>📊 Tax split &amp; breakdown</span>
      </div>
      <div class={styles.donutBreakdownContainer}>
        <div class={styles.donutSvgCol}>
          <svg
            width="90"
            height="90"
            viewBox="0 0 90 90"
            aria-label="Tax Split Donut Chart"
            role="img"
          >
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
            />
            {slices.map((s, idx) => (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={s.strokeDasharray}
                strokeDashoffset={s.strokeDashoffset}
                transform={`rotate(-90 ${center} ${center})`}
              />
            ))}
          </svg>
          <div class={styles.donutCenterLabel}>
            <div class={styles.donutTotalVal}>
              {formatCurrencyNumber(results.totalTax, currencySymbol)}
            </div>
            <div class={styles.donutTotalSub}>Total Tax</div>
          </div>
        </div>

        <div class={styles.breakdownTableCol}>
          {displayComponents.map((c, idx) => (
            <div key={idx} class={styles.breakdownRow}>
              <div class={styles.breakdownLabelGroup}>
                <span class={styles.breakdownDot} style={{ background: c.color }} />
                <span>{c.name}</span>
              </div>
              <div class={styles.breakdownValGroup}>
                <span class={styles.breakdownAmount}>
                  {formatCurrencyNumber(c.amount, currencySymbol)}
                </span>
                <span class={styles.breakdownPercent}>{c.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UniversalTaxResultsCard({ tax }: UniversalTaxResultsCardProps) {
  const { results, currencySymbol, showFormula, setShowFormula, copySummary, downloadCsv } = tax;

  return (
    <section class={styles.taxCard} aria-label="Results Summary" data-tax-results-card="">
      <div class={styles.cardHeaderRow}>
        <div class={styles.cardTitleWithBadge}>
          <span class={`${styles.stepBadge} ${styles.stepBadge3}`}>3</span>
          <span class={styles.cardTitleText}>Results Summary</span>
        </div>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={showFormula}
            onChange={(e) => setShowFormula((e.target as HTMLInputElement).checked)}
          />
          <span>Show formula</span>
        </label>
      </div>

      <HeadlineHeroBox
        finalAmount={results.finalAmount}
        effectiveRate={results.effectiveRate}
        currencySymbol={currencySymbol}
      />

      <KpiMetricsGrid
        taxableAmount={results.taxableAmount}
        totalTax={results.totalTax}
        effectiveRate={results.effectiveRate}
        finalAmount={results.finalAmount}
        currencySymbol={currencySymbol}
      />

      <DonutBreakdownSection
        results={results}
        currencySymbol={currencySymbol}
        country={tax.country}
        isComposition={tax.isComposition}
        cessRate={tax.cessRate}
      />

      <div class={styles.savingsNotice}>
        <div class={styles.savingsNoticeText}>
          <strong>
            ℹ You are saving {formatCurrencyNumber(results.savings, currencySymbol)} with this
            calculation.
          </strong>
          <br />
          Add a discount or compare inclusive vs exclusive prices to see potential tax
          optimizations.
        </div>
        <span class={styles.savingsMoneyIcon} aria-hidden="true">
          💰
        </span>
      </div>

      <div class={styles.desktopOnlyActions}>
        <button type="button" class={styles.calculateBtn} onClick={copySummary}>
          <span>▦</span>
          <span>Calculate Tax</span>
        </button>
        <button type="button" class={styles.ghostActionBtn} onClick={copySummary}>
          <span>📋</span>
          <span>Copy Summary</span>
        </button>
        <button type="button" class={styles.ghostActionBtn} onClick={downloadCsv}>
          <span>📥</span>
          <span>Download CSV</span>
        </button>
      </div>
    </section>
  );
}
