---
lastReviewed: 2026-09-27
---

## How to use

1. **Choose one image.** Drag and drop a JPG, PNG, or WebP file onto the box, or select one from your
   device. A preview appears.
2. **Enter the crop rectangle** — Crop X and Crop Y (the top-left corner, in pixels, measured from the
   image's own top-left corner) and Crop width and Crop height (the size of the area to keep, in pixels).
   Pick an output format — the same as your input, or convert to JPG, PNG, or WebP — and a quality setting
   if you picked JPG or WebP.
3. Select **Download cropped image**. The image is read, cropped, and re-encoded in your browser, and the
   result downloads immediately — nothing is uploaded anywhere.

**What Image Crop does:** it cuts out a rectangular area from a single JPG, PNG, or WebP image, by exact
pixel coordinates, entirely on your device, with no sign-up and no MangoTools watermark added to the result.
It does not resize the result afterward — the output is always exactly the crop width and height you
entered.

## Method

**The crop rectangle.** Crop X and Crop Y set the top-left corner of the area to keep, counted in pixels
from the image's own top-left corner (X increases to the right, Y increases downward). Crop width and Crop
height set the size of that area. If you don't already know your image's exact pixel dimensions, try a
crop first — if the rectangle doesn't fit inside the image, the error message states the image's actual
width and height in pixels, so you can enter a rectangle that fits.

**Output size.** The output image is always exactly Crop width × Crop height — this tool only crops, it
never separately resizes the result. Use [Image Resize](tool:image-resize) afterward if you also want to
change the cropped image's size.

**Supported formats.** JPG, PNG, and WebP are all supported as input, and can be freely converted between
each other on output — the default keeps the original format. Converting a transparent PNG or WebP to JPG
fills the transparent areas with white, since JPG has no transparency channel.

**Browser-based processing.** No file upload is required for this tool — the image you select is read,
cropped, and re-encoded on your own device, and the result downloads without ever leaving it. Browser image
encoders may produce different file sizes across browsers for the same input and settings, and metadata such
as camera and location data is not preserved after export. Very large images may fail because of browser
memory limits.

**What this tool does not do.** It supports a numeric crop rectangle only — there is no drag-to-select or
interactive crop area in this version. It handles one image per run — there is no batch cropping or ZIP
download. It does not add a MangoTools watermark of any kind.

**Common errors.** A specific, plain-English message explains exactly what went wrong: no image selected, a
file that isn't a JPG, PNG, or WebP, a file over the size limit, an invalid crop X/Y position, an invalid
crop width or height, a crop rectangle that extends outside the image (stated with the image's actual
dimensions), or an image file that can't be read. Do not use this tool for images you are not allowed to
process.

## FAQ

### How do I crop an image online?

Select your image, enter the crop rectangle (X, Y, width, and height in pixels), and select Download
cropped image.

### Can I crop JPG, PNG, and WebP images?

Yes, all three are supported as both input and output format.

### Can I crop by exact pixel size?

Yes — Crop X, Y, width, and height are all entered as exact pixel values.

### Does MangoTools add a watermark?

No. The cropped image is exactly the rectangle you selected from your original — no MangoTools branding or
watermark is added.

### Can I crop many images at once?

Not in this version. Batch cropping is not included in v1 — Image Crop handles one image per run; select a
new image to crop another.

### Can I drag to crop?

Not in this version. Drag-to-select crop is not included in v1 — enter the crop rectangle as exact pixel
values instead.

### Why did my file size change?

Cropping reduces the pixel area, which usually reduces file size, but re-encoding also depends on the
output format and quality setting you choose — both file sizes are shown so you can compare.
