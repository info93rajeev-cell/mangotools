import { useLayoutEffect } from 'preact/hooks';

/** Puts a page element somewhere else for as long as the workspace is mounted, then restores it. */
function relocate(node: Element, parent: Element, before: Node | null): () => void {
  const home = node.parentElement;
  const next = node.nextSibling;
  parent.insertBefore(node, before);
  return () => home?.insertBefore(node, next);
}

/**
 * CBM-only page presentation from the approved reference: the "Runs on your device" badge sits in
 * the site header. It is restored when the workspace unmounts; other pages are untouched. The
 * page's shared supporting strip (Disclaimer, How to use, Method, FAQ, Related tools…) and the
 * global footer stay exactly where the shared tool page renders them.
 */
export function useCbmPageChrome() {
  useLayoutEffect(() => {
    const badge = document.querySelector<HTMLElement>('.tool-header .privacy');
    const actions = document.querySelector('.site-header .actions');
    if (!badge || !actions) return;
    const restore = relocate(badge, actions, actions.lastElementChild);
    badge.dataset.cbmHeader = '';
    return () => {
      delete badge.dataset.cbmHeader;
      restore();
    };
  }, []);
}
