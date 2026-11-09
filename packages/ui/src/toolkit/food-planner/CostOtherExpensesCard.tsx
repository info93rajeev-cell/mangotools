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
}: {
  idPrefix?: string;
  items: OtherCostItem[];
  totalOtherCost: number;
  onUpdate: (id: string, cost: number, enabled: boolean) => void;
}) {
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
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <label
              for={`${idPrefix}-cost-${item.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
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
              <span style={{ fontSize: '12px', color: '#64748b' }}>₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                aria-label={`${item.label} cost in rupees`}
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
      </div>

      <div
        style={{
          marginTop: '14px',
          padding: '10px 14px',
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
        <span>₹{totalOtherCost.toLocaleString('en-IN')}</span>
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
}: {
  totalIngredientCost: number;
  totalOtherCost: number;
  totalMenuCost: number;
  costPerServing: string;
  guests: number;
  dishesCount: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
        <span>Total Ingredient Cost:</span>
        <strong>₹{totalIngredientCost.toLocaleString('en-IN')}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
        <span>Total Other Cost:</span>
        <strong>₹{totalOtherCost.toLocaleString('en-IN')}</strong>
      </div>

      <div class={styles.totalCostHighlight}>
        <span>Total Menu Cost</span>
        <span class={styles.totalCostValue}>₹{totalMenuCost.toLocaleString('en-IN')}</span>
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
          <strong style={{ fontSize: '15px' }}>₹{costPerServing}</strong>
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
  totalCost,
  onSetBudget,
}: {
  budget: string;
  totalCost: number;
  onSetBudget: (val: string) => void;
}) {
  const budgetNum = Number.parseFloat(budget) || 0;
  const budgetDiff = budgetNum > 0 ? budgetNum - totalCost : 0;
  const isOverBudget = budgetNum > 0 && totalCost > budgetNum;

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
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
        Target Budget (₹)
      </label>
      <input
        id="target-budget-input"
        type="number"
        class={styles.textInput}
        value={budget}
        placeholder="e.g. 2500"
        onInput={(e) => onSetBudget((e.target as HTMLInputElement).value)}
      />
      {budgetNum > 0 && (
        <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600 }}>
          {isOverBudget ? (
            <span style={{ color: '#dc2626' }}>
              ⚠️ Budget Exceeded by ₹{Math.abs(budgetDiff).toLocaleString('en-IN')}
            </span>
          ) : (
            <span style={{ color: '#166534' }}>
              ✓ Under Budget by ₹{budgetDiff.toLocaleString('en-IN')}
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
}: {
  costPerServing: string;
  highestCostDish: RecipeCostItem | null;
  ingredientCost: number;
  totalCost: number;
}) {
  const ingredientShare = totalCost === 0 ? 0 : Math.round((ingredientCost / totalCost) * 100);
  const otherShare = 100 - ingredientShare;

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '14px',
        background: '#fffbeb',
        borderRadius: '8px',
        border: '1px solid #fde68a',
      }}
    >
      <h3
        style={{
          fontSize: '13.5px',
          fontWeight: 700,
          margin: '0 0 10px 0',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Icon name="lightbulb" /> Cost Insights
      </h3>
      <ul
        style={{
          margin: 0,
          paddingLeft: '18px',
          fontSize: '12.5px',
          color: '#78350f',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <li>
          Cost per serving: <strong>₹{costPerServing}</strong>
        </li>
        {highestCostDish && (
          <li>
            Highest cost dish:{' '}
            <strong>
              {highestCostDish.name} (₹{highestCostDish.totalDish})
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
