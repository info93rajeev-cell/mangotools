import { Icon } from '../../primitives/Icon.tsx';
import styles from './dataStudio.module.css';
import { useJsonSearch } from './JsonSearchContext.tsx';
import type { ParseResult } from './useJsonFormatterStudio.ts';

export function ValidationResultCard({ parsedResult }: { parsedResult: ParseResult }) {
  const { valid, error, stats } = parsedResult;

  return (
    <section class={styles.optcard}>
      <div class={styles.optTitle}>
        <span class={styles.optIcon}>
          <Icon name="circle-check" class={styles.optIco} />
        </span>
        <b>Validation Result</b>
      </div>
      {valid ? (
        <div class={styles.badgeOkCallout}>
          <span class={styles.badgeOkCircle}>
            <Icon name="check" class={styles.ico} />
          </span>
          <div class={styles.badgeOkText}>
            <strong>Valid JSON</strong>
            <small>No syntax errors found.</small>
          </div>
        </div>
      ) : (
        <div class={styles.badgeErrCallout}>
          <span class={styles.badgeErrCircle}>
            <Icon name="triangle-alert" class={styles.ico} />
          </span>
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
  searchMatchCase,
  onSearchMatchCase,
  searchRegex,
  onSearchRegex,
  onLoadExample,
}: {
  searchQuery: string;
  onSearch: (v: string) => void;
  /** Kept for API compatibility; the live count comes from the search context. */
  searchMatches?: number;
  searchMatchCase: boolean;
  onSearchMatchCase: (v: boolean) => void;
  searchRegex: boolean;
  onSearchRegex: (v: boolean) => void;
  onLoadExample: (key: string) => void;
}) {
  const search = useJsonSearch();
  return (
    <section class={styles.optcard}>
      <div class={styles.optTitle}>
        <span class={styles.optIcon}>
          <Icon name="search" class={styles.optIco} />
        </span>
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
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (e.shiftKey) search.prev();
            else search.next();
          }}
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
        <SearchNav query={searchQuery} />
      </div>
      <div class={styles.exampleRow}>
        <span class={styles.exampleLabel}>
          <Icon name="sun" class={styles.ico} /> Examples
        </span>
        <select
          aria-label="Load example"
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

function SearchNav({ query }: { query: string }) {
  const { index, total, error, next, prev } = useJsonSearch();
  const label = total > 0 ? `${index + 1} of ${total}` : '0 of 0';
  return (
    <div class={styles.searchNav}>
      <button
        type="button"
        class={styles.searchNavBtn}
        onClick={prev}
        disabled={total === 0}
        aria-label="Previous match"
      >
        <Icon name="chevron-left" class={styles.ico} />
      </button>
      <button
        type="button"
        class={styles.searchNavBtn}
        onClick={next}
        disabled={total === 0}
        aria-label="Next match"
      >
        <Icon name="chevron-right" class={styles.ico} />
      </button>
      <span class={styles.matchCountBadge} aria-live="polite">
        {error ?? (query ? label : '0 of 0')}
      </span>
    </div>
  );
}
