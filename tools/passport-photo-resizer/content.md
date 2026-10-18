---
lastReviewed: 2026-10-18
---

## How to use

1. Check your application's current photo requirements. Prepare the framing first with [Image Crop](tool:image-crop) if needed; this tool only resizes an existing photo.
2. Choose one JPG, PNG or WebP photo. Its current dimensions appear automatically; they are not recommended passport dimensions.
3. Enter the required width and height in pixels. Keep aspect ratio on to fit without distortion. The output can then be smaller than one target dimension: check both result dimensions. For an exact size, crop to matching proportions first, or turn aspect ratio off with care because this can distort faces.
4. Select JPG, PNG or WebP and, for JPG/WebP, an encoder quality. Choose **Download passport photo** and check the downloaded dimensions, format, file size and visible photo against your application's requirements. Processing stays in your browser.

## Method

Uses the same browser-local resize operation as [Image Resize](tool:image-resize). It does not set a country-specific passport size, crop automatically, adjust face placement or remove backgrounds. It does not set physical print size or DPI, check identity-document rules or guarantee official acceptance.

Quality is not a target file size: there is no automatic 20 KB/50 KB limit. The result reports actual output bytes. Try a lower quality or smaller permitted dimensions if necessary; PNG ignores encoder quality. Re-encoding can increase file size, change visible quality and remove camera/location metadata. Upscaling and transparent-to-white JPG conversion retain the existing warnings. Browser encoders can produce different bytes; unsupported WebP output falls back to PNG with a warning.

One image per run, up to 25 MB and 40 megapixels decoded/output. Very large images may fail due to browser memory limits. Keep the original photo and inspect the downloaded copy.

## FAQ

### Does this choose the correct size for my passport application?

No. Enter the pixel dimensions and format published by your application authority. There are no universal passport defaults or automatic acceptance checks. Physical print dimensions and DPI are not configured here.

### Why are the downloaded dimensions different from my target box?

With Keep aspect ratio on, the photo fits inside the box without stretching. One dimension may be smaller. Crop to the required proportions first and verify the actual output dimensions.

### Can I guarantee a photo below a particular KB limit?

No. Encoder quality does not guarantee a file size. Read the output byte count and verify the downloaded file against the portal's limit.

### Is the photo uploaded or saved to an account?

No. The tool processes one photo locally in your browser, without sign-up or a file upload. You choose where to save the downloaded copy.
