# image.favicon@1

Generates a single square PNG favicon from a JPG, PNG, or WebP image, entirely in the browser. This is the
whole operation for v1 — one size per run (no multi-size pack, no `.ico`, no batch processing).

## Input

| Field | Type | Rule |
|---|---|---|
| `file` | `{ name: string, bytes: Uint8Array }`, optional | The source image. Optional so a missing file is a normal validation error (`IMAGE_NO_FILE_SELECTED`), not a schema rejection. |
| `size` | `'16' \| '32' \| '48' \| '180' \| '192' \| '512'` | The requested favicon's width and height in pixels (always square). A string enum, not a number — the UI sends every `kind: enum` select field's value as a string (see `packages/ui/src/archetypes/useFileTool.ts`'s `fieldInputValue`); parsed with `Number()` in `operation.ts`. Fully constrained by the preset's `<select>`, so an invalid value is rejected by the schema itself as a generic `INVALID_INPUT`, matching `image.crop@1`'s own `outputFormat` precedent for a select-constrained field. |
| `outputFileName` | string, optional | User-entered output name, normalized by `deriveOutputFileName` (see `lib/file-name.ts`). |

## Output

| Field | Meaning |
|---|---|
| `bytes` | The generated favicon's raw PNG bytes. |
| `fileName` | The normalized output file name (`-favicon-{size}` suffix by default, e.g. `logo-favicon-32.png`). |
| `originalWidth`, `originalHeight` | The decoded source image's own dimensions. |
| `outputSize` | The generated favicon's width and height (always equal — the output is always square). |
| `originalFileSize`, `outputFileSize` | Byte sizes, before and after. |
| `sizeDifferenceBytes`, `sizeChangePercent` | Same shape as `image.resize@1`'s own (`lib/size-change.ts`); positive means the output is smaller. |
| `originalFormat` | The source's own detected format, by signature. |
| `outputFormat` | Always `'png'` in v1 — see "Format" below for why `.ico` is deferred. |

## Validation, in order

1. **File presence.** No file is `IMAGE_NO_FILE_SELECTED`.
2. **Declared type, by signature** (not extension or claimed MIME type): no JPG/PNG/WebP signature is
   `IMAGE_INVALID_FILE_TYPE`.
3. **File size** over 25 MB is `IMAGE_FILE_TOO_LARGE`.
4. **Decode.** A file that looks like an image by signature but fails to decode is `IMAGE_UNREADABLE`.
5. **Decoded (source) pixel count** over 40 megapixels is `IMAGE_SOURCE_PIXELS_TOO_LARGE` — the same shared
   cap `image.resize@1`/`image.crop@1` use (`lib/limits.ts`).
6. **Canvas render / encode** falls back to `IMAGE_FAVICON_FAILED` for any unexpected failure once the
   source has already decoded successfully.

`IMAGE_MEMORY_LIMIT_EXCEEDED` is declared, matching every other operation in this engine, but is not raised
by any code path in this version for the same reason documented in `image.resize@1`'s own README: there is
no distinct, reliably catchable JavaScript error type for browser memory exhaustion during a canvas
operation.

## Favicon generation behavior

**Square fit: center-crop, not letterbox.** A non-square source image is center-cropped to a square first
(cropping the longer axis, centered on the shorter axis), then that square is scaled to `size` x `size`
(`canvas-pipeline.ts`'s `renderFavicon`, using the same 9-argument `drawImage` overload `image.crop@1` added
to `browser-globals.d.ts`). This was chosen over "fit inside the square with padding" specifically because
it needs no background-color decision: the output canvas is always entirely filled by the source image, so
there is never a transparent-vs-white choice to make or document. If the source has an alpha channel (PNG,
WebP), any transparency in the cropped region is preserved as-is into the PNG output.

**Always PNG.** Every other Image & Media tool lets the user choose an output format; this operation does
not — favicons are conventionally PNG, and `.ico` generation would require either a new (currently
unapproved) dependency or hand-rolled binary `.ico` container encoding, both out of scope for v1. This is a
deliberate, disclosed simplification, not an oversight — see `tools/favicon-generator/content.md`'s FAQ.

**Warnings.** Every run carries the engine's own standing warnings (`IMAGE_VERIFY_OUTPUT`,
`IMAGE_METADATA_NOT_PRESERVED`, `IMAGE_LARGE_IMAGES_MAY_FAIL`) plus two favicon-specific standing warnings
(`IMAGE_FAVICON_ENCODER_SIZE_VARIES`, `IMAGE_FAVICON_NOT_LOGO_TOOL`). Three more are conditional:
`IMAGE_FAVICON_CROPPED_TO_SQUARE` when the source is not already square, `IMAGE_FAVICON_SOURCE_TOO_SMALL`
when the source's shorter side is smaller than the requested `size` (the output is being upscaled),
`IMAGE_FAVICON_SMALL_SIZE_DETAIL_LOSS` when `size` is 16 or 32 (the sizes where a complex source image is
most likely to lose visible detail), and `IMAGE_OUTPUT_LARGER_THAN_INPUT` (shared with every other operation
in this engine) if the generated favicon happens to be larger than the original file.

## Output file name normalization

Reuses `lib/file-name.ts`'s `deriveOutputFileName` unchanged, with this operation's own style
(`suffix: '-favicon-{size}'`, `fallbackBase: 'favicon'`) — the same mechanism every other Image & Media tool
already uses for its own wording. The size is baked into the suffix (rather than left generic) so that
generating a few different sizes from the same source image in separate runs does not silently overwrite
the same downloaded file name.

## Fixtures and what they can and cannot cover

Only the pre-decode validation paths (steps 1–3 above) can run in Node — see the engine README's "Runtime"
section. `fixtures/` therefore contains **validation-only** cases (no file, wrong type, file too large);
there is no "successful favicon" fixture, because that requires `OffscreenCanvas`/`createImageBitmap` to
decode a real image first, which do not exist in Node. The actual crop-to-square/scale/encode pipeline is
covered by Playwright e2e tests instead (`tests/e2e/image-tools.spec.ts`), asserting the generated favicon's
decoded dimensions and format rather than byte-identical output. See the engine README's "Determinism"
section for why.
