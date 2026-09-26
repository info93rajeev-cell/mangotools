# image.resize@1

Resizes a JPG, PNG, or WebP image to the requested dimensions, entirely in the browser. This is the whole
operation — no cropping, no batch processing, no metadata editing beyond what canvas re-encoding already
drops as a side effect (see "Metadata" below).

## Input

| Field | Type | Rule |
|---|---|---|
| `file` | `{ name: string, bytes: Uint8Array }`, optional | The image to resize. Optional so a missing file is a normal validation error (`IMAGE_NO_FILE_SELECTED`), not a schema rejection. |
| `targetWidth`, `targetHeight` | number | The requested output size (or bounding box, with `keepAspectRatio`). |
| `keepAspectRatio` | boolean | See "Resize behavior" below. |
| `outputFormat` | `'same' \| 'jpg' \| 'png' \| 'webp'` | `'same'` resolves to the detected input format. |
| `quality` | number 0–100, optional | Only meaningful for `jpg`/`webp`; ignored for `png` (lossless, no quality knob). |
| `outputFileName` | string, optional | User-entered output name, normalized by `deriveOutputFileName` (see below). |

## Params

Optional, and irrelevant to the operation's own resize/encode behavior — they only steer output-name
wording for a preset that reuses this operation for a different purpose (added for Image Compress,
TASK-005C):

| Param | Meaning |
|---|---|
| `outputFileNameSuffix` | Appended to the original base name; defaults to `-resized` when unset. |
| `outputFileNameFallback` | Used when nothing usable remains in the original name; defaults to `resized-image` when unset. |

## Output

| Field | Meaning |
|---|---|
| `bytes` | The resized image's raw bytes. |
| `fileName` | The normalized output file name. |
| `originalWidth`, `originalHeight` | The decoded source image's own dimensions. |
| `outputWidth`, `outputHeight` | The actual output dimensions (after aspect-ratio fitting, if applied). |
| `originalFileSize`, `outputFileSize` | Byte sizes, before and after. |
| `sizeDifferenceBytes`, `sizeChangePercent` | `originalFileSize - outputFileSize`, and the same as a percentage (`size-change.ts`); positive means the output is smaller. Always populated — useful for a resize too, not Image-Compress-specific. |
| `outputFormat` | The format actually produced — may differ from the requested one only for the WebP-unsupported fallback (see "Format handling"). |

## Validation, in order

1. **File presence.** No file is `IMAGE_NO_FILE_SELECTED`.
2. **Declared type, by signature** (not extension or claimed MIME type): no JPG/PNG/WebP signature is
   `IMAGE_INVALID_FILE_TYPE`.
3. **File size** over 25 MB is `IMAGE_FILE_TOO_LARGE`.
4. **Requested target dimensions**: not a positive integer, or over the single-axis sanity cap
   (`limits.ts`), is `IMAGE_DIMENSIONS_INVALID`. Checked before decoding, since it needs no decode.
5. **Decode.** A file that looks like an image by signature but fails to decode is `IMAGE_UNREADABLE`.
6. **Decoded (source) pixel count** over 40 megapixels is `IMAGE_SOURCE_PIXELS_TOO_LARGE` — checked because
   a small, highly-compressed file can still decode to a very large bitmap; file size alone (step 3) is not
   a sufficient proxy for memory risk.
7. **Computed output pixel count** (after aspect-ratio fitting) over 40 megapixels is
   `IMAGE_OUTPUT_DIMENSIONS_TOO_LARGE` — the same risk from the other direction.
8. **Canvas render / encode** falls back to `IMAGE_RESIZE_FAILED` for any unexpected failure once the
   source has already decoded successfully (except the disclosed WebP fallback, which is not a failure —
   see "Format handling").

This order deliberately differs slightly from a plain top-to-bottom checklist: target-dimension validity
(step 4) is checked *before* decoding (step 5), since it is free and needs no decode, matching the
fail-fast-before-the-expensive-step discipline `pdf.merge@1`/`pdf.jpg-to-pdf@1` already use.

`IMAGE_MEMORY_LIMIT_EXCEEDED` is declared for a detectable out-of-memory condition but is not raised by any
code path in this version — JavaScript has no distinct, reliably catchable error type for browser memory
exhaustion during a canvas operation. It is reserved should a detectable case be found later, and is
covered by a message-exists test now so the copy exists in advance.

## Resize behavior

