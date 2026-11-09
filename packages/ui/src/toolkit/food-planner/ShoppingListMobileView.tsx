import { useState } from 'preact/hooks';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { AISLE_DISPLAY_MAP } from './foodReferenceData.ts';
import { MobileMetric, MobilePlanHeader } from './MobilePlanSetup.tsx';
import { ingredientTotal, money, sumMoney } from './plannerResults.ts';
import { buildShoppingItems, type ShoppingLineItem } from './shoppingListUtils.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface ShoppingListMobileViewProps {
  planner: UseFoodPlannerReturn;
  boughtMap: Record<string, boolean>;
  onToggleBought: (id: string) => void;
}

export function ShoppingListMobileView({
  planner,
  boughtMap,
  onToggleBought,
}: ShoppingListMobileViewProps) {
  const items = mobileShoppingItems(planner);
  const [filter, setFilter] = useState<'all' | 'tobuy' | 'instock'>('all');
  const [closed, setClosed] = useState<Record<string, boolean>>(initialClosedGroups);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const inStock = items.filter((item) => Number(item.buyQuantity) === 0).length;

  const groups = shoppingGroups(items, filter);
  const share = () => shareShopping(items, setMessage);
  return (
    <div class={s.mobileContainer} data-testid="mobile-shopping">
      <MobilePlanHeader planner={planner} section="shopping" />
      <ShoppingOverview
        items={items}
        inStock={inStock}
        total={ingredientTotal(planner.engineCost)}
        filter={filter}
        setFilter={setFilter}
      />
      {orderedShoppingGroups(groups).map(([aisle, lines]) => (
        <section class={s.mobileAccordionGroup} key={aisle}>
          <button
            type="button"
            class={s.mobileAccordionHeader}
            aria-expanded={!closed[aisle]}
            onClick={() => setClosed({ ...closed, [aisle]: !closed[aisle] })}
          >
            <span>
              {shoppingGroupLabel(aisle)} ({lines?.length ?? 0})
            </span>
            <strong>{money(sumMoney((lines ?? []).map((line) => line.estCost)))}</strong>
          </button>
          {!closed[aisle] && (
            <div class={s.mobileAccordionBody}>
              {(lines ?? []).map((item) => (
                <div class={s.mobileDishItem} key={item.id}>
                  <input
                    type="checkbox"
                    checked={!!selected[item.id]}
                    disabled={Number(item.buyQuantity) === 0}
                    aria-label={`${t.addSelected}: ${item.name}`}
                    onChange={() => setSelected({ ...selected, [item.id]: !selected[item.id] })}
                  />
                  <img class={s.mobileDishThumb} src={item.thumbnailUrl} alt="" />
                  <div class={s.mobileDishInfo}>
                    <strong>{item.name}</strong>
                    <div>
                      {Number(item.buyQuantity) === 0
                        ? `${t.stock}: ${item.requiredQuantity} ${item.requiredUnit}`
                        : `${item.buyQuantity} ${item.unit} · ${item.priceLabel}`}
                    </div>
                  </div>
                  <strong>{money(item.estCost)}</strong>
                  {Number(item.buyQuantity) === 0 ? (
                    <span class={s.mobileStockBadge}>{t.stock}</span>
                  ) : (
                    <button
                      type="button"
                      class={s.mobileEditBtn}
                      onClick={() => onToggleBought(item.id)}
                      aria-label={`${t.inList}: ${item.name}`}
                      aria-pressed={!!boughtMap[item.id]}
                    >
                      {boughtMap[item.id] ? t.inList : t.toBuy}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
      <div class={s.mobileDualActions}>
        <button
          type="button"
          class={s.mobilePrimaryBtn}
          onClick={() => {
            planner.setBoughtItems({
              ...boughtMap,
              ...Object.fromEntries(
                Object.keys(selected)
                  .filter((id) => selected[id])
                  .map((id) => [id, true]),
              ),
            });
            setSelected({});
          }}
        >
          {t.addSelected}
        </button>
        <button type="button" class={s.mobileSecondaryBtn} onClick={() => void share()}>
          {t.share}
        </button>
      </div>
      <p class={s.mobileCardSubtitle}>{t.roundingNote}</p>
      <p role="status">{message}</p>
    </div>
  );
}

function ShoppingOverview({
  items,
  inStock,
  total,
  filter,
  setFilter,
}: {
  items: ShoppingLineItem[];
  inStock: number;
  total: number;
  filter: 'all' | 'tobuy' | 'instock';
  setFilter: (value: 'all' | 'tobuy' | 'instock') => void;
}) {
  return (
    <>
      {' '}
      <section class={s.mobileCard}>
        <h4 class={s.mobileCardTitle}>{t.listSummary}</h4>
        <div class={s.mobileSummary2x2}>
          <MobileMetric label={t.totalItems} value={items.length} icon="clipboard-paste" />
          <MobileMetric label={t.toBuy} value={items.length - inStock} icon="shopping-cart" />
          <MobileMetric label={t.stock} value={inStock} icon="circle-check" />
          <MobileMetric label={t.estimated} value={money(total)} icon="coins" />
        </div>
      </section>
      <div class={s.mobileNavPillsRow}>
        {(
          [
            ['all', t.all],
            ['tobuy', t.toBuy],
            ['instock', t.stock],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            class={`${s.mobileNavPill} ${filter === value ? s.mobileNavPillActive : ''}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

function shoppingGroups(items: ShoppingLineItem[], filter: string) {
  const groups: Record<string, ShoppingLineItem[]> = {};
  for (const item of items) {
    if (filter === 'tobuy' && Number(item.buyQuantity) === 0) continue;
    if (filter === 'instock' && Number(item.buyQuantity) !== 0) continue;
    const key = mobileShoppingGroup(item.aisle);
    groups[key] ??= [];
    groups[key]?.push(item);
  }
  return groups;
}

function initialClosedGroups() {
  return Object.fromEntries(
    [...Object.keys(AISLE_DISPLAY_MAP), 'grains-pulses', 'oils-others'].map((key) => [
      key,
      key !== 'vegetables',
    ]),
  );
}

function orderedShoppingGroups(groups: Record<string, ShoppingLineItem[]>) {
  const order = ['vegetables', 'grains-pulses', 'dairy', 'spices', 'oils-others'];
  const rank = (key: string) => (order.includes(key) ? order.indexOf(key) : 9);
  return Object.entries(groups).sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
}

async function shareShopping(items: ShoppingLineItem[], setMessage: (message: string) => void) {
  try {
    await navigator.clipboard.writeText(
      items.map((item) => `${item.name}: ${item.buyQuantity} ${item.unit}`).join('\n'),
    );
    setMessage(t.shared);
  } catch {
    setMessage(t.shareError);
  }
}

function mobileShoppingGroup(aisle: string): string {
  if (aisle === 'grains' || aisle === 'pulses') return 'grains-pulses';
  if (aisle === 'herbs') return 'vegetables';
  if (aisle === 'oils-fats' || aisle === 'other') return 'oils-others';
  return aisle;
}
function shoppingGroupLabel(aisle: string): string {
  if (aisle === 'grains-pulses') return t.grainsPulses;
  if (aisle === 'oils-others') return t.oilsOthers;
  return AISLE_DISPLAY_MAP[aisle] ?? aisle;
}

function mobileShoppingItems(planner: UseFoodPlannerReturn) {
  return buildShoppingItems(
    planner.engineConsolidated,
    planner.selectedRecipes,
    planner.portionFactors,
    planner.setup.guests,
    planner.setup.servingsPerGuest,
    planner.boughtItems,
    planner.engineCost,
    planner.priceMode,
    planner.userPrices,
    true,
  ).map((item) => ({ ...item, aisle: planner.ingredientCategories[item.id] ?? item.aisle }));
}
