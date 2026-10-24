---
lastReviewed: 2026-10-24
---

## How to use

1. **Upload your image.** Click the prominent **Upload Image** button, drag and drop any JPG, PNG, or WebP photo, or click **Try Sample** to test with an authentic example photograph.
2. **Choose removal mode.** The tool defaults to **Universal Mode** to isolate arbitrary products, people, pets, vehicles, furniture, food, and objects using browser-local neural matting. Use **Person Mode** for ultra-fast headshots, or **Solid Chroma** for flat single-color graphics and logos.
3. **Select output format & download.** Choose **PNG (Transparent)** for crisp cutouts, **WebP** for compact file size, **JPG** with a solid white or custom background, or **PDF** for official document submittals. Click **Download transparent image** to save your result instantly.

## Method

**Universal in-browser neural matting.** The primary automatic engine runs directly inside your web browser using WebGPU hardware acceleration with automatic CPU WebAssembly fallback. It identifies the salient foreground subject(s)—including e-commerce products, apparel, pets, vehicles, culinary dishes, household furniture, and human subjects—and computes a high-fidelity alpha matte that separates the foreground while preserving fine edges and complex contours.

**Scope and subject support.** Universal mode handles people, products, pets, vehicles, furniture, food, and general objects against varied backgrounds. For scenic landscapes without an obvious foreground subject, the engine informs you that no clear subject was detected rather than destroying the image. Universal foreground removal is not designed for sky replacement in panoramic vistas.

**Instant Person mode.** When processing high-volume portraits, passport photos, or selfies, the secondary **Person** mode provides sub-30ms execution using lightweight neural segmentation tuned specifically for human facial, hair, and clothing boundaries.

**Solid color chroma eraser.** For simple graphics, logos, signatures, or flat studio backdrops, the secondary **Solid Chroma** mode provides adjustable Euclidean color tolerance and edge feathering.

**Edge feathering and smoothing.** The segmentation pipeline applies smooth alpha interpolation across subject boundaries, delivering clean outlines around hair, fur, and fabric without jagged pixel artifacts.

**High-demand PDF document output.** When preparing passport cutouts, ID photos, or product catalogs for official submittals, users frequently need PDF documents. This tool embeds high-resolution cutouts into clean PDF documents on demand via client-side code-splitting.

**Zero uploads privacy guarantee.** Unlike third-party online tools that send your photos to remote AI cloud servers, this tool processes every single byte directly inside your browser's local sandbox memory. No images are saved, tracked, or uploaded.

## FAQ

### How do I remove a background from products or objects for free?

Click **Upload Image** or drag your photo onto the stage. The in-browser Universal AI engine automatically detects the product, vehicle, pet, or object and removes the background while preserving edges and contours.

### What image formats can I export?

You can download your cutout as a transparent PNG, compact transparent WebP, solid JPG (with white or black background), or an official PDF document.

### Are my images uploaded to any server or remote AI?

No. 100% of the neural inference, pixel masking, and re-encoding occurs locally inside your web browser. Your photos never leave your device.

### Can I replace the background with white or black instead of transparent?

Yes. Select White or Black from the replacement options. This is ideal for e-commerce marketplace listings, official passport requirements, and document applications.
