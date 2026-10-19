# #196 — bounded native PNG feasibility

Test-only evidence, 19 October 2026. Base main: `f03aa91ed1245cf959bab6a9fea8d36982ce2885`.
No production implementation, dependency, engine export, route or public contract is added.

## Recommendation

Prefer the dependency-free native path, subject to the remaining Firefox/Linux CI evidence and
explicit production-boundary review. Do not install a PNG dependency on the present evidence.
Do not resume #194 by sending untrusted PNG bytes to pdf-lib's bundled UPNG decoder.

Candidate: bounded PNG/chunk/CRC admission → native `DecompressionStream('deflate')` scanline
validation → `createImageBitmap` → bounded canvas → PNG encode → the same structural/scanline
validation and metadata removal → independently decode the output and check pixels/alpha.
Neither candidate nor tests import UPNG or internal package files. No timeout decides validity.

## Evidence and limits

The 23 static vectors use Node 24's independent `zlib.deflateSync` and `crc32`, with hand-verified
RGBA expectations: RGB, RGBA, palette/tRNS alpha, grayscale 1/16-bit, grayscale alpha, colour-key
alpha, 1×1 Adam7, metadata, two 20MP boundaries and twelve malformed/unsupported cases. The large
vectors verify dimensions, inflated work and sampled tiles, not every pixel of a 20MP output.
The small vectors compare every decoded input and re-encoded output pixel without tolerances.

Local Windows results:

| Runtime | Result |
|---|---|
| Node 24 | Native compressed-stream validation passes; bitmap path explicitly unavailable |
| Chromium 141 | Window and worker: all 23 cases pass |
| WebKit 2215 | Window: all 23 pass; worker explicitly reports missing OffscreenCanvas |
| Firefox 1495 | Launch fails before test body (`spawn UNKNOWN`); no candidate result claimed |

The six Node/Chromium/WebKit tests pass without skips. An unsupported worker is tested as such,
not counted as a successful conversion. A window-canvas fallback is necessary on that WebKit build.
Linux GitHub CI must supply Firefox and the remaining supported-worker evidence before approval.

An initially failing exact output-pixel assertion exposed a WebKit re-encode profile effect
(green's red channel 0 became 1 on a second decode). Removing encoder-added ancillary metadata
from the actual normalized output resolved it. No expected pixels or tolerances were changed.
Canonical encoded PNG hashes still differ across browsers; this is not byte-identical encoding.

## Resource argument

- Admission: 15 MiB/file, 20,000,000 pixels, 14,400/side, at most 4,096 framed chunks.
- Reject every APNG control/frame/data chunk before any bitmap call. Reject duplicate headers,
  invalid CRC/framing, unsupported methods/depths, unknown critical chunks and missing required data.
- Only raster/palette/transparency chunks reach decoding; ancillary metadata parsers are not used.
- Compute exact scanline lengths, including Adam7 passes. Stream compressed input in 1 KiB writes;
  count decompressed output, validate filter bytes and reject excessive/short output or zlib errors.
  Do not retain the inflated raster. Palette/tRNS interpretation remains native-decoder-owned.
- The largest tested RGBA16 raster is 5,000×4,000: 160,004,000 inflated bytes. It passes. A conservative
  scanline-work bound is `8 × pixels + 14 × height` bytes, including interlace/padding overhead.
- Maximum observed returned decompression chunk: Chromium 65,536 bytes; WebKit 1,056,768 bytes.
  These are observations, not a standards-guaranteed native allocation ceiling.
- One source at a time; bitmap closes after draw, canvas shrinks before output validation. Normalized
  output is byte-capped before copying. A 20MP RGBA bitmap/canvas represents 80MB each. Browser
  native scratch/GPU memory and process RSS are not controllable or claimed bounded to that number.
  Production must also preflight aggregate counts/bytes/pixels and handle low-memory failure honestly.

These finite application limits and successful corrupt-input rejection are not a formal proof about
all browser decoder implementations. Canvas normalizes to 8-bit display pixels; ICC/wide-gamut,
hidden RGB under zero alpha, 16-bit sample preservation and universal colour fidelity are not promised.

## Dependency comparison and production boundary

`pngjs` offers a browser distribution, CRC checking and PNG decoding. Adopting it would require a
separate dependency-risk approval, license/transitive/bundle review and the same bounded corruption
matrix. `fflate` alone handles compression, not PNG unfiltering/palette/alpha; it would additionally
require a PNG decoder or new custom decoder code. Neither is installed or experimentally certified.
Native decoding avoids those new dependencies and the bundled UPNG path in this prototype.

The PDF engine's current pure Node/worker boundary must not acquire browser globals. Production
normalization belongs in a separately scoped browser layer; PDF generation needs a reviewed safe
raster boundary that never decodes untrusted PNG through UPNG. Browser-derived bytes can vary;
unchanged canonical PDF inputs must retain the existing PDF determinism rule. This prototype does
not silently grant an Image-engine exception to PDF or authorize that new contract. Existing
`pdf.jpg-to-pdf@1`, all fixtures, presets and published pages remain unchanged.

## Reproduce and sources

Run existing Playwright with `tests/e2e/png-native-feasibility.spec.ts` in the three browser projects
under Node 24. JSON attachments record capabilities, per-case outcomes, read chunks and output hashes.
No test document is shipped; the existing in-memory test bundler and intercepted document are reused.

- [W3C PNG Third Edition](https://www.w3.org/TR/2025/REC-png-3-20250624/), §§5, 11 and CRC appendix.
- [WHATWG Compression Standard](https://compression.spec.whatwg.org/), deflate validation/error rules.
- [WHATWG ImageBitmap](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html), decode/rejection and colour options.
- [WHATWG Canvas](https://html.spec.whatwg.org/multipage/canvas.html), alpha/colour conversion limitations.
- [pngjs primary documentation](https://github.com/pngjs/pngjs), PNG formats, CRC and browser distribution.
- [fflate primary documentation](https://github.com/101arrowz/fflate), compression and streaming APIs.
