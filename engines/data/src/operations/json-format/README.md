# data.json.format@1

Parses JSON with a hand-written RFC 8259 parser that keeps every scalar's raw text, then prints it.

- **Lossless:** numbers (`12345678901234567890`, `1.0e+10`) and string escapes (`é`) are copied exactly.
- **format:** indent with 2 spaces, 4 spaces or a tab; empty containers print as `{}` / `[]`; no trailing newline.
- **minify:** removes insignificant whitespace only.
- **validate:** returns `text: ""` plus statistics.
- **sortKeys:** sorts object members by Unicode code point, recursively; stable for duplicate keys.
- Errors report 1-based line/column (UTF-16 code units, tab = 1 column) and the expected token.
- Nesting deeper than 512 levels is rejected (`DATA_JSON_TOO_DEEP`).

Reference: RFC 8259.
