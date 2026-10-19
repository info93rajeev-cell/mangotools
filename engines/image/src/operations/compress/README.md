# Image Compress operation (`image.compress@1`)

## User intent and core promise

User intent: *"Make this image file smaller while keeping acceptable visual quality."*

Core promise: **Output bytes must be strictly smaller than input bytes (`outputBytes < inputBytes`).**
Never merely "conversion succeeded" or "encoded without error".

If no tested candidate down to the minimum quality limit (50%) achieves smaller bytes than the original, the operation fails honestly with typed error `IMAGE_COMPRESSION_NOT_SMALLER`. An enlarged or equal-sized file is NEVER presented as a successful compression result.

## Search algorithm

1. **Decode source once**: Decodes the input file into an `ImageBitmap`, checks pixel count caps, and ensures `bitmap.close()` is called in `finally`.
2. **Preserve dimensions**: By default, dimensions are 100% preserved (`width = source.width`, `height = source.height`). Dimension reduction is only permitted if `allowDimensionReduction: true` is explicitly passed.
3. **Bounded quality search**:
   - For **JPG** and **WebP**: Evaluates up to 8 quality steps in descending order from requested `startQuality` (default 80) down to `minQuality` (default 50).
   - Because candidates are evaluated from highest quality to lowest quality, the first candidate whose actual encoded bytes satisfy `bytes.byteLength < inputBytes` (or `<= targetCeilingBytes`) is returned, ensuring the highest possible visual fidelity.
   - For **PNG**: Standard browser canvas encoding is lossless and ignores quality parameters. PNG encodes once at full dimensions. If re-encoding does not produce a smaller file, it reports `IMAGE_COMPRESSION_NOT_SMALLER` honestly rather than pretending quality knobs exist.
4. **Target ceiling**:
   - If `maxFileSizeKB` is provided, `targetCeilingBytes = min(inputBytes - 1, maxFileSizeKB * 1000)`.
   - If omitted, `targetCeilingBytes = inputBytes - 1`.
   - Every candidate is verified against `targetCeilingBytes`.
5. **No monotonic encoder size assumption**: Each candidate's actual bytes are measured after encoding.
6. **Failure reporting**: If all tested candidates exceed the ceiling, `IMAGE_COMPRESSION_NOT_SMALLER` is returned with `minQuality`, smallest tested `bytes`, and `attempts`.
