---
lastReviewed: 2026-11-01
---

## How to use

1. Paste your CSV or TSV into the **Text** tab, open a `.csv` / `.tsv` file with **File**, paste
   cells copied from a spreadsheet with **Google Sheet Style**, or load **Sample Data**.
2. By default the first row is read as the column headers. Choose the delimiter, or let
   **Auto detect** pick comma, semicolon, tab or pipe.
3. The result updates as you type. Switch the output between **Formatted JSON**, **Minified JSON**
   and a **Preview Table**.
4. Use **Column Mappings** to leave columns out, and **Output Options** for the JSON shape,
   empty-to-null and a metadata wrapper. Copy, download or open the `.json` result in a new tab.

**What CSV to JSON does:** it converts CSV to JSON entirely in your browser — a free CSV to JSON
converter for turning a CSV to JSON array of objects, using the first row as keys. It is built for
the common case: paste CSV, get valid JSON out.

## Method

**Header row.** The first line of the CSV becomes the object keys for every row after it. A CSV
with headers `name,age` and a data row `Raj,50` becomes `{ "name": "Raj", "age": "50" }`. Header
names are matched exactly as written, including case and spacing.

**Quoted fields and commas inside fields.** A field wrapped in double quotes may contain commas or
line breaks without being split into extra columns — for example `"Lives in NY, USA"` stays one
field. A double quote inside a quoted field is written as two double quotes (`""`), the standard
CSV escape, for example `"He said ""yes"""` becomes the text `He said "yes"`.

**Values stay strings unless you ask.** By default every value in the output JSON is a string,
even when it looks like a number, such as `"age": "50"` rather than `"age": 50`, because guessing
would silently change IDs, postal codes or phone numbers with a leading zero. Turn on **Auto detect
data types** to write numbers and `true`/`false` as JSON numbers and booleans. Even then a value is
converted only when nothing can be lost: `30` becomes `30`, but `00124`, `1.50` and very long
integers stay strings. Dates are never converted.

**Empty and null values.** **Convert empty values to null** writes an empty cell as `null` instead
of `""`. **Custom null values** lets you list exact tokens, such as `NA, N/A`, that should also
become `null`.

**Output shapes.** *Array of objects* (the default) gives one object per row. *Array of arrays*
gives the header row followed by one array per row. *JSON Lines* gives one compact object per line.
**Add metadata** wraps the result as `{ "meta": { "rowCount", "columnCount", "columns" }, "data" }`.

**Browser-based processing.** No upload is required. The CSV you paste is parsed on your own
device, in a background worker, and never sent to a server.

**What this tool does not do.** This is a CSV to JSON converter only — for the reverse direction, use
[JSON to CSV](tool:json-to-csv). It does not read Excel or `.xlsx` files, only plain CSV text. It
does not import data into a database, read live Google Sheets, or use AI to clean up messy data.

**Related developer and data tools.** Once you have JSON, format or validate it with
[JSON Formatter & Validator](tool:json-formatter), or convert it back with
[JSON to CSV](tool:json-to-csv). For other everyday encoding tasks, see
[Base64 Encode & Decode](tool:base64-encode-decode) and [URL Encode & Decode](tool:url-encode-decode).

## FAQ

### Does CSV to JSON use the first row as headers?

Yes, by default the first row is the column headers and every row after it becomes one JSON object
using those headers as keys. Turn off **First row as header** and the columns are named
`column_1`, `column_2` and so on.

### Do the values stay as text, or does it detect numbers?

By default values stay as strings: `age,50` becomes `"age": "50"`. Turn on **Auto detect data
types** to get `"age": 50` and real booleans. Values such as `00124` or `1.50` stay strings even
then, so IDs and codes are never changed.

### Are commas inside quoted fields supported?

Yes. Wrap a field in double quotes to include a comma or a line break inside it, for example
`"Lives in NY, USA"`. A double quote inside such a field is written as two double quotes (`""`).

### Can I use semicolons, tabs or pipes instead of commas?

Yes. Choose the delimiter in **Parsing Options**, or pick **Auto detect** and the tool uses the most
frequent of comma, semicolon, tab and pipe on the first line.

### Can I convert an Excel or .xlsx file?

Not as a file. Export your spreadsheet to CSV first, or select the cells, copy them, and paste
them into the **Google Sheet Style** tab, which reads the tab-separated text a spreadsheet copies.

### Do I need to sign up or install anything?

No. CSV to JSON online, right in your browser, with no account and no installation.

### Does this tool use AI?

No. Conversion is a deterministic, rule-based CSV parser — the same input always produces the same
output.

### Can I convert JSON back to CSV here?

Not on this page, but [JSON to CSV](tool:json-to-csv) does exactly that — the reverse of this tool.

### Is my CSV data uploaded anywhere?

No. Parsing happens entirely in your browser. Nothing you paste is sent to a server.

### What happens if two column headers are the same?

The conversion stops with a clear error naming the duplicate header, rather than silently
overwriting one column's data with another's.

### What happens if a row has too many or too few columns?

The conversion stops with a clear error naming the line number of the row, rather than guessing
which columns are missing or extra.

## References

- RFC 4180 — Common Format and MIME Type for Comma-Separated Values (CSV) Files (rfc-editor.org)
