# engines/data

Text and data transforms for developer tools. All operations are pure, deterministic and run in a
worker or in Node.

| Operation | Purpose |
|---|---|
| `data.json.format@1` | Lossless format / minify / validate (RFC 8259); numbers and escapes kept exactly as written |
| `data.base64.transform@1` | UTF-8 text ⇄ Base64 (RFC 4648), standard or URL-safe alphabet, optional padding and 76-char MIME lines; UTF-8 or Latin-1/raw bytes, data URIs, file-type detection on decode |
| `data.url.transform@1` | Percent-encoding as a URL component, a full URL, or form data (RFC 3986, WHATWG form encoding) |
| `data.csv.to-json@1` | CSV text to JSON (RFC 4180 quoting). Defaults: comma, first row as headers, values kept as strings. Optional params: delimiter (incl. auto), no header row, trim, skip empty rows, lossless type inference, empty/custom tokens as null, max rows, excluded columns, objects/arrays/NDJSON shape, metadata wrapper. Reports each column's JSON type |
| `data.json.to-csv@1` | A JSON array of objects (or a single object) to CSV text, with RFC 4180 escaping. Defaults: comma, header line, union of keys, nested values rejected. Optional params: delimiter, no header line, first-record keys only, nested values flattened to dot paths or written as JSON text, a record path inside the document, and a formula guard. Reports missing cells, formula-like cells, leading-zero columns, candidate record paths and a 100-row preview |
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
- 0.9.1 — `data.json.to-csv@1` keeps large integers exact: 12345678901234567890 is written as
  given instead of JSON.parse's 12345678901234567000 (lossless parse, `lossless.ts`). All existing
  fixtures unchanged.
- 0.9.0 — `data.json.to-csv@1` gains optional, additive params; defaults reproduce the previous
  output (all 10 existing fixtures unchanged). `delimiter` (comma/semicolon/tab/pipe; a value is
  quoted when it contains the chosen delimiter), `header` (off → no header line), `keys` (`union`
  default, or `first` = only the first record's keys), `nested` (`reject` default; `flatten` →
  dot-path columns such as `profile.city`, arrays as JSON text; `json` → every object or array as
  JSON text), `recordPath` (dot path to the records, e.g. `data.items`; missing → typed error
  `DATA_JSON_TO_CSV_RECORD_PATH_NOT_FOUND`) and `formulaGuard` (prefix `'` to text cells starting
  with = + - @ tab or CR, per OWASP CSV injection guidance; JSON numbers are never changed). New
  outputs: `missingCount`, `formulaCount`, `leadingZeroColumns`, `recordPaths` and `previewRows`
  (the first 100 rows as written cell texts, for a table preview).
- 0.8.0 — `data.url.transform@1` gains optional, additive params; defaults reproduce the
  previous output (all 9 fixtures unchanged). `space` (by mode / always `%20` / always `+`; on
  decode `plus` also reads `+` as a space), `encodeSubDelims` (off leaves `! ' ( ) *` like
  `encodeURIComponent`), `keepEscapes` (no double encoding of valid `%XX`), `crlf` (line breaks to
  CRLF before encoding), `perLine` (each line on its own, breaks kept) and `source: pairs` (a JSON
  array of [key, value] encoded into `k=v&…`; unreadable → `DATA_URL_INVALID_PAIRS`). New output
  `params`: the query parameters, read from the encoded side when it still shows `?`/`=` (decoded
  with form rules), otherwise from the first line of the decoded side (max 200).
- 0.7.0 — `data.base64.transform@1` gains optional, additive params; defaults reproduce the
  previous output (all 15 fixtures unchanged). `charset` (`utf-8` default, or `latin1` = one
  character per byte, which is also how a file's raw bytes are passed in; a character above 255 is
  the typed error `DATA_BASE64_NOT_LATIN1`), `dataUriMime` (encode to `data:<mime>;base64,…`,
  never line-wrapped) and `stripDataUri` (decode accepts a data URI prefix). New outputs:
  `inputByteLength`, `binary` (decoded bytes as a latin1 string when they are not UTF-8 or charset
  is latin1) and `mime` (from a data URI prefix, or PNG/JPEG/GIF/WebP/PDF/ZIP magic numbers).
- 0.6.0 — `data.csv.to-json@1` gains optional, additive params; every default keeps the 0.3.0
  output byte-for-byte (all existing fixtures unchanged). `delimiter` (comma/semicolon/tab/pipe, or
  `auto` = most frequent on the first line outside quotes), `header` (off → `column_1…`), `trim`,
  `skipEmptyRows`, `inferTypes` (off by default; a value becomes a number only when its text is
  the exact `String(Number(x))` form, so `00124`, `1.50` and integers past 2^53 stay strings;
  `true`/`false` any case → boolean), `emptyAsNull`, `nullValues` (comma-separated exact tokens),
  `maxRows` (warning `DATA_CSV_ROWS_LIMITED`), `excludeColumns` (1-based numbers), `shape`
  (objects/arrays/ndjson) and `metadata`. New outputs: `columns` (name, JSON type, sample,
  included), resolved `delimiter`, `sourceRowCount`. Row objects use a null prototype so a
  `__proto__` header stays a plain key.
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
