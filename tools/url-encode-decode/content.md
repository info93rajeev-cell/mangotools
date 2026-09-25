---
lastReviewed: 2026-09-25
---

## How to use

1. Choose **Encode** or **Decode**.
2. Pick the mode: **Component** for a single value such as a query parameter or path segment, **Full URL** to encode a complete address while keeping its structure, or **Form** for HTML form data.
3. Type or paste your text. The result updates as you type.
4. Copy the result, or select **Swap** to move it into the input and reverse the direction.

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
