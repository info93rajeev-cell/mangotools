# data.url.transform@1

- `component`: percent-encode every UTF-8 byte except the RFC 3986 unreserved set `A–Z a–z 0–9 - . _ ~`.
  Hex digits are uppercase.
- `full-url`: additionally keep reserved characters `: / ? # [ ] @ ! $ & ' ( ) * + , ; =` and existing
  valid `%XX` escapes. Decoding keeps escapes of reserved characters so the URL's meaning is unchanged.
- `form`: like `component`, but space ⇄ `+` (application/x-www-form-urlencoded).
- `changedCount`: characters encoded (encode) or escapes decoded (decode).

References: RFC 3986 §2; WHATWG URL Standard (application/x-www-form-urlencoded).
