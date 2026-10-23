import { useEffect, useState } from 'preact/hooks';
import { t } from '../strings/en.ts';
import styles from './cards.module.css';

export interface CategoryChipsProps {
  categories: { id: string; name: string }[];
  /** Selector for the groups to filter; each carries data-category="<id>". */
  target?: string;
}

function filterCards(container: ParentNode, query: string): number {
  const cards = container.querySelectorAll<HTMLElement>('[data-tool-card]');
  let visible = 0;
  for (const card of cards) {
    const text = `${card.dataset.toolCard ?? ''} ${card.textContent ?? ''}`.toLowerCase();
    const match = !query || text.includes(query);
    card.hidden = !match;
    if (match) visible++;
  }
  return visible;
}

/**
 * Filters the tool groups and cards in the page by selected category and live search query.
 * Without JavaScript every group and card stays visible.
 */
export function CategoryChips({
  categories,
  target = '[data-category-group]',
}: CategoryChipsProps) {
  const [selected, setSelected] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleInput = (e: Event) => {
      const el = e.target as HTMLInputElement | null;
      if (el && el.type === 'search') {
        setQuery(el.value.trim().toLowerCase());
      }
    };
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleInput);
    return () => {
      document.removeEventListener('input', handleInput);
      document.removeEventListener('change', handleInput);
    };
  }, []);

  useEffect(() => {
    for (const group of document.querySelectorAll<HTMLElement>(target)) {
      const match = selected === 'all' || group.dataset.category === selected;
      if (!match) {
        group.hidden = true;
        continue;
      }
      group.hidden = filterCards(group, query) === 0;
    }

    const popular = document.querySelector<HTMLElement>('[data-popular-tools]');
    if (popular) {
      popular.hidden = filterCards(popular, query) === 0;
    }
  }, [selected, query, target]);

  const chips = [{ id: 'all', name: t('chips.all') }, ...categories];
  return (
    <fieldset class={styles.chips}>
      <legend class="visually-hidden">{t('chips.label')}</legend>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          class={styles.chip}
          aria-pressed={selected === chip.id}
          onClick={() => setSelected(chip.id)}
        >
          {chip.name}
        </button>
      ))}
    </fieldset>
  );
}
