import { describe, expect, it } from 'vitest';
import { resolveImageErrorMessage } from './imageErrorPresentation.ts';

describe('imageErrorPresentation', () => {
  it('gives dedicated helpful message for HEIC / HEIF files', () => {
    const msg1 = resolveImageErrorMessage({ code: 'IMAGE_INVALID_FILE_TYPE' }, 'IMG_1234.HEIC');
    expect(msg1).toBe(
      "iPhone HEIC photos aren't supported. Set Camera → Formats → Most Compatible, or take a screenshot.",
    );

    const msg2 = resolveImageErrorMessage(null, 'vacation.heif');
    expect(msg2).toBe(
      "iPhone HEIC photos aren't supported. Set Camera → Formats → Most Compatible, or take a screenshot.",
    );
  });

  it('gives dedicated helpful message for PDF files uploaded to image tools', () => {
    const msg = resolveImageErrorMessage({ code: 'IMAGE_INVALID_FILE_TYPE' }, 'my-document.pdf');
    expect(msg).toBe(
      '"my-document.pdf" is a PDF document, not an image. Please upload a JPG, PNG, or WebP image.',
    );
  });

  it('maps standard image error codes to human-readable explanations', () => {
    expect(resolveImageErrorMessage({ code: 'IMAGE_INVALID_FILE_TYPE' })).toBe(
      "This file isn't a supported JPG, PNG, or WebP image. Please choose a valid image file.",
    );
    expect(resolveImageErrorMessage({ code: 'IMAGE_INVALID_FILE_TYPE' }, 'test.txt')).toBe(
      '"test.txt" is not a supported JPG, PNG, or WebP image. Please choose a valid image file.',
    );
    expect(resolveImageErrorMessage({ code: 'IMAGE_UNREADABLE' })).toBe(
      'This file could not be read as an image. It may be corrupted or damaged.',
    );
    expect(resolveImageErrorMessage({ code: 'IMAGE_FILE_TOO_LARGE' })).toBe(
      'This image is larger than the allowed limit. Please choose a smaller image.',
    );
    expect(resolveImageErrorMessage({ code: 'IMAGE_MEMORY_LIMIT_EXCEEDED' })).toBe(
      'The browser ran out of memory while processing this image. Please try a smaller image.',
    );
    expect(resolveImageErrorMessage({ code: 'IMAGE_NO_FILE_SELECTED' })).toBe(
      'Select an image to continue.',
    );
    expect(resolveImageErrorMessage({ code: 'IMAGE_BACKGROUND_REMOVAL_FAILED' })).toBe(
      'The background could not be removed. Please try again with a different image.',
    );
    expect(resolveImageErrorMessage({ code: 'IMAGE_COMPRESSION_FAILED' })).toBe(
      'The image could not be compressed. Please try again with a different image.',
    );
    expect(resolveImageErrorMessage({ code: 'IMAGE_SIZE_TARGET_UNREACHABLE' })).toBe(
      'The size limit was not reached within these settings. Relax the limit or allow smaller dimensions.',
    );
  });

  it('handles Error instances, raw string errors, and fallbacks cleanly', () => {
    expect(resolveImageErrorMessage(new Error('Canvas rendering failed'))).toBe(
      'Canvas rendering failed',
    );
    expect(resolveImageErrorMessage('Custom error message')).toBe('Custom error message');
    expect(resolveImageErrorMessage(null)).toBe(
      'Could not process this image. Please check the file and try again with a valid JPG, PNG, or WebP image.',
    );
    expect(resolveImageErrorMessage(undefined)).toBe(
      'Could not process this image. Please check the file and try again with a valid JPG, PNG, or WebP image.',
    );
  });
});
