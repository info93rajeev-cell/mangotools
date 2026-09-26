/** English messages for every error and warning code this engine can return. */
export const messages: Readonly<Record<string, string>> = {
  IMAGE_NO_FILE_SELECTED: 'Select an image to resize.',
  IMAGE_INVALID_FILE_TYPE: '"{name}" is not a JPG, PNG, or WebP image.',
  IMAGE_FILE_TOO_LARGE: '"{name}" is larger than the {max} MB limit.',
  IMAGE_DIMENSIONS_INVALID: 'Enter a width and height greater than 0.',
  IMAGE_SOURCE_PIXELS_TOO_LARGE: 'This image is larger than the {max} megapixel limit.',
  IMAGE_OUTPUT_DIMENSIONS_TOO_LARGE:
    'The requested output size is larger than the {max} megapixel limit.',
  IMAGE_UNREADABLE: '"{name}" could not be read as an image. It may be corrupted or damaged.',
  IMAGE_MEMORY_LIMIT_EXCEEDED: 'The browser ran out of memory while processing this image.',
  IMAGE_RESIZE_FAILED: 'The image could not be resized. Please try again with a different image.',
  IMAGE_VERIFY_OUTPUT: 'Verify the resized image before using it.',
  IMAGE_METADATA_NOT_PRESERVED: 'Metadata such as camera and location data is not preserved.',
  IMAGE_LARGE_IMAGES_MAY_FAIL: 'Very large images may fail because of browser memory limits.',
  IMAGE_TRANSPARENT_FLATTENED_TO_WHITE:
    'Transparent areas will be flattened onto a white background when exporting as JPG.',
  IMAGE_UPSCALED_QUALITY_LOSS:
    'The output is larger than the original image in at least one dimension, which can reduce quality.',
  IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG:
    'WebP is not supported in this browser; the image was exported as PNG instead.',
  IMAGE_OUTPUT_LARGER_THAN_INPUT:
    'The output file is larger than the original. Try a lower quality setting or another format.',
};
