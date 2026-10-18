---
lastReviewed: 2026-10-18
---

## How to use

1. Choose one JPG, PNG or WebP photo. It stays in your browser. Keep the original file.
2. Enter your maximum file size: 20, 50, 100, 200 or any whole KB from 1 to 25000. Here 1 KB means exactly 1000 bytes. Enter maximum pixel dimensions if your application also limits them.
3. Choose JPG or PNG. JPG starts at your maximum quality (50–100) and tries lower quality down to 50. PNG ignores quality. The photo keeps its proportions and is never enlarged.
4. Leave **Allow smaller dimensions** off to keep the fitted size. Turn it on only if your application's rules allow smaller pixels; if quality alone fails, the bounded search can then reduce dimensions with a 64-pixel short-side floor. Inputs already below that floor are not enlarged or reduced further.
5. Download and check the actual output bytes, dimensions, format and visible quality. Compare the original preview to the downloaded image. A failed target downloads nothing and reports the smallest tested candidate, not an oversized success.

## Method

This is real maximum-byte targeting, not a quality-slider estimate. The shared upload-preparation operation checks each encoded candidate's bytes, with at most four resolutions and 32 JPEG encodes (one encode per resolution for PNG). It samples the original image each time, never repeatedly compresses an already-lossy candidate. It does not assume that encoder size changes monotonically.

The search is bounded, not exhaustive or globally optimal. An already-small photo is re-encoded and may grow; a target may be impossible within the quality/dimension safeguards. PNG preserves alpha; JPEG flattens transparency to white. Metadata such as camera/location information is not preserved. There is no perceptual quality guarantee, minimum-byte padding, exact-byte target or automatic portal approval.

One image per run, up to 25 MiB and 40 megapixels decoded/output, with a 20000-pixel axis cap. Browser memory can still limit large files. Output sizes differ between browser encoders; verify the actual downloaded result.

## FAQ

### Can I reduce a photo below 20 KB or 50 KB?

Enter that maximum and try JPG. The tool returns a file only when its actual encoded bytes meet the limit. Smaller dimensions may be needed, but require your explicit permission. Some images cannot reach a limit within the safeguards; the error is an honest failure, not a claimed successful download.

### Why is the photo smaller in pixels?

It first fits within your maximum width/height without stretching or upscaling. Additional reduction occurs only when you enable Allow smaller dimensions and quality alone cannot meet the limit. The result reports the actual dimensions; check them against your application's minimum as well as maximum.

### Is the photo sent to a server?

No. Encoding and byte verification happen on your device, without an account, upload, analytics payload or network-based codec.

## References

Capability baselines: ResizePixel KB reducer, Simple Image Resizer KB workflow and RedKetchup image-resize help (inspected 18 October 2026). Engine contract and independent decoded-output tests: issues #185 and #188.
