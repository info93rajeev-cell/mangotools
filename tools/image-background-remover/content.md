---
lastReviewed: 2026-11-07
---

## How to use

The tool opens in **Quick Auto Removal**. Advanced users can switch to **Advanced Pen Selection & Feather**; a photo you already opened comes along.

1. **Upload your image.** Click **Upload Image**, drop a JPG, PNG, or WebP photo onto the image card, or click the sample photo to try it. Once your photo is open the same card shows **Replace Image**: it clears the current work and starts again with a new photo.
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

### Does this tool use AI?

Yes, but only in **Quick Auto Removal**. That mode runs an AI model (BiRefNet-lite, MIT licence) on your own device. A model is used because removing backgrounds from people, hair, pets and busy scenes without one gives rough edges, and we tested that. The first time you use it, the model files (about 100 MB, or up to 190 MB on browsers without WebGPU) download from this website (beyandtheai.com) itself, and your browser keeps them for later visits. Only the model comes to you; nothing goes back.

**Glass products.** Under **Matte Mode**, **Glass** rebuilds the background behind the product from the area around it. Parts that look almost like that background are glass and become see-through, and the old background colour is taken out of them, so a new background shows through the glass. Parts that clearly differ (liquid, plastic, labels, fruit) stay solid. **Tinted Glass** is for a product that is all glass, coloured glass too, such as an amber bottle: every part becomes see-through. White or light plastic that has the same tint as the background can look like glass and turn partly see-through; use **Auto** or **Solid** for such photos.

**Pen tool, step by step.** Click to place points around the area; click and drag while placing a point to make a curve. The path stays open until you close it: click the green first point, press **C**, or use **Close Path**. Only then does the area inside join the selection. Drag a point to move it, and drag its round handles to bend the curve. Double-click a point (or use **Make Curve / Make Corner**) to switch between a curve point and a corner. Use the **✋ Hand** tool (or hold **Space**) to move the photo while zoomed in.

In **Pen Selection**, **Auto Select** uses the same on-device AI model to make the first selection; the **Pen** and the **Brush Add / Brush Remove** tools use no AI. If you prefer no AI at all, skip Auto Select and draw the selection with the Pen and brushes.

### Are my images uploaded to any server or remote AI?

No. The model runs on your device, and all masking and re-encoding happen there too. Your photos never leave your device. You can check this yourself: open your browser's developer tools, go to the Network tab, and remove a background. You will see only the one-time model download, never your image.

### Can I replace the background with white or black instead of transparent?

Yes. Select White or Black from the replacement options. This is ideal for e-commerce marketplace listings, official passport requirements, and document applications.
