---
lastReviewed: 2026-11-02
---

## How to use

1. Paste your JSON into the input box, open a `.json` file, or select **Load sample**.
2. The JSON can be an array of objects, a single object (treated as one row), or an object that
   holds the records — pick where they are under **Record path**.
3. The table preview, export summary and CSV output update as you type.
4. Choose how nested objects are handled, the delimiter, the header line, a UTF-8 BOM for Excel and
   the formula guard, then copy or download the `.csv` file.

**What JSON to CSV does:** it is a free JSON to CSV converter that turns a JSON array to CSV, or a
single JSON object to CSV, entirely in your browser. It is built for the common case: paste JSON
from an API or export, get a spreadsheet-ready CSV out.

## Method

**Accepted JSON format.** The input must be a JSON array where every item is an object, such as
`[{"name": "Raj", "age": "50"}, {"name": "Aiva", "age": "19"}]`. A single JSON object on its own,
such as `{"name": "Raj", "age": "50"}`, is also accepted and becomes one CSV row.

**Record path.** When the records sit inside a larger document, such as
`{"data": {"items": [...]}}`, choose `$.data.items[*]` under **Record path**. The list offers every
array of objects found up to three levels deep.

**Header and column order.** Column headers come from the first object's own key order. If a later
object introduces a key the first object didn't have, that key is appended as a new column, in the
order it is first seen. A row missing a key that other rows have simply gets an empty cell for that
column — objects do not need identical keys. The **Missing** figure counts those empty cells. Turn
off **Union all keys** to keep only the first object's keys.

**Nested objects and arrays.** By default a nested object is flattened into dot-path columns, so
`{"profile": {"city": "Pune"}}` becomes a `profile.city` column, and an array is written as JSON
text such as `["a","b"]`. Choose **Keep as JSON text** to write every nested object or array as
JSON text in its own column, or **Stop with an error** to reject nested values.

**How values are escaped.** CSV fields are built with proper escaping, never plain text joining. A
value is wrapped in double quotes if it contains a comma, a double quote, a line break, or leading
or trailing spaces; a double quote inside such a value is written as two double quotes (`""`), the
standard CSV escape. With a semicolon, tab or pipe delimiter, a value is quoted when it contains
that delimiter instead. Numbers and booleans are written as plain text (`50`, `true`), not quoted.
Numbers are read as standard JavaScript numbers, so `499.00` is written as `499`, and whole numbers
longer than 15 digits can be rounded — put long IDs in quotes in the JSON to keep them exactly.
`null` and a missing key both become an empty cell. Text such as `00124` stays text in the CSV;
the summary names those columns because a spreadsheet would drop the leading zeros when it opens
the file.

**Spreadsheet safety.** A text cell starting with `=`, `+`, `-`, `@`, a tab or a carriage return can
run as a formula when the CSV is opened in spreadsheet software. Such cells are counted, and the
**Formula guard** prefixes them with `'` so they open as text, following OWASP's CSV injection
guidance. JSON numbers such as `-5` are never changed.

**Browser-based processing.** No upload is required. The JSON you paste is parsed on your own
device, in a background worker, and never sent to a server.

**What this tool does not do.** This is a JSON to CSV converter only, not a JSON CSV converter that
also reads Excel or `.xlsx` files. It does not import
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

Yes. Nested objects are flattened into dot-path columns such as `profile.city`, and arrays are
written as JSON text. You can instead keep every nested value as JSON text, or stop with an error
that names the key and the item.

### Are commas and quotes escaped correctly?

Yes. A value containing a comma, a quote, a line break, or leading or trailing spaces is wrapped in
double quotes, with any quote inside it doubled — the standard CSV escaping rule, not simple text
joining.

### Does my JSON upload to a server?

No. Parsing and conversion happen entirely in your browser. Nothing you paste is sent anywhere.

### Can I convert CSV back to JSON?

Yes — see [CSV to JSON](tool:csv-to-json) for the reverse conversion.

### Can I open the CSV in Excel or Google Sheets?

Yes. The output is standard, properly escaped UTF-8 CSV text, which Google Sheets reads directly. If
Excel shows characters such as ₹ incorrectly when you double-click the file, tick **UTF-8 BOM** before
downloading, or import it with **Data → From Text/CSV** and choose UTF-8.

### Do I need to sign up?

No. This tool works without an account, sign-up, or login — free JSON to CSV, right in your browser.

## References

- RFC 4180 — Common Format and MIME Type for Comma-Separated Values (CSV) Files (rfc-editor.org)
- OWASP — CSV Injection (owasp.org)
