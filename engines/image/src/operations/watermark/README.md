# image.watermark@1

Draws a text watermark onto a JPG, PNG, or WebP image at a chosen position, entirely in the browser. This
is the whole operation for v1 — no logo/image watermark, no drag-to-position, no tiling, no rotation, no
batch processing.

## Input

| Field | Type | Rule |
|---|---|---|
| `file` | `{ name: string, bytes: Uint8Array }`, optional | The image to watermark. Optional so a missing file is a normal validation error (`IMAGE_NO_FILE_SELECTED`), not a schema rejection. |
| `text` | string | The watermark caption. Trimmed and checked non-empty and length-capped in `validate.ts` (`IMAGE_WATERMARK_TEXT_REQUIRED`/`IMAGE_WATERMARK_TEXT_TOO_LONG`), not by the schema alone, so each gets its own plain-English message. |
| `position` | `'top-left' \| 'top-right' \| 'center' \| 'bottom-left' \| 'bottom-right'` | An anchor preset. No free-drag placement in v1. |
| `opacity` | number 10-100 | A schema-level range (matching `quality`'s own pattern) — a value outside it is a generic schema rejection, since the UI's own control (a slider/number input) never produces one in normal use. |
| `fontSize` | number 8-200 (px) | Same schema-level-range treatment as `opacity`. |
| `color` | string, `#rrggbb` | Matches what an `<input type="color">` always emits; a schema-level regex check. |
| `outputFormat` | `'same' \| 'jpg' \| 'png' \| 'webp'` | `'same'` resolves to the detected input format. |
| `quality` | number 0-100, optional | Only meaningful for `jpg`/`webp`; ignored for `png` (lossless, no quality knob). |
| `outputFileName` | string, optional | User-entered output name, normalized by `deriveOutputFileName` (see `lib/file-name.ts`). |

## Output

| Field | Meaning |
|---|---|
| `bytes` | The watermarked image's raw bytes. |
| `fileName` | The normalized output file name (`-watermarked` suffix by default). |
| `originalWidth`/`originalHeight`, `outputWidth`/`outputHeight` | Always equal — this operation never resizes; both are reported for the same reason Image Resize reports them, and so a preset can show "size unchanged" explicitly rather than by omission. |
| `originalFileSize`, `outputFileSize` | Byte sizes, before and after. |
| `sizeDifferenceBytes`, `sizeChangePercent` | Same shape as `image.resize@1`'s own (`lib/size-change.ts`); positive means the output is smaller. |
| `originalFormat`, `outputFormat` | The source's own detected format, and the format actually produced (may differ from requested only for the WebP-unsupported fallback). |
| `watermarkText`, `position`, `opacity`, `fontSize`, `color` | Echo the resolved request, so a result view can show exactly what was applied without remembering its own inputs. |

## Validation, in order

1. **File presence.** No file is `IMAGE_NO_FILE_SELECTED`.
2. **Declared type, by signature** (not extension or claimed MIME type): no JPG/PNG/WebP signature is
   `IMAGE_INVALID_FILE_TYPE`.
3. **File size** over 25 MB is `IMAGE_FILE_TOO_LARGE`.
4. **Watermark text**: missing, empty, or whitespace-only is `IMAGE_WATERMARK_TEXT_REQUIRED`; over 100
   characters (`limits.ts`'s `MAX_WATERMARK_TEXT_LENGTH`) is `IMAGE_WATERMARK_TEXT_TOO_LONG`. Checked before
   decoding, since neither needs a decode. `text` is optional at the **schema** level specifically so a
   genuinely missing key (the real UI never sends an empty field at all — see
   `packages/ui/src/archetypes/useFileTool.ts`'s `extraInputValues`) reaches this specific message rather
   than the generic `INVALID_INPUT` a required-but-absent schema field would otherwise produce.
5. **Decode.** A file that looks like an image by signature but fails to decode is `IMAGE_UNREADABLE`.
6. **Decoded (source) pixel count** over 40 megapixels is `IMAGE_SOURCE_PIXELS_TOO_LARGE` — the same shared
   cap `image.resize@1` uses (`lib/limits.ts`), since this operation never resizes and so has no separate
   *output*-pixel-cap direction to also check.
7. **Canvas render / encode** falls back to `IMAGE_WATERMARK_FAILED` for any unexpected failure once the
   source has already decoded successfully (except the disclosed WebP fallback, which is not a failure —
   see `image.resize@1`'s own README "Format handling").

Position, opacity, font size, and color are all validated at the **schema** level (enum/range/regex), not
by a bespoke check in `validate.ts` — matching `outputFormat`'s own established precedent in this engine,
since each is UI-constrained (a select, a bounded number input, and a color picker respectively) and does
not need its own plain-English message the way a free-typed field like watermark text does.

## Drawing behavior

The source image is drawn once, at its own natural size (never scaled), onto a fresh canvas exactly that
size — this operation's whole job is adding text, not resizing. The watermark text is then drawn on top at
one of five anchor positions (`canvas-pipeline.ts`'s `watermarkOrigin`), using `ctx.textBaseline = 'top'` so
`fontSize` alone is a good enough approximation of the text's own rendered height without needing per-glyph
metrics. A caption wider than a very small source image is clamped to start no further left/up than 0,
rather than drawing off-canvas.

**Font.** A generic `sans-serif` family stack is used — no custom font loading, and no claim that the exact
typeface is identical across browsers or operating systems (it is not; this is the same disclosed
cross-browser variance every canvas-text operation has).

**Transparency and format handling.** Identical to `image.resize@1`: converting from an alpha-capable
source (PNG, WebP) to JPG fills the canvas with white before drawing, with `IMAGE_TRANSPARENT_FLATTENED_TO_WHITE`
added to the warnings; an *explicit* same-format request (not `outputFormat: 'same'` itself) adds
`IMAGE_SAME_FORMAT_REENCODED`; an output larger than the input adds `IMAGE_OUTPUT_LARGER_THAN_INPUT`; and an
unsupported WebP request falls back to PNG with `IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG`. See
`image.resize@1`'s own README "Format handling" for the full rationale — reused here verbatim, not
reimplemented differently.

## Not legal protection

`IMAGE_WATERMARK_NOT_LEGAL_PROTECTION` is a standing warning on every successful result: this tool adds a
*visible* text watermark only. It does not embed any cryptographic or forensic proof of ownership, and does
not by itself create or prove legal copyright protection — content and warnings must never imply otherwise.

## Output file name normalization

Reuses `lib/file-name.ts`'s `deriveOutputFileName` unchanged, with this operation's own style
(`suffix: '-watermarked'`, `fallbackBase: 'watermarked-image'`) — the same mechanism Image Compress, Image
Format Converter, and Image Metadata Remover already use for their own wording.

## Fixtures and what they can and cannot cover

Only the pre-decode validation paths (steps 1–4 above) can run in Node — see the engine README's "Runtime"
section. `fixtures/` therefore contains **validation-only** cases (no file, wrong type, missing watermark
text, watermark text too long); there is no "successful watermark" YAML fixture, because that path requires
`OffscreenCanvas`/`createImageBitmap`, which do not exist in Node. The actual draw/encode pipeline is
covered by Playwright e2e tests instead (`tests/e2e/file-tools.spec.ts`), asserting decoded dimensions,
format, and the applied watermark settings rather than byte-identical output. See the engine README's
"Determinism" section for why.
