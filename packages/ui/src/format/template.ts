import { type FormatOptions, formatValue, type ValueFormat } from './numbers.ts';

/** A piece of a rendered working-step line: literal text or a formatted value. */
export type TemplatePart =
  | { kind: 'text'; text: string }
  | { kind: 'value'; name: string; text: string };

const PLACEHOLDER = /\{(\w+)(?::(money|number|percent|text))?\}/g;

/**
 * Renders a working-step template such as "CGST = {taxable:money} × {halfRate}% = {result:money}".
 * `{name}` is formatted as a number, `{name:money}` as money; unknown names stay as written.
 */
export function renderTemplate(
  template: string,
  values: Record<string, string>,
  options: FormatOptions = {},
): TemplatePart[] {
  const parts: TemplatePart[] = [];
  let last = 0;
  for (const match of template.matchAll(PLACEHOLDER)) {
    const [whole, name = '', format = 'number'] = match;
    if (match.index > last) parts.push({ kind: 'text', text: template.slice(last, match.index) });
    const raw = values[name];
    parts.push(
      raw === undefined
        ? { kind: 'text', text: whole }
        : { kind: 'value', name, text: formatValue(format as ValueFormat, raw, options) },
    );
    last = match.index + whole.length;
  }
  if (last < template.length) parts.push({ kind: 'text', text: template.slice(last) });
  return parts;
}

/** Placeholder names used by a template (for build-time validation). */
export function templateNames(template: string): string[] {
  return [...template.matchAll(PLACEHOLDER)].map((m) => m[1] ?? '');
}

export const partsToText = (parts: TemplatePart[]) => parts.map((p) => p.text).join('');
