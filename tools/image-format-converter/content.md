---
lastReviewed: 2026-09-27
---

## How to use

1. **Choose one image.** Drag and drop a JPG, PNG, or WebP file onto the box, or select one from your
   device. A preview appears, and the image's own dimensions are kept — this tool converts format, not size.
2. **Choose the format to convert to** — JPG, PNG, or WebP — and a quality setting if you picked JPG or
   WebP. Set an output name, or leave it blank for an automatic one based on the original file name.
3. Select **Download converted image**. The image is read, re-encoded in the format you chose, and the
   result downloads immediately — nothing is uploaded anywhere.

**What Image Format Converter does:** it changes the file format of a single JPG, PNG, or WebP image —
converting between any of the three, in either direction — entirely on your device, with no sign-up and no
watermark added to the result. It does not resize, crop, rotate, retouch, or watermark the
image itself; use [Image Resize](tool:image-resize) for size changes.

## Method

**Browser-first, and processed locally where supported.** No file upload is required for this tool — the
image you select is read and re-encoded on your own device, and the result downloads without ever leaving
it. This is useful for everyday image conversion — preparing images for a website, an online store, a
social media post, a document, or an AI-generated image that arrived in a format you did not want — not for
professional, color-managed prepress work.

**JPG vs PNG vs WebP.** JPG is a lossy, widely-supported format with no transparency, generally the smallest
file for a photo. PNG is lossless and supports transparency, generally larger for a photo but exact for
flat colors, screenshots, and graphics. WebP supports both lossy and lossless modes plus transparency, and
is often smaller than either for the same visual quality, where the browser or platform you are using
supports it.

**Transparency and JPG backgrounds.** JPG has no transparency channel. If your source image has transparent
areas and you convert it to JPG, those areas are filled with a white background before the image is drawn,
and a warning tells you this happened. PNG and WebP keep transparency as-is.

**Quality setting.** Shown only for JPG and WebP output, since PNG is lossless and has no quality knob. A
lower quality setting produces a smaller file at some cost to visual detail; a higher setting keeps more
detail at a larger file size.

**Converting to the same format you started with.** This is allowed, not rejected — choosing, for example,
"Convert to JPG" for a file that is already a JPG re-encodes it in your chosen quality setting, which can
change its file size and, for a lossy format, its visual quality slightly. A warning explains this whenever
it happens.

**File size.** File size can go up or down after conversion — it depends on the source image, the format
you chose, and the quality setting, not on the conversion itself. Both the original and converted file
sizes, and the difference, are shown so you can check.

**File size and browser limits.** An image can be up to 25 MB, and up to 40 megapixels once decoded. Very
large images, or images with very large pixel dimensions, may fail because of browser memory limits; this
is a stated limit for a tool that runs entirely on your device, not a server. Output can also differ
slightly between browsers, because browser image encoders vary — verify the result in the browser your
audience will actually use if that matters for your case. WebP output depends on your browser supporting
it; where it doesn't, the tool falls back to PNG and says so.

**What this tool does not do.** It does not resize, crop, rotate, retouch, add a watermark, remove a
background, remove metadata, or convert to or from HEIC, AVIF, PDF, video, or audio formats. It handles one
image per run — there is no batch conversion or ZIP download in this version. Metadata such as camera and
location data is not preserved, since re-encoding to a canvas does not carry it over.

**Common errors.** A specific, plain-English message explains exactly what went wrong: no image selected, a
file that isn't a JPG, PNG, or WebP, a file over the size limit, an image over the pixel limit, an image
file that can't be read, or a conversion that failed to complete. Do not use this tool for images you are
not allowed to process.

## FAQ

### How do I convert JPG to PNG?

Select your JPG file, choose PNG as the format to convert to, and select Download converted image. No
quality setting is shown for PNG, since it's lossless.

### How do I convert PNG to JPG?

Select your PNG file, choose JPG as the format to convert to, pick a quality setting, and download. If the
PNG has transparent areas, they're filled with white first — see the transparency note above.

### How do I convert JPG to WebP?

Select your JPG file, choose WebP as the format to convert to, pick a quality setting, and download. WebP
output depends on your browser supporting it; where it doesn't, you'll get PNG instead and a warning saying
so.

### How do I convert WebP to JPG?

Select your WebP file, choose JPG as the format to convert to, pick a quality setting, and download. A
WebP image with transparency is filled with white first, the same as PNG to JPG.

### Will transparency be preserved?

Yes, if you convert to PNG or WebP, both of which support transparency. Converting to JPG flattens
transparent areas onto a white background, since JPG has no transparency channel.

### Why did my file size increase after conversion?

Re-encoding a file — even to the same or a different format — is not always smaller. It depends on the
source image, the format you picked, and the quality setting. Try a lower quality setting, or a different
output format, and compare the file sizes shown.

### Is this useful for website images?

Yes. Converting to a smaller or more broadly-supported format, or to WebP where your platform accepts it,
is a common step in getting an image ready for a website, an online store, or a social post.

### Does this add a watermark?

No. The converted image is exactly the image you uploaded, re-encoded in the format and quality you chose —
no branding or watermark is added.

### Do I need to sign up?

No. Image Format Converter is free, with no sign-up and no account required.

### Can I convert many images at once?

Not in this version. Image Format Converter handles one image per run; select a new image to convert
another.

### Will the output look exactly the same in every browser?

Not necessarily. Browser image encoders vary, so the exact bytes of the converted file can differ slightly
between browsers even for the same input and settings. The format and dimensions you chose are what's
guaranteed.
