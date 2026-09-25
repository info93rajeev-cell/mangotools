import { loadSearch, type SearchFn, type SearchResult, track } from '@mangotools/runtime';
import { useRef, useState } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import { t } from '../strings/en.ts';
import styles from './search.module.css';

export interface SearchBoxProps {
  idPrefix: string;
  /** Header size; the home page and 404 use the large version. */
  compact?: boolean;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

function statusText(status: Status, query: string, count: number): string {
  if (status === 'loading') return t('search.loading');
  if (status === 'error') return t('search.unavailable');
  if (!query.trim()) return '';
  if (count === 0) return t('search.noResults', { query });
  return count === 1 ? t('search.one') : t('search.count', { count });
}

/** Search state: lazy index loading, results, the active option and keyboard handling. */
function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const searcher = useRef<SearchFn | null>(null);

  const ensure = async (): Promise<SearchFn | null> => {
    if (searcher.current) return searcher.current;
    setStatus('loading');
    try {
      searcher.current = await loadSearch();
      setStatus('ready');
    } catch {
      setStatus('error');
    }
    return searcher.current;
  };

  const update = async (next: string) => {
    setQuery(next);
    const search = await ensure();
    const found = search && next.trim() ? search(next, 8) : [];
    setResults(found);
    setActive(found.length > 0 ? 0 : -1);
    setOpen(next.trim() !== '');
  };

  const go = (result: SearchResult | undefined) => {
    if (!result) return;
    track('search_query', { resultCount: results.length });
    window.location.assign(result.url);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const count = results.length;
    if (event.key === 'ArrowDown' && count > 0) {
      setOpen(true);
      setActive((active + 1) % count);
    } else if (event.key === 'ArrowUp' && count > 0) setActive((active - 1 + count) % count);
    else if (event.key === 'Escape') {
      if (open) setOpen(false);
      else void update('');
    } else return;
    event.preventDefault();
  };

  const expanded = open && query.trim() !== '';
  return {
    query,
    results,
    active,
    setActive,
    setOpen,
    status,
    ensure,
    update,
    go,
    onKeyDown,
    expanded,
  };
}

/** Combobox: the input keeps focus, arrow keys move the active option, Enter opens it. */
export function SearchBox({ idPrefix, compact = false }: SearchBoxProps) {
  const s = useSearch();
  const inputId = `${idPrefix}-input`;
  const listId = `${idPrefix}-list`;
  const optionId = (i: number) => `${idPrefix}-option-${i}`;
  const onSubmit = (event: Event) => {
    event.preventDefault();
    s.go(s.results[Math.max(s.active, 0)]);
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: <search> is not in Preact's JSX types yet; role="search" is equivalent.
    <form
      role="search"
      action="/tools"
      method="get"
      class={[styles.form, compact ? '' : styles.large].join(' ')}
      onSubmit={onSubmit}
    >
      <label for={inputId} class="visually-hidden">
        {t('search.label')}
      </label>
      <div class={styles.box}>
        <Icon name="search" />
        <input
          id={inputId}
          class={styles.input}
          type="search"
          name="q"
          role="combobox"
          aria-expanded={s.expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={s.expanded && s.active >= 0 ? optionId(s.active) : undefined}
          autocomplete="off"
          spellcheck={false}
          placeholder={t('search.placeholder')}
          value={s.query}
          onFocus={() => void s.ensure()}
          onInput={(event) => void s.update(event.currentTarget.value)}
          onKeyDown={s.onKeyDown}
          onBlur={() => s.setOpen(false)}
        />
      </div>
      <div class={styles.popover} hidden={!s.expanded}>
        <div id={listId} role="listbox" aria-label={t('search.label')} class={styles.listbox}>
          {s.results.map((result, index) => (
            // biome-ignore lint/a11y/useFocusableInteractive: combobox pattern; focus stays in the input.
            // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard selection is handled by the input.
            <div
              key={result.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === s.active}
              class={styles.option}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => s.setActive(index)}
              onClick={() => s.go(result)}
            >
              <span class={styles.optionName}>{result.name}</span>
              <span class={styles.optionMeta}>{result.category}</span>
            </div>
          ))}
        </div>
        {s.results.length === 0 ? (
          <p class={styles.empty}>{statusText(s.status, s.query, 0)}</p>
        ) : null}
      </div>
      <p class="visually-hidden" role="status" aria-live="polite">
        {statusText(s.status, s.query, s.results.length)}
      </p>
    </form>
  );
}
