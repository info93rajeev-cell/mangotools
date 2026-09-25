/**
 * Analytics placeholder. Events are validated against this catalogue so that no user content can
 * ever be attached. In development the web app installs a console.debug sink; in production there
 * is no sink, so nothing leaves the page. There are no network calls here.
 */

const TEMPLATES = ['home', 'tools', 'category', 'tool', '404'] as const;
const METHODS = ['copy', 'download', 'print'] as const;
const THEMES = ['light', 'dark', 'system'] as const;

export interface AnalyticsCatalogue {
  page_view: { template: (typeof TEMPLATES)[number] };
  tool_view: { toolId: string };
  tool_run: { toolId: string };
  tool_complete: { toolId: string; method: (typeof METHODS)[number] };
  sample_load: { toolId: string };
  search_query: { resultCount: number };
  theme_change: { theme: (typeof THEMES)[number] };
}

export type AnalyticsEvent = keyof AnalyticsCatalogue;

type Rule = readonly string[] | 'id' | 'count';

const CATALOGUE: Record<AnalyticsEvent, Record<string, Rule>> = {
  page_view: { template: TEMPLATES },
  tool_view: { toolId: 'id' },
  tool_run: { toolId: 'id' },
  tool_complete: { toolId: 'id', method: METHODS },
  sample_load: { toolId: 'id' },
  search_query: { resultCount: 'count' },
  theme_change: { theme: THEMES },
};

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function valid(rule: Rule, value: unknown): boolean {
  if (rule === 'id') return typeof value === 'string' && ID.test(value) && value.length <= 64;
  if (rule === 'count') return typeof value === 'number' && Number.isInteger(value) && value >= 0;
  return typeof value === 'string' && rule.includes(value);
}

/** Returns a problem description, or null when the event matches the catalogue exactly. */
export function validateEvent(name: string, props: Record<string, unknown>): string | null {
  const rules = CATALOGUE[name as AnalyticsEvent];
  if (!rules) return `unknown event "${name}"`;
  const keys = Object.keys(props);
  const extra = keys.find((k) => !(k in rules));
  if (extra) return `unexpected property "${extra}"`;
  for (const [key, rule] of Object.entries(rules)) {
    if (!valid(rule, props[key])) return `invalid "${key}"`;
  }
  return null;
}

export type AnalyticsSink = (name: AnalyticsEvent, props: Record<string, unknown>) => void;

let sink: AnalyticsSink | null = null;

export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

/** Records an event if it is valid. Returns whether it was accepted. */
export function track<E extends AnalyticsEvent>(name: E, props: AnalyticsCatalogue[E]): boolean {
  const record = props as unknown as Record<string, unknown>;
  if (validateEvent(name, record) !== null) return false;
  sink?.(name, record);
  return true;
}
