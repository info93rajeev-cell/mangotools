import type { ToolSnapshot } from '@mangotools/runtime';
import { formatMoney, formatPercent } from '../format/numbers.ts';
import {
  AMAZON_BREAKDOWN_LABELS,
  AMAZON_FEE_COLUMNS,
  amazonFeeLabel,
  amazonResultLabel as text,
} from '../strings/amazonManualProfitability.ts';
import styles from './amazonResult.module.css';
import toolkit from './toolkit.module.css';

type Result = NonNullable<ToolSnapshot['result']>;
const METRICS = [
  'estimatedSettlement',
  'profitMarginPercent',
  'roiPercent',
  'breakEvenSellingPrice',
  'effectiveMarketplaceFeePercent',
];
const columns = Object.keys(AMAZON_FEE_COLUMNS) as (keyof typeof AMAZON_FEE_COLUMNS)[];
const money = (value: unknown) =>
  typeof value === 'string' ? formatMoney(value, { currency: 'INR' }) : text('unavailable');

function scalar(key: string, result: Result): string {
  const value = result.value[key];
  if (key === 'breakEvenSellingPrice' && value == null) {
    const reason = result.warnings.find((w) => w.code === 'ESTIMATE_BREAK_EVEN_NOT_DETERMINABLE')
      ?.details?.reason;
    return typeof reason === 'string' &&
      ['scenario', 'price-slabs', 'no-positive-solution'].includes(reason)
      ? text(reason === 'price-slabs' ? 'price-slabs-reason' : reason)
      : text('indeterminate');
  }
  return typeof value !== 'string'
    ? text('unavailable')
    : key.endsWith('Percent')
      ? formatPercent(value)
      : money(value);
}
function ScalarList({ keys, result }: { keys: string[]; result: Result }) {
  return (
    <dl class={toolkit.rows}>
      {keys.map((key) => (
        <div key={key} class={toolkit.row} data-output={key}>
          <dt>{text(key)}</dt>
          <dd>{scalar(key, result)}</dd>
        </div>
      ))}
    </dl>
  );
}
function feeText(key: string, fee: Record<string, unknown>): string {
  if (key === 'id')
    return `${amazonFeeLabel(String(fee.id))}${fee.applicable === false ? ` — ${text('notApplied')}` : ''}`;
  if (key === 'mode' || key === 'gstTreatment') return text(String(fee[key]));
  if (key !== 'baseSlab') return money(fee[key]);
  return (
    [
      fee.percentageBase && text(String(fee.percentageBase)),
      fee.base != null && money(fee.base),
      fee.slabPriceBase && text(String(fee.slabPriceBase)),
      fee.slabMatchValue != null &&
        (fee.mode === 'weight-slabs' ? String(fee.slabMatchValue) : money(fee.slabMatchValue)),
      fee.matchedSlabIndex != null && `${text('slabIndex')} ${String(fee.matchedSlabIndex)}`,
    ]
      .filter(Boolean)
      .join(' · ') || text('unavailable')
  );
}
function FeeTable({ fees }: { fees: Record<string, unknown>[] }) {
  return (
    <table class={styles.fees}>
      <caption>{text('feeBreakdown')}</caption>
      <thead class={styles.header}>
        <tr>
          {columns.map((key) => (
            <th key={key} scope="col">
              {AMAZON_FEE_COLUMNS[key]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {fees.map((fee, index) => (
          <tr key={index} data-fee-row="">
            {columns.map((key) => (
              <td key={key}>
                <span aria-hidden="true">{AMAZON_FEE_COLUMNS[key]}</span>
                {feeText(key, fee)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
/** Formats engine output only; never derives financial values from inputs or other outputs. */
export function AmazonManualProfitabilityResult({ result }: { result: Result }) {
  const fees = Array.isArray(result.value.marketplaceFees)
    ? result.value.marketplaceFees.slice(0, 20)
    : [];
  return (
    <div class={styles.result} data-amazon-result="">
      <div
        class={toolkit.primary}
        aria-live="polite"
        aria-atomic="true"
        data-primary-result=""
        data-output="economicProfit"
      >
        <span class={toolkit.primaryLabel}>{text('economicProfit')}</span>
        <output class={toolkit.primaryValue}>{money(result.value.economicProfit)}</output>
      </div>
      <ScalarList keys={METRICS} result={result} />
      <details class={toolkit.working}>
        <summary>{text('feeBreakdown')}</summary>
        <FeeTable fees={fees} />
      </details>
      <details class={toolkit.working}>
        <summary>{text('detailedBreakdown')}</summary>
        <ScalarList keys={Object.keys(AMAZON_BREAKDOWN_LABELS)} result={result} />
      </details>
    </div>
  );
}
