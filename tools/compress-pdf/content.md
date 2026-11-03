---
lastReviewed: 2026-11-02
---

## How to use

1. **Open or drop a PDF**, or select **Sample PDF** to try a three-page photo report generated in
   your browser.
2. **Choose a preset**: Light (JPEG 82%, images up to 3000 px), Balanced (JPEG 70%, up to 2000 px),
   Strong (JPEG 50%, up to 1400 px), or Custom to set the image quality yourself.
3. Optional: convert images to grayscale, remove page thumbnails, or set a maximum size.
4. Select **Compress PDF**. The summary shows the measured size before and after, the percentage
   saved and how many images were re-encoded. Then download the compressed file.

## Method

**What is compressed.** Most of the size of a large PDF — scans, photos, slide exports — is in its
JPEG images. Each JPEG image is decoded by your browser, scaled down if it is larger than the
preset allows, optionally turned grey, and saved again at the preset's JPEG quality. A re-encoded
image replaces the original only when it is smaller. The file is then saved with compressed object
streams, and page thumbnails are removed if you chose that.

**What is not changed.** Text, fonts and vector graphics are left exactly as they are, so text stays
selectable and searchable — pages are never turned into pictures. Images stored in other formats
(Flate, JBIG2, JPEG 2000) are kept as they are.

**Honest results.** The figures are measured on the file actually produced, never estimated. If the
compressed copy would not be smaller — for example a PDF that is mostly text and already compact —
your original file is kept and the page says so. With a maximum size set, up to two further passes
use a lower quality and smaller images; if the target still cannot be reached, the page tells you.

**Browser-based processing.** The PDF is read and written on your own device and never uploaded.

## FAQ

### Is Compress PDF free to use?

Yes. It is free, with no sign-up, no watermark and no usage quota.

### Are my documents uploaded to a server?

No. The PDF is processed in your browser and nothing is sent anywhere.

### How much smaller will my PDF get?

It depends on the file. Scans and photo-heavy PDFs often shrink a lot; text-only PDFs usually
cannot get much smaller, because their size is mostly text and fonts. The tool shows the real
result after compressing.

### Will the text still be searchable?

Yes. Only images are re-encoded; text is never rasterised.

### Can it compress password-protected PDFs?

Encrypted PDFs may fail to compress. Remove the password in your PDF reader first.

### What is the largest file it can handle?

The limit is your device's memory. Very large files (hundreds of MB) can be slow or fail on phones.
