---
lastReviewed: 2026-11-01
---

## How to use

1. Choose **Encode** or **Decode**, and the encode type: **URL Encode (RFC 3986)** for a single value such as a query parameter, **Full URL** to keep the address structure, or **Form data** for HTML forms.
2. Type or paste text in the **Text** tab (each line is encoded on its own), open a text **File**, or build a query string from rows in **Query** (with an optional base URL) or **Form Data**.
3. Adjust the switches: spaces as `%20` or `+`, encode `! ' ( ) *`, keep existing `%XX` escapes, convert line breaks to CRLF, and encode each line separately.
4. Copy, download or open the result in a new tab, or use **Swap Input ⇄ Output** to reverse it. The **URL Inspector** shows the scheme, host, path and decoded query parameters.

## Method

**Component mode** percent-encodes every UTF-8 byte except the unreserved characters
`A–Z a–z 0–9 - . _ ~` (RFC 3986 §2.3), with uppercase hex digits — `₹` becomes `%E2%82%B9`.

**Full URL mode** also keeps the reserved characters `: / ? # [ ] @ ! $ & ' ( ) * + , ; =` and any
valid `%XX` escapes already present, so the address keeps its structure. When decoding in this mode,
escapes of reserved characters are kept, so the URL's meaning does not change.

**Form mode** works like Component mode, except that a space is written as `+` and `+` decodes to a
space, as in `application/x-www-form-urlencoded` (WHATWG URL Standard).

**Options.** *Encode spaces as %20* off writes a space as `+`. *Encode special characters* off
leaves `! ' ( ) *` as they are, like JavaScript's `encodeURIComponent`. *Keep existing encoding*
leaves valid `%XX` escapes untouched, so text that is already encoded is not encoded twice
(RFC 3986 §2.4). *Convert line breaks (CRLF)* turns every line break into CR LF first, as HTML forms
send them. *Encode each line separately* keeps the line breaks and treats every line on its own.

**Query and Form Data rows.** Each key and value is encoded on its own and joined as
`key=value&key=value`, so an `&` or `=` inside a value can never break the query.

**Decoding** checks every `%XX` escape and the UTF-8 it produces; a malformed escape or invalid UTF-8
shows a clear error instead of a partly decoded result.

**Browser-based processing.** The text is encoded and decoded on your own device, in a background
worker, and never sent to a server.

## FAQ

### When should I encode a component vs a full URL?

Encode a component when you insert one value into a URL — a search term, a file name or a redirect address. Component mode encodes every character except letters, digits and `- . _ ~`, so characters such as `&`, `=` and `/` can't change the meaning of the URL. Full URL mode keeps reserved characters such as `:`, `/`, `?`, `&` and `=`, and existing `%XX` escapes, so the address still works; it encodes spaces, non-ASCII characters and other unsafe characters.

### Why do spaces become %20 or +?

In a URL, a space is encoded as `%20`. In HTML form data (`application/x-www-form-urlencoded`) a space becomes `+`. Use Form mode for query strings produced by HTML forms, and Component mode everywhere else.

### Why does decoding fail?

Decoding fails when a `%` is not followed by two hexadecimal digits — for example `%G1` or a lone `%` — or when the decoded bytes are not valid UTF-8 text. The error message tells you which problem was found.

## References

- RFC 3986 — Uniform Resource Identifier (URI): Generic Syntax (rfc-editor.org)
- WHATWG URL Standard — application/x-www-form-urlencoded (url.spec.whatwg.org)
