import styles from './dataStudio.module.css';
import type { ParseResult } from './useJsonFormatterStudio.ts';

export function ValidationResultCard({ parsedResult }: { parsedResult: ParseResult }) {
  const { valid, error, stats } = parsedResult;

  return (
    <section class={styles.optcard}>
      <div class={styles.optTitle}>
        <span class={styles.optIcon}>✓</span>
        <b>Validation Result</b>
      </div>
      {valid ? (
        <div class={styles.badgeOkCallout}>
          <span class={styles.badgeOkCircle}>✓</span>
          <div class={styles.badgeOkText}>
            <strong>Valid JSON</strong>
            <small>No syntax errors found.</small>
          </div>
        </div>
      ) : (
        <div class={styles.badgeErrCallout}>
          <span class={styles.badgeErrCircle}>⚠</span>
          <div class={styles.badgeErrText}>
            <strong>Invalid JSON</strong>
            <small>{error || 'Syntax error'}</small>
          </div>
        </div>
      )}
      <div class={styles.metricsPillRow}>
        <div class={styles.metricPill}>
          <small>Characters</small>
          <b>{stats?.chars ?? 0}</b>
        </div>
        <div class={styles.metricPill}>
          <small>Lines</small>
          <b>{stats?.lines ?? 0}</b>
        </div>
        <div class={styles.metricPill}>
          <small>Size</small>
          <b>{stats?.sizeKb ?? '0 B'}</b>
        </div>
        <div class={styles.metricPill}>
          <small>Depth</small>
          <b>{stats?.maxDepth ?? 1} levels</b>
        </div>
      </div>
    </section>
  );
}

export function SearchInJsonCard({
  searchQuery,
  onSearch,
  searchMatches,
  searchMatchCase,
  onSearchMatchCase,
  searchRegex,
  onSearchRegex,
  onLoadExample,
}: {
  searchQuery: string;
  onSearch: (v: string) => void;
  searchMatches: number;
  searchMatchCase: boolean;
  onSearchMatchCase: (v: boolean) => void;
  searchRegex: boolean;
  onSearchRegex: (v: boolean) => void;
  onLoadExample: (key: string) => void;
}) {
  return (
    <section class={styles.optcard}>
      <div class={styles.optTitle}>
        <span class={styles.optIcon}>🔍</span>
        <b>Search in JSON</b>
      </div>
      <div class={styles.searchInputWrap}>
        <input
          type="text"
          class={styles.optSearchInput}
          placeholder="Search keys or values..."
          value={searchQuery}
          aria-label="Search keys or values"
          onInput={(e) => onSearch((e.target as HTMLInputElement).value)}
        />
      </div>
      <div class={styles.searchOptionsRow}>
        <label class={styles.optCheckbox}>
          <input
            type="checkbox"
            checked={searchMatchCase}
            onChange={(e) => onSearchMatchCase((e.target as HTMLInputElement).checked)}
          />
          Match case
        </label>
        <label class={styles.optCheckbox}>
          <input
            type="checkbox"
            checked={searchRegex}
            onChange={(e) => onSearchRegex((e.target as HTMLInputElement).checked)}
          />
          Use regex
        </label>
        <span class={styles.matchCountBadge}>
          {searchQuery ? `${searchMatches} match${searchMatches === 1 ? '' : 'es'}` : '0 of 0'}
        </span>
      </div>
      <div class={styles.exampleRow}>
        <span class={styles.exampleLabel}>⭐ Examples</span>
        <select
          class={styles.exampleSelect}
          onChange={(e) => {
            const val = (e.target as HTMLSelectElement).value;
            if (val) onLoadExample(val);
          }}
        >
          <option value="">Load example ∨</option>
          <option value="user">User Profile</option>
          <option value="api">API Response</option>
          <option value="ecommerce">E-Commerce Product</option>
          <option value="config">App Configuration</option>
        </select>
      </div>
    </section>
  );
}
