import { useMemo, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { AISLE_DISPLAY_MAP, CATALOG_INGREDIENTS, REFERENCE_PRICES } from './foodReferenceData.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface ShoppingListSectionProps {
  planner: UseFoodPlannerReturn;
}

interface ShoppingLineItem {
  id: string;
  name: string;
  aisle: string;
  buyQuantity: string;
  unit: string;
  priceLabel: string;
  estCost: number;
  storeType: string;
  isBought: boolean;
}

export function ShoppingListSection({ planner }: ShoppingListSectionProps) {
  const {
    setup,
    selectedRecipes,
    engineConsolidated,
    boughtItems,
    toggleBoughtItem,
    setActiveSection,
  } = planner;

  const [expandedAisles, setExpandedAisles] = useState<Record<string, boolean>>({
    vegetables: true,
    pulses: true,
    grains: true,
    spices: true,
    dairy: true,
  });
  const [groceryQuery, setGroceryQuery] = useState(setup.location || 'Delhi');

  const toggleAisle = (aisle: string) => {
    setExpandedAisles((prev) => ({ ...prev, [aisle]: !prev[aisle] }));
  };

  const shoppingItems = useMemo(
    () => buildShoppingItems(engineConsolidated, boughtItems),
    [engineConsolidated, boughtItems],
  );

  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingLineItem[]> = {};
    for (const item of shoppingItems) {
      if (!groups[item.aisle]) groups[item.aisle] = [];
      groups[item.aisle].push(item);
    }
    return groups;
  }, [shoppingItems]);

  const totalItems = shoppingItems.length;
  const inListCount = shoppingItems.filter((i) => i.isBought).length;
  const toBuyCount = totalItems - inListCount;
  const totalEstCost = shoppingItems.reduce((sum, i) => sum + i.estCost, 0);

  return (
    <div class={styles.layoutGrid}>
      <div class={styles.card}>
        <div class={styles.cardHeader}>
          <div class={styles.cardTitleGroup}>
            <h2 class={styles.cardTitle}>
              <Icon name="shopping-cart" /> Shopping List ({totalItems} items)
            </h2>
            <p class={styles.cardSubtitle}>
              Consolidated purchase list with rounded buy units for {selectedRecipes.length}{' '}
              recipes.
            </p>
          </div>
          <button type="button" class={styles.actionBtn} onClick={() => window.print()}>
            <Icon name="printer" /> Print List
          </button>
        </div>

        {Object.keys(groupedItems).length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
            No shopping items yet. Select dishes in Recipes &amp; Menu to generate your shopping
            list.
          </p>
        ) : (
          Object.entries(groupedItems).map(([aisle, items]) => (
            <AisleAccordionCard
              key={aisle}
              aisle={aisle}
              items={items}
              isExpanded={expandedAisles[aisle] !== false}
              onToggle={() => toggleAisle(aisle)}
              onToggleBought={toggleBoughtItem}
            />
          ))
        )}
      </div>

      <div class={styles.card}>
        <div class={styles.cardHeader}>
          <h2 class={styles.cardTitle}>
            <Icon name="package" /> Purchase Summary
          </h2>
        </div>

        <PurchaseSummaryStats total={totalItems} toBuy={toBuyCount} inStock={inListCount} />

        <div class={styles.totalCostHighlight}>
          <span>Total Estimated Cost</span>
          <span class={styles.totalCostValue}>₹{totalEstCost.toLocaleString('en-IN')}</span>
        </div>

        <GroceryDiscoveryCard location={groceryQuery} onChangeLocation={setGroceryQuery} />

        <button type="button" class={styles.ctaBtn} onClick={() => setActiveSection('cost')}>
          <Icon name="coins" /> Continue to Cost Estimation <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  );
}

