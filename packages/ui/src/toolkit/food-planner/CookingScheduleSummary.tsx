import { Icon } from '../../primitives/Icon.tsx';
import type { ScheduleTaskItem } from './CookingScheduleTimeline.tsx';
import styles from './foodPlanner.module.css';

export function formatTimeSpan(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} h ${m} min`;
}

export function CapacityNotice() {
  return (
    <div
      class={styles.capacityWarning}
      style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#475569' }}
    >
      <Icon name="info" />
      <span>
        Timings are deterministic model estimates backward scheduled from serving time minus 10m
        rest. Burner allocations prevent bottleneck overlaps.
      </span>
    </div>
  );
}

export function ScheduleSummaryCard({
  tasksCount,
  timeSpanStr,
  burners,
  mealTime,
  selectedRecipes,
  tasks,
}: {
  tasksCount: number;
  timeSpanStr: string;
  burners: number;
  mealTime: string;
  selectedRecipes: Array<{ id: string; name: string }>;
  tasks: ScheduleTaskItem[];
}) {
  const recipeProgress = selectedRecipes.map((r) => {
    const dishTasks = tasks.filter((t) =>
      t.recipeName.toLowerCase().includes(r.name.toLowerCase()),
    );
    const completed = dishTasks.filter((t) => t.isCompleted).length;
    const pct = dishTasks.length > 0 ? Math.round((completed / dishTasks.length) * 100) : 0;
    return { id: r.id, name: r.name, percent: pct };
  });

  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <Icon name="clock" /> Schedule Summary
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '6px 0',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <span style={{ color: '#475569' }}>Total Tasks:</span>
          <strong>{tasksCount}</strong>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '6px 0',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <span style={{ color: '#475569' }}>Active Prep Time:</span>
          <strong>{timeSpanStr}</strong>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '6px 0',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <span style={{ color: '#475569' }}>Parallel Tasks Max:</span>
          <strong>
            {burners > 2 ? '2' : '1'} (Burners: {burners})
          </strong>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '6px 0',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <span style={{ color: '#475569' }}>Serving Time:</span>
          <strong>{mealTime}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
          <span style={{ color: '#475569' }}>Buffer Time:</span>
          <strong>30 min</strong>
        </div>
      </div>

      <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: '#0f172a' }}>
          Recipe Readiness
        </h3>
        <div class={styles.categoryBreakdown}>
          {recipeProgress.map((r) => (
            <div key={r.id} style={{ marginBottom: '8px' }}>
              <div class={styles.breakdownRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={`/food/recipes/${r.id}.jpg`}
                    alt=""
                    class={styles.tableThumb}
                    style={{ width: '24px', height: '24px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/food/recipes/besan-ladoo.jpg';
                    }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '12.5px' }}>{r.name}</span>
                </div>
                <strong
                  style={{ fontSize: '12px', color: r.percent === 100 ? '#16a34a' : '#2563eb' }}
                >
                  {r.percent}%
                </strong>
              </div>
              <div class={styles.progressBarBg}>
                <div
                  class={styles.progressBarFill}
                  style={{
                    width: `${r.percent}%`,
                    background: r.percent === 100 ? '#16a34a' : '#2563eb',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlanTotalsFooter({
  tasksCount,
  timeSpanStr,
  guests: _guests,
  mealTime,
}: {
  tasksCount: number;
  timeSpanStr: string;
  guests: number;
  mealTime: string;
}) {
  return (
    <div
      style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '10px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#78350f',
      }}
    >
      <span>
        📅 <strong>Plan Totals</strong>
      </span>
      <span>|</span>
      <span>
        Total Tasks: <strong>{tasksCount}</strong>
      </span>
      <span>|</span>
      <span>
        Total Prep Time: <strong>{timeSpanStr}</strong>
      </span>
      <span>|</span>
      <span>
        Cooking Window: <strong>6:30 AM — 4:30 PM</strong>
      </span>
      <span>|</span>
      <span>
        Serving Deadline: <strong>{mealTime}</strong>
      </span>
    </div>
  );
}
