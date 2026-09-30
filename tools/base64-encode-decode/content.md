---
lastReviewed: 2026-09-30
---

## How to use

1. Choose **Encode** to turn text into Base64, or **Decode** to turn Base64 back into text.
2. Type or paste your input. Text is converted to UTF-8 bytes before encoding, so characters such as ₹ work correctly. The result updates as you type.
3. Pick the alphabet: **Standard** or **URL-safe**. When decoding, **Auto-detect** accepts either. When encoding, you can turn padding off or break lines every 76 characters for MIME.
4. Copy the result, or select **Swap** to move it into the input and reverse the direction.

## Method

**Encoding.** The text is first converted to UTF-8 bytes. Every group of three bytes then becomes four
characters from the chosen alphabet: Standard uses `+` and `/`, URL-safe uses `-` and `_` (RFC 4648
§4 and §5). When the last group is short, `=` padding completes it unless you turn padding off. With
**76 characters (MIME)**, the result is broken into 76-character lines joined with CRLF, the line
length RFC 2045 sets for email.

**Decoding.** Spaces and line breaks in the input are ignored, and **Auto-detect** accepts both
alphabets. Padding is optional, but when present it must be well formed. An invalid character (with
its position) or an invalid length shows a clear error instead of a partial result. If the decoded
bytes are not valid UTF-8 text, the tool shows the byte count and a hexadecimal preview of the first
64 bytes instead of garbled text.

**Browser-based processing.** The text is encoded and decoded on your own device, in a background
worker, and never sent to a server.

## FAQ

### Is Base64 encryption?

No. Base64 is an encoding, not encryption. It has no key, and anyone can decode it. Use it to carry binary or non-ASCII data through systems that expect plain text — never to hide passwords or secrets.

### What is URL-safe Base64?

Standard Base64 uses `+` and `/`, which have special meanings in URLs and file names. URL-safe Base64 uses `-` and `_` instead, and the `=` padding is often left out. Both are defined in RFC 4648.

### Why does my decoded text show as unreadable?

Base64 can hold any bytes, not only text. If the decoded bytes are not valid UTF-8 text — for example part of an image or a compressed file — they can't be shown as text, so the tool shows the byte count and a hexadecimal preview instead.

## References

- RFC 4648 — The Base16, Base32, and Base64 Data Encodings (rfc-editor.org)
- RFC 2045 — Multipurpose Internet Mail Extensions (MIME) Part One: Format of Internet Message Bodies (rfc-editor.org)
