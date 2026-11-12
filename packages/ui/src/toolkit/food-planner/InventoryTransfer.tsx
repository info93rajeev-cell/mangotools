import { useState } from 'preact/hooks';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { CATALOG_INGREDIENTS } from './foodReferenceData.ts';
import type { IngredientLineItem } from './ingredientsUtils.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

type InventoryRows = {
  quantities: Record<string, string>;
  stock: Record<string, string>;
  prices: Record<string, string>;
  count: number;
};

export function parseInventoryCsv(text: string): InventoryRows | null {
  if (text.length > 128_000) return null;
  const rows = text
    .trim()
    .replaceAll('\r', '')
    .split('\n')
    .map((line) => line.split(',').map((v) => v.trim()));
  if (
    rows[0]?.join(',') !== 'ingredient,required,stock,price' ||
    rows.length < 2 ||
    rows.length > 61
  )
    return null;
  const result: InventoryRows = { quantities: {}, stock: {}, prices: {}, count: 0 };
  const decimal = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;
  for (const row of rows.slice(1)) {
    const [id, required, stock, price] = row;
    if (
      row.length !== 4 ||
      !CATALOG_INGREDIENTS.some((item) => item.id === id) ||
      id in result.quantities ||
      !required ||
      [required, stock, price].some(
        (v) => v !== '' && (!decimal.test(v) || Number(v) > 1_000_000_000),
      )
    )
      return null;
    result.quantities[id] = required;
    result.stock[id] = stock;
    result.prices[id] = price;
    result.count++;
  }
  return result;
}

export function inventoryCsv(items: IngredientLineItem[], planner: UseFoodPlannerReturn): string {
  return [
    'ingredient,required,stock,price',
    ...items.map((item) => {
      const factor = item.unit === 'kg' || item.unit === 'L' ? 1000 : 1;
      return [
        item.id,
        String(Number(item.quantity) * factor),
        planner.stockQuantities[item.id] ?? '',
        planner.userPrices[item.id] ?? '',
      ].join(',');
    }),
  ].join('\r\n');
}

export function downloadInventory(items: IngredientLineItem[], planner: UseFoodPlannerReturn) {
  const url = URL.createObjectURL(
    new Blob([inventoryCsv(items, planner)], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'food-planner-inventory.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function InventoryTransfer({
  items,
  planner,
}: {
  items: IngredientLineItem[];
  planner: UseFoodPlannerReturn;
}) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const apply = () => {
    const parsed = parseInventoryCsv(text);
    if (!parsed) {
      setMessage(t.importError);
      return;
    }
    planner.setIngredientQuantities((old) => ({ ...old, ...parsed.quantities }));
    const merge = (old: Record<string, string>, rows: Record<string, string>) => {
      const next = { ...old };
      for (const [id, value] of Object.entries(rows)) {
        if (value === '') delete next[id];
        else next[id] = value;
      }
      return next;
    };
    planner.setStockQuantities((old) => merge(old, parsed.stock));
    planner.setUserPrices((old) => merge(old, parsed.prices));
    setMessage(`${t.imported} ${parsed.count}`);
  };
  return (
    <section class={s.mobileSetupCard} data-testid="inventory-transfer">
      <p>{t.importNote}</p>
      <label>
        {t.importFile}
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            if (file.size > 128_000) {
              setMessage(t.importError);
              return;
            }
            void file
              .text()
              .then(setText)
              .catch(() => setMessage(t.importError));
          }}
        />
      </label>
      <label>
        {t.inventoryCsv}
        <textarea
          class={s.mobileSelect}
          value={text}
          maxLength={128_000}
          onInput={(event) => setText(event.currentTarget.value)}
        />
      </label>
      <div class={s.mobileDualActions}>
        <button type="button" class={s.mobilePrimaryBtn} onClick={apply}>
          {t.importCsv}
        </button>
        <button
          type="button"
          class={s.mobileSecondaryBtn}
          onClick={() => downloadInventory(items, planner)}
        >
          {t.export}
        </button>
      </div>
      <p role="status">{message}</p>
    </section>
  );
}

export function InventoryCategories({
  items,
  planner,
}: {
  items: IngredientLineItem[];
  planner: UseFoodPlannerReturn;
}) {
  const [name, setName] = useState('');
  const [ingredient, setIngredient] = useState(items[0]?.id ?? '');
  const [error, setError] = useState('');
  return (
    <form
      class={s.mobileSetupCard}
      data-testid="inventory-categories"
      onSubmit={(event) => {
        event.preventDefault();
        if (
          !name.trim() ||
          name.trim().length > 40 ||
          name.trim() === 'all' ||
          Object.hasOwn(Object.prototype, name.trim())
        ) {
          setError(t.categoryError);
          return;
        }
        planner.setIngredientCategories((old) => ({ ...old, [ingredient]: name.trim() }));
        setError('');
      }}
    >
      <p>{t.categoryNote}</p>
      <label>
        {t.categoryName}
        <input
          class={s.mobileSelect}
          maxLength={40}
          value={name}
          onInput={(event) => setName(event.currentTarget.value)}
        />
      </label>
      <label>
        {t.ingredient}
        <select
          class={s.mobileSelect}
          value={ingredient}
          onChange={(event) => setIngredient(event.currentTarget.value)}
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <button class={s.mobilePrimaryBtn} type="submit" disabled={!items.length}>
        {t.saveCategory}
      </button>
      {Object.entries(planner.ingredientCategories).map(([id, category]) => (
        <div key={id}>
          {category}: {CATALOG_INGREDIENTS.find((i) => i.id === id)?.name}
          <button
            type="button"
            class={s.mobileSecondaryBtn}
            aria-label={`${t.remove}: ${category}`}
            onClick={() =>
              planner.setIngredientCategories((old) => {
                const next = { ...old };
                delete next[id];
                return next;
              })
            }
          >
            {t.remove}
          </button>
        </div>
      ))}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
