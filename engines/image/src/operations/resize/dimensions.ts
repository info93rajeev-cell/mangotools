export interface Dimensions {
  width: number;
  height: number;
}

/**
 * The output size for a resize request. With `keepAspectRatio`, the target width/height describe a
 * bounding box the source is scaled to fit inside (like CSS `object-fit: contain`) — never cropped,
 * never distorted. Without it, the output is exactly the requested width and height, which may distort
 * the image if its aspect ratio differs from the target's.
 */
export function computeOutputDimensions(
  source: Dimensions,
  target: Dimensions,
  keepAspectRatio: boolean,
): Dimensions {
  if (!keepAspectRatio) return { width: target.width, height: target.height };
  const scale = Math.min(target.width / source.width, target.height / source.height);
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

/** Whether `output` is larger than `source` in either axis — the definition of "upscaled" here. */
export function isUpscale(source: Dimensions, output: Dimensions): boolean {
  return output.width > source.width || output.height > source.height;
}
