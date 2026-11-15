import styles from './constructionPlanner.module.css';
import type {
  ProjectOverviewState,
  ProjectSummaryMetrics,
  RecentWorkItem,
  SheetMetadata,
} from './types.ts';

interface PrintSummaryViewProps {
  overview: ProjectOverviewState;
  metrics: ProjectSummaryMetrics;
  sheets: SheetMetadata[];
  recentWork: RecentWorkItem[];
}

export function PrintSummaryView({ overview, metrics, sheets, recentWork }: PrintSummaryViewProps) {
  return (
    <div class={styles.printOnlyContainer} aria-hidden="true">
      <header class={styles.printHeader}>
        <div class={styles.printTitleRow}>
          <h1 class={styles.printMainTitle}>{overview.projectName}</h1>
          <span class={styles.printDate}>{new Date().toLocaleDateString()}</span>
        </div>
        <p class={styles.printMeta}>
          Location: {overview.location} | Type: {overview.projectType} | Floors: {overview.floors} |
          Standard: {overview.concreteStandard}, {overview.rebarStandard}
        </p>
      </header>

      <section class={styles.printSection}>
        <h2 class={styles.printHeading}>Project Quantity & Member Summary</h2>
        <div class={styles.printGrid}>
          <div class={styles.printGridItem}>
            <strong>Total Members:</strong> {metrics.totalMembers} Nos.
          </div>
          <div class={styles.printGridItem}>
            <strong>Footings:</strong> {metrics.footingsCount} Nos.
          </div>
          <div class={styles.printGridItem}>
            <strong>Columns:</strong> {metrics.columnsCount} Nos.
          </div>
          <div class={styles.printGridItem}>
            <strong>Beams:</strong> {metrics.beamsCount} Nos.
          </div>
          <div class={styles.printGridItem}>
            <strong>Slabs:</strong> {metrics.slabsCount} Zones
          </div>
          <div class={styles.printGridItem}>
            <strong>Status:</strong> {metrics.status}
          </div>
        </div>
      </section>

      <section class={styles.printSection}>
        <h2 class={styles.printHeading}>Drawing Sheets Package ({sheets.length} Sheets)</h2>
        <table class={styles.printTable}>
          <thead>
            <tr>
              <th>Sheet #</th>
              <th>Title</th>
              <th>Category</th>
              <th>Revision</th>
            </tr>
          </thead>
          <tbody>
            {sheets.map((s) => (
              <tr key={s.id}>
                <td>{s.sheetNumber}</td>
                <td>{s.name}</td>
                <td>{s.category}</td>
                <td>{s.revision}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section class={styles.printSection}>
        <h2 class={styles.printHeading}>Recent Structural Member Detailing</h2>
        <table class={styles.printTable}>
          <thead>
            <tr>
              <th>Member</th>
              <th>Type</th>
              <th>Portion</th>
              <th>Status</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {recentWork.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.memberType}</td>
                <td>{item.portion}</td>
                <td>{item.status}</td>
                <td>{item.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer class={styles.printFooter}>
        <p>
          Note: Quantities are planning estimates. Structural design and final quantities must be
          verified by a qualified licensed engineer.
        </p>
      </footer>
    </div>
  );
}
