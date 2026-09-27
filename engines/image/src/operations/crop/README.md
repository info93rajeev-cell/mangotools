# image.crop@1

Crops a JPG, PNG, or WebP image to a pixel rectangle, entirely in the browser. This is the whole operation
for v1 — no drag/interactive selection, no aspect-ratio presets, no batch processing.

## Input

| Field | Type | Rule |
|---|---|---|
| `file` | `{ name: string, bytes: Uint8Array }`, optional | The image to crop. Optional so a missing file is a normal validation error (`IMAGE_NO_FILE_SELECTED`), not a schema rejection. |
| `cropX`, `cropY` | number (pixels) | The crop rectangle's top-left corner, measured from the source image's own top-left. Checked (non-negative integer) in `validate.ts`, matching `image.resize@1`'s own `targetWidth`/`targetHeight` precedent. |
| `cropWidth`, `cropHeight` | number (pixels) | The crop rectangle's own size — also the exact output size, since this operation never scales. Checked (positive integer) in `validate.ts`. |
| `outputFormat` | `'same' \| 'jpg' \| 'png' \| 'webp'` | `'same'` resolves to the detected input format. |
| `quality` | number 0-100, optional | Only meaningful for `jpg`/`webp`; ignored for `png` (lossless, no quality knob). |
| `outputFileName` | string, optional | User-entered output name, normalized by `deriveOutputFileName` (see `lib/file-name.ts`). |

## Output

| Field | Meaning |
|---|---|
| `bytes` | The cropped image's raw bytes. |
| `fileName` | The normalized output file name (`-cropped` suffix by default). |
| `originalWidth`, `originalHeight` | The decoded source image's own dimensions. |
| `outputWidth`, `outputHeight` | Always equal to `cropWidth`/`cropHeight` — this operation only ever crops, never separately resizes. |
| `cropX`, `cropY`, `cropWidth`, `cropHeight` | Echo the resolved crop rectangle, so a result view can show exactly what was applied. |
| `originalFileSize`, `outputFileSize` | Byte sizes, before and after. |
| `sizeDifferenceBytes`, `sizeChangePercent` | Same shape as `image.resize@1`'s own (`lib/size-change.ts`); positive means the output is smaller. |
| `originalFormat`, `outputFormat` | The source's own detected format, and the format actually produced (may differ from requested only for the WebP-unsupported fallback). |

## Validation, in order

1. **File presence.** No file is `IMAGE_NO_FILE_SELECTED`.
2. **Declared type, by signature** (not extension or claimed MIME type): no JPG/PNG/WebP signature is
   `IMAGE_INVALID_FILE_TYPE`.
3. **File size** over 25 MB is `IMAGE_FILE_TOO_LARGE`.
4. **Crop position** (`cropX`/`cropY`): not a non-negative integer is `IMAGE_CROP_POSITION_INVALID`.
5. **Crop size** (`cropWidth`/`cropHeight`): not a positive integer is `IMAGE_CROP_SIZE_INVALID`. Both 4
   and 5 are checked before decoding, since neither needs one.
6. **Decode.** A file that looks like an image by signature but fails to decode is `IMAGE_UNREADABLE`.
7. **Decoded (source) pixel count** over 40 megapixels is `IMAGE_SOURCE_PIXELS_TOO_LARGE` — the same shared
   cap `image.resize@1` uses (`lib/limits.ts`).
8. **Crop rectangle bounds**: `cropX + cropWidth` or `cropY + cropHeight` exceeding the decoded image's own
   width/height is `IMAGE_CROP_OUT_OF_BOUNDS` — checked only once the real dimensions are known, with the
   actual width/height included in the error's `details` so the message can state them plainly (there is no
   natural-size prefill in the v1 UI, so a rejected first attempt telling the user the real dimensions is
   the way they find out what to enter instead).
9. **Canvas render / encode** falls back to `IMAGE_CROP_FAILED` for any unexpected failure once the source
   has already decoded successfully (except the disclosed WebP fallback, which is not a failure — see
   `image.resize@1`'s own README "Format handling").

## Cropping behavior

The source bitmap is never scaled — only the `(cropX, cropY, cropWidth, cropHeight)` source rectangle is
drawn, onto a fresh canvas of exactly that size (`canvas-pipeline.ts`'s `renderCropped`, using the 9-argument
form of `drawImage` that draws a source sub-rectangle rather than the whole bitmap). The output dimensions
are therefore always identical to the requested crop size — there is no separate "resize after crop" step in
v1.

**Transparency and format handling.** Identical to `image.resize@1`: converting from an alpha-capable source
(PNG, WebP) to JPG fills the canvas with white before drawing, with `IMAGE_TRANSPARENT_FLATTENED_TO_WHITE`
added to the warnings; an *explicit* same-format request (not `outputFormat: 'same'` itself) adds
`IMAGE_SAME_FORMAT_REENCODED`; an output larger than the input adds `IMAGE_OUTPUT_LARGER_THAN_INPUT`; and an
unsupported WebP request falls back to PNG with `IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG`. See
`image.resize@1`'s own README "Format handling" for the full rationale — reused here verbatim, not
reimplemented differently.

## Output file name normalization

Reuses `lib/file-name.ts`'s `deriveOutputFileName` unchanged, with this operation's own style
(`suffix: '-cropped'`, `fallbackBase: 'cropped-image'`) — the same mechanism every other Image & Media tool
already uses for its own wording.

## Fixtures and what they can and cannot cover

Only the pre-decode validation paths (steps 1–5 above) can run in Node — see the engine README's "Runtime"
section. `fixtures/` therefore contains **validation-only** cases (no file, wrong type, invalid crop
position, invalid crop size); there is no "successful crop" or "out of bounds" YAML fixture, because both
require `OffscreenCanvas`/`createImageBitmap` to decode a real image first, which do not exist in Node. The
actual crop/encode pipeline, including the out-of-bounds check, is covered by Playwright e2e tests instead
(`tests/e2e/file-tools.spec.ts`), asserting decoded dimensions, format, and the applied crop rectangle rather
than byte-identical output. See the engine README's "Determinism" section for why.
