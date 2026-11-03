import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';

export interface ScheduleTaskItem {
  id: string;
  name: string;
  phase: string;
  startTime: string;
  durationMinutes: number;
  recipeName: string;
  priority: 'High' | 'Medium';
  isCompleted: boolean;
}

export function PhaseGroupCard({
  title,
  tasks,
  isExpanded,
  onToggle,
  onToggleTask,
}: {
  title: string;
  phaseKey: string;
  tasks: ScheduleTaskItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onToggleTask: (id: string) => void;
}) {
  const totalMinutes = tasks.reduce((sum, t) => sum + t.durationMinutes, 0);

  return (
    <div style={{ marginBottom: '10px' }}>
      <button
        type="button"
        class={styles.phaseHeader}
        style={{ width: '100%', textAlign: 'left', border: 'none' }}
        onClick={onToggle}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} />
          {title}
        </span>
        <span class={styles.phaseTag}>
          {tasks.length} tasks · {totalMinutes}m
        </span>
      </button>

      {isExpanded && tasks.length > 0 && (
        <div
          style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px' }}
        >
          {tasks.map((task) => (
            <div
              key={task.id}
              class={styles.taskRow}
              style={{ background: task.isCompleted ? '#f8fafc' : '#ffffff' }}
            >
              <div class={styles.taskInfo}>
                <input
                  type="checkbox"
                  aria-label={`Mark task completed: ${task.name}`}
                  checked={task.isCompleted}
                  onChange={() => onToggleTask(task.id)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'block',
                      textDecoration: task.isCompleted ? 'line-through' : 'none',
                    }}
                  >
                    {task.name}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#475569' }}>{task.recipeName}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span class={styles.taskTime}>
                  <Icon name="clock" /> {task.startTime} ({task.durationMinutes}m)
                </span>
                <span
                  class={styles.badge}
                  style={{
                    background: task.priority === 'High' ? '#fee2e2' : '#f1f5f9',
                    color: task.priority === 'High' ? '#b91c1c' : '#475569',
                  }}
                >
                  {task.priority}
                </span>
                {task.isCompleted && (
                  <span class={`${styles.badge} ${styles.badgeVerified}`}>✓ Done</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SchedulePhaseList({
  groupedTasks,
  expandedPhases,
  onTogglePhase,
  onToggleTask,
}: {
  groupedTasks: Record<string, ScheduleTaskItem[]>;
  expandedPhases: Record<string, boolean>;
  onTogglePhase: (k: string) => void;
  onToggleTask: (id: string) => void;
}) {
  return (
    <>
      <PhaseGroupCard
        title="Early Prep (Setup, cleaning, basic preparation)"
        phaseKey="early-prep"
        tasks={groupedTasks['early-prep'] ?? []}
        isExpanded={expandedPhases['early-prep'] !== false}
        onToggle={() => onTogglePhase('early-prep')}
        onToggleTask={onToggleTask}
      />
      <PhaseGroupCard
        title="Dough & Soaking (Mixing, kneading, pre-cooking)"
        phaseKey="dough-soak"
        tasks={groupedTasks['dough-soak'] ?? []}
        isExpanded={expandedPhases['dough-soak'] !== false}
        onToggle={() => onTogglePhase('dough-soak')}
        onToggleTask={onToggleTask}
      />
      <PhaseGroupCard
        title="Cooking (Main dishes & gravies)"
        phaseKey="cooking"
        tasks={groupedTasks.cooking ?? []}
        isExpanded={expandedPhases.cooking !== false}
        onToggle={() => onTogglePhase('cooking')}
        onToggleTask={onToggleTask}
      />
      <PhaseGroupCard
        title="Frying (Snacks & savouries)"
        phaseKey="frying"
        tasks={groupedTasks.frying ?? []}
        isExpanded={expandedPhases.frying !== false}
        onToggle={() => onTogglePhase('frying')}
        onToggleTask={onToggleTask}
      />
      <PhaseGroupCard
        title="Final Assembly / Serving (Finishing, plating & service)"
        phaseKey="assembly"
        tasks={groupedTasks.assembly ?? []}
        isExpanded={expandedPhases.assembly !== false}
        onToggle={() => onTogglePhase('assembly')}
        onToggleTask={onToggleTask}
      />
    </>
  );
}
