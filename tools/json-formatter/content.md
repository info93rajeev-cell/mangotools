---
lastReviewed: 2026-09-30
---

## How to use

1. Paste or type your JSON into the input box, or select **Try sample**.
2. Choose **Format**, **Minify** or **Validate**.
3. For Format, pick the indent — 2 spaces, 4 spaces or Tab — and turn on **Sort keys** if you want object keys in alphabetical order.
4. Copy or download the result. If the JSON is invalid, the error shows the line and column; select **Go to** to jump to it.

## Method

**Lossless parsing.** The JSON is read by a parser that follows RFC 8259 and keeps every number and
string escape exactly as written, instead of converting values through JavaScript numbers. That is
why large IDs and values such as `499.00` never change.

**Format, Minify and Validate.** Format prints the same values with 2 spaces, 4 spaces or a tab per
level; **Sort keys** orders object keys by Unicode code point, so `B` comes before `a`. Minify
removes all whitespace between values. Validate only checks the input.

**Errors and warnings.** Invalid JSON stops at the first problem and shows its line, its column and
what was expected there. Duplicate keys are allowed by the standard but are usually a mistake, so
each one is reported as a warning with its position. A byte order mark at the start is removed with
a warning. Nesting deeper than 512 levels and input larger than 50 MB are rejected with a clear
message.

**Browser-based processing.** The JSON is parsed and printed on your own device, in a background
worker, and never sent to a server.

## FAQ

### Does this change my numbers?

No. Numbers are copied exactly as written. A large integer such as 12345678901234567890 or a value such as 499.00 stays the same, unlike tools that convert through JavaScript numbers and silently round large values. String escapes such as `\u00e9` are also kept as written.

### Is my JSON uploaded anywhere?

No. Formatting happens in your browser, in a background worker on your device. Nothing you paste is sent to a server.

### What is the difference between Format and Minify?

Format adds line breaks and indentation so the structure is easy to read. Minify removes all whitespace between values to make the text as small as possible. Both keep the data identical. Validate only checks the JSON and tells you whether it is valid.

### Why is my JSON invalid?

Common causes are a trailing comma after the last item, single quotes instead of double quotes, keys without quotes, comments, and numbers with leading zeros such as 007. Standard JSON allows none of these. The error message names the problem and shows its line and column.

## References

- RFC 8259 — The JavaScript Object Notation (JSON) Data Interchange Format (rfc-editor.org)
