---
lastReviewed: 2026-09-30
---

## How to use

1. Paste your JSON into the input box, or select **Try sample**.
2. The JSON must be an array of objects, or a single object (treated as one row).
3. The result updates as you type: CSV text with one header row and one row per object.
4. Copy or download the `.csv` result to open in Excel or Google Sheets.

**What JSON to CSV does:** it is a free JSON to CSV converter that turns a JSON array to CSV, or a
single JSON object to CSV, entirely in your browser. It is built for the common case: paste JSON
from an API or export, get a spreadsheet-ready CSV out.

## Method

**Accepted JSON format.** The input must be a JSON array where every item is an object, such as
`[{"name": "Raj", "age": "50"}, {"name": "Aiva", "age": "19"}]`. A single JSON object on its own,
such as `{"name": "Raj", "age": "50"}`, is also accepted and becomes one CSV row.

**Header and column order.** Column headers come from the first object's own key order. If a later
object introduces a key the first object didn't have, that key is appended as a new column, in the
order it is first seen. A row missing a key that other rows have simply gets an empty cell for that
column — objects do not need identical keys.

**How values are escaped.** CSV fields are built with proper escaping, never plain text joining. A
value is wrapped in double quotes if it contains a comma, a double quote, a line break, or leading
or trailing spaces; a double quote inside such a value is written as two double quotes (`""`), the
standard CSV escape. Numbers and booleans are written as plain text (`50`, `true`), not quoted.
Numbers are read as standard JavaScript numbers, so `499.00` is written as `499`, and whole numbers
longer than 15 digits can be rounded — put long IDs in quotes in the JSON to keep them exactly.
`null` and a missing key both become an empty cell.

**Browser-based processing.** No upload is required. The JSON you paste is parsed on your own
device, in a background worker, and never sent to a server.

**What this tool does not do.** This is a JSON to CSV converter only, not a JSON CSV converter that
also reads Excel or `.xlsx` files. Nested objects and arrays inside a value are rejected with a
clear error, rather than being silently flattened into extra columns — flatten your
data to a simple, flat shape (or pick the fields you need) before converting. It does not import
data into a database, infer a schema beyond collecting column names, or use AI to clean up messy
data.

**Related developer and data tools.** For the reverse conversion, see
[CSV to JSON](tool:csv-to-json). Format or validate JSON first with
[JSON Formatter & Validator](tool:json-formatter). For other everyday encoding tasks, see
[Base64 Encode & Decode](tool:base64-encode-decode) and [URL Encode & Decode](tool:url-encode-decode).

## FAQ

### How do I convert JSON to CSV?

Paste a JSON array of objects (or a single object) into the input box. The CSV output — headers and
rows — appears immediately, ready to copy or download.

### Does the JSON need to be an array?

An array of objects is the typical case, but a single JSON object is also accepted and becomes one
CSV row. Anything else at the top level, such as a plain string or number, is rejected with an error.

### Can I convert one JSON object?

Yes. A single object, not wrapped in an array, converts to a header row plus one data row.

### What happens if objects have different keys?

Every key seen across all objects becomes a column. A row that doesn't have a particular key gets an
empty cell for that column, so objects with different (or missing) keys don't cause an error.

### Can it handle nested objects?

No. A value that is itself an object or array is rejected with a clear error naming
the key and the item, rather than being flattened or stringified in a way that might surprise you.

### Are commas and quotes escaped correctly?

Yes. A value containing a comma, a quote, a line break, or leading or trailing spaces is wrapped in
double quotes, with any quote inside it doubled — the standard CSV escaping rule, not simple text
joining.

### Does my JSON upload to a server?

No. Parsing and conversion happen entirely in your browser. Nothing you paste is sent anywhere.

### Can I convert CSV back to JSON?

Yes — see [CSV to JSON](tool:csv-to-json) for the reverse conversion.

### Can I open the CSV in Excel or Google Sheets?

Yes. The output is standard, properly escaped CSV text (UTF-8, without a byte order mark). Google Sheets
reads it directly. If Excel shows characters such as ₹ incorrectly when you double-click the file, import
it with **Data → From Text/CSV** and choose UTF-8.

### Do I need to sign up?

No. This tool works without an account, sign-up, or login — free JSON to CSV, right in your browser.

## References

- RFC 4180 — Common Format and MIME Type for Comma-Separated Values (CSV) Files (rfc-editor.org)
