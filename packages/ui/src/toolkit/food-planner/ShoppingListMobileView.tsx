import { useState } from 'preact/hooks';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { AISLE_DISPLAY_MAP } from './foodReferenceData.ts';
import { MobileMetric, MobilePlanSetup, MobileSectionHeader } from './MobilePlanSetup.tsx';
import { ingredientTotal, money, sumMoney } from './plannerResults.ts';
import type { ShoppingLineItem } from './shoppingListUtils.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface ShoppingListMobileViewProps {
  planner: UseFoodPlannerReturn;
  items: ShoppingLineItem[];
  boughtMap: Record<string, boolean>;
  onToggleBought: (id: string) => void;
}

export function ShoppingListMobileView({
  planner,
  items,
  boughtMap,
  onToggleBought,
}: ShoppingListMobileViewProps) {
  const [filter, setFilter] = useState<'all' | 'tobuy' | 'instock'>('all');
  const [closed, setClosed] = useState<Record<string, boolean>>(initialClosedGroups);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const inList = items.filter((item) => boughtMap[item.id]).length;

  const groups = shoppingGroups(items, filter, boughtMap);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(
        items.map((item) => `${item.name}: ${item.buyQuantity} ${item.unit}`).join('\n'),
      );
      setMessage(t.shared);
    } catch {
      setMessage(t.shareError);
    }
  };
  return (
    <div class={s.mobileContainer} data-testid="mobile-shopping">
      <MobileSectionHeader title={t.shopping} intro={t.shoppingIntro} icon="shopping-cart" />
      <MobilePlanSetup planner={planner} id="mobile-shopping" />
      <ShoppingOverview
        items={items}
        inList={inList}
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
              {AISLE_DISPLAY_MAP[aisle] ?? aisle} ({lines?.length ?? 0})
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
                    aria-label={`${t.addSelected}: ${item.name}`}
                    onChange={() => setSelected({ ...selected, [item.id]: !selected[item.id] })}
                  />
                  <img class={s.mobileDishThumb} src={item.thumbnailUrl} alt="" />
                  <div class={s.mobileDishInfo}>
                    <strong>{item.name}</strong>
                    <div>
                      {item.buyQuantity} {item.unit} · {item.priceLabel}
                    </div>
                  </div>
                  <strong>{money(item.estCost)}</strong>
                  <button
                    type="button"
                    class={s.mobileEditBtn}
                    onClick={() => onToggleBought(item.id)}
                    aria-label={`${t.inList}: ${item.name}`}
                    aria-pressed={!!boughtMap[item.id]}
                  >
                    {boughtMap[item.id] ? t.inList : t.toBuy}
                  </button>
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
      <button
        type="button"
        class={s.mobileSecondaryBtn}
        onClick={() => planner.setActiveSection('cost')}
      >
        {t.goCost}
      </button>
    </div>
  );
}

function ShoppingOverview({
  items,
  inList,
  total,
  filter,
  setFilter,
}: {
  items: ShoppingLineItem[];
  inList: number;
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
          <MobileMetric label={t.totalItems} value={items.length} icon="clipboard" />
          <MobileMetric label={t.toBuy} value={items.length - inList} icon="shopping-cart" />
          <MobileMetric label={t.inList} value={inList} icon="check-circle" />
          <MobileMetric label={t.estimated} value={money(total)} icon="coins" />
        </div>
      </section>
      <div class={s.mobileNavPillsRow}>
        {(
          [
            ['all', t.all],
            ['tobuy', t.toBuy],
            ['instock', t.inList],
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

function shoppingGroups(
  items: ShoppingLineItem[],
  filter: string,
  boughtMap: Record<string, boolean>,
) {
  const groups: Record<string, ShoppingLineItem[]> = {};
  for (const item of items) {
    if (filter === 'tobuy' && boughtMap[item.id]) continue;
    if (filter === 'instock' && !boughtMap[item.id]) continue;
    groups[item.aisle] ??= [];
    groups[item.aisle]?.push(item);
  }
  return groups;
}

function initialClosedGroups() {
  return Object.fromEntries(
    Object.keys(AISLE_DISPLAY_MAP).map((key) => [key, key !== 'vegetables']),
  );
}

function orderedShoppingGroups(groups: Record<string, ShoppingLineItem[]>) {
  return Object.entries(groups).sort(([a], [b]) =>
    a === 'vegetables' ? -1 : b === 'vegetables' ? 1 : a.localeCompare(b),
  );
}
