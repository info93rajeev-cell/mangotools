import type { RefObject } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import { iconSvg } from '../icons/icons.ts';
import s from './cbmInputs.module.css';

/** Puts a page element somewhere else for as long as the workspace is mounted, then restores it. */
function relocate(node: Element, parent: Element, before: Node | null): () => void {
  const home = node.parentElement;
  const next = node.nextSibling;
  parent.insertBefore(node, before);
  return () => home?.insertBefore(node, next);
}

function decorate(card: HTMLElement, icon: string, tone: string | undefined, count: number) {
  const summary = card.querySelector(':scope > summary');
  if (!summary) return () => {};
  const badge = document.createElement('span');
  badge.className = `${s.infoIcon} ${tone ?? ''}`;
  badge.setAttribute('aria-hidden', 'true');
  badge.innerHTML = icon === '?' ? '<b>?</b>' : iconSvg(icon);
  const counter = document.createElement('span');
  counter.className = s.infoCount ?? '';
  counter.textContent = `(${count})`;
  const chevron = document.createElement('span');
  chevron.className = `icon ${s.chevron ?? ''}`;
  chevron.setAttribute('aria-hidden', 'true');
  chevron.innerHTML = iconSvg('chevron-down');
  summary.prepend(badge);
  summary.append(counter, chevron);
  card.classList.add(s.panel ?? '', s.infoCard ?? '');
  card.dataset.cbmMoved = '';
  return () => {
    for (const added of [badge, counter, chevron]) added.remove();
    card.classList.remove(s.panel ?? '', s.infoCard ?? '');
    delete card.dataset.cbmMoved;
  };
}

/**
 * CBM-only page presentation from the approved reference: the "Runs on your device" badge sits in
 * the site header, and the page's FAQ and Related tools sections become cards in the worksheet
 * column. Everything is restored when the workspace unmounts; other pages are untouched.
 */
export function useCbmPageChrome(cards: RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const undo: (() => void)[] = [];
    const badge = document.querySelector<HTMLElement>('.tool-header .privacy');
    const actions = document.querySelector('.site-header .actions');
    if (badge && actions) {
      undo.push(relocate(badge, actions, actions.lastElementChild));
      badge.dataset.cbmHeader = '';
      undo.push(() => delete badge.dataset.cbmHeader);
    }
    const slot = cards.current;
    const faq = document.querySelector<HTMLElement>('[data-secondary-information] details#faq');
    const related = document.querySelector<HTMLElement>(
      '[data-secondary-information] details#related-tools',
    );
    if (slot && faq) {
      undo.push(relocate(faq, slot, null));
      undo.push(decorate(faq, '?', s.toneInfo, faq.querySelectorAll('.faq > details').length));
    }
    if (slot && related) {
      undo.push(relocate(related, slot, null));
      const count = related.querySelectorAll('[data-tool-card]').length;
      undo.push(decorate(related, 'layout-grid', s.toneInfo, count));
    }
    return () => {
      for (const step of undo.reverse()) step();
    };
  }, [cards]);
}