With `keepAspectRatio: true`, `targetWidth`/`targetHeight` describe a bounding box the source is scaled to
fit inside — like CSS `object-fit: contain` — never cropped, never distorted (`dimensions.ts`'s
`computeOutputDimensions`). With `keepAspectRatio: false`, the output is exactly the requested size, which
may distort the image if its aspect ratio differs from the target's. If the computed output is larger than
the source in either axis, `IMAGE_UPSCALED_QUALITY_LOSS` is added to the warnings — resizing up always
reduces effective quality, so this is stated rather than silently allowed to surprise.

A preset can pass the source's own decoded dimensions back in as `targetWidth`/`targetHeight` (with
`keepAspectRatio: true`, which is then a no-op fit) to re-encode at the original size without resizing —
this is exactly how Image Compress reuses this operation. Separately, whenever the *encoded output* is
larger in bytes than the original file, `IMAGE_OUTPUT_LARGER_THAN_INPUT` is added to the warnings —
regardless of whether the pixel dimensions changed at all.

## Format handling

**Transparency.** JPG has no alpha channel; PNG and WebP both do. Converting from an alpha-capable format
to JPG fills the output canvas with an opaque white background *before* drawing the source image, and adds
`IMAGE_TRANSPARENT_FLATTENED_TO_WHITE` to the warnings. **A real canvas gotcha, not a hypothetical:** an
unfilled canvas is transparent by default, and encoding that straight to JPG (which has no alpha channel)
typically flattens transparent regions to **black**, not white — the explicit fill step exists specifically
to avoid this. The white fill (and its warning) is applied whenever the *format* supports alpha and the
*output* format does not, regardless of whether any pixel in this particular image is actually
transparent — reading actual pixel data to check would need `getImageData`, an extra, avoidable cost for a
statement ("transparent areas will be flattened") that remains true, if vacuously, for a fully-opaque
source.

**WebP support.** `canvas.convertToBlob`'s WebP encoding support is not uniform across browser engines and
has a materially shorter history than JPEG/PNG, especially on WebKit/Safari. A browser that cannot honor a
WebP request may throw, or may silently return a blob of a different type. Both are treated as "WebP not
supported here": the operation retries as PNG and adds `IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG` to the
warnings, rather than failing outright or silently mislabeling the result. **This fallback path is
implemented defensively from the specification and this platform's own architecture planning
(`tasks/TASK-005A-IMAGE-TOOLS-WAVE-PLANNER.md` §3 Q10), not yet exercised against a real
WebP-unsupporting browser** — this sandbox's available browser for local testing supports WebP encoding, so
the fallback branch itself is currently unverified against a genuine failure. Flagged here, not hidden.

## Output file name normalization

`deriveOutputFileName` (`file-name.ts`) never rejects a name — it only cleans one up or falls back:

1. If a user-entered `outputFileName` is given and non-empty after cleanup, use it (extension normalized to
   match the actual output format).
2. Otherwise, derive from the original file name: strip its extension, append the suffix (`-resized`
   unless `params.outputFileNameSuffix` overrides it), sanitize, and add the correct extension
   (`product-photo.jpg` → `product-photo-resized.jpg`).
3. If step 2 leaves nothing usable, fall back to `resized-image.<ext>` (or
   `params.outputFileNameFallback.<ext>`).

Sanitization: trim whitespace, remove characters unsafe across common filesystems (`\ / : * ? " < > |`) and
control characters — the same rule as `pdf.merge@1`/`pdf.jpg-to-pdf@1`'s own `sanitizeOutputFileName`.

## Metadata

Canvas decode/re-encode never reads or writes EXIF or other image metadata, so it is dropped as a side
effect of resizing — not a deliberately engineered privacy feature, just what redrawing to a canvas already
does. This is stated in the standing warnings (`IMAGE_METADATA_NOT_PRESERVED`) rather than assumed silently.

## Limits (founder-approved, `limits.ts`)

| Limit | Value |
|---|---|
| Maximum input file size | 25 MB |
| Maximum decoded (source) pixels | 40 megapixels |
| Maximum output pixels | 40 megapixels |
| Maximum single-axis pixels (either input target) | 20,000 |

## Fixtures and what they can and cannot cover

Only the pre-decode validation paths (steps 1–4 above) can run in Node — see the engine README's "Runtime"
section. `fixtures/` therefore contains **validation-only** cases (no file, wrong type, too large, invalid
dimensions); there is no "successful resize" YAML fixture, because that path requires
`OffscreenCanvas`/`createImageBitmap`, which do not exist in Node. The actual resize/encode pipeline —
including the transparency-flatten and WebP-fallback behavior above — is proven instead by a dev-only,
real-browser Playwright harness (`apps/web/src/pages/[dev]/image-foundation.astro`), asserting decoded
dimensions, format, and warnings rather than byte-identical output. See the engine README's "Determinism"
section for why.
