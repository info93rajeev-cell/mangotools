---
lastReviewed: 2026-09-27
---

## How to use

1. **Choose one image.** Drag and drop a JPG, PNG, or WebP file onto the box, or select one from your
   device. A preview appears.
2. **Pick a favicon size** from the list — 16×16, 32×32, 48×48, 180×180 (Apple touch icon), 192×192
   (Android), or 512×512 (large icon / PWA).
3. Select **Download favicon**. The image is read, fitted to a square, resized, and encoded as PNG in your
   browser, and the result downloads immediately — nothing is uploaded anywhere.

Need more than one size? Run the tool again with the same image and a different size selected — each
download gets its own file name (for example `logo-favicon-32.png`, `logo-favicon-180.png`), so you won't
overwrite one size with another.

## Method

**What the Favicon Generator does.** It turns a single JPG, PNG, or WebP image into one square PNG favicon
at a size you choose, entirely on your device, with no sign-up and no MangoTools watermark added to the
result.

**Recommended favicon sizes.** Most websites only need a small set:

| Size | Common use |
|---|---|
| 16×16 | Classic browser tab icon |
| 32×32 | Standard browser tab / bookmark icon |
| 48×48 | Windows site icons |
| 180×180 | Apple touch icon (iOS home screen) |
| 192×192 | Android home screen / Chrome |
| 512×512 | Large icon, app manifests, PWA install icons |

A typical site uses 32×32 as its main favicon, plus 180×180 and 192×192 for mobile home screens.

**Square image and background.** Favicons must be square. If your image isn't already square, it is
center-cropped to a square first — the longer side is trimmed evenly from both edges to match the shorter
side — and that square is then resized to your chosen favicon size. This means the entire output is always
filled by your image: there is never a padding or background color to add or choose, and any transparency
already in your source image (PNG or WebP) is kept as-is. This tool does not offer an interactive crop
editor in this version — if the automatic center crop cuts off part of the image you wanted to keep, crop
the source image with [Image Crop](tool:image-crop) first, then generate the favicon from the cropped result.

**Where to upload favicon files.** Once downloaded, upload the favicon file(s) to your website's root
folder (or wherever your site or hosting platform expects icon files), then reference them in your HTML
`<head>` as shown below. This tool only creates the image files — you still need to add them to your website
yourself.

**Basic HTML favicon snippet.** Add a line for each size you generated, matching its own file name, for
example:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

Only include a `<link>` tag for a size you actually generated and uploaded — a tag pointing at a file that
doesn't exist on your server won't do anything useful.

**Browser-based processing.** No file upload is required for this tool — the image you select is read,
resized, and encoded on your own device, and the result downloads without ever leaving it. Different
browsers may produce slightly different PNG file sizes for the same input and settings, and metadata such as
camera and location data is not preserved after export. Very large images may fail because of browser memory
limits.

**What this tool does not do.** It generates one square PNG favicon per run, at a size you pick from a fixed
list — there is no batch mode, no ZIP download of multiple sizes at once, and no `.ico` file output in this
version. It is not a logo design tool: it resizes and center-crops your existing image, it does not create
new artwork, add effects, or use AI. It does not add a MangoTools watermark of any kind.

**Common errors.** A specific, plain-English message explains exactly what went wrong: no image selected, a
file that isn't a JPG, PNG, or WebP, a file over the size limit, or an image file that can't be read
(corrupted or damaged). A small source image is still accepted, but it may look blurry once enlarged to your
chosen favicon size — the result carries a plain-English note when this happens. Do not use this tool for
images you are not allowed to process.

## FAQ

### What is a favicon?

A favicon is the small square icon a website shows in a browser tab, bookmarks list, and mobile home
screen shortcut.

### How do I create a favicon from an image?

Select your image, pick a favicon size from the list, and select Download favicon. The image is
center-cropped to a square (if it isn't one already), resized, and downloaded as a PNG.

### What favicon sizes do I need?

For most websites, 32×32 covers the basic browser tab icon, with 180×180 for Apple devices and 192×192 for
Android as a common minimum set. See the sizes table above for what each size is typically used for.

### Can I use PNG as a favicon?

Yes. PNG is the most widely supported favicon format today and is what this tool always outputs.

### Does this create .ico files?

Not in this version. This tool generates PNG favicons only. Modern browsers support PNG favicons directly,
so a `.ico` file is not required for most sites.

### Why does my favicon look blurry?

Favicons are very small, so fine detail and small text in the original image often don't survive being
shrunk to 16×16 or 32×32 pixels. A simple, high-contrast image usually works better as a favicon than a
detailed photo. Enlarging a source image that's smaller than your chosen favicon size will also look blurry.

### Where do I upload the favicon on my website?

Upload the downloaded file to your website's root folder (or your hosting platform's icon upload location),
then reference it with an HTML `<link>` tag in your page's `<head>`, as shown above.

### Does MangoTools add a watermark?

No. The generated favicon is only your image, cropped and resized — no MangoTools branding or watermark is
added.

### Do I need to sign up?

No. This tool works without an account, sign-up, or login.

### Can I create many favicon files at once?

Not in this version. Batch processing and a multi-size ZIP pack are not included in v1 — generate one size
at a time, and run the tool again with a different size for each file you need.
