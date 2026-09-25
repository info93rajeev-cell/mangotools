import type { Expected } from './parse.ts';

/** Plain-language description of what the parser expected, used in syntax error messages. */
export const EXPECTED_TEXT: Readonly<Record<Expected, string>> = {
  value: 'a value (text in quotes, a number, true, false, null, an object or an array)',
  'property-name': 'a property name in double quotes',
  colon: 'a colon (:) after the property name',
  'comma-or-object-end': 'a comma (,) or a closing brace (})',
  'comma-or-array-end': 'a comma (,) or a closing bracket (])',
  'end-of-input': 'the end of the input (there is extra text after the JSON)',
  'valid-number': 'a valid number',
  'valid-escape': 'a valid escape such as \\n, \\" or \\u00e9',
  'closing-quote': 'a closing double quote (")',
  'valid-string-character': 'a valid character (control characters must be escaped)',
};
