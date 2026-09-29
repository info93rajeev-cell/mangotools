---
lastReviewed: 2026-09-30
---

## How to use

1. Choose **Encode** or **Decode**.
2. Pick the mode: **Component** for a single value such as a query parameter or path segment, **Full URL** to encode a complete address while keeping its structure, or **Form** for HTML form data.
3. Type or paste your text. The result updates as you type.
4. Copy the result, or select **Swap** to move it into the input and reverse the direction.

## Method

**Component mode** percent-encodes every UTF-8 byte except the unreserved characters
`A–Z a–z 0–9 - . _ ~` (RFC 3986 §2.3), with uppercase hex digits — `₹` becomes `%E2%82%B9`.

**Full URL mode** also keeps the reserved characters `: / ? # [ ] @ ! $ & ' ( ) * + , ; =` and any
valid `%XX` escapes already present, so the address keeps its structure. When decoding in this mode,
escapes of reserved characters are kept, so the URL's meaning does not change.

**Form mode** works like Component mode, except that a space is written as `+` and `+` decodes to a
space, as in `application/x-www-form-urlencoded` (WHATWG URL Standard).

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
