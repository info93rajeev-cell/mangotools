import type { CsvDelimiterName, CsvToJsonParams } from './schema.ts';

export const DELIMITER_CHAR: Readonly<Record<CsvDelimiterName, string>> = {
  comma: ',',
  semicolon: ';',
  tab: '\t',
  pipe: '|',
};

const CANDIDATES: readonly CsvDelimiterName[] = ['comma', 'semicolon', 'tab', 'pipe'];

/** The first non-blank line, ignoring characters inside double quotes. */
function firstLineOutsideQuotes(text: string): string {
  let out = '';
  let inQuotes = false;
  for (const c of text) {
    if (c === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (c === '\n' || c === '\r')) {
      if (out.trim() !== '') return out;
      out = '';
    } else if (!inQuotes) out += c;
  }
  return out;
}

/** Resolves `auto` to the most frequent candidate on the first line; ties and none → comma. */
export function resolveDelimiter(
  choice: CsvToJsonParams['delimiter'],
  text: string,
): CsvDelimiterName {
  if (choice !== 'auto') return choice;
  const line = firstLineOutsideQuotes(text);
  let best: CsvDelimiterName = 'comma';
  let bestCount = 0;
  for (const name of CANDIDATES) {
    const count = line.split(DELIMITER_CHAR[name]).length - 1;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}
