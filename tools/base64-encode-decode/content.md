---
lastReviewed: 2026-11-01
---

## How to use

1. Choose **Encode**, **Decode** or **Auto Detect**. Auto Detect decodes when the input looks like Base64 and encodes everything else; the chosen direction is always highlighted.
2. Pick the input: **Text**, a **File** (any type, encoded byte for byte), an **Image** (encoded as a `data:` URI you can paste into HTML or CSS), or **Base64 (Auto Detect)** to paste Base64 or a data URI to decode.
3. Set the options: line breaks every 76 characters (MIME), `=` padding, URL-safe alphabet and the character encoding (UTF-8 or ISO-8859-1).
4. Copy or download the result, or use **Swap Input ↔ Output** to reverse it. A decoded image is previewed, and any decoded file can be downloaded.

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

**Files, images and data URIs.** A file's bytes are encoded exactly as stored, without any text
conversion. An image is wrapped as `data:<type>;base64,…` (RFC 2397). When decoding, a `data:`
prefix is accepted and PNG, JPEG, GIF, WebP, PDF and ZIP data are recognised from their first
bytes, so an image can be previewed and any file downloaded with the right extension.

**Character encoding.** UTF-8 handles every language. ISO-8859-1 (Latin-1) maps each character to
one byte, as some older systems expect; characters outside it show a clear error.

**Browser-based processing.** The text is encoded and decoded on your own device, in a background
worker, and never sent to a server.

## FAQ

### Is Base64 encryption?

No. Base64 is an encoding, not encryption. It has no key, and anyone can decode it. Use it to carry binary or non-ASCII data through systems that expect plain text — never to hide passwords or secrets.

### What is URL-safe Base64?

Standard Base64 uses `+` and `/`, which have special meanings in URLs and file names. URL-safe Base64 uses `-` and `_` instead, and the `=` padding is often left out. Both are defined in RFC 4648.

### Why does my decoded text show as unreadable?

Base64 can hold any bytes, not only text. If the decoded bytes are not valid UTF-8 text — for example part of an image or a compressed file — they can't be shown as text, so the tool shows the detected file type, the byte count and a hexadecimal preview, with a preview for images and a button to download the file.

### Can I convert an image to Base64?

Yes. Use the **Image** tab: the image is read on your device and turned into a `data:` URI. Paste a Base64 image or data URI into **Base64 (Auto Detect)** to see it again.

## References

- RFC 4648 — The Base16, Base32, and Base64 Data Encodings (rfc-editor.org)
- RFC 2397 — The "data" URL scheme (rfc-editor.org)
- RFC 2045 — Multipurpose Internet Mail Extensions (MIME) Part One: Format of Internet Message Bodies (rfc-editor.org)
