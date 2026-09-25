# engines/data

Text and data transforms for developer tools. All operations are pure, deterministic and run in a
worker or in Node.

| Operation | Purpose |
|---|---|
| `data.json.format@1` | Lossless format / minify / validate (RFC 8259); numbers and escapes kept exactly as written |
| `data.base64.transform@1` | UTF-8 text ⇄ Base64 (RFC 4648), standard or URL-safe alphabet, optional padding and 76-char MIME lines |
| `data.url.transform@1` | Percent-encoding as a URL component, a full URL, or form data (RFC 3986, WHATWG form encoding) |

Error messages for every code are in `src/errors.ts`. Golden fixtures live next to each operation in
`src/operations/<operation>/fixtures/` and run through `tests/unit/engine-fixtures.test.ts`.

## Changelog
- 0.1.0 — first three operations (TASK-001). `DATA_JSON_TOO_DEEP` (nesting over 512 levels) added to
  protect the worker from stack exhaustion.
