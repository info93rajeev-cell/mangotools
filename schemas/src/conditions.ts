import type { Conditions } from './registry.ts';

/** Current values of a tool's fields and options, as the UI and the pipeline see them. */
export type ConditionState = Readonly<Record<string, unknown>>;

/**
 * True when every key in `conditions` has one of its listed values in `state`.
 * Values are compared as strings, so `true` matches "true" and 18 matches "18".
 * Missing conditions always match.
 */
export function matchesConditions(
  conditions: Conditions | undefined,
  state: ConditionState,
): boolean {
  if (!conditions) return true;
  return Object.entries(conditions).every(([key, values]) => values.includes(String(state[key])));
}

/** Whether a preset entry (field, option or output) is shown for the given state. */
export function isShown(
  entry: { visible?: boolean; visibleWhen?: Conditions },
  state: ConditionState,
): boolean {
  return entry.visible !== false && matchesConditions(entry.visibleWhen, state);
}
