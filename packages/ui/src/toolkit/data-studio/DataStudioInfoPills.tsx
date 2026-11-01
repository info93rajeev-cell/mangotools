import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './dataStudio.module.css';

/** The page's information sections (rendered below the tool by ToolPage), opened from pills in the
 *  studio's action row like the reference. Only sections that exist on the page get a pill. */
const SECTIONS = [
  { selector: 'details[data-disclaimer]', label: 'Disclaimer', icon: 'info' },
  { selector: 'details#how-to-use', label: 'How to use', icon: 'book-open' },
  { selector: 'details#method', label: 'Method', icon: 'settings' },
  { selector: 'details#worked-example', label: 'Worked example', icon: 'hash' },
  { selector: 'details#faq', label: 'FAQ', icon: 'circle-help' },
  { selector: 'details#references', label: 'References', icon: 'book-open' },
  { selector: 'details#related-tools', label: 'Related tools', icon: 'link' },
] as const;

const find = (selector: string) => document.querySelector<HTMLDetailsElement>(selector);

export function DataStudioInfoPills() {
  const [present, setPresent] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const found = SECTIONS.filter((s) => find(s.selector)).map((s) => s.selector);
    setPresent(found);
    const sync = () => setOpen(found.find((sel) => find(sel)?.open) ?? null);
    const nodes = found.map(find).filter((n): n is HTMLDetailsElement => n !== null);
    for (const node of nodes) node.addEventListener('toggle', sync);
    return () => {
      for (const node of nodes) node.removeEventListener('toggle', sync);
    };
  }, []);

  const toggle = (selector: string) => {
    const target = find(selector);
    if (!target) return;
    const opening = !target.open;
    for (const sel of present) {
      const other = find(sel);
      if (other && sel !== selector) other.open = false;
    }
    target.open = opening;
    if (opening) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  if (present.length === 0) return null;
  return (
    <div class={styles.infoPills}>
      {SECTIONS.filter((s) => present.includes(s.selector)).map((s) => (
        <button
          key={s.selector}
          type="button"
          class={styles.infoPill}
          aria-expanded={open === s.selector}
          onClick={() => toggle(s.selector)}
        >
          <Icon name={s.icon} class={styles.ico} />
          {s.label}
        </button>
      ))}
    </div>
  );
}