function AisleAccordionCard({
  aisle,
  items,
  isExpanded,
  onToggle,
  onToggleBought,
}: {
  aisle: string;
  items: ShoppingLineItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onToggleBought: (id: string) => void;
}) {
  const aisleCost = items.reduce((sum, i) => sum + i.estCost, 0);

  return (
    <div style={{ marginBottom: '12px' }}>
      <button
        type="button"
        class={styles.phaseHeader}
        style={{ width: '100%', textAlign: 'left', border: 'none' }}
        onClick={onToggle}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} />
          {AISLE_DISPLAY_MAP[aisle] ?? aisle} ({items.length})
        </span>
        <span class={styles.phaseTag}>Est. Cost: ₹{aisleCost}</span>
      </button>

      {isExpanded && (
        <div class={styles.tableWrapper} style={{ borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          <table class={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '36px' }} aria-label="Status checkbox"></th>
                <th>Ingredient</th>
                <th>Buy Qty</th>
                <th>Est. Price</th>
                <th>Est. Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ background: item.isBought ? '#f8fafc' : 'transparent' }}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Mark ${item.name} as in stock`}
                      checked={item.isBought}
                      onChange={() => onToggleBought(item.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <strong>{item.name}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                      Buy at: {item.storeType}
                    </span>
                  </td>
                  <td>
                    <strong>{item.buyQuantity}</strong> {item.unit}
                  </td>
                  <td>{item.priceLabel}</td>
                  <td>{item.estCost > 0 ? `₹${item.estCost}` : '—'}</td>
                  <td>
                    {item.isBought ? (
                      <span class={`${styles.badge} ${styles.badgeVerified}`}>✓ In Stock</span>
                    ) : (
                      <span class={`${styles.badge} ${styles.badgePrototype}`}>○ To Buy</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PurchaseSummaryStats({
  total,
  toBuy,
  inStock,
}: {
  total: number;
  toBuy: number;
  inStock: number;
}) {
  return (
    <div class={styles.summaryStats} style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
      <div
        class={styles.statItem}
        style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}
      >
        <span class={styles.statLabel}>Total</span>
        <span class={styles.statValue}>{total}</span>
      </div>
      <div
        class={styles.statItem}
        style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px' }}
      >
        <span class={styles.statLabel} style={{ color: '#991b1b' }}>
          To Buy
        </span>
        <span class={styles.statValue} style={{ color: '#b91c1c' }}>
          {toBuy}
        </span>
      </div>
      <div
        class={styles.statItem}
        style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px' }}
      >
        <span class={styles.statLabel} style={{ color: '#166534' }}>
          In Stock
        </span>
        <span class={styles.statValue} style={{ color: '#15803d' }}>
          {inStock}
        </span>
      </div>
    </div>
  );
}

function GroceryDiscoveryCard({
  location,
  onChangeLocation,
}: {
  location: string;
  onChangeLocation: (s: string) => void;
}) {
  const googleMapsUrl = `https://www.google.com/maps/search/grocery+stores+near+${encodeURIComponent(location)}`;

  return (
    <div class={styles.discoveryCard}>
      <div class={styles.discoveryTitle}>
        <Icon name="map-pin" /> Nearby Grocery Discovery
      </div>
      <p class={styles.discoveryDesc}>
        Find nearby supermarket, kirana and spice stores with live driving directions on Google
        Maps. Free and zero tracking.
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          class={styles.textInput}
          style={{ height: '34px', fontSize: '12.5px' }}
          value={location}
          placeholder="Enter locality or area..."
          onInput={(e) => onChangeLocation((e.target as HTMLInputElement).value)}
        />
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          class={styles.discoveryBtn}
          style={{ whiteSpace: 'nowrap' }}
        >
          Find Stores <Icon name="external-link" />
        </a>
      </div>
    </div>
  );
}

function buildShoppingItems(
  engineConsolidated: unknown,
  boughtItems: Record<string, boolean>,
): ShoppingLineItem[] {
  const cons = engineConsolidated as {
    lines?: Array<{ ingredient: string; buy: string; unit: string }>;
  } | null;

  if (!cons?.lines) return [];

  const catalogMap = new Map(CATALOG_INGREDIENTS.map((i) => [i.id, i]));
  const priceMap = new Map(
    REFERENCE_PRICES.filter((p) => p.kind === 'retail-reference').map((p) => [p.ingredient, p]),
  );

  return cons.lines.map((l) => {
    const cat = catalogMap.get(l.ingredient);
    const pr = priceMap.get(l.ingredient);
    const buyNum = Number.parseFloat(l.buy);
    const estCost = computeLineCost(buyNum, l.unit, pr?.priceInr, pr?.per, pr?.unit);
    const priceLabel = pr ? `₹${pr.priceInr} / ${pr.unit}` : '—';

    return {
      id: l.ingredient,
      name: cat?.name ?? l.ingredient,
      aisle: cat?.aisle ?? 'other',
      buyQuantity: formatDisplayBuy(buyNum, l.unit),
      unit: formatDisplayBuyUnit(buyNum, l.unit),
      priceLabel,
      estCost: Math.round(estCost),
      storeType: getStoreTypeForAisle(cat?.aisle ?? 'other'),
      isBought: !!boughtItems[l.ingredient],
    };
  });
}

function computeLineCost(
  buyNum: number,
  lineUnit: string,
  priceInr?: string,
  per?: string,
  priceUnit?: string,
): number {
  if (!priceInr || !per || !priceUnit) return 0;
  const rate = Number.parseFloat(priceInr);
  const p = Number.parseFloat(per);

  if (lineUnit === 'g' && priceUnit === 'kg') {
    return (buyNum / 1000) * (rate / p);
  }
  if (lineUnit === 'ml' && (priceUnit === 'l' || priceUnit === '1000')) {
    return (buyNum / 1000) * (rate / p);
  }
  return (buyNum / p) * rate;
}

function formatDisplayBuy(num: number, unit: string): string {
  if (unit === 'g' && num >= 1000) return (num / 1000).toFixed(2);
  if (unit === 'ml' && num >= 1000) return (num / 1000).toFixed(2);
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function formatDisplayBuyUnit(num: number, unit: string): string {
  if (unit === 'g' && num >= 1000) return 'kg';
  if (unit === 'ml' && num >= 1000) return 'L';
  return unit;
}

function getStoreTypeForAisle(aisle: string): string {
  if (aisle === 'vegetables' || aisle === 'herbs') return 'Sabzi Mandi / Veg Vendor';
  if (aisle === 'dairy') return 'Dairy / Milk Booth';
  if (aisle === 'spices') return 'Spice Merchant / Kirana';
  if (aisle === 'grains' || aisle === 'pulses') return 'Grocery Wholesale / Retail';
  return 'General Store';
}
