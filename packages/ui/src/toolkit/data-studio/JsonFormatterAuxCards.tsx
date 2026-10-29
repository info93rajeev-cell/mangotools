import styles from './dataStudio.module.css';
import type { JsonStats } from './useJsonFormatterStudio.ts';

export function SideMetricsPanel({
  parsedResult,
  inputLength,
  inputLines,
}: {
  parsedResult: { valid: boolean; error: string | null; stats: JsonStats | null };
  inputLength: number;
  inputLines: number;
}) {
  return (
    <div class={`${styles.side} ${styles.sidePanel}`}>
      <section class={`${styles.panel} ${styles.sideTopCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#10003;</span>Validation &amp; Info
        </div>
        {parsedResult.valid ? (
          <div class={styles.badgeOk}>
            <span>&#10004;</span>
            <div>
              <strong>Valid JSON</strong>
              <div style={{ fontSize: 10.5, color: '#098650' }}>RFC 8259 compliant</div>
            </div>
          </div>
        ) : (
          <div class={styles.badgeErr}>
            <span>&#9888;</span>
            <div>
              <strong>Invalid JSON</strong>
              <div style={{ fontSize: 10, color: '#a81c34' }}>{parsedResult.error}</div>
            </div>
          </div>
        )}
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Characters</small>
            <b>{parsedResult.stats?.chars ?? inputLength}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniGreen}`}>
            <small>Lines</small>
            <b>{parsedResult.stats?.lines ?? inputLines}</b>
          </div>
        </div>
      </section>

      <section class={`${styles.panel} ${styles.sideBottomCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#9881;</span>Data Structure
        </div>
        <div class={styles.kv}>
          <span>Root Type</span>
          <b>{parsedResult.stats?.rootType ?? 'Unknown'}</b>
        </div>
        <div class={styles.kv}>
          <span>Objects Count</span>
          <b>{parsedResult.stats?.objects ?? 0}</b>
        </div>
        <div class={styles.kv}>
          <span>Arrays Count</span>
          <b>{parsedResult.stats?.arrays ?? 0}</b>
        </div>
        <div class={styles.kv}>
          <span>Max Depth</span>
          <b>{parsedResult.stats?.maxDepth ?? 0} levels</b>
        </div>
      </section>
    </div>
  );
}

export function JsonAuxCards({
  indent,
  onIndent,
  sortKeys,
  onSortKeys,
  searchQuery,
  onSearch,
  searchMatches,
  stats,
}: {
  indent: '2' | '4' | 'tab';
  onIndent: (v: '2' | '4' | 'tab') => void;
  sortKeys: boolean;
  onSortKeys: (v: boolean) => void;
  searchQuery: string;
  onSearch: (v: string) => void;
  searchMatches: number;
  stats: JsonStats | null;
}) {
  return (
    <div class={styles.aux}>
      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9881;</span>Formatting
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Indentation</span>
          <select
            class={styles.optSelect}
            value={indent}
            onChange={(e) => onIndent((e.target as HTMLSelectElement).value as '2' | '4' | 'tab')}
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>
        <div class={styles.optCheckboxRow}>
          <label class={styles.optCheckbox}>
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => onSortKeys((e.target as HTMLInputElement).checked)}
            />
            Sort keys (A-Z)
          </label>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9889;</span>Advanced
        </div>
        <div class={styles.rowchips}>
          <span class={styles.chipPurple}>Duplicate check</span>
          <span class={styles.chipBlue}>BigInt safe</span>
        </div>
        <div class={styles.optHelptext} style={{ marginTop: 4 }}>
          Numeric fidelity &middot; Schema validation &middot; Error path &middot; Key sorting
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128269;</span>Search in JSON
        </div>
        <input
          type="text"
          class={styles.optSelect}
          placeholder="Search keys or values..."
          value={searchQuery}
          aria-label="Search keys or values"
          onInput={(e) => onSearch((e.target as HTMLInputElement).value)}
        />
        <div class={styles.optHelptext}>
          {searchQuery
            ? `${searchMatches} match${searchMatches === 1 ? '' : 'es'} found`
            : 'Find in formatted JSON'}
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128065;</span>Inspection Tools
        </div>
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Objects</small>
            <b>{stats?.objects ?? 0}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniPurple}`}>
            <small>Arrays</small>
            <b>{stats?.arrays ?? 0}</b>
          </div>
        </div>
      </section>
    </div>
  );
}
