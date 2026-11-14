import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
import type { PlannerTab } from './types.ts';

interface TabNavigationProps {
  activeTab: PlannerTab;
  onSelectTab: (tab: PlannerTab) => void;
}

interface TabDef {
  id: PlannerTab;
  label: string;
  icon: 'settings' | 'file-text' | 'table-2' | 'layers' | 'chart-column';
  isReady: boolean;
  stageBadge?: string;
}

const TABS: TabDef[] = [
  { id: 'setup', label: t.tabSetup, icon: 'settings', isReady: true },
  {
    id: 'drawings',
    label: t.tabDrawings,
    icon: 'file-text',
    isReady: false,
    stageBadge: 'Stage 3',
  },
  {
    id: 'concrete-rebar',
    label: t.tabConcreteRebar,
    icon: 'table-2',
    isReady: false,
    stageBadge: 'Stage 4',
  },
  { id: 'bbs', label: t.tabBbs, icon: 'layers', isReady: false, stageBadge: 'Stage 5' },
  {
    id: 'revisions',
    label: t.tabRevisions,
    icon: 'chart-column',
    isReady: false,
    stageBadge: 'Stage 6',
  },
];

export function TabNavigation({ activeTab, onSelectTab }: TabNavigationProps) {
  return (
    <nav class={styles.tabNav} aria-label="Planner workflow tabs">
      <div class={styles.tabList} role="tablist">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              class={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
              onClick={() => onSelectTab(tab.id)}
            >
              <Icon name={tab.icon} />
              <span class={styles.tabLabel}>{tab.label}</span>
              {!tab.isReady && (
                <span
                  class={styles.notBuiltBadge}
                  title={`${t.notBuiltYetBadge} (${tab.stageBadge})`}
                >
                  {tab.stageBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
