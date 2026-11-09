import { useMemo, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { CookingScheduleMobileView } from './CookingScheduleMobileView.tsx';
import {
  CapacityNotice,
  formatTimeSpan,
  PlanTotalsFooter,
  ScheduleSummaryCard,
} from './CookingScheduleSummary.tsx';
import { SchedulePhaseList, type ScheduleTaskItem } from './CookingScheduleTimeline.tsx';
import styles from './foodPlanner.module.css';
import { scheduleTasks } from './plannerResults.ts';
import { ScheduleControls, visibleTasks } from './ScheduleControls.tsx';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface CookingScheduleSectionProps {
  planner: UseFoodPlannerReturn;
}

export function CookingScheduleSection({ planner }: CookingScheduleSectionProps) {
  const { setup, selectedRecipes, engineSchedule, completedTasks, setActiveSection } = planner;

  const [sort, setSort] = useState('start');
  const [pending, setPending] = useState(false);
  const controls = (
    <ScheduleControls
      planner={planner}
      sort={sort}
      setSort={setSort}
      pending={pending}
      setPending={setPending}
    />
  );
  const { expandedPhases, togglePhase } = usePhaseExpansion();

  const tasks = useMemo(
    () => [
      ...scheduleTasks(engineSchedule, completedTasks),
      ...planner.customTasks.map((task) => ({ ...task, isCompleted: !!completedTasks[task.id] })),
    ],
    [engineSchedule, completedTasks, planner.customTasks],
  );

  const groupedTasks = useMemo(
    () => groupTasksByPhase(visibleTasks(tasks, sort, pending)),
    [tasks, sort, pending],
  );
  const totalPrepTimeMinutes = tasks.reduce((sum, t) => sum + t.durationMinutes, 0);
  const timeSpanStr = formatTimeSpan(totalPrepTimeMinutes);

  if (selectedRecipes.length === 0) {
    return <ScheduleEmptyState onBrowse={() => setActiveSection('recipes')} />;
  }

  return (
    <>
      <div class={styles.desktopOnly}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ScheduleAlerts error={planner.scheduleError} isLoading={planner.isLoadingSchedule} />
          <div class={styles.layoutGrid}>
            <div class={styles.card}>
              <ScheduleHeader
                tasksCount={tasks.length}
                mealTime={planner.mealTime}
                burners={planner.burners}
                onSetMealTime={planner.setMealTime}
                onSetBurners={planner.setBurners}
              />
              {controls}
              <CapacityNotice />
              <SchedulePhaseList
                groupedTasks={groupedTasks}
                expandedPhases={expandedPhases}
                onTogglePhase={togglePhase}
                onToggleTask={planner.toggleTaskCompleted}
              />
            </div>

            <ScheduleSummaryCard
              tasksCount={tasks.length}
              timeSpanStr={timeSpanStr}
              burners={planner.burners}
              mealTime={planner.mealTime}
              selectedRecipes={selectedRecipes}
              tasks={tasks}
            />
          </div>

          <PlanTotalsFooter
            tasksCount={tasks.length}
            timeSpanStr={timeSpanStr}
            guests={setup.guests}
            mealTime={planner.mealTime}
            tasks={tasks}
          />
        </div>
      </div>

      <div class={styles.mobileOnly}>
        <CookingScheduleMobileView
          planner={planner}
          tasks={tasks}
          visible={visibleTasks(tasks, sort, pending)}
          controls={controls}
        />
      </div>
    </>
  );
}

function ScheduleEmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div
      class={styles.card}
      style={{ textAlign: 'center', padding: '48px 16px', color: '#475569' }}
    >
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
        No recipes selected for cooking schedule
      </p>
      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
        Pick dishes in Recipes &amp; Menu to generate your preparation timeline and burner schedule.
      </p>
      <button
        type="button"
        class={styles.actionBtn}
        style={{ marginTop: '16px' }}
        onClick={onBrowse}
      >
        <Icon name="utensils" /> Browse Recipes &amp; Menu
      </button>
    </div>
  );
}

function ScheduleAlerts({ error, isLoading }: { error: string | null; isLoading: boolean }) {
  return (
    <>
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '13px',
          }}
        >
          <strong>⚠️ Schedule Note:</strong> {error}. No substitute schedule is displayed.
        </div>
      )}
      {isLoading && (
        <div style={{ fontSize: '12px', color: '#64748b', padding: '4px 0' }}>
          Updating cooking schedule timeline...
        </div>
      )}
    </>
  );
}

function ScheduleHeader({
  tasksCount,
  mealTime,
  burners,
  onSetMealTime,
  onSetBurners,
}: {
  tasksCount: number;
  mealTime: string;
  burners: number;
  onSetMealTime: (t: string) => void;
  onSetBurners: (b: number) => void;
}) {
  return (
    <div class={styles.cardHeader}>
      <div class={styles.cardTitleGroup}>
        <h2 class={styles.cardTitle}>
          <Icon name="calendar" /> D5 · Cooking Schedule ({tasksCount} tasks)
        </h2>
        <p class={styles.cardSubtitle}>
          Backward-scheduled preparation timeline for serving at {mealTime}.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
          <label
            for="schedule-meal-time"
            style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}
          >
            Meal:
          </label>
          <input
            id="schedule-meal-time"
            type="time"
            class={styles.textInput}
            style={{ height: '32px', width: '90px', fontSize: '12px', padding: '0 4px' }}
            value={mealTime}
            onChange={(e) => onSetMealTime((e.target as HTMLInputElement).value)}
          />
          <label
            for="schedule-burners"
            style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginLeft: '4px' }}
          >
            Burners:
          </label>
          <select
            id="schedule-burners"
            class={styles.selectInput}
            style={{ height: '32px', width: '56px', fontSize: '12px', padding: '0 4px' }}
            value={burners}
            onChange={(e) => onSetBurners(Number((e.target as HTMLSelectElement).value) || 2)}
          >
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="6">6</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function groupTasksByPhase(tasks: ScheduleTaskItem[]): Record<string, ScheduleTaskItem[]> {
  const map: Record<string, ScheduleTaskItem[]> = {
    'early-prep': [],
    'dough-soak': [],
    cooking: [],
    frying: [],
    assembly: [],
  };
  for (const t of tasks) {
    if (!map[t.phase]) map[t.phase] = [];
    map[t.phase].push(t);
  }
  return map;
}

function usePhaseExpansion() {
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    'early-prep': true,
    'dough-soak': true,
    cooking: true,
    frying: true,
    assembly: true,
  });

  const togglePhase = (key: string) => {
    setExpandedPhases((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  return { expandedPhases, togglePhase };
}
