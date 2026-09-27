---
lastReviewed: 2026-09-27
---

## How to use

1. Choose a direction: **Timestamp → Date** or **Date → Timestamp**.
2. For **Timestamp → Date**, paste a Unix timestamp and pick a unit — **Auto-detect**, **Seconds** or
   **Milliseconds** — or select **Try sample**.
3. For **Date → Timestamp**, type a date/time such as `2023-11-14T22:13:20Z` or `2023-11-14`, and
   choose whether a date/time with no zone should be read as **Local time** or **UTC**.
4. The result updates as you type: an ISO string, UTC date/time, local date/time, and Unix seconds
   and milliseconds. Copy or download the result.

**What Timestamp Converter does:** it is a free Unix timestamp converter and epoch converter for
converting a timestamp to date or a date to timestamp, entirely in your browser.

## Method

**Seconds vs milliseconds.** A Unix timestamp counts seconds (or milliseconds) since 1 January 1970,
00:00:00 UTC. `1700000000` (10 digits) is seconds; `1700000000000` (13 digits) is the same instant in
milliseconds. With **Auto-detect**, a 10-digit-or-shorter number is read as seconds and a 13-digit-or-
longer number as milliseconds; an 11 or 12-digit number is genuinely ambiguous, so this tool asks you
to pick a unit rather than guessing one and risking a wrong date decades off.

**UTC vs local time.** UTC is Coordinated Universal Time, the zone-free reference every other time
zone is defined relative to. This tool always shows the UTC date/time clearly labeled, and separately
shows local date/time — the current time in whatever timezone this browser itself is set to, read
from your device, not a named city you pick. Converting **Date → Timestamp**, a date/time with no
explicit zone (no trailing `Z`) is read using whichever basis — local or UTC — you select; a date/time
that already ends in `Z` is always read as UTC regardless of that choice.

**Browser-based processing.** No upload is required. Every conversion happens on your own device, in
a background worker, and nothing you enter is sent to a server.

**What this tool does not do.** It does not offer a timezone database with named cities — only UTC and
this browser's own local time. It has no calendar widget, no recurring-schedule or cron support, and
it does not parse natural-language dates like "next Tuesday". It converts one timestamp or date/time
per run; it does not batch-convert a column of values (for that, format your data as CSV or JSON
first and use [CSV to JSON](tool:csv-to-json) or [JSON to CSV](tool:json-to-csv) alongside this tool).

**Related developer and data tools.** Format or validate JSON with
[JSON Formatter & Validator](tool:json-formatter), or convert between CSV and JSON with
[CSV to JSON](tool:csv-to-json) and [JSON to CSV](tool:json-to-csv). For other everyday encoding
tasks, see [URL Encode & Decode](tool:url-encode-decode) and
[Base64 Encode & Decode](tool:base64-encode-decode).

## FAQ

### What is a Unix timestamp?

A Unix timestamp (or epoch time) is the number of seconds — or milliseconds — since 1 January 1970,
00:00:00 UTC. It is a single number that represents a point in time, independent of any timezone.

### Is a Unix timestamp in seconds or milliseconds?

Either, depending on the system that produced it. This converter detects seconds vs milliseconds
automatically from the number of digits, or you can select the unit yourself if you already know it.

### How do I convert a timestamp to a date?

Select **Timestamp → Date**, paste the number, and the UTC date/time, local date/time and ISO string
appear immediately.

### How do I convert a date to a timestamp?

Select **Date → Timestamp**, type a date/time such as `2023-11-14T22:13:20Z` or `2023-11-14`, and the
Unix seconds and milliseconds appear immediately.

### What is UTC?

UTC (Coordinated Universal Time) is the time standard the world's timezones are defined as an offset
from. It does not change with daylight saving.

### Why is local time different from UTC?

Local time is UTC adjusted by your device's own timezone offset (and daylight saving, where it
applies). The local result shown here always matches whatever timezone this browser is currently set
to.

### Does this support timezones by city?

No, not in this version. Only UTC and this browser's own local time are shown — there is no picker
for named cities or other timezones.

### Does this upload anything to a server?

No. Every conversion runs in your browser. Nothing you enter is sent anywhere.

### Do I need to sign up?

No. This is a free, online timestamp converter with no account, sign-up or login.

### Can I convert JSON or CSV data too?

Not in this same tool. For JSON, use [JSON Formatter & Validator](tool:json-formatter),
[CSV to JSON](tool:csv-to-json) or [JSON to CSV](tool:json-to-csv) — a single timestamp field inside a
larger JSON or CSV document is not converted automatically by this tool.

## References

- IEEE Std 1003.1 (POSIX) — the Unix time (epoch) definition (ieee.org)
