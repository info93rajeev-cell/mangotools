/**
 * Runs on every page: installs the development console sink (development builds only) and
 * records the page view. There is no network sink in Phase 1.
 */
import { setAnalyticsSink, track } from '@mangotools/runtime';

const root = document.documentElement;
if (root.dataset.analytics === 'debug') {
  setAnalyticsSink((name, props) => console.debug('[analytics]', name, props));
}
const template = root.dataset.template;
if (
  template === 'home' ||
  template === 'tools' ||
  template === 'category' ||
  template === 'tool' ||
  template === '404'
) {
  track('page_view', { template });
}
