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
  phaseKey: _phaseKey,
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
    <div style={{ marginBottom: '12px' }}>
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
          {tasks.length} tasks • {totalMinutes} min
        </span>
      </button>

      {isExpanded && tasks.length > 0 && (
        <div class={styles.tableWrapper} style={{ borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          <table class={styles.table} aria-label={`Schedule Table for ${title}`}>
            <thead>
              <tr>
                <th style={{ width: '28px' }}>#</th>
                <th style={{ width: '28px' }}></th>
                <th>Task / Preparation</th>
                <th>Start Time</th>
                <th>Duration</th>
                <th>Recipe (Dish)</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, idx) => (
                <ScheduleTableRow key={task.id} task={task} idx={idx} onToggleTask={onToggleTask} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScheduleStatusBadge({ status }: { status: 'completed' | 'progress' | 'pending' }) {
  if (status === 'completed') {
    return <span class={styles.statusPillCompleted}>✓ Completed</span>;
  }
  if (status === 'progress') {
    return <span class={styles.statusPillProgress}>🔄 In Progress</span>;
  }
  return <span class={styles.statusPillPending}>⭕ Pending</span>;
}

function ScheduleTableRow({
  task,
  idx,
  onToggleTask,
}: {
  task: ScheduleTaskItem;
  idx: number;
  onToggleTask: (id: string) => void;
}) {
  const status = task.isCompleted ? 'completed' : idx === 0 ? 'progress' : 'pending';
  const isHigh = task.priority === 'High';

  return (
    <tr style={{ background: task.isCompleted ? '#f8fafc' : 'transparent' }}>
      <td style={{ color: '#64748b', fontSize: '12px' }}>{idx + 1}</td>
      <td>
        <input
          type="checkbox"
          aria-label={`Mark task completed: ${task.name}`}
          checked={task.isCompleted}
          onChange={() => onToggleTask(task.id)}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
      </td>
      <td>
        <strong
          style={{
            fontSize: '13px',
            display: 'block',
            textDecoration: task.isCompleted ? 'line-through' : 'none',
            color: task.isCompleted ? '#94a3b8' : '#0f172a',
          }}
        >
          {task.name}
        </strong>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <span class={styles.taskTime}>
          <Icon name="clock" /> {task.startTime}
        </span>
      </td>
      <td style={{ color: '#475569', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
        {task.durationMinutes} min
      </td>
      <td>
        <span
          class={styles.badge}
          style={{ background: '#f1f5f9', color: '#334155', fontSize: '11px' }}
        >
          {task.recipeName}
        </span>
      </td>
      <td>
        <span
          class={styles.badge}
          style={{
            background: isHigh ? '#fee2e2' : '#f1f5f9',
            color: isHigh ? '#b91c1c' : '#475569',
            fontWeight: 600,
          }}
        >
          {task.priority}
        </span>
      </td>
      <td>
        <ScheduleStatusBadge status={status} />
      </td>
    </tr>
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
        title="🧹 Early Prep (Setup, cleaning, basic preparation)"
        phaseKey="early-prep"
        tasks={groupedTasks['early-prep'] ?? []}
        isExpanded={expandedPhases['early-prep'] !== false}
        onToggle={() => onTogglePhase('early-prep')}
        onToggleTask={onToggleTask}
      />
      <PhaseGroupCard
        title="🥣 Dough & Soaking (Mixing, kneading, pre-cooking)"
        phaseKey="dough-soak"
        tasks={groupedTasks['dough-soak'] ?? []}
        isExpanded={expandedPhases['dough-soak'] !== false}
        onToggle={() => onTogglePhase('dough-soak')}
        onToggleTask={onToggleTask}
      />
      <PhaseGroupCard
        title="🍲 Cooking (Main dishes & gravies)"
        phaseKey="cooking"
        tasks={groupedTasks.cooking ?? []}
        isExpanded={expandedPhases.cooking !== false}
        onToggle={() => onTogglePhase('cooking')}
        onToggleTask={onToggleTask}
      />
      <PhaseGroupCard
        title="🍳 Frying (Snacks & savouries)"
        phaseKey="frying"
        tasks={groupedTasks.frying ?? []}
        isExpanded={expandedPhases.frying !== false}
        onToggle={() => onTogglePhase('frying')}
        onToggleTask={onToggleTask}
      />
      <PhaseGroupCard
        title="🍽️ Final Assembly / Serving (Finishing, plating & service)"
        phaseKey="assembly"
        tasks={groupedTasks.assembly ?? []}
        isExpanded={expandedPhases.assembly !== false}
        onToggle={() => onTogglePhase('assembly')}
        onToggleTask={onToggleTask}
      />
    </>
  );
}
