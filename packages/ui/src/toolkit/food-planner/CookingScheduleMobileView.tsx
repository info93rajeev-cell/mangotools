import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { formatTimeSpan } from './CookingScheduleSummary.tsx';
import type { ScheduleTaskItem } from './CookingScheduleTimeline.tsx';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { MobileMetric, MobilePlanSetup, MobileSectionHeader } from './MobilePlanSetup.tsx';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

export function CookingScheduleMobileView({
  planner,
  tasks,
  visible,
  controls,
}: {
  planner: UseFoodPlannerReturn;
  tasks: ScheduleTaskItem[];
  visible: ScheduleTaskItem[];
  controls: ComponentChildren;
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({ cooking: true });
  const phases = [
    ['early-prep', t.earlyPrep],
    ['cooking', t.cooking],
    ['assembly', t.assembly],
  ];
  const minutes = tasks.reduce((sum, task) => sum + task.durationMinutes, 0);
  const allClosed = phases.every(([key]) => closed[key ?? '']);
  return (
    <div class={s.mobileContainer} data-testid="mobile-schedule">
      <MobileSectionHeader title={t.schedule} intro={t.scheduleIntro} icon="calendar" />
      <MobilePlanSetup planner={planner} id="mobile-schedule" />
      {controls}
      {planner.isLoadingSchedule && <p role="status">{t.calculating}</p>}
      {planner.scheduleError && <p role="alert">{planner.scheduleError}</p>}
      <section class={s.mobileCard}>
        <div class={s.mobileCardHeader}>
          <h4 class={s.mobileCardTitle}>
            {t.schedule} ({tasks.length} {t.tasks})
          </h4>
          <button
            type="button"
            class={s.mobileEditBtn}
            onClick={() => setClosed(Object.fromEntries(phases.map(([key]) => [key, !allClosed])))}
          >
            {allClosed ? t.expand : t.collapse}
          </button>
        </div>
        {phases.map(([key = '', title]) => (
          <TaskGroup
            key={key}
            title={title ?? ''}
            tasks={visible.filter((task) => task.phase === key)}
            closed={!!closed[key]}
            toggle={() => setClosed({ ...closed, [key]: !closed[key] })}
            planner={planner}
          />
        ))}
        <p class={s.mobileCardSubtitle}>{t.scheduleNote}</p>
      </section>
      <section class={s.mobileCard}>
        <h4 class={s.mobileCardTitle}>{t.scheduleSummary}</h4>
        <div class={s.mobileSummary2x2}>
          <MobileMetric label={t.totalTasks} value={tasks.length} icon="clipboard" />
          <MobileMetric label={t.activePrep} value={formatTimeSpan(minutes)} icon="clock" />
          <MobileMetric label={t.servingTime} value={planner.mealTime} icon="utensils" />
          <MobileMetric label={t.buffer} value="10 min" icon="clock" />
        </div>
        <label>
          {t.servingTime}
          <input
            type="time"
            value={planner.mealTime}
            onChange={(e) => planner.setMealTime(e.currentTarget.value)}
          />
        </label>
      </section>
      <section class={s.mobileCard}>
        <h4 class={s.mobileCardTitle}>{t.readiness}</h4>
        {planner.selectedRecipes.map((recipe) => {
          const related = tasks.filter((task) => task.recipeName === recipe.name);
          const done = related.filter((task) => task.isCompleted).length;
          const percent = related.length ? Math.round((done / related.length) * 100) : 0;
          return (
            <div class={s.mobileDishItem} key={recipe.id}>
              <img class={s.mobileDishThumb} src={recipe.thumbnailUrl} alt="" />
              <div class={s.mobileDishInfo}>
                <p class={s.mobileDishName}>{recipe.name}</p>
                <progress max={100} value={percent} aria-label={`${recipe.name} ${t.readiness}`} />
              </div>
              <strong>{percent}%</strong>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  closed,
  toggle,
  planner,
}: {
  title: string;
  tasks: ScheduleTaskItem[];
  closed: boolean;
  toggle: () => void;
  planner: UseFoodPlannerReturn;
}) {
  if (!tasks.length) return null;
  return (
    <div class={s.mobileAccordionGroup}>
      <button
        type="button"
        class={s.mobileAccordionHeader}
        aria-expanded={!closed}
        onClick={toggle}
      >
        <span>{title}</span>
        <span>
          {tasks.length} {t.tasks} ·{' '}
          {formatTimeSpan(tasks.reduce((n, task) => n + task.durationMinutes, 0))}
        </span>
      </button>
      {!closed && (
        <div class={s.mobileAccordionBody}>
          {tasks.map((task) => (
            <label class={s.mobileDishItem} key={task.id}>
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={() => planner.toggleTaskCompleted(task.id)}
                aria-label={`${task.name} ${t.done}`}
              />
              <div class={s.mobileDishInfo}>
                <p class={s.mobileDishName}>{task.name}</p>
                <span>
                  {task.startTime} · {task.durationMinutes} min · {task.recipeName}
                </span>
              </div>
              <span>{task.isCompleted ? t.done : t.pending}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
