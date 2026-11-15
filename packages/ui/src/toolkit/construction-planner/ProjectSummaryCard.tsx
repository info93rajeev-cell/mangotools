import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
import {
  BeamIsoGraphic,
  BuildingIsoGraphic,
  ColumnIsoGraphic,
  FootingIsoGraphic,
  SlabIsoGraphic,
} from './isometricGraphics.tsx';
import type { ProjectSummaryMetrics } from './types.ts';

interface ProjectSummaryCardProps {
  metrics: ProjectSummaryMetrics;
  sitePortion: string;
  onChangePortion: (portion: string) => void;
}

function SummaryMetricsList({ metrics }: { metrics: ProjectSummaryMetrics }) {
  const isDraft = metrics.status === 'Draft';
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
        <span class={isDraft ? styles.statusBadgeDraft : styles.statusBadgeGreen}>
          {metrics.status}
        </span>
      </div>
    </div>
  );
}

function MemberCardsGrid2x2({ metrics }: { metrics: ProjectSummaryMetrics }) {
  return (
    <div class={styles.memberCardsGrid2x2}>
      {/* Footings */}
      <div class={styles.memberCardTile}>
        <div class={styles.memberCardInfo}>
          <span class={styles.memberCardTypeRow}>
            <span class={styles.memberTileDot} />
            <span class={styles.memberCardType}>{t.footingsTitle}</span>
          </span>
          <span class={styles.memberCardQty}>
            {metrics.footingsCount} <small>{t.nosUnit}</small>
          </span>
        </div>
        <div class={styles.memberTileGraphicWrap}>
          <FootingIsoGraphic />
        </div>
      </div>

      {/* Columns */}
      <div class={styles.memberCardTile}>
        <div class={styles.memberCardInfo}>
          <span class={styles.memberCardTypeRow}>
            <span class={styles.memberTileDot} />
            <span class={styles.memberCardType}>{t.columnsTitle}</span>
          </span>
          <span class={styles.memberCardQty}>
            {metrics.columnsCount} <small>{t.nosUnit}</small>
          </span>
        </div>
        <div class={styles.memberTileGraphicWrap}>
          <ColumnIsoGraphic />
        </div>
      </div>

      {/* Beams */}
      <div class={styles.memberCardTile}>
        <div class={styles.memberCardInfo}>
          <span class={styles.memberCardTypeRow}>
            <span class={styles.memberTileDot} />
            <span class={styles.memberCardType}>{t.beamsTitle}</span>
          </span>
          <span class={styles.memberCardQty}>
            {metrics.beamsCount} <small>{t.nosUnit}</small>
          </span>
        </div>
        <div class={styles.memberTileGraphicWrap}>
          <BeamIsoGraphic />
        </div>
      </div>

      {/* Slabs */}
      <div class={styles.memberCardTile}>
        <div class={styles.memberCardInfo}>
          <span class={styles.memberCardTypeRow}>
            <span class={styles.memberTileDot} />
            <span class={styles.memberCardType}>{t.slabsTitle}</span>
          </span>
          <span class={styles.memberCardQty}>
            {metrics.slabsCount} <small>{t.zonesUnit}</small>
          </span>
        </div>
        <div class={styles.memberTileGraphicWrap}>
          <SlabIsoGraphic />
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
        <div class={styles.summaryPortionWrap}>
          <div class={styles.selectWrap}>
            <select
              class={styles.formSelectCompact}
              value={sitePortion}
              onChange={(e) => onChangePortion((e.target as HTMLSelectElement).value)}
              aria-label="Filter summary by portion"
            >
              <option value="">-- Select portion --</option>
              <option value="Site A / Block 1">Site A / Block 1</option>
              <option value="Site B / Block 2">Site B / Block 2</option>
              <option value="Main Tower">Main Tower</option>
              <option value="Entire Site">Entire Site</option>
              <option value="Entire Project">Entire Project</option>
            </select>
            <span class={styles.selectArrow}>
              <Icon name="chevron-down" />
            </span>
          </div>
        </div>
      </div>

      <div class={styles.summaryTopRow}>
        <div class={styles.buildingRenderWrap}>
          <BuildingIsoGraphic />
        </div>
        <SummaryMetricsList metrics={metrics} />
      </div>

      <MemberCardsGrid2x2 metrics={metrics} />
    </section>
  );
}
