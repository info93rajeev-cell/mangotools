---
lastReviewed: 2026-09-25
---

## How to use

1. Paste or type your JSON into the input box, or select **Try sample**.
2. Choose **Format**, **Minify** or **Validate**.
3. For Format, pick the indent — 2 spaces, 4 spaces or Tab — and turn on **Sort keys** if you want object keys in alphabetical order.
4. Copy or download the result. If the JSON is invalid, the error shows the line and column; select **Go to** to jump to it.

## FAQ

### Does this change my numbers?

No. Numbers are copied exactly as written. A large integer such as 12345678901234567890 or a value such as 499.00 stays the same, unlike tools that convert through JavaScript numbers and silently round large values. String escapes such as `é` are also kept as written.

### Is my JSON uploaded anywhere?

No. Formatting happens in your browser, in a background worker on your device. Nothing you paste is sent to a server.

### What is the difference between Format and Minify?

Format adds line breaks and indentation so the structure is easy to read. Minify removes all whitespace between values to make the text as small as possible. Both keep the data identical. Validate only checks the JSON and tells you whether it is valid.

### Why is my JSON invalid?

Common causes are a trailing comma after the last item, single quotes instead of double quotes, keys without quotes, comments, and numbers with leading zeros such as 007. Standard JSON allows none of these. The error message names the problem and shows its line and column.

## References

- RFC 8259 — The JavaScript Object Notation (JSON) Data Interchange Format (rfc-editor.org)
