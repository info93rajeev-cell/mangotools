---
lastReviewed: 2026-09-26
---

## How to use

1. **Choose one image.** Drag and drop a JPG, PNG, or WebP file onto the box, or select one from your device. A preview appears; the image keeps its original width and height.
2. **Choose an output format** — the same format as your input, or convert to JPG, PNG, or WebP — and a quality setting if you picked JPG or WebP. Lower quality settings generally produce smaller files.
3. **Set an output name**, or leave it blank for an automatic one based on the original file name.
4. Select **Download compressed image**. The image is read and re-encoded in your browser with the settings you chose, and the result downloads immediately — nothing is uploaded anywhere. Compare the original and output size shown before you rely on the result.

**What Image Compress does:** it re-encodes a single JPG, PNG, or WebP image with the format and quality you choose, to reduce its file size where possible. It keeps the original width and height — it does not resize, crop, rotate, retouch, or watermark. This is not guaranteed compression: whether the output is smaller, and by how much, depends on the source image, its format, and the settings you pick.

## Method

**Browser-first, and processed locally where supported.** No file upload is required for this tool — the image you select is read and re-encoded on your own device, and the result downloads without ever leaving it.

**Why compression results vary.** An image that is already tightly compressed, or one saved in a format with no quality knob, may not get smaller no matter what settings you choose — sometimes re-encoding even makes a file larger. Always compare the original and output size shown, and use a lower quality setting or a different format if the result isn't smaller.

**JPG vs PNG vs WebP.** JPG and WebP support an adjustable quality setting and are usually the better choice for photographs, where some quality loss is visually hard to notice. PNG is lossless and has no quality knob, so it does not reduce file size for photo-like images — it works best for graphics, screenshots, and images with flat color or transparency. JPG has no transparency channel; converting a transparent image to JPG fills the transparent areas with white and shows a warning.

**Quality setting.** For JPG and WebP output, a lower quality percentage produces a smaller file at the cost of some visual detail; a higher percentage keeps more detail but produces a larger file. PNG output ignores the quality setting because PNG is lossless.

**File size and browser limits.** An image can be up to 25 MB, and up to 40 megapixels once decoded. Very large images may fail because of browser memory limits; this is a stated limit for a tool that runs entirely on your device, not a server. Output can also differ slightly between browsers, because browser image encoders vary. WebP output depends on your browser supporting it; where it doesn't, the tool falls back to PNG and says so.

**Common errors.** A specific, plain-English message explains exactly what went wrong: no image selected, a file that isn't a JPG, PNG, or WebP, a file over the size limit, an image over the pixel limit, an unreadable or corrupted image, or a conversion that failed to complete. Do not use this tool for images you are not allowed to process.

## FAQ

### Is Image Compress free?

Yes. It's free and unlimited, with no sign-up and no ads.

### Are my images uploaded anywhere?

No. Your image is read and re-encoded in this browser. No file upload is required for this tool.

### Is the output guaranteed to be smaller?

No. Compression results depend on the source image, its format, and the settings you choose. Some images — especially ones already tightly compressed, or PNGs of photo-like content — may not shrink, and re-encoding can occasionally make a file larger. If that happens, the tool shows a clear warning; try a lower quality setting or a different output format.

### Does Image Compress resize my image?

No. It keeps the original width and height by default. Use Image Resize if you also want to change the dimensions.

### What happens to transparent areas if I convert to JPG?

They're filled with white before the image is drawn, since JPG has no transparency channel. A warning appears whenever this applies. Choose PNG or WebP instead if you need to keep transparency.

### Which format should I pick?

JPG or WebP for photographs, where a quality setting can trade some detail for a smaller file. PNG for graphics, screenshots, or images that need transparency — PNG is lossless and has no quality knob, so it won't shrink a photo-like image much, if at all.

### Why did my image fail to compress?

The most common reasons are a file that isn't actually a JPG, PNG, or WebP; a file or decoded image over the stated size limits; or a corrupted image that can't be read. The error message names the specific problem.
