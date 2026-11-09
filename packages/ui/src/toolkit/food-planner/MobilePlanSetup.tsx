import { Icon } from '../../primitives/Icon.tsx';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { LOCATIONS, OCCASIONS, PLANNING_TYPES } from './foodReferenceData.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

export function MobileSectionHeader({
  title,
  intro,
  icon,
}: {
  title: string;
  intro: string;
  icon: string;
}) {
  return (
    <header class={s.mobileSectionHeader}>
      <div class={s.mobileSectionHeaderIcon}>
        <Icon name={icon} />
      </div>
      <div>
        <h3 class={s.mobileSectionHeaderTitle}>{title}</h3>
        <p class={s.mobileSectionHeaderSub}>{intro}</p>
      </div>
    </header>
  );
}

export function MobilePlanSetup({ planner, id }: { planner: UseFoodPlannerReturn; id: string }) {
  const { setup, setSetup } = planner;
  const fields = [
    { key: 'location' as const, label: t.location, options: LOCATIONS },
    { key: 'occasion' as const, label: t.occasion, options: OCCASIONS },
    { key: 'planningType' as const, label: t.planningType, options: PLANNING_TYPES },
  ];
  return (
    <section class={s.mobileSetupCard}>
      <h4 class={s.mobileSetupTitle}>
        <Icon name="calendar" />
        {t.setup}
      </h4>
      <div class={s.mobileSetupGrid}>
        {fields.map((field) => (
          <div class={s.mobileSetupField} key={field.key}>
            <label class={s.mobileFieldLabel} for={`${id}-${field.key}`}>
              {field.label}
            </label>
            <select
              id={`${id}-${field.key}`}
              class={s.mobileSelect}
              value={setup[field.key]}
              onChange={(e) => setSetup({ ...setup, [field.key]: e.currentTarget.value })}
            >
              {field.options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div class={s.mobileSetupField}>
          <label class={s.mobileFieldLabel} for={`${id}-guests`}>
            {t.guests}
          </label>
          <select
            id={`${id}-guests`}
            class={s.mobileSelect}
            value={setup.guests}
            onChange={(e) => setSetup({ ...setup, guests: Number(e.currentTarget.value) })}
          >
            {[10, 20, 50, 100, 250, 500].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="button" class={s.mobileUpdateBtn} onClick={() => setSetup({ ...setup })}>
        <Icon name="refresh-cw" />
        {t.update}
      </button>
    </section>
  );
}

export function MobileMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div class={s.mobileSummaryTile}>
      <Icon name={icon} />
      <div>
        <p class={s.mobileSummaryTileLabel}>{label}</p>
        <p class={s.mobileSummaryTileValue}>{value}</p>
      </div>
    </div>
  );
}

export function MobilePagination({
  page,
  pages,
  setPage,
}: {
  page: number;
  pages: number;
  setPage: (page: number) => void;
}) {
  return (
    <nav class={s.mobileDualActions} aria-label={t.page}>
      <button
        type="button"
        class={s.mobileSecondaryBtn}
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
      >
        {t.previous}
      </button>
      <button
        type="button"
        class={s.mobileSecondaryBtn}
        disabled={page >= pages}
        onClick={() => setPage(page + 1)}
      >
        {t.next}
      </button>
      <span>
        {t.page} {page} / {pages}
      </span>
    </nav>
  );
}
