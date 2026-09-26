---
lastReviewed: 2026-09-26
---

## How to use

1. **Choose one image.** Drag and drop a JPG, PNG, or WebP file onto the box, or select one from your device. A preview appears, and its original width and height fill in the width and height fields automatically.
2. **Set the width and height** you want, in pixels. Leave **Keep aspect ratio** on to fit your image inside that box without distorting it, or turn it off to force the exact size you entered.
3. **Choose an output format** — the same format as your input, or convert to JPG, PNG, or WebP — and a quality setting if you picked JPG or WebP. Set an output name, or leave it blank for an automatic one based on the original file name.
4. Select **Download resized image**. The image is read, resized, and re-encoded in your browser in the selected format, and the result downloads immediately — nothing is uploaded anywhere.

**What Image Resize does:** it changes the width and height of a single JPG, PNG, or WebP image, entirely on your device. It does not crop, rotate, retouch, watermark, or compress beyond what the chosen output format and quality setting already do.

## Method

**Browser-first, and processed locally where supported.** No file upload is required for this tool — the image you select is read, resized, and re-encoded on your own device, and the result downloads without ever leaving it.

**Image size and quality.** With **Keep aspect ratio** on, your width and height describe a box the image is scaled to fit inside, without cropping or distortion. With it off, the output is exactly the size you entered, which can distort the image if its proportions differ from your target. Making an image larger than its original size always reduces effective quality, and a warning appears when this happens. Resizing itself, and re-encoding at a JPG or WebP quality setting, can also reduce image quality — always verify the final output before publishing, printing, filing, or sending.

**Transparency and JPG backgrounds.** JPG has no transparency channel. If your source image has transparent areas and you convert it to JPG, those areas are filled with a white background before the image is drawn, and a warning tells you this happened. PNG and WebP keep transparency as-is.

**File size and browser limits.** An image can be up to 25 MB, and up to 40 megapixels once decoded — both the file itself and the requested output are checked. Very large images, or images with very large pixel dimensions, may fail because of browser memory limits; this is a stated limit for a tool that runs entirely on your device, not a server. Output can also differ slightly between browsers, because browser image encoders vary — verify the result in the browser your audience will actually use if that matters for your case. WebP output depends on your browser supporting it; where it doesn't, the tool falls back to PNG and says so.

**Common errors.** A specific, plain-English message explains exactly what went wrong: no image selected, a file that isn't a JPG, PNG, or WebP, a file over the size limit, an image over the pixel limit, an invalid or missing width or height, requested output dimensions that are too large, an image file that can't be read, or a resize that failed to complete. Do not use this tool for images you are not allowed to process.

## FAQ

### Is Image Resize free?

Yes. It's free and unlimited, with no sign-up and no ads.

### Are my images uploaded anywhere?

No. Your image is read, resized, and re-encoded in this browser. No file upload is required for this tool.

### Will resizing reduce my image's quality?

It can. Making an image larger than its original size always reduces effective quality, and re-encoding at a JPG or WebP quality setting is lossy by design. Verify the downloaded file before you rely on it.

### What happens to transparent areas if I convert to JPG?

They're filled with white before the image is drawn, since JPG has no transparency channel. A warning appears whenever this applies. Convert to PNG or WebP instead if you need to keep transparency.

### Why did my image fail to resize?

The most common reasons are a file that isn't actually a JPG, PNG, or WebP; a file or decoded image over the stated size limits; an invalid width or height; or a corrupted image that can't be read. The error message names the specific problem.

### Does Image Resize support more than one image at a time?

Not in this version. Image Resize handles one image per run; select a new image to start again.

### Will the output look exactly the same in every browser?

Not necessarily. Browser image encoders vary, so the exact bytes of the resized file can differ slightly between browsers even for the same input and settings. The dimensions and format you chose are what's guaranteed.
