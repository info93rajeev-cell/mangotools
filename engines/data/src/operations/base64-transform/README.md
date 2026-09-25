# data.base64.transform@1

- Encode: UTF-8 bytes of the text → Base64 with the standard (`+/`) or URL-safe (`-_`) alphabet,
  optional `=` padding, optional 76-character lines joined with CRLF (MIME).
- Decode: ignores ASCII whitespace; `variant: auto` accepts both alphabets; padding is optional but
  must be well-formed. When the bytes are not valid UTF-8 the result has `isUtf8: false`, empty text
  and a hex preview of the first 64 bytes.

References: RFC 4648 (§4, §5, §10 test vectors); RFC 2045 §6.8 (line length).
