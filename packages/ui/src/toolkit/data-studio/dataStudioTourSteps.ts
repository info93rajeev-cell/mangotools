import type { TourStep } from '../tourStorage.ts';

const JSON_FORMATTER_STEPS: TourStep[] = [
  {
    id: 'json-step-input',
    targetSelector: '[class*="inputPanel"]',
    stepNumber: 1,
    title: '1. Paste or Type JSON',
    description:
      'Enter raw or unformatted JSON here. You can also click "✨ Try sample" to test with realistic mock data.',
    hint: 'Supports JSON arrays, objects, nested values, and automatically detects syntax errors.',
  },
  {
    id: 'json-step-actions',
    targetSelector: '[class*="toolactions"]',
    stepNumber: 2,
    title: '2. Format, Minify or Validate',
    description:
      'Choose 2-space indentation, 4 spaces, or compact minify. Invalid JSON highlights the exact line and error message.',
  },
  {
    id: 'json-step-output',
    targetSelector: '[class*="outputPanel"]',
    stepNumber: 3,
    title: '3. Formatted Code & Tree View',
    description:
      'Inspect colorized, syntax-highlighted code or switch to the interactive collapsible Tree View to explore nodes.',
  },
  {
    id: 'json-step-metrics',
    targetSelector: '[class*="sideColumn"], [class*="sideTopCard"]',
    stepNumber: 4,
    title: '4. Structure Metrics & 1-Click Copy',
    description:
      'View total keys count, object depth, character and byte savings, and copy or download the formatted JSON file.',
  },
];

const BASE64_STEPS: TourStep[] = [
  {
    id: 'base64-step-input',
    targetSelector: '[class*="inputPanel"]',
    stepNumber: 1,
    title: '1. Input Text or Base64',
    description:
      'Enter plaintext string, ASCII/Unicode text, or a Base64 encoded payload to convert.',
  },
  {
    id: 'base64-step-mode',
    targetSelector: '[class*="toolactions"], [class*="toolbar"]',
    stepNumber: 2,
    title: '2. Encode or Decode',
    description:
      'Switch between Encode and Decode modes. Supports standard Base64 and URL-safe safe variants (RFC 4648).',
  },
  {
    id: 'base64-step-output',
    targetSelector: '[class*="outputPanel"]',
    stepNumber: 3,
    title: '3. Instant Converted Result',
    description:
      'View instant conversion with character counts, byte size difference, and 1-click clipboard copy.',
  },
];

const URL_ENCODER_STEPS: TourStep[] = [
  {
    id: 'url-step-input',
    targetSelector: '[class*="inputPanel"]',
    stepNumber: 1,
    title: '1. Enter URL or Query Parameters',
    description:
      'Paste any web address, query parameters string, or URL-encoded path to encode or decode.',
  },
  {
    id: 'url-step-mode',
    targetSelector: '[class*="toolactions"], [class*="toolbar"]',
    stepNumber: 2,
    title: '2. Encoding Standard',
    description:
      'Choose standard encodeURI (full URLs), encodeURIComponent (query params), or Decode mode.',
  },
  {
    id: 'url-step-output',
    targetSelector: '[class*="outputPanel"]',
    stepNumber: 3,
    title: '3. Output & Query Inspection',
    description:
      'View the processed output along with a breakdown of parsed query parameter key-value pairs.',
  },
];

const CSV_TO_JSON_STEPS: TourStep[] = [
  {
    id: 'csv2json-step-input',
    targetSelector: '[class*="inputPanel"]',
    stepNumber: 1,
    title: '1. Paste Tabular CSV Data',
    description:
      'Paste comma-separated rows or TSV data, or click "✨ Try sample" to test immediately.',
  },
  {
    id: 'csv2json-step-options',
    targetSelector: '[class*="toolactions"], [class*="toolbar"]',
    stepNumber: 2,
    title: '2. Delimiter & Header Options',
    description:
      'Configure comma, semicolon, or tab delimiters, first-row headers detection, and auto type parsing.',
  },
  {
    id: 'csv2json-step-output',
    targetSelector: '[class*="outputPanel"]',
    stepNumber: 3,
    title: '3. Formatted JSON Array',
    description:
      'Review the generated JSON records array with preview table, and copy or download the JSON file.',
  },
];

const JSON_TO_CSV_STEPS: TourStep[] = [
  {
    id: 'json2csv-step-input',
    targetSelector: '[class*="inputPanel"]',
    stepNumber: 1,
    title: '1. Paste JSON Array',
    description:
      'Paste a JSON array of objects or table records, or load the built-in sample dataset.',
  },
  {
    id: 'json2csv-step-options',
    targetSelector: '[class*="toolactions"], [class*="toolbar"]',
    stepNumber: 2,
    title: '2. Column Delimiter & Flattening',
    description:
      'Select output delimiter (comma, semicolon, tab) and enable nested dot-notation object flattening.',
  },
  {
    id: 'json2csv-step-output',
    targetSelector: '[class*="outputPanel"]',
    stepNumber: 3,
    title: '3. Downloadable CSV Table',
    description:
      'Inspect the tabular preview and download your CSV file ready for Excel, Google Sheets, or SQL imports.',
  },
];

const TIMESTAMP_STEPS: TourStep[] = [
  {
    id: 'ts-step-input',
    targetSelector: '[class*="inputPanel"]',
    stepNumber: 1,
    title: '1. Enter Timestamp or Date',
    description:
      'Type Unix epoch timestamp in seconds (10 digits) or milliseconds (13 digits), or enter a human date/time.',
  },
  {
    id: 'ts-step-options',
    targetSelector: '[class*="toolactions"], [class*="toolbar"]',
    stepNumber: 2,
    title: '2. Timezone & Conversion Formats',
    description:
      'Convert between UTC and local time, generate ISO 8601 strings, RFC 2822 dates, and relative time.',
  },
  {
    id: 'ts-step-output',
    targetSelector: '[class*="outputPanel"]',
    stepNumber: 3,
    title: '3. Code-Ready Formats Matrix',
    description:
      'Copy syntax-ready date strings for JavaScript, Python, SQL, Go, and PHP with 1-click convenience.',
  },
];

export function getDataStudioTourSteps(toolId: string): TourStep[] | null {
  if (toolId === 'json-formatter' || toolId === 'data/json.format') return JSON_FORMATTER_STEPS;
  if (toolId === 'base64-encode-decode' || toolId === 'data/base64') return BASE64_STEPS;
  if (toolId === 'url-encode-decode' || toolId === 'data/url') return URL_ENCODER_STEPS;
  if (toolId === 'csv-to-json' || toolId === 'data/csv.to-json') return CSV_TO_JSON_STEPS;
  if (toolId === 'json-to-csv' || toolId === 'data/json.to-csv') return JSON_TO_CSV_STEPS;
  if (toolId === 'timestamp-converter' || toolId === 'data/timestamp.convert')
    return TIMESTAMP_STEPS;
  return null;
}
