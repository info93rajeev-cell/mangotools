import { Icon } from '../../primitives/Icon.tsx';
import mobileStyles from './foodPlannerMobile.module.css';
import type { ShoppingLineItem } from './shoppingListUtils.ts';

export interface DeptGroup {
  name: string;
  count: number;
  cost: number;
  icon: string;
  items: ShoppingLineItem[];
}

export const DEFAULT_VEGETABLES: ShoppingLineItem[] = [
  {
    id: 'onion',
    name: 'Onion',
    aisle: 'produce',
    buyQuantity: '2.0',
    unit: 'kg',
    priceLabel: '₹60/kg',
    estCost: 120,
    storeType: 'Grocery',
    isBought: false,
  },
  {
    id: 'tomato',
    name: 'Tomato',
    aisle: 'produce',
    buyQuantity: '1.5',
    unit: 'kg',
    priceLabel: '₹40/kg',
    estCost: 60,
    storeType: 'Grocery',
    isBought: false,
  },
  {
    id: 'capsicum',
    name: 'Capsicum',
    aisle: 'produce',
    buyQuantity: '0.5',
    unit: 'kg',
    priceLabel: '₹120/kg',
    estCost: 60,
    storeType: 'Grocery',
    isBought: false,
  },
  {
    id: 'carrot',
    name: 'Carrot',
    aisle: 'produce',
    buyQuantity: '0.5',
    unit: 'kg',
    priceLabel: '₹50/kg',
    estCost: 0,
    storeType: 'Grocery',
    isBought: true,
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    aisle: 'produce',
    buyQuantity: '0.5',
    unit: 'kg',
    priceLabel: '₹40/kg',
    estCost: 0,
    storeType: 'Grocery',
    isBought: true,
  },
  {
    id: 'coriander',
    name: 'Coriander',
    aisle: 'produce',
    buyQuantity: '100',
    unit: 'g',
    priceLabel: '₹40/100 g',
    estCost: 40,
    storeType: 'Grocery',
    isBought: false,
  },
];

export function MobileDepartmentGroup({
  dept,
  isExpanded,
  onToggle,
  boughtMap,
  onToggleBought,
}: {
  dept: DeptGroup;
  isExpanded: boolean;
  onToggle: () => void;
  boughtMap: Record<string, boolean>;
  onToggleBought: (id: string) => void;
}) {
  return (
    <div class={mobileStyles.mobileAccordionGroup}>
      <button
        type="button"
        class={mobileStyles.mobileAccordionHeader}
        style={{ width: '100%', border: 'none', textAlign: 'left' }}
        onClick={onToggle}
      >
        <div class={mobileStyles.mobileAccordionHeaderLeft}>
          <Icon name={dept.icon} />
          <span>
            {dept.name} ({dept.count})
          </span>
        </div>
        <div class={mobileStyles.mobileAccordionHeaderRight}>
          <strong>Est. Cost: ₹{dept.cost}</strong>
          <span>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {isExpanded && (
        <div class={mobileStyles.mobileAccordionBody}>
          {dept.items.map((it) => (
            <MobileShoppingItemRow
              key={it.id}
              it={it}
              isBought={boughtMap[it.id] || it.isBought}
              onToggle={() => onToggleBought(it.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MobileShoppingItemRow({
  it,
  isBought,
  onToggle,
}: {
  it: ShoppingLineItem;
  isBought: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 0',
        borderBottom: '1px solid #f1f5f9',
        fontSize: '12px',
      }}
    >
      <input type="checkbox" checked={!isBought} onChange={onToggle} />
      <img
        src="/food/recipes/jeera-rice.jpg"
        alt=""
        style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/food/recipes/dal-tadka.jpg';
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{it.name}</strong>
        {isBought && (
          <span
            style={{
              display: 'inline-block',
              marginLeft: '6px',
              background: '#dcfce7',
              color: '#15803d',
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '6px',
            }}
          >
            In Stock
          </span>
        )}
      </div>
      <span
        style={{
          background: '#eff6ff',
          color: '#1d4ed8',
          padding: '2px 6px',
          borderRadius: '6px',
          fontWeight: 600,
        }}
      >
        {it.buyQuantity} {it.unit}
      </span>
      <span style={{ color: '#64748b', fontSize: '11.5px', minWidth: '45px', textAlign: 'right' }}>
        {it.priceLabel}
      </span>
      <strong style={{ color: '#0f172a', minWidth: '40px', textAlign: 'right' }}>
        {it.estCost > 0 ? `₹${it.estCost}` : '—'}
      </strong>
      <span style={{ color: '#2563eb', cursor: 'pointer', paddingLeft: '4px' }}>🛒</span>
    </div>
  );
}
