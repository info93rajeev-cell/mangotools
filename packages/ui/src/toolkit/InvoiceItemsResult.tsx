import type { ToolSnapshot } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { formatValue } from '../format/numbers.ts';
import { InlineAlert } from '../primitives/feedback.tsx';
import { t } from '../strings/en.ts';
import styles from './invoiceItems.module.css';
import { label, messageFor, type OutputRow, outputRows } from './presentation.ts';
import toolkitStyles from './toolkit.module.css';
import { type WorkingStep, WorkingSteps } from './WorkingSteps.tsx';

interface ResultItem {
  description: string;
  hsn: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  lineAmount: string;
}

/** Description · HSN · Qty · Unit · Unit price · Amount — the one thing v1's flat result never had. */
function ItemTable({ preset, items }: { preset: ResolvedPreset; items: ResultItem[] }) {
  const col = (key: string) => label(preset, `invoice.item.${key}`);
  const caption = label(preset, 'invoice.out.items');
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: a <section> needs tabIndex too for axe's scrollable-region-focusable rule, since it only scrolls (and needs keyboard focus) on narrow viewports.
    <section class={styles.tableWrap} tabIndex={0} aria-label={caption}>
      <table class={styles.table}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{col('description')}</th>
            <th scope="col">{col('hsn')}</th>
            <th scope="col">{col('quantity')}</th>
            <th scope="col">{col('unit')}</th>
            <th scope="col">{col('unitPrice')}</th>
            <th scope="col">{label(preset, 'invoice.out.lineAmount')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} data-item-row-result={index}>
              <td>{item.description}</td>
              <td>{item.hsn}</td>
              <td>{formatValue('number', item.quantity)}</td>
              <td>{item.unit}</td>
              <td>{formatValue('money', item.unitPrice)}</td>
              <td>{formatValue('money', item.lineAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** Primary output large and first (matching every other tool's result), the rest as label/value rows. */
function ScalarRows({ rows }: { rows: OutputRow[] }) {
  const [primary, ...rest] = rows;
  if (!primary) return null;
  return (
    <div>
      <div
        class={toolkitStyles.primary}
        aria-live="polite"
        aria-atomic="true"
        data-primary-result=""
      >
        <span class={toolkitStyles.primaryLabel}>{primary.label}</span>
        <output class={toolkitStyles.primaryValue}>{primary.value}</output>
      </div>
      {rest.length > 0 ? (
        <dl class={toolkitStyles.rows}>
          {rest.map((row) => (
            <div key={row.key} class={toolkitStyles.row} data-output={row.key}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export interface InvoiceItemsResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  /** Set when the error already has its own field-level message (a row, or a regular field) —
   * the generic alert below stays silent rather than repeating the same text a second time. */
  shownInline: boolean;
}

/** Archetype B's usual result section, plus an item table above the scalar outputs (subtotal/total). */
export function InvoiceItemsResult({
  idPrefix,
  preset,
  snapshot,
  shownInline,
}: InvoiceItemsResultProps) {
  const { values, phase, error, result } = snapshot;
  const items = (result?.value.items as ResultItem[] | undefined) ?? [];
  const rows = result && phase !== 'error' ? outputRows(preset, result.value, values) : [];
  const steps = (result?.value.working as WorkingStep[] | undefined) ?? [];
  const current = result && phase !== 'error' ? result : null;
  return (
    <section
      class={`${toolkitStyles.panel} ${toolkitStyles.result}`}
      aria-labelledby={`${idPrefix}-result-title`}
    >
      <h2 id={`${idPrefix}-result-title`} class={toolkitStyles.panelTitle}>
        {t('result.title')}
      </h2>
      {items.length > 0 ? <ItemTable preset={preset} items={items} /> : null}
      {rows.length > 0 ? <ScalarRows rows={rows} /> : null}
      {items.length === 0 && phase !== 'error' ? (
        <p class={toolkitStyles.placeholder}>{t('result.empty')}</p>
      ) : null}
      {phase === 'error' && error ? (
        <InlineAlert tone="danger" title={t('error.title')} role="alert">
          {shownInline ? null : <p>{messageFor(preset, error)}</p>}
        </InlineAlert>
      ) : null}
      {current?.warnings.map((w) => (
        <InlineAlert key={w.code} tone="warning">
          {messageFor(preset, w)}
        </InlineAlert>
      ))}
      {current ? <WorkingSteps preset={preset} steps={steps} /> : null}
    </section>
  );
}
