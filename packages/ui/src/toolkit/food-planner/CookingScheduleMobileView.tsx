import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import {
  MobileRecipeReadinessCard,
  MobileScheduleSummaryGrid,
} from './CookingScheduleMobileComponents.tsx';
import { type MobileStageGroup, STATIC_MOBILE_STAGE_GROUPS } from './CookingScheduleMobileData.ts';
import mobileStyles from './foodPlannerMobile.module.css';
import { LOCATIONS, OCCASIONS, PLANNING_TYPES } from './foodReferenceData.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface CookingScheduleMobileViewProps {
  planner: UseFoodPlannerReturn;
}

export function CookingScheduleMobileView({ planner }: CookingScheduleMobileViewProps) {
  const { setup, setSetup } = planner;
  const [expandedGroup, setExpandedGroup] = useState<string>('Early Prep');

  return (
    <div class={mobileStyles.mobileContainer}>
      <MobileScheduleHeader />
      <MobileScheduleSetupCard setup={setup} setSetup={setSetup} />

      <MobileScheduleTasksCard
        groups={STATIC_MOBILE_STAGE_GROUPS}
        expandedGroup={expandedGroup}
        onToggleGroup={(name) => setExpandedGroup(expandedGroup === name ? '' : name)}
        onCollapseAll={() => setExpandedGroup(expandedGroup ? '' : 'Early Prep')}
      />

      <MobileScheduleSummaryGrid />
      <MobileRecipeReadinessCard />
    </div>
  );
}

function MobileScheduleHeader() {
  return (
    <div class={mobileStyles.mobileSectionHeader}>
      <div class={mobileStyles.mobileSectionHeaderIcon}>
        <Icon name="calendar" />
      </div>
      <div>
        <h3 class={mobileStyles.mobileSectionHeaderTitle}>Cooking Schedule</h3>
        <p class={mobileStyles.mobileSectionHeaderSub}>
          Time-based cooking plan with prep, cooking, frying and serving schedule.
        </p>
      </div>
    </div>
  );
}

function MobileScheduleSetupCard({
  setup,
  setSetup,
}: {
  setup: UseFoodPlannerReturn['setup'];
  setSetup: UseFoodPlannerReturn['setSetup'];
}) {
  return (
    <div class={mobileStyles.mobileSetupCard}>
      <div class={mobileStyles.mobileSetupTitle}>
        <Icon name="calendar" />
        <span>Plan Setup</span>
      </div>
      <div class={mobileStyles.mobileSetupGrid}>
        <div class={mobileStyles.mobileSetupField}>
          <label class={mobileStyles.mobileFieldLabel} for="mob-sched-loc">
            <Icon name="map-pin" /> Location
          </label>
          <select
            id="mob-sched-loc"
            class={mobileStyles.mobileSelect}
            value={setup.location}
            onChange={(e) =>
              setSetup({ ...setup, location: (e.target as HTMLSelectElement).value })
            }
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <div class={mobileStyles.mobileSetupField}>
          <label class={mobileStyles.mobileFieldLabel} for="mob-sched-occ">
            <Icon name="flame" /> Occasion
          </label>
          <select
            id="mob-sched-occ"
            class={mobileStyles.mobileSelect}
            value={setup.occasion}
            onChange={(e) =>
              setSetup({ ...setup, occasion: (e.target as HTMLSelectElement).value })
            }
          >
            {OCCASIONS.map((occ) => (
              <option key={occ} value={occ}>
                {occ}
              </option>
            ))}
          </select>
        </div>
        <div class={mobileStyles.mobileSetupField}>
          <label class={mobileStyles.mobileFieldLabel} for="mob-sched-pt">
            <Icon name="layers" /> Planning Type
          </label>
          <select
            id="mob-sched-pt"
            class={mobileStyles.mobileSelect}
            value={setup.planningType}
            onChange={(e) =>
              setSetup({ ...setup, planningType: (e.target as HTMLSelectElement).value })
            }
          >
            {PLANNING_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>
        <div class={mobileStyles.mobileSetupField}>
          <label class={mobileStyles.mobileFieldLabel} for="mob-sched-guests">
            <Icon name="users" /> People / Servings
          </label>
          <select
            id="mob-sched-guests"
            class={mobileStyles.mobileSelect}
            value={setup.guests}
            onChange={(e) =>
              setSetup({ ...setup, guests: Number((e.target as HTMLSelectElement).value) || 20 })
            }
          >
            <option value="10">20</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
      <button type="button" class={mobileStyles.mobileUpdateBtn}>
        <Icon name="rotate-ccw" /> Update Plan
      </button>
    </div>
  );
}

function MobileScheduleTasksCard({
  groups,
  expandedGroup,
  onToggleGroup,
  onCollapseAll,
}: {
  groups: MobileStageGroup[];
  expandedGroup: string;
  onToggleGroup: (name: string) => void;
  onCollapseAll: () => void;
}) {
  return (
    <div class={mobileStyles.mobileCard}>
      <div class={mobileStyles.mobileCardHeader}>
        <div>
          <h4 class={mobileStyles.mobileCardTitle}>Cooking Schedule (8 tasks)</h4>
          <p class={mobileStyles.mobileCardSubtitle}>
            Step-by-step time plan to prepare all selected recipes.
          </p>
        </div>
        <button type="button" class={mobileStyles.mobileEditBtn} onClick={onCollapseAll}>
          {expandedGroup ? '▲ Collapse All' : '▼ Expand All'}
        </button>
      </div>

      <div>
        {groups.map((grp) => (
          <MobileStageAccordion
            key={grp.name}
            grp={grp}
            isExpanded={expandedGroup === grp.name}
            onToggle={() => onToggleGroup(grp.name)}
          />
        ))}
      </div>
    </div>
  );
}

function MobileStageAccordion({
  grp,
  isExpanded,
  onToggle,
}: {
  grp: MobileStageGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div class={mobileStyles.mobileAccordionGroup}>
      <button
        type="button"
        class={mobileStyles.mobileAccordionHeader}
        style={{ width: '100%', border: 'none', textAlign: 'left' }}
        onClick={onToggle}
      >
        <div class={mobileStyles.mobileAccordionHeaderLeft}>
          <Icon name={grp.icon} />
          <span>{grp.name}</span>
        </div>
        <div class={mobileStyles.mobileAccordionHeaderRight}>
          <span>
            {grp.count} tasks · {grp.time}
          </span>
          <span>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {isExpanded && (
        <div class={mobileStyles.mobileAccordionBody}>
          {grp.tasks.map((task) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
                fontSize: '12px',
              }}
            >
              <input type="checkbox" checked={task.isDone} readOnly />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{task.name}</strong>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '2px',
                    color: '#64748b',
                  }}
                >
                  <span>🕒 {task.time}</span>
                  <span>⏳ {task.duration}</span>
                  <span>🍲 {task.recipe}</span>
                </div>
              </div>
              <span
                style={{
                  background: task.priority === 'High' ? '#fee2e2' : '#fef3c7',
                  color: task.priority === 'High' ? '#b91c1c' : '#92400e',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '6px',
                }}
              >
                {task.priority}
              </span>
              <span
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '6px',
                }}
              >
                {task.isDone ? '✓ Done' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
