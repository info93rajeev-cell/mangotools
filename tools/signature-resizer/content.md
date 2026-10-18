---
lastReviewed: 2026-10-18
---

## How to use

1. Check your application's current pixel dimensions, format and maximum bytes. There are no universal official signature sizes. Crop unwanted margins first using [Image Crop](tool:image-crop), if needed.
2. Choose one JPG, PNG or WebP signature image. Enter the required width and height in pixels; the selected image's dimensions initially appear, not recommended portal dimensions.
3. Select JPG for white padding/background or PNG to retain transparency. Content is centered, contained without distortion and never enlarged; the output canvas has exactly your requested pixels.
4. Optionally enter a maximum KB (1 KB = 1000 bytes). JPEG quality starts at your selected maximum and may fall to 50. PNG does not have a quality control. Exact canvas size is never reduced to meet the limit.
5. Download, inspect the original preview against the downloaded signature, and verify actual pixels, format, byte count and stroke legibility before submitting. If the bounded search cannot meet the limit, no oversized file is downloaded; the error reports the smallest tested size.

## Method

Uses the shared browser-local upload-preparation operation. It tries at most eight JPEG encodes at fixed canvas dimensions, or one PNG encode, checking actual bytes rather than estimating from quality. It does not search every possible encoder setting, promise a global optimum, remove backgrounds, sharpen blurred strokes, set DPI or certify a signature or portal acceptance. Existing camera/location metadata is not preserved.

One image per run, up to 25 MiB and 40 megapixels decoded/output, with a 20000-pixel axis cap. Very large images may still exceed browser memory. Keep your original. Browser encoders can produce different output sizes; a downloaded result can be larger than the input even when it meets the chosen ceiling.

## FAQ

### Why is there padding around my signature?

The canvas uses your exact pixel dimensions without stretching the signature. Centered padding fills unused space, white for JPG and transparent for PNG. Crop unwanted source margins first if your application's framing rules require it.

### What happens if my maximum KB is impossible?

The tool reports the smallest tested bytes and dimensions and downloads nothing. Increase the limit if permitted, try JPG or crop the original first. Signature dimensions stay fixed; there is no hidden automatic downscaling, minimum-byte padding or guarantee that every target is achievable.

### Is my signature uploaded or stored?

No. Processing takes place in your browser. There is no account, server upload or signature storage; you choose where to save the downloaded copy.

## References

Capability baselines: Simple Image Resizer signature workflow, ResizePixel editor, RedKetchup image-resize help (inspected 18 October 2026). These are workflow references, not official application requirements. Engine contract and browser-output verification: issues #185 and #188.
