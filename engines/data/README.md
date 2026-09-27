# engines/data

Text and data transforms for developer tools. All operations are pure, deterministic and run in a
worker or in Node.

| Operation | Purpose |
|---|---|
| `data.json.format@1` | Lossless format / minify / validate (RFC 8259); numbers and escapes kept exactly as written |
| `data.base64.transform@1` | UTF-8 text ⇄ Base64 (RFC 4648), standard or URL-safe alphabet, optional padding and 76-char MIME lines |
| `data.url.transform@1` | Percent-encoding as a URL component, a full URL, or form data (RFC 3986, WHATWG form encoding) |
| `data.csv.to-json@1` | CSV text to a JSON array of objects (RFC 4180 quoting), first row as headers, values kept as strings |
| `data.json.to-csv@1` | A JSON array of objects (or a single object) to CSV text, with RFC 4180 escaping; nested values rejected |
| `data.timestamp.convert@1` | Unix timestamp ⇄ date/time, seconds or milliseconds, UTC and local browser time |

Error messages for every code are in `src/errors.ts`. Golden fixtures live next to each operation in
`src/operations/<operation>/fixtures/` and run through `tests/unit/engine-fixtures.test.ts`.

## Determinism: `data.timestamp.convert@1` is `worker`-only

Every other operation in this engine declares `runtimes: ['worker', 'node']` and is cross-checked
byte-for-byte between Node and a browser worker by the platform's determinism suite
(`tests/determinism/determinism.spec.ts`, driven by `scripts/generate/pipeline.ts`'s
`determinismCases()`, which only includes fixtures whose operation declares `'node'`).
`data.timestamp.convert@1` is the one exception: its `localDisplay` output field reflects whatever
timezone the running JS engine itself resolves as local (`Date.prototype.toString()`), which is not
portable — a Node test process and a browser can disagree on their own default timezone. Declaring
`runtimes: ['worker']` only (the same generic exclusion mechanism `engines/image/README.md`'s own
"Determinism" section documents for `image.resize@1`) keeps that field out of the cross-environment
hash comparison; every other field (`isoString`, `utcDisplay`, `unixSeconds`, `unixMilliseconds`) is
fully deterministic regardless. The engine's own fixtures and unit tests still run fine in Node
(`tests/unit/engine-fixtures.test.ts` calls operations directly, ignoring `runtimes`); no fixture
asserts an exact `localDisplay` string, and the one unit test that checks it computes its own
expectation from `new Date(...).toString()` in the same process, so it passes on any machine's
timezone rather than only one.

## Changelog
- 0.5.0 — `data.timestamp.convert@1` added (TASK-008G). Converts a Unix timestamp (seconds or
  milliseconds, auto-detected by digit count or chosen explicitly) to a date, and a date/time back to
  a Unix timestamp. Date/time parsing uses a constrained ISO-like regex with the numeric `Date`
  constructors (`Date.UTC` / the local multi-argument form), never the single-argument string
  constructor, so UTC vs. local interpretation is always explicit; a trailing `Z` always means UTC
  regardless of the `basis` param. An 11–12 digit timestamp is a typed "ambiguous length" failure
  rather than a guess; a day/month/hour/minute/second that doesn't exist (e.g. 2023-02-30) is
  rejected rather than silently rolled over. See "Determinism" above for why this one operation is
  `worker`-only.
- 0.4.0 — `data.json.to-csv@1` added (TASK-008E). Header order is the first object's own key order,
  with later-discovered keys appended; missing keys and `null` both become an empty cell. A nested
  object or array value is rejected with a typed error naming the key and item, rather than
  flattened. CSV escaping (`stringify.ts`) is isolated and unit-tested: a value is quoted when it
  has a comma, quote, CR, LF or leading/trailing space, with `"` doubled inside a quoted value.
  Plain `JSON.parse` is used (not the lossless `json-format` parser) since values need to be
  genuine JS values to build rows, and native parse-failure text is discarded in favor of one fixed,
  engine-independent error message, keeping the worker/Node determinism test stable.
- 0.3.0 — `data.csv.to-json@1` added (TASK-008D). Hand-written CSV tokenizer (no `split(',')`):
  quoted fields, doubled `""` escapes, commas/newlines inside quotes, CRLF/LF/lone-CR line endings.
  Duplicate headers and inconsistent row lengths are rejected with a typed error naming the header
  or line; a fully blank line is skipped rather than treated as a row. Values are never coerced from
  strings.
- 0.2.0 — `DATA_JSON_SYNTAX_ERROR` messages use plain words ("Expected a property name in double
  quotes") via a new `expectedText` detail. The error code, `line`, `column`, `offset` and the
  `expected` code are unchanged (TASK-002A A4).
- 0.1.0 — first three operations (TASK-001). `DATA_JSON_TOO_DEEP` (nesting over 512 levels) added to
  protect the worker from stack exhaustion.
