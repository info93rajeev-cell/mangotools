import mobileStyles from './foodPlannerMobile.module.css';
import type { IngredientLineItem } from './ingredientsUtils.ts';

export const INGREDIENT_STOCK_DATA: Record<
  string,
  { price: string; stock: string; category: string; catClass: string }
> = {
  onion: { price: '₹60 / kg', stock: '2.5 kg', category: 'Vegetable', catClass: '#dcfce7' },
  tomato: { price: '₹40 / kg', stock: '1.5 kg', category: 'Vegetable', catClass: '#dcfce7' },
  capsicum: { price: '₹120 / kg', stock: '0.5 kg', category: 'Vegetable', catClass: '#dcfce7' },
  carrot: { price: '₹50 / kg', stock: 'In Stock', category: 'Vegetable', catClass: '#dcfce7' },
  'basmati-rice': { price: '₹60 / kg', stock: '5.0 kg', category: 'Grain', catClass: '#fef3c7' },
  besan: { price: '₹80 / kg', stock: '2.0 kg', category: 'Grain', catClass: '#fef3c7' },
  paneer: { price: '₹320 / kg', stock: '2.0 kg', category: 'Dairy', catClass: '#dbeafe' },
  milk: { price: '₹56 / L', stock: 'In Stock', category: 'Dairy', catClass: '#dbeafe' },
};

export const FALLBACK_MOBILE_INGREDIENTS: IngredientLineItem[] = [
  {
    id: 'onion',
    name: 'Onion',
    aisle: 'produce',
    quantity: '2.50',
    unit: 'kg',
    usedIn: [],
    allergens: [],
  },
  {
    id: 'tomato',
    name: 'Tomato',
    aisle: 'produce',
    quantity: '1.50',
    unit: 'kg',
    usedIn: [],
    allergens: [],
  },
  {
    id: 'capsicum',
    name: 'Capsicum',
    aisle: 'produce',
    quantity: '0.50',
    unit: 'kg',
    usedIn: [],
    allergens: [],
  },
  {
    id: 'carrot',
    name: 'Carrot',
    aisle: 'produce',
    quantity: '1.00',
    unit: 'kg',
    usedIn: [],
    allergens: [],
  },
  {
    id: 'basmati-rice',
    name: 'Rice',
    aisle: 'dry-goods',
    quantity: '5.00',
    unit: 'kg',
    usedIn: [],
    allergens: [],
  },
  {
    id: 'besan',
    name: 'Besan',
    aisle: 'dry-goods',
    quantity: '2.00',
    unit: 'kg',
    usedIn: [],
    allergens: [],
  },
  {
    id: 'paneer',
    name: 'Paneer',
    aisle: 'dairy',
    quantity: '2.00',
    unit: 'kg',
    usedIn: [],
    allergens: [],
  },
  {
    id: 'milk',
    name: 'Milk',
    aisle: 'dairy',
    quantity: '2.00',
    unit: 'L',
    usedIn: [],
    allergens: [],
  },
];

export function MobileIngredientsTable({ items }: { items: IngredientLineItem[] }) {
  return (
    <div class={mobileStyles.mobileCard} style={{ padding: '0px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr
            style={{
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              color: '#475569',
              textAlign: 'left',
            }}
          >
            <th style={{ padding: '10px 12px' }}>
              <input type="checkbox" checked readOnly style={{ marginRight: '6px' }} />
              Ingredients ({items.length})
            </th>
            <th style={{ padding: '10px 8px', textAlign: 'right' }}>Unit Price</th>
            <th style={{ padding: '10px 12px', textAlign: 'right' }}>In Stock</th>
          </tr>
        </thead>
        <tbody>
          {items.map((ing) => {
            const meta = INGREDIENT_STOCK_DATA[ing.id] ?? {
              price: '₹60 / kg',
              stock: `${ing.quantity} ${ing.unit}`,
              category: ing.aisle,
              catClass: '#f1f5f9',
            };
            return (
              <tr key={ing.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked readOnly />
                    <img
                      src={`/food/recipes/${ing.id.includes('rice') ? 'jeera-rice' : 'dal-tadka'}.jpg`}
                      alt=""
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '4px',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/food/recipes/dal-tadka.jpg';
                      }}
                    />
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{ing.name}</strong>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '10.5px',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          background: meta.catClass,
                          color: '#334155',
                          width: 'fit-content',
                          marginTop: '2px',
                        }}
                      >
                        {meta.category}
                      </span>
                    </div>
                  </div>
                </td>
                <td
                  style={{
                    padding: '8px 8px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: '#1e293b',
                  }}
                >
                  {meta.price}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        fontWeight: 700,
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '6px',
                      }}
                    >
                      {meta.stock}
                    </span>
                    <span style={{ color: '#2563eb', cursor: 'pointer' }}>✏️</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
