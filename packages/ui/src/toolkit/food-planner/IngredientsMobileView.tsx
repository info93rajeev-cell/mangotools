import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { AISLE_DISPLAY_MAP, CATALOG_INGREDIENTS } from './foodReferenceData.ts';
import { InventoryCategories, InventoryTransfer } from './InventoryTransfer.tsx';
import {
  formatDisplayQty,
  formatDisplayUnit,
  type IngredientLineItem,
} from './ingredientsUtils.ts';
import { inventoryValue } from './inventoryValue.ts';
import { MobileMetric, MobilePagination, MobilePlanHeader } from './MobilePlanSetup.tsx';
import { priceBasis } from './plannerPrices.ts';
import { money } from './plannerResults.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

export function IngredientsMobileView({
  planner,
  items: rawItems,
}: {
  planner: UseFoodPlannerReturn;
  items: IngredientLineItem[];
}) {
  const items = rawItems.map((item) => ({
    ...item,
    aisle: planner.ingredientCategories[item.id] ?? item.aisle,
  }));
  const [transfer, setTransfer] = useState(false);
  const [categories, setCategories] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const visible = items.filter(
    (item) =>
      (category === 'all' || item.aisle === category) &&
      item.name.toLowerCase().includes(search.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(visible.length / 8));
  const currentPage = Math.min(page, pages);
  const paged = visible.slice((currentPage - 1) * 8, currentPage * 8);
  return (
    <div class={s.mobileContainer} data-testid="mobile-ingredients">
      <MobilePlanHeader planner={planner} section="ingredients" />
      <div class={s.mobileDualActions}>
        <input
          class={s.mobileSelect}
          type="search"
          aria-label={t.searchIngredients}
          placeholder={t.searchIngredients}
          value={search}
          onInput={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
        />
        <button type="button" class={s.mobileSecondaryBtn} onClick={() => setAdding(!adding)}>
          {t.addIngredient}
        </button>
      </div>
      {adding && <AddIngredient planner={planner} onClose={() => setAdding(false)} />}
      <IngredientCategories
        items={items}
        category={category}
        onSelect={(key) => {
          setCategory(key);
          setPage(1);
        }}
      />
      <section class={s.mobileCard}>
        <div class={s.mobileInventoryHeader}>
          <strong>
            {t.ingredients} ({items.length})
          </strong>
          <span>{t.price}</span>
          <span>{t.stock}</span>
        </div>
        {paged.map((item) => (
          <div key={item.id}>
            <div class={`${s.mobileDishItem} ${s.mobileInventoryRow}`}>
              <img class={s.mobileDishThumb} src={item.thumbnailUrl} alt="" />
              <div class={s.mobileDishInfo}>
                <strong>{item.name}</strong>
                <div>
                  {t.required}: {item.quantity} {item.unit}
                </div>
              </div>
              <span class={s.mobileInventoryPrice}>{priceLabel(item.id, planner)}</span>
              <span>{stockLabel(item, planner)}</span>
              <button
                type="button"
                class={s.mobileEditBtn}
                aria-label={`${t.edit}: ${item.name}`}
                onClick={() => setEditing(editing === item.id ? null : item.id)}
              >
                <Icon name="pencil" />
              </button>
            </div>
            {editing === item.id && (
              <IngredientEditor
                key={item.id}
                item={item}
                planner={planner}
                onClose={() => setEditing(null)}
              />
            )}
          </div>
        ))}
        {!visible.length && <p>{t.noIngredients}</p>}
      </section>
      <MobilePagination page={currentPage} pages={pages} setPage={setPage} />
      <InventorySummary planner={planner} items={items} />
      <div class={s.mobileInventoryActions}>
        <button
          type="button"
          class={s.mobilePrimaryBtn}
          onClick={() => setEditing(paged[0]?.id ?? null)}
        >
          {t.updateStock}
        </button>
        <button type="button" class={s.mobileSecondaryBtn} onClick={() => setTransfer(!transfer)}>
          {t.importExport}
        </button>
        <button
          type="button"
          class={s.mobileSecondaryBtn}
          onClick={() => setCategories(!categories)}
        >
          {t.addCategory}
        </button>
      </div>
      {transfer && <InventoryTransfer items={items} planner={planner} />}
      {categories && <InventoryCategories items={items} planner={planner} />}
    </div>
  );
}

function displayFactor(unit: string): number {
  return unit === 'kg' || unit === 'L' ? 1000 : 1;
}
function stockLabel(item: IngredientLineItem, planner: UseFoodPlannerReturn): string {
  const stock = planner.stockQuantities[item.id];
  if (stock === undefined) return t.stockUnknown;
  const base = item.unit === 'kg' ? 'g' : item.unit === 'L' ? 'ml' : item.unit;
  return `${formatDisplayQty(Number(stock), base)} ${formatDisplayUnit(Number(stock), base)}`;
}
function priceLabel(id: string, planner: UseFoodPlannerReturn): string {
  const price = priceBasis(id, planner.priceMode);
  const value = planner.userPrices[id] ?? ('priceInr' in price ? price.priceInr : undefined);
  return value === undefined ? '—' : `${money(value)} / ${price.per} ${price.unit}`;
}

export function IngredientEditor({
  item,
  planner,
  onClose,
}: {
  item: IngredientLineItem;
  planner: UseFoodPlannerReturn;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [stock, setStock] = useState(
    planner.stockQuantities[item.id] === undefined
      ? ''
      : String(Number(planner.stockQuantities[item.id]) / displayFactor(item.unit)),
  );
  const [price, setPrice] = useState(planner.userPrices[item.id] ?? '');
  const [error, setError] = useState('');
  const save = () => {
    if (
      ![quantity, stock, price].every(
        (v) =>
          v === '' ||
          (/^(?:0|[1-9]\d*)(\.\d{1,6})?$/.test(v) &&
            Number.isFinite(Number(v)) &&
            Number(v) <= 1_000_000_000),
      ) ||
      quantity === ''
    ) {
      setError(t.amountError);
      return;
    }
    planner.setIngredientQuantities((prev) => ({
      ...prev,
      [item.id]: String(Number(quantity) * displayFactor(item.unit)),
    }));
    planner.setStockQuantities((prev) => {
      const next = { ...prev };
      if (stock === '') delete next[item.id];
      else next[item.id] = String(Number(stock) * displayFactor(item.unit));
      return next;
    });
    planner.setUserPrices((prev) => {
      const next = { ...prev };
      if (price === '') delete next[item.id];
      else next[item.id] = price;
      return next;
    });
    onClose();
  };
  return (
    <fieldset class={s.mobileSetupCard} aria-label={`${t.inventoryEdit}: ${item.name}`}>
      <label>
        {t.required} ({item.unit})
        <input
          class={s.mobileSelect}
          inputMode="decimal"
          value={quantity}
          onInput={(e) => setQuantity(e.currentTarget.value)}
        />
      </label>
      <label>
        {t.stockAmount}
        <input
          class={s.mobileSelect}
          inputMode="decimal"
          value={stock}
          onInput={(e) => setStock(e.currentTarget.value)}
        />
      </label>
      <label>
        {t.priceAmount} (₹ / {priceBasis(item.id, planner.priceMode).per}{' '}
        {priceBasis(item.id, planner.priceMode).unit})
        <input
          class={s.mobileSelect}
          inputMode="decimal"
          value={price}
          onInput={(e) => setPrice(e.currentTarget.value)}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <div class={s.mobileDualActions}>
        <button type="button" class={s.mobilePrimaryBtn} onClick={save}>
          {t.save}
        </button>
        <button type="button" class={s.mobileSecondaryBtn} onClick={onClose}>
          {t.cancel}
        </button>
      </div>
    </fieldset>
  );
}

export function AddIngredient({
  planner,
  onClose,
}: {
  planner: UseFoodPlannerReturn;
  onClose: () => void;
}) {
  const lines =
    (planner.engineConsolidated as { lines?: Array<{ ingredient: string }> } | null)?.lines ?? [];
  const available = CATALOG_INGREDIENTS.filter(
    (item) => !lines.some((line) => line.ingredient === item.id),
  );
  const [id, setId] = useState(available[0]?.id ?? '');
  return (
    <section class={s.mobileSetupCard}>
      <label>
        {t.selectIngredient}
        <select class={s.mobileSelect} value={id} onChange={(e) => setId(e.currentTarget.value)}>
          {available.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        class={s.mobilePrimaryBtn}
        disabled={!id}
        onClick={() => {
          planner.setIngredientQuantities((prev) => ({ ...prev, [id]: prev[id] ?? '1' }));
          onClose();
        }}
      >
        {t.add}
      </button>
    </section>
  );
}

function InventorySummary({
  planner,
  items,
}: {
  planner: UseFoodPlannerReturn;
  items: IngredientLineItem[];
}) {
  const known = items.filter((item) => planner.stockQuantities[item.id] !== undefined).length;
  const low = items.filter(
    (item) =>
      planner.stockQuantities[item.id] !== undefined &&
      Number(planner.stockQuantities[item.id]) < Number(item.quantity) * displayFactor(item.unit),
  ).length;
  return (
    <section class={s.mobileCard}>
      <div class={s.mobileSummary2x2}>
        <MobileMetric label={t.totalItems} value={items.length} icon="clipboard-paste" />
        <MobileMetric label={t.lowStock} value={low} icon="shopping-cart" />
        <MobileMetric label={t.knownStock} value={known} icon="circle-check" />
        <MobileMetric label={t.value} value={money(inventoryValue(items, planner))} icon="coins" />
      </div>
      <p class={s.mobileCardSubtitle}>{t.stockHint}</p>
    </section>
  );
}

function IngredientCategories({
  items,
  category,
  onSelect,
}: {
  items: IngredientLineItem[];
  category: string;
  onSelect: (key: string) => void;
}) {
  const priority = ['vegetables', 'grains', 'dairy'];
  const categories = [...new Set(items.map((item) => item.aisle))].sort(
    (a, b) =>
      (priority.includes(a) ? priority.indexOf(a) : 9) -
      (priority.includes(b) ? priority.indexOf(b) : 9),
  );
  const button = (key: string) => (
    <button
      type="button"
      key={key}
      class={`${s.mobileNavPill} ${category === key ? s.mobileNavPillActive : ''}`}
      aria-pressed={category === key}
      onClick={() => onSelect(key)}
    >
      {key === 'all' ? t.all : (AISLE_DISPLAY_MAP[key] ?? key)} (
      {key === 'all' ? items.length : items.filter((item) => item.aisle === key).length})
    </button>
  );
  return (
    <div class={s.mobileNavPillsRow}>
      {['all', ...categories.slice(0, 3)].map(button)}
      {categories.length > 3 && (
        <details class={s.mobileCategoryMore}>
          <summary>{t.more}</summary>
          <div>{categories.slice(3).map(button)}</div>
        </details>
      )}
    </div>
  );
}
