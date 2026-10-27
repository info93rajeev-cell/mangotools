---
lastReviewed: 2026-10-27
---

## How to use

1. **Upload or Try Sample**: Upload your handwritten signature image (JPG, PNG, or WebP) or click **Sample** to explore the interactive studio.
2. **Choose Exam Preset or Custom Pixels**: Select an official government or exam portal preset (UPSC, SSC, IBPS, NTA JEE/NEET, PAN Card) or input your custom exact dimensions for **Signature width** and **Signature height**.
3. **Choose Output Format**:
   - **JPG (White Background)**: Automatically centers your signature on a clean, solid white canvas with undistorted padding. Ideal for exam portals that reject transparent images.
   - **PNG (Retain Transparency)**: Keeps transparent alpha margins intact, perfect for digital document signing, PDFs, and official contracts.
4. **Set Maximum KB Limit (Optional)**: Enter your application portal's maximum byte ceiling (e.g. 20 KB for UPSC/SSC, 30 KB for NTA, 50 KB for GATE). The resizer runs a bounded, quality-preserving local search to guarantee the final file meets the limit.
5. **Download Signature**: Click **Download signature** to save your compliant image. Verification guarantees 100% in-browser processing with zero server uploads.

## Method

The tool uses a client-side execution pipeline (`image.prepare-upload@1`) that centers signatures within an exact pixel canvas while preserving original aspect ratios. Content is contained without horizontal or vertical stretching, and padded with white pixels (JPG) or transparent pixels (PNG).

### Bounded Binary Byte Optimization

When an optional maximum file size is set (e.g., 20 KB), the browser engine performs iterative quality sweeps (between 50% and 90% JPEG quality) directly in WebAssembly/Canvas memory. If an impossible limit is requested (such as 1 KB for a large complex signature), the tool upholds an honest failure guarantee: it displays the smallest achievable file size and halts rather than downloading an oversized file that would face portal rejection.

| Portal / Examination | Recommended Canvas (W × H px) | Maximum Allowed File Size | Preferred Format |
| :--- | :--- | :--- | :--- |
| **UPSC Civil Services / NDA** | 140 × 60 px | 20 KB (min 1 KB) | JPG (White Background) |
| **SSC CGL / CHSL / MTS** | 140 × 60 px | 10 KB – 20 KB | JPG (White Background) |
| **IBPS PO / Clerk / RRB** | 140 × 60 px | 10 KB – 20 KB | JPG (White Background) |
| **NTA JEE Main / NEET UG** | 200 × 100 px (4:2 ratio) | 4 KB – 30 KB | JPG |
| **PAN Card (NSDL / UTIITSL)** | 150 × 100 px | 20 KB | JPG |
| **GATE / PSU Recruitment** | 160 × 80 px | 5 KB – 50 KB | JPG |

## FAQ

### Why does my resized signature have padding on the sides?

Official exam portals require exact canvas dimensions (e.g., 140 × 60 px) without stretching or distorting the applicant's signature. Centered padding fills remaining empty margins, rendering white for JPG and transparent for PNG.

### Why was my download prevented when I set a very small KB limit?

The tool enforces an honest verification guarantee. If your chosen pixel dimensions cannot compress below your target KB without dropping below 50% visual quality, the tool stops and reports the smallest tested byte size. This ensures you never submit an oversized file that gets rejected by government portals.

### How do I prepare a signature taken with my phone camera?

1. Crop out shadowy borders and table backgrounds using [Image Crop](tool:image-crop) first.
2. Select **JPG (white background)** so grey photo paper blends cleanly into solid white.
3. Select your exam preset (e.g. UPSC / SSC 140×60 px, ≤20 KB) and click **Download signature**.

### Is my private signature uploaded to any external server?

No. Processing takes place 100% locally in your browser sandbox using Canvas and WebAssembly. Your personal signature and metadata are never uploaded, stored, or transmitted over the network.
