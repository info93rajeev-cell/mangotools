import { useState } from 'preact/hooks';
import type { ScheduleTaskItem } from './CookingScheduleTimeline.tsx';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

export function ScheduleControls({
  planner,
  sort,
  setSort,
  pending,
  setPending,
}: {
  planner: UseFoodPlannerReturn;
  sort: string;
  setSort: (v: string) => void;
  pending: boolean;
  setPending: (v: boolean) => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div class={styles.card}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <label>
          {t.sort}
          <select value={sort} onChange={(e) => setSort(e.currentTarget.value)}>
            <option value="start">{t.start}</option>
            <option value="duration">{t.sortDuration}</option>
            <option value="priority">{t.sortPriority}</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={pending}
            onChange={(e) => setPending(e.currentTarget.checked)}
          />
          {t.pendingOnly}
        </label>
        <button
          type="button"
          class={styles.actionBtn}
          onClick={() => setAdding(!adding)}
          aria-expanded={adding}
        >
          {t.addTask}
        </button>
        {planner.customTasks.length > 0 && (
          <button type="button" class={styles.actionBtn} onClick={() => planner.setCustomTasks([])}>
            {t.clearCustom}
          </button>
        )}
      </div>
      {adding && <TaskForm planner={planner} onClose={() => setAdding(false)} />}
    </div>
  );
}

function TaskForm({ planner, onClose }: { planner: UseFoodPlannerReturn; onClose: () => void }) {
  const [name, setName] = useState('');
  const [start, setStart] = useState(planner.mealTime);
  const [minutes, setMinutes] = useState(15);
  const [recipe, setRecipe] = useState(planner.selectedRecipes[0]?.name ?? '');
  const submit = () => {
    if (!name.trim() || !start || !Number.isInteger(minutes) || minutes < 1 || minutes > 1440)
      return;
    const task: ScheduleTaskItem = {
      id: `custom-${planner.customTasks.length + 1}`,
      name: name.trim(),
      phase: 'assembly',
      startTime: start,
      durationMinutes: minutes,
      recipeName: recipe,
      priority: 'Medium',
      isCompleted: false,
    };
    planner.setCustomTasks((prev) => [...prev, task]);
    planner.setCompletedTasks((prev) => ({ ...prev, [task.id]: false }));
    onClose();
  };
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <p>{t.customTasksNote}</p>
      <label>
        {t.taskName}
        <input
          required
          maxLength={160}
          value={name}
          onInput={(e) => setName(e.currentTarget.value)}
        />
      </label>
      <label>
        {t.start}
        <input
          required
          type="time"
          value={start}
          onInput={(e) => setStart(e.currentTarget.value)}
        />
      </label>
      <label>
        {t.duration}
        <input
          required
          type="number"
          min="1"
          max="1440"
          value={minutes}
          onInput={(e) => setMinutes(e.currentTarget.valueAsNumber)}
        />
      </label>
      <label>
        {t.recipes}
        <select value={recipe} onChange={(e) => setRecipe(e.currentTarget.value)}>
          {planner.selectedRecipes.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" class={styles.actionBtn}>
        {t.save}
      </button>
      <button type="button" class={styles.actionBtn} onClick={onClose}>
        {t.cancel}
      </button>
    </form>
  );
}

export function visibleTasks(tasks: ScheduleTaskItem[], sort: string, pending: boolean) {
  return tasks
    .filter((task) => !pending || !task.isCompleted)
    .sort((a, b) =>
      sort === 'duration'
        ? b.durationMinutes - a.durationMinutes
        : sort === 'priority'
          ? a.priority.localeCompare(b.priority)
          : a.startTime.localeCompare(b.startTime),
    );
}
