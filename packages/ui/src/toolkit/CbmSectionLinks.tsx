import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import s from './cbmInputs.module.css';
import { cbmWorkbenchText as w } from './cbmWorkbenchStrings.ts';

/**
 * The FAQ and Related tools cards of the approved CBM workspace. Their content lives once, in the
 * page's shared supporting strip below the tool; each card opens that section and brings it into
 * view, so nothing is duplicated and the shared strip keeps its standard set of sections.
 */
const SECTIONS = [
  { id: 'faq', title: w.faqTitle, items: '.faq > details', icon: null },
  { id: 'related-tools', title: w.relatedTitle, items: '[data-tool-card]', icon: 'layout-grid' },
] as const;

type Section = (typeof SECTIONS)[number];

/** How many entries the shared section holds, read once the page is in the browser. */
function useItemCount(section: Section): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    setCount(document.querySelectorAll(`#${section.id} ${section.items}`).length);
  }, [section]);
  return count;
}

function openSection(id: string, event: MouseEvent) {
  const target = document.getElementById(id);
  if (!(target instanceof HTMLDetailsElement)) return;
  event.preventDefault();
  target.open = true;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  target.querySelector('summary')?.focus({ preventScroll: true });
}

function SectionLink({ section }: { section: Section }) {
  const count = useItemCount(section);
  if (count === 0) return null;
  return (
    <a
      class={`${s.panel} ${s.infoCard} ${s.infoLink}`}
      href={`#${section.id}`}
      data-cbm-section-link={section.id}
      onClick={(event) => openSection(section.id, event)}
    >
      <span class={`${s.infoIcon} ${s.toneInfo}`} aria-hidden="true">
        {section.icon ? <Icon name={section.icon} /> : <b>?</b>}
      </span>
      <span class={s.infoTitle}>{section.title}</span>
      {count === null ? null : <span class={s.infoCount}>({count})</span>}
      <Icon name="chevron-down" class={s.chevron} />
    </a>
  );
}

export function CbmSectionLinks() {
  return (
    <>
      {SECTIONS.map((section) => (
        <SectionLink key={section.id} section={section} />
      ))}
    </>
  );
}
