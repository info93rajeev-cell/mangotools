import { useMemo, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import {
  CapacityNotice,
  formatTimeSpan,
  PlanTotalsFooter,
  ScheduleSummaryCard,
} from './CookingScheduleSummary.tsx';
import { SchedulePhaseList, type ScheduleTaskItem } from './CookingScheduleTimeline.tsx';
import styles from './foodPlanner.module.css';
import { DEFAULT_SCHEDULE_TASKS } from './foodReferenceData.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface CookingScheduleSectionProps {
  planner: UseFoodPlannerReturn;
}

export function CookingScheduleSection({ planner }: CookingScheduleSectionProps) {
  const {
    setup,
    selectedRecipes,
    engineSchedule,
    isLoadingSchedule,
    scheduleError,
    mealTime,
    setMealTime,
    burners,
    setBurners,
    completedTasks,
    toggleTaskCompleted,
    setActiveSection,
  } = planner;

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

  const tasks = useMemo(
    () => buildScheduleTasks(engineSchedule, selectedRecipes, completedTasks),
    [engineSchedule, selectedRecipes, completedTasks],
  );

  const groupedTasks = useMemo(() => groupTasksByPhase(tasks), [tasks]);
  const totalPrepTimeMinutes = tasks.reduce((sum, t) => sum + t.durationMinutes, 0);
  const timeSpanStr = formatTimeSpan(totalPrepTimeMinutes);

  if (selectedRecipes.length === 0) {
    return <ScheduleEmptyState onBrowse={() => setActiveSection('recipes')} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ScheduleAlerts error={scheduleError} isLoading={isLoadingSchedule} />
      <div class={styles.layoutGrid}>
        <div class={styles.card}>
          <ScheduleHeader
            tasksCount={tasks.length}
            mealTime={mealTime}
            burners={burners}
            onSetMealTime={setMealTime}
            onSetBurners={setBurners}
          />
          <CapacityNotice />
          <SchedulePhaseList
            groupedTasks={groupedTasks}
            expandedPhases={expandedPhases}
            onTogglePhase={togglePhase}
            onToggleTask={toggleTaskCompleted}
          />
        </div>

        <ScheduleSummaryCard
          tasksCount={tasks.length}
          timeSpanStr={timeSpanStr}
          burners={burners}
          mealTime={mealTime}
          selectedRecipes={selectedRecipes}
          tasks={tasks}
        />
      </div>

      <PlanTotalsFooter
        tasksCount={tasks.length}
        timeSpanStr={timeSpanStr}
        guests={setup.guests}
        mealTime={mealTime}
      />
    </div>
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
          <strong>⚠️ Schedule Note:</strong> {error}. Displaying default preparation phases.
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
        <button
          type="button"
          class={styles.actionBtn}
          style={{ padding: '4px 10px', fontSize: '12px' }}
        >
          <Icon name="filter" /> Filter
        </button>
        <select
          class={styles.pageSizeSelect}
          style={{ height: '32px', fontSize: '12px', padding: '0 6px' }}
          aria-label="Sort schedule tasks"
        >
          <option value="start-time">Sort: Start Time ∨</option>
          <option value="duration">Sort: Duration</option>
          <option value="priority">Sort: Priority</option>
        </select>
        <button
          type="button"
          class={styles.actionBtn}
          style={{ padding: '4px 10px', fontSize: '12px' }}
        >
          <Icon name="sliders-horizontal" /> Manage Tasks
        </button>
        <button
          type="button"
          class={styles.actionBtn}
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            background: '#1e3a8a',
            color: '#fff',
            borderColor: '#1e3a8a',
          }}
        >
          <Icon name="plus" /> Add Task
        </button>
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

function buildScheduleTasks(
  engineSchedule: unknown,
  selectedRecipes: Array<{ id: string; name: string }>,
  completedTasks: Record<string, boolean>,
): ScheduleTaskItem[] {
  const raw = engineSchedule as {
    tasks?: Array<{
      recipeId: string;
      stepIndex: number;
      stepText: string;
      phase: string;
      startMinute: number;
      durationMinutes: number;
    }>;
  } | null;

  if (raw?.tasks && raw.tasks.length > 0) {
    return raw.tasks.map((t, i) => {
      const recipe = selectedRecipes.find((r) => r.id === t.recipeId);
      const taskId = `task-${t.recipeId}-${t.stepIndex}-${i}`;
      return {
        id: taskId,
        name: t.stepText,
        phase: t.phase || 'cooking',
        startTime: formatMinuteToTime(t.startMinute),
        durationMinutes: t.durationMinutes,
        recipeName: recipe?.name ?? t.recipeId,
        priority: t.durationMinutes >= 30 ? 'High' : 'Medium',
        isCompleted: !!completedTasks[taskId],
      };
    });
  }

  return DEFAULT_SCHEDULE_TASKS.map((t) => ({ ...t, isCompleted: !!completedTasks[t.id] }));
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

function formatMinuteToTime(minute: number): string {
  const normalized = ((minute % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}
