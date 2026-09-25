import { useEffect, useState } from 'preact/hooks';
import { t } from '../strings/en.ts';
import styles from './cards.module.css';

export interface CategoryChipsProps {
  categories: { id: string; name: string }[];
  /** Selector for the groups to filter; each carries data-category="<id>". */
  target?: string;
}

/**
 * Filters the tool groups already in the page. Without JavaScript every group stays visible,
 * so the full list is always in the HTML.
 */
export function CategoryChips({
  categories,
  target = '[data-category-group]',
}: CategoryChipsProps) {
  const [selected, setSelected] = useState('all');

  useEffect(() => {
    for (const group of document.querySelectorAll<HTMLElement>(target)) {
      group.hidden = selected !== 'all' && group.dataset.category !== selected;
    }
  }, [selected, target]);

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
