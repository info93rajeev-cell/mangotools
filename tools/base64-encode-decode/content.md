---
lastReviewed: 2026-09-25
---

## How to use

1. Choose **Encode** to turn text into Base64, or **Decode** to turn Base64 back into text.
2. Type or paste your input. Text is converted to UTF-8 bytes before encoding, so characters such as ₹ work correctly. The result updates as you type.
3. Pick the alphabet: **Standard** or **URL-safe**. When decoding, **Auto-detect** accepts either. When encoding, you can turn padding off or break lines every 76 characters for MIME.
4. Copy the result, or select **Swap** to move it into the input and reverse the direction.

## FAQ

### Is Base64 encryption?

No. Base64 is an encoding, not encryption. It has no key, and anyone can decode it. Use it to carry binary or non-ASCII data through systems that expect plain text — never to hide passwords or secrets.

### What is URL-safe Base64?

Standard Base64 uses `+` and `/`, which have special meanings in URLs and file names. URL-safe Base64 uses `-` and `_` instead, and the `=` padding is often left out. Both are defined in RFC 4648.

### Why does my decoded text show as unreadable?

Base64 can hold any bytes, not only text. If the decoded bytes are not valid UTF-8 text — for example part of an image or a compressed file — they can't be shown as text, so the tool shows the byte count and a hexadecimal preview instead.

## References

- RFC 4648 — The Base16, Base32, and Base64 Data Encodings (rfc-editor.org)
