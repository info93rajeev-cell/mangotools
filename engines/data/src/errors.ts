/** English messages for every error and warning code this engine can return. */
export const messages: Readonly<Record<string, string>> = {
  DATA_INPUT_TOO_LARGE: 'The input is larger than the {limitMb} MB this tool accepts.',
  DATA_JSON_EMPTY: 'Paste or type some JSON to format.',
  DATA_JSON_SYNTAX_ERROR: 'Invalid JSON at line {line}, column {column}. Expected {expectedText}.',
  DATA_JSON_TOO_DEEP: 'The JSON is nested more than {maxDepth} levels deep.',
  DATA_JSON_DUPLICATE_KEY: 'Duplicate key at line {line}, column {column}.',
  DATA_JSON_BOM_REMOVED: 'A byte order mark at the start of the input was removed.',
  DATA_BASE64_INVALID_CHARACTER: 'Invalid Base64 character at position {offset}.',
  DATA_BASE64_INVALID_LENGTH: 'The Base64 text has an invalid length or padding.',
  DATA_BASE64_NOT_UTF8:
    'The decoded data is not UTF-8 text ({byteLength} bytes). A hex preview is shown instead.',
  DATA_URL_MALFORMED_ESCAPE: 'Malformed percent-escape at position {offset}.',
  DATA_URL_INVALID_UTF8: 'The text does not form valid UTF-8 characters.',
  DATA_CSV_EMPTY: 'Paste or type some CSV to convert.',
  DATA_CSV_BOM_REMOVED: 'A byte order mark at the start of the input was removed.',
  DATA_CSV_NO_HEADER_ROW: 'The CSV has no header row to convert.',
  DATA_CSV_DUPLICATE_HEADER: 'Duplicate column header "{name}" (column {column}).',
  DATA_CSV_INCONSISTENT_COLUMNS:
    'Row at line {line} has {actual} columns, but the header has {expected}.',
  DATA_CSV_UNCLOSED_QUOTE: 'Unclosed quoted field starting at line {line}.',
  DATA_CSV_INVALID_QUOTE: 'Invalid quoted field at line {line}.',
};

export const MAX_INPUT_CHARS = 50 * 1024 * 1024;
