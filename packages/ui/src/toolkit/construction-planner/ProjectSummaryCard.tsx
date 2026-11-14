import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
import type { ProjectSummaryMetrics } from './types.ts';

interface ProjectSummaryCardProps {
  metrics: ProjectSummaryMetrics;
  sitePortion: string;
  onChangePortion: (portion: string) => void;
}

function BuildingIsoSvg() {
  return (
    <svg
      class={styles.buildingIsoSvg}
      viewBox="0 0 160 120"
      aria-label="3D building frame structure"
    >
      <polygon
        points="80,15 140,45 80,75 20,45"
        fill="#f1f5f9"
        stroke="#94a3b8"
        stroke-width="1.2"
      />
      <polygon
        points="80,45 140,75 80,105 20,75"
        fill="#f8fafc"
        stroke="#cbd5e1"
        stroke-width="1.2"
      />
      <line x1="20" y1="45" x2="20" y2="105" stroke="#475569" stroke-width="3" />
      <line x1="80" y1="75" x2="80" y2="115" stroke="#334155" stroke-width="3.5" />
      <line x1="140" y1="45" x2="140" y2="105" stroke="#475569" stroke-width="3" />
      <line x1="50" y1="60" x2="50" y2="110" stroke="#64748b" stroke-width="2.5" />
      <line x1="110" y1="60" x2="110" y2="110" stroke="#64748b" stroke-width="2.5" />
      <polygon
        points="80,85 145,110 80,118 15,110"
        fill="#e2e8f0"
        stroke="#94a3b8"
        stroke-width="1.2"
      />
    </svg>
  );
}

function SummaryMetricsList({ metrics }: { metrics: ProjectSummaryMetrics }) {
  return (
    <div class={styles.metricsList}>
      <div class={styles.metricRow}>
        <span class={styles.metricIcon}>
          <Icon name="table-2" />
        </span>
        <span class={styles.metricLabel}>{t.totalMembersLabel}</span>
        <span class={styles.metricValue}>{metrics.totalMembers}</span>
      </div>
      <div class={styles.metricRow}>
        <span class={styles.metricIcon}>
          <Icon name="file-text" />
        </span>
        <span class={styles.metricLabel}>{t.pendingDrawingsLabel}</span>
        <span class={styles.metricValue}>{metrics.pendingDrawings}</span>
      </div>
      <div class={styles.metricRow}>
        <span class={styles.metricIcon}>
          <Icon name="clock" />
        </span>
        <span class={styles.metricLabel}>{t.lastRevisionLabel}</span>
        <span class={styles.metricDate}>{metrics.lastRevision}</span>
      </div>
      <div class={styles.metricRow}>
        <span class={styles.metricIcon}>
          <Icon name="circle-check" />
        </span>
        <span class={styles.metricLabel}>{t.projectStatusLabel}</span>
        <span class={styles.statusBadgeGreen}>{metrics.status}</span>
      </div>
    </div>
  );
}

function MemberCardsGrid({ metrics }: { metrics: ProjectSummaryMetrics }) {
  return (
    <div class={styles.memberCardsGrid}>
      <div class={styles.memberCard}>
        <div class={styles.memberCardInfo}>
          <span class={styles.memberCardType}>{t.footingsTitle}</span>
          <span class={styles.memberCardQty}>
            {metrics.footingsCount} <small>{t.nosUnit}</small>
          </span>
        </div>
      </div>
      <div class={styles.memberCard}>
        <div class={styles.memberCardInfo}>
          <span class={styles.memberCardType}>{t.columnsTitle}</span>
          <span class={styles.memberCardQty}>
            {metrics.columnsCount} <small>{t.nosUnit}</small>
          </span>
        </div>
      </div>
      <div class={styles.memberCard}>
        <div class={styles.memberCardInfo}>
          <span class={styles.memberCardType}>{t.beamsTitle}</span>
          <span class={styles.memberCardQty}>
            {metrics.beamsCount} <small>{t.nosUnit}</small>
          </span>
        </div>
      </div>
      <div class={styles.memberCard}>
        <div class={styles.memberCardInfo}>
          <span class={styles.memberCardType}>{t.slabsTitle}</span>
          <span class={styles.memberCardQty}>
            {metrics.slabsCount} <small>{t.zonesUnit}</small>
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProjectSummaryCard({
  metrics,
  sitePortion,
  onChangePortion,
}: ProjectSummaryCardProps) {
  return (
    <section class={styles.summaryCard} aria-labelledby="summary-heading">
      <div class={styles.cardHeader}>
        <div class={styles.cardHeaderTitle}>
          <span class={styles.cardIconBlue}>
            <Icon name="layers" />
          </span>
          <h2 id="summary-heading" class={styles.cardTitle}>
            {t.projectSummaryTitle}
          </h2>
        </div>
        <div class={styles.portionSelectWrap}>
          <select
            class={styles.portionSelect}
            value={sitePortion}
            onChange={(e) => onChangePortion((e.target as HTMLSelectElement).value)}
            aria-label="Filter summary by portion"
          >
            <option value="Site A / Block 1">Site A / Block 1</option>
            <option value="Site B / Block 2">Site B / Block 2</option>
            <option value="Main Tower">Main Tower</option>
            <option value="Entire Project">Entire Project</option>
          </select>
          <span class={styles.selectArrow}>
            <Icon name="chevron-down" />
          </span>
        </div>
      </div>

      <div class={styles.summaryTopRow}>
        <div class={styles.buildingRenderWrap}>
          <BuildingIsoSvg />
        </div>
        <SummaryMetricsList metrics={metrics} />
      </div>

      <MemberCardsGrid metrics={metrics} />
    </section>
  );
}
