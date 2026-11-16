import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
import {
  BeamIsoGraphic,
  ColumnIsoGraphic,
  FootingIsoGraphic,
  SlabIsoGraphic,
} from './isometricGraphics.tsx';
import type { RecentWorkItem } from './types.ts';

interface RecentWorkCardProps {
  items: RecentWorkItem[];
  onOpenItem: (item: RecentWorkItem) => void;
}

function MemberTypeIcon({ type }: { type: RecentWorkItem['memberType'] }) {
  switch (type) {
    case 'footing':
      return <FootingIsoGraphic className={styles.tableRowSvg} />;
    case 'column':
      return <ColumnIsoGraphic className={styles.tableRowSvg} />;
    case 'beam':
      return <BeamIsoGraphic className={styles.tableRowSvg} />;
    case 'slab':
      return <SlabIsoGraphic className={styles.tableRowSvg} />;
  }
}

function RecentTableRow({
  row,
  onOpen,
}: {
  row: RecentWorkItem;
  onOpen: (item: RecentWorkItem) => void;
}) {
  const isCalc = row.status === 'Calculated';
  return (
    <tr>
      <td class={styles.itemNameCell}>
        <span class={styles.rowGraphicWrap}>
          <MemberTypeIcon type={row.memberType} />
        </span>
        <span class={styles.rowItemName}>{row.name}</span>
      </td>
      <td>
        <span class={`${styles.typeBadge} ${styles[`typeBadge_${row.memberType}`]}`}>
          {row.memberType.charAt(0).toUpperCase() + row.memberType.slice(1)}
        </span>
      </td>
      <td class={styles.rowPortion}>{row.portion}</td>
      <td class={styles.rowDate}>{row.lastUpdated}</td>
      <td>
        <span class={isCalc ? styles.statusBadgeGreen : styles.statusBadgeBlue}>{row.status}</span>
      </td>
      <td class={styles.rowActionCell}>
        <button type="button" class={styles.openItemBtn} onClick={() => onOpen(row)}>
          {t.actionOpen}
        </button>
        <button
          type="button"
          class={styles.ellipsisBtn}
          aria-label="More options"
          title="More options"
        >
          <Icon name="ellipsis" />
        </button>
      </td>
    </tr>
  );
}

export function RecentWorkCard({ items, onOpenItem }: RecentWorkCardProps) {
  return (
    <section class={styles.recentWorkCard} aria-labelledby="recent-work-heading">
      <div class={styles.cardHeader}>
        <div class={styles.cardHeaderTitle}>
          <span class={styles.cardIconBlue}>
            <Icon name="clock" />
          </span>
          <div>
            <h2 id="recent-work-heading" class={styles.cardTitle}>
              {t.recentWorkTitle}
            </h2>
            <p class={styles.cardSubtitle}>{t.recentWorkSubtitle}</p>
          </div>
        </div>
      </div>

      <div class={styles.tableResponsiveWrap}>
        <table class={styles.recentTable}>
          <thead>
            <tr>
              <th scope="col">{t.colItemMember}</th>
              <th scope="col">{t.colType}</th>
              <th scope="col">{t.colPortion}</th>
              <th scope="col">{t.colLastUpdated}</th>
              <th scope="col">{t.colStatus}</th>
              <th scope="col">{t.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} class={styles.emptyTableNotice}>
                  No recent calculations. Click <strong>Sample Project</strong> above or choose a
                  member in Getting Started to begin.
                </td>
              </tr>
            ) : (
              items.map((row) => <RecentTableRow key={row.id} row={row} onOpen={onOpenItem} />)
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
