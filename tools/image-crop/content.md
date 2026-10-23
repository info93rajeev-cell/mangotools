---
lastReviewed: 2026-09-30
---

## How to use

1. **Choose one image.** Drag and drop a JPG, PNG, or WebP file onto the box, or select one from your device. You can also click **Try Sample** to test with an example photo.
2. **Adjust the crop area** — Drag the 8 interactive canvas handles, choose an aspect ratio preset (Free, 1:1, 4:3, 16:9, or 35:45), or enter exact pixel coordinates (X, Y, Width, Height) with the ratio lock enabled.
3. **Select format & crop** — Pick your desired output format (Same as input, JPG, PNG, or WebP) and quality, then click **Crop Image**. The image is processed entirely on your device and downloads immediately.

**What Image Crop does:** it cuts out a rectangular area from a single JPG, PNG, or WebP image, by visual selection or exact pixel coordinates, entirely on your device, with no sign-up and no watermark added to the result.

## Method

**Visual canvas & precision.** The visual canvas uses subpixel-to-integer coordinate rounding to map selection rectangles directly to native source pixels. Pixels are sliced in memory using browser canvas operations without lossy generational artifacts.

**The crop rectangle.** Crop X and Crop Y set the top-left corner of the area to keep, counted in pixels from the image's own top-left corner (X increases to the right, Y increases downward). Crop width and Crop height set the size of that area.

**Output size.** The output image is always exactly Crop width × Crop height — this tool only crops, it never separately resizes the result. Use [Image Resize](tool:image-resize) afterward if you also want to change the cropped image's size.

**Supported formats & transparency.** JPG, PNG, and WebP are all supported as input, and can be freely converted between each other on output — the default keeps the original format. PNG transparency is preserved when exporting to PNG or Same. Converting a transparent PNG or WebP to JPG fills the transparent areas with white, since JPG has no transparency channel.

**Browser-based processing.** No file upload is required for this tool — the image you select is read, cropped, and re-encoded on your own device, and the result downloads without ever leaving it. Your photos never reach any cloud server.

## FAQ

### How do I crop an image online?

Select your image, drag the selection handles on the canvas or type the crop rectangle in pixels, and select Download cropped image.

### Can I crop JPG, PNG, and WebP images?

Yes, all three are supported as both input and output format.

### Can I crop by exact pixel size?

Yes — Crop X, Y, width, and height can be entered as exact pixel values in the controls panel.

### Does this tool add a watermark?

No. The cropped image is exactly the rectangle you selected from your original — no branding or watermark is added.

### Can I crop many images at once?

No. Batch cropping is not included — Image Crop handles one image per run; select a new image to crop another.

### Can I drag to crop?

Yes. You can drag the corner and edge handles directly on the canvas, move the crop box, or use arrow keys for 1-pixel precision.

### Why did my file size change?

Cropping reduces the pixel area, which usually reduces file size, but re-encoding also depends on the output format and quality setting you choose — both file sizes are shown so you can compare.
