import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { AISLE_DISPLAY_MAP } from './foodReferenceData.ts';
import type { ShoppingLineItem } from './shoppingListUtils.ts';

export function AisleAccordionCard({
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
          <table class={styles.table} aria-label={`Shopping List Table for ${aisle}`}>
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

export function PurchaseSummaryStats({
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

export function GroceryDiscoveryCard({
  location,
  onChangeLocation,
}: {
  location: string;
  onChangeLocation: (s: string) => void;
}) {
  const googleMapsUrl = `https://www.google.com/maps/search/grocery+stores+near+${encodeURIComponent(location)}`;

  return (
    <details class={styles.groceryDiscoveryCard}>
      <summary class={styles.discoveryHeader}>
        <Icon name="map-pin" />
        <strong>Find Nearby Grocery Stores</strong>
      </summary>
      <p class={styles.discoveryDesc}>
        Locate nearby wholesale mandis, kirana stores, and dairy booths for your shopping list.
      </p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <input
          type="text"
          class={styles.textInput}
          style={{ height: '34px', fontSize: '12.5px' }}
          placeholder="Enter city or area..."
          value={location}
          onInput={(e) => onChangeLocation((e.target as HTMLInputElement).value)}
        />
      </div>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        class={styles.discoveryBtn}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <Icon name="external-link" /> Open in Google Maps
      </a>
    </details>
  );
}
