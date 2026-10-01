import {
  type FormatOptions,
  formatDecimal,
  formatValue,
  roundDecimalText,
  type ValueFormat,
} from './numbers.ts';

/** A piece of a rendered working-step line: literal text or a formatted value. */
export type TemplatePart =
  | { kind: 'text'; text: string }
  | { kind: 'value'; name: string; text: string };

const PLACEHOLDER = /\{(\w+)(?::(money|number|percent|text|d[0-6]))?\}/g;

/** `{name:d2}` shows a value rounded to 2 decimal places (for long exact intermediate values). */
function formatPart(format: string, raw: string, options: FormatOptions): string {
  const places = /^d(\d)$/.exec(format);
  if (places) return formatDecimal(roundDecimalText(raw, Number(places[1])), 'international');
  return formatValue(format as ValueFormat, raw, options);
}

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
        : { kind: 'value', name, text: formatPart(format, raw, options) },
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
