import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import type { OtherCostItem } from './useFoodPlanner.ts';

export interface RecipeCostItem {
  id: string;
  num: number;
  name: string;
  servings: number;
  totalQty: string;
  ingCost: number;
  otherCost: number;
  totalDish: number;
}

export function OtherCostsCard({
  items,
  totalOtherCost,
  onUpdate,
  idPrefix = 'desktop',
  currencySymbol = '₹',
  currency = 'INR',
}: {
  idPrefix?: string;
  items: OtherCostItem[];
  totalOtherCost: number;
  onUpdate: (id: string, cost: number, enabled: boolean) => void;
  currencySymbol?: string;
  currency?: string;
}) {
  const loc = currency === 'USD' ? 'en-US' : 'en-IN';
  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <div class={styles.cardTitleGroup}>
          <h2 class={styles.cardTitle}>
            <Icon name="sliders-horizontal" /> Other Costs (Optional)
          </h2>
          <p class={styles.cardSubtitle}>Additional preparation, packaging and service costs.</p>
        </div>
      </div>

      <div class={styles.otherCostsGrid}>
        {items.map((item) => (
          <div
            key={item.id}
            class={styles.otherCostRow}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              padding: '6px 12px',
            }}
          >
            <label
              for={`${idPrefix}-cost-${item.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: item.enabled ? '#1e293b' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <input
                id={`${idPrefix}-cost-${item.id}`}
                type="checkbox"
                checked={item.enabled}
                onChange={(e) =>
                  onUpdate(item.id, item.cost, (e.target as HTMLInputElement).checked)
                }
              />
              <span>{item.label}</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{currencySymbol}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                aria-label={`${item.label} cost`}
                style={{
                  width: '70px',
                  height: '28px',
                  padding: '0 6px',
                  fontSize: '12.5px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                }}
                value={item.cost}
                disabled={!item.enabled}
                onInput={(e) =>
                  onUpdate(item.id, Number((e.target as HTMLInputElement).value) || 0, item.enabled)
                }
              />
            </div>
          </div>
        ))}
        <div
          style={{
            padding: '6px 10px',
            background: '#fef3c7',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          <span>Total Other Cost</span>
          <span>
            {currencySymbol}
            {totalOtherCost.toLocaleString(loc)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CostSummaryStats({
  totalIngredientCost,
  totalOtherCost,
  totalMenuCost,
  costPerServing,
  guests,
  dishesCount,
  currencySymbol = '₹',
  currency = 'INR',
}: {
  totalIngredientCost: number;
  totalOtherCost: number;
  totalMenuCost: number;
  costPerServing: string;
  guests: number;
  dishesCount: number;
  currencySymbol?: string;
  currency?: string;
}) {
  const loc = currency === 'USD' ? 'en-US' : 'en-IN';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
        <span>Total Ingredient Cost:</span>
        <strong>
          {currencySymbol}
          {totalIngredientCost.toLocaleString(loc)}
        </strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
        <span>Total Other Cost:</span>
        <strong>
          {currencySymbol}
          {totalOtherCost.toLocaleString(loc)}
        </strong>
      </div>

      <div class={styles.totalCostHighlight}>
        <span>Total Menu Cost</span>
        <span class={styles.totalCostValue}>
          {currencySymbol}
          {totalMenuCost.toLocaleString(loc)}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '6px',
        }}
      >
        <div
          style={{
            background: '#f8fafc',
            padding: '10px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Per Serving</span>
          <strong style={{ fontSize: '15px' }}>
            {currencySymbol}
            {costPerServing}
          </strong>
        </div>
        <div
          style={{
            background: '#f8fafc',
            padding: '10px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Servings</span>
          <strong style={{ fontSize: '15px' }}>{guests}</strong>
        </div>
        <div
          style={{
            background: '#f8fafc',
            padding: '10px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Dishes</span>
          <strong style={{ fontSize: '15px' }}>{dishesCount}</strong>
        </div>
      </div>
    </div>
  );
}

export function BudgetTargetCard({
  budget,
  onSetBudget,
  totalCost,
  currencySymbol = '₹',
  currency = 'INR',
}: {
  budget: string;
  onSetBudget: (val: string) => void;
  totalCost: number;
  currencySymbol?: string;
  currency?: string;
}) {
  const budgetNum = Number(budget) || 0;
  const budgetDiff = budgetNum - totalCost;
  const isOverBudget = budgetNum > 0 && budgetDiff < 0;
  const loc = currency === 'USD' ? 'en-US' : 'en-IN';

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
      }}
    >
      <label
        for="target-budget-input"
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 600,
          color: '#475569',
          marginBottom: '6px',
        }}
      >
        Target Budget ({currencySymbol})
      </label>
      <input
        id="target-budget-input"
        type="number"
        class={styles.textInput}
        value={budget}
        placeholder={currency === 'USD' ? 'e.g. 250' : 'e.g. 2500'}
        onInput={(e) => onSetBudget((e.target as HTMLInputElement).value)}
      />
      {budgetNum > 0 && (
        <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600 }}>
          {isOverBudget ? (
            <span style={{ color: '#dc2626' }}>
              ⚠️ Budget Exceeded by {currencySymbol}
              {Math.abs(budgetDiff).toLocaleString(loc)}
            </span>
          ) : (
            <span style={{ color: '#166534' }}>
              ✓ Under Budget by {currencySymbol}
              {budgetDiff.toLocaleString(loc)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function CostInsightsCard({
  costPerServing,
  highestCostDish,
  ingredientCost,
  totalCost,
  currencySymbol = '₹',
}: {
  costPerServing: string;
  highestCostDish: RecipeCostItem | null;
  ingredientCost: number;
  totalCost: number;
  currencySymbol?: string;
}) {
  const ingredientShare = totalCost > 0 ? Math.round((ingredientCost / totalCost) * 100) : 0;
  const otherShare = 100 - ingredientShare;

  return (
    <div
      style={{
        background: '#fffbeb',
        border: '1px solid #fef3c7',
        borderRadius: '8px',
        padding: '12px',
      }}
    >
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>
        Cost Insights & Budget Tips
      </h3>
      <ul
        style={{
          margin: 0,
          paddingLeft: '16px',
          fontSize: '12px',
          color: '#78350f',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <li>
          Cost per serving:{' '}
          <strong>
            {currencySymbol}
            {costPerServing}
          </strong>
        </li>
        {highestCostDish && (
          <li>
            Highest cost dish:{' '}
            <strong>
              {highestCostDish.name} ({currencySymbol}
              {highestCostDish.totalDish})
            </strong>
          </li>
        )}
        <li>
          Ingredient cost share: <strong>{ingredientShare}%</strong>
        </li>
        <li>
          Other cost share: <strong>{otherShare}%</strong>
        </li>
      </ul>
    </div>
  );
}
