import type { TourStep } from './tourStorage.ts';

const SHARED_IMAGE_PANELS = {
  controls: '[class*="controlsPanel"], [class*="left"]',
  canvas: '[class*="canvasPanel"], [class*="center"]',
  result: '[class*="resultPanel"], [class*="right"]',
};

const IMAGE_CROP_STEPS: TourStep[] = [
  {
    id: 'crop-step-1',
    targetSelector: SHARED_IMAGE_PANELS.controls,
    stepNumber: 1,
    title: '1. Aspect Ratio & Presets',
    description:
      'Choose fixed aspect ratios (1:1 Square, 16:9 Widescreen, 4:3) or Freeform. Click "Load Sample" to test instantly.',
  },
  {
    id: 'crop-step-2',
    targetSelector: SHARED_IMAGE_PANELS.canvas,
    stepNumber: 2,
    title: '2. Drag & Frame Selection',
    description:
      'Drag within the preview canvas or use corner resize handles to frame your image subject perfectly.',
  },
  {
    id: 'crop-step-3',
    targetSelector: SHARED_IMAGE_PANELS.result,
    stepNumber: 3,
    title: '3. Pixel Specs & Download',
    description:
      'Review cropped pixel dimensions, estimated file size, and download your cropped image with zero server uploads.',
  },
];

const IMAGE_COMPRESS_STEPS: TourStep[] = [
  {
    id: 'compress-step-1',
    targetSelector: SHARED_IMAGE_PANELS.controls,
    stepNumber: 1,
    title: '1. Quality & Format Settings',
    description:
      'Select compression strength (Recommended, Extreme, or Light) or convert output to modern WebP format.',
  },
  {
    id: 'compress-step-2',
    targetSelector: SHARED_IMAGE_PANELS.canvas,
    stepNumber: 2,
    title: '2. Live Canvas Inspection',
    description:
      'Zoom into details to verify crisp edge fidelity and zero noticeable compression artifacts before saving.',
  },
  {
    id: 'compress-step-3',
    targetSelector: SHARED_IMAGE_PANELS.result,
    stepNumber: 3,
    title: '3. Verified KB Savings',
    description:
      'Inspect exact file size savings percentage (e.g. -65%) and download your high-efficiency compressed photo.',
  },
];

const IMAGE_RESIZE_STEPS: TourStep[] = [
  {
    id: 'resize-step-1',
    targetSelector: SHARED_IMAGE_PANELS.controls,
    stepNumber: 1,
    title: '1. Width, Height & Scale %',
    description:
      'Input target pixel dimensions or scale by percentage with locked aspect ratio to avoid distortion.',
  },
  {
    id: 'resize-step-2',
    targetSelector: SHARED_IMAGE_PANELS.canvas,
    stepNumber: 2,
    title: '2. Scaled Preview',
    description: 'Verify resized image proportions rendered with high-precision bicubic smoothing.',
  },
  {
    id: 'resize-step-3',
    targetSelector: SHARED_IMAGE_PANELS.result,
    stepNumber: 3,
    title: '3. Download Resized Image',
    description:
      'Save resized image in your original format or convert to WebP/PNG for optimal web performance.',
  },
];

const IMAGE_CONVERT_STEPS: TourStep[] = [
  {
    id: 'convert-step-1',
    targetSelector: SHARED_IMAGE_PANELS.controls,
    stepNumber: 1,
    title: '1. Target Image Format',
    description:
      'Select destination format: JPG, PNG, WebP, AVIF, BMP, or ICO. Transparency is automatically preserved where supported.',
  },
  {
    id: 'convert-step-2',
    targetSelector: SHARED_IMAGE_PANELS.canvas,
    stepNumber: 2,
    title: '2. Preview Render',
    description:
      'Inspect color profile and alpha channel transparency directly in the browser viewport.',
  },
  {
    id: 'convert-step-3',
    targetSelector: SHARED_IMAGE_PANELS.result,
    stepNumber: 3,
    title: '3. Instant Download',
    description:
      'Download converted file instantly — 100% processed client-side without sending files to any server.',
  },
];

const BG_REMOVER_STEPS: TourStep[] = [
  {
    id: 'bg-step-1',
    targetSelector: SHARED_IMAGE_PANELS.controls,
    stepNumber: 1,
    title: '1. Subject & Matting Options',
    description:
      'Upload a portrait, product, or graphic. Choose transparent PNG, white background, or custom backdrop color.',
  },
  {
    id: 'bg-step-2',
    targetSelector: SHARED_IMAGE_PANELS.canvas,
    stepNumber: 2,
    title: '2. Cutout Preview',
    description:
      'Inspect clean edge boundaries, hair strand preservation, and transparent checkerboard background.',
  },
  {
    id: 'bg-step-3',
    targetSelector: SHARED_IMAGE_PANELS.result,
    stepNumber: 3,
    title: '3. Download Isolated Subject',
    description:
      'Download your transparent cutout ready for e-commerce listings, marketing banners, or profile photos.',
  },
];

const ENLARGER_STEPS: TourStep[] = [
  {
    id: 'enlarge-step-1',
    targetSelector: SHARED_IMAGE_PANELS.controls,
    stepNumber: 1,
    title: '1. Upscale Multiplier (2× / 4×)',
    description:
      'Select 2× or 4× resolution enhancement with edge-guided super-resolution reconstruction.',
  },
  {
    id: 'enlarge-step-2',
    targetSelector: SHARED_IMAGE_PANELS.canvas,
    stepNumber: 2,
    title: '2. Split-Screen Comparison',
    description:
      'Pan across the preview canvas to compare original low-res details with enhanced high-definition output.',
  },
  {
    id: 'enlarge-step-3',
    targetSelector: SHARED_IMAGE_PANELS.result,
    stepNumber: 3,
    title: '3. Download High-Res Photo',
    description:
      'Save clean, un-pixelated high-resolution image suitable for large prints and retina displays.',
  },
];

const METADATA_STEPS: TourStep[] = [
  {
    id: 'meta-step-1',
    targetSelector: SHARED_IMAGE_PANELS.controls,
    stepNumber: 1,
    title: '1. Inspect Privacy Risks',
    description:
      'Upload any camera or smartphone photo. Detect hidden GPS coordinates, camera serial numbers, and device tags.',
  },
  {
    id: 'meta-step-2',
    targetSelector: SHARED_IMAGE_PANELS.canvas,
    stepNumber: 2,
    title: '2. Sanitization Breakdown',
    description:
      'Review detected EXIF tags that will be permanently stripped without altering image visual quality.',
  },
  {
    id: 'meta-step-3',
    targetSelector: SHARED_IMAGE_PANELS.result,
    stepNumber: 3,
    title: '3. Download Clean Image',
    description:
      'Save 100% sanitized, privacy-safe photo completely safe for social media or forum uploads.',
  },
];

const WATERMARK_STEPS: TourStep[] = [
  {
    id: 'wm-step-1',
    targetSelector: SHARED_IMAGE_PANELS.controls,
    stepNumber: 1,
    title: '1. Text or Logo Overlay',
    description:
      'Type watermark text, copyright notice, or upload a secondary logo image to stamp.',
  },
  {
    id: 'wm-step-2',
    targetSelector: SHARED_IMAGE_PANELS.canvas,
    stepNumber: 2,
    title: '2. Position, Opacity & Tile',
    description:
      'Position watermark at Center, Corner, or Full-Tiled repeat. Adjust opacity and font styling.',
  },
  {
    id: 'wm-step-3',
    targetSelector: SHARED_IMAGE_PANELS.result,
    stepNumber: 3,
    title: '3. Download Protected Image',
    description:
      'Save copyright-protected visual asset ready for client review and public portfolios.',
  },
];

const PASSPORT_STEPS: TourStep[] = [
  {
    id: 'passport-step-1',
    targetSelector: SHARED_IMAGE_PANELS.controls,
    stepNumber: 1,
    title: '1. Country & Visa Standard',
    description:
      'Select US Passport (2×2 in), India Passport/PAN (35×45 mm), Schengen Visa, or UK Passport specs.',
  },
  {
    id: 'passport-step-2',
    targetSelector: SHARED_IMAGE_PANELS.canvas,
    stepNumber: 2,
    title: '2. Biometric Face Alignment',
    description:
      'Align eyes and chin within the biometric compliance oval guide to meet official photo requirements.',
  },
  {
    id: 'passport-step-3',
    targetSelector: SHARED_IMAGE_PANELS.result,
    stepNumber: 3,
    title: '3. Single Photo & 4×6 Print Sheet',
    description:
      'Download individual photo or generate a multi-photo 4×6 inch print grid ready for local printing.',
  },
];

const PHOTO_SIZE_STEPS: TourStep[] = [
  {
    id: 'photo-size-step-1',
    targetSelector: SHARED_IMAGE_PANELS.controls,
    stepNumber: 1,
    title: '1. Set Max Target KB',
    description:
      'Enter target file size limit (e.g. 20 KB, 50 KB, 100 KB) required by government portals and exam applications.',
  },
  {
    id: 'photo-size-step-2',
    targetSelector: SHARED_IMAGE_PANELS.canvas,
    stepNumber: 2,
    title: '2. Iterative Optimization',
    description:
      'The engine automatically finds the best quality balance that strictly complies with your KB limit.',
  },
  {
    id: 'photo-size-step-3',
    targetSelector: SHARED_IMAGE_PANELS.result,
    stepNumber: 3,
    title: '3. Verified Byte Size',
    description:
      'Download guaranteed portal-compliant photo with actual byte verification against rejection.',
  },
];

const SIGNATURE_STEPS: TourStep[] = [
  {
    id: 'sign-step-1',
    targetSelector: SHARED_IMAGE_PANELS.controls,
    stepNumber: 1,
    title: '1. Portal Specs & Size',
    description:
      'Select official application presets (UPSC, SSC, IBPS) or specify exact pixel width, height, and maximum KB.',
  },
  {
    id: 'sign-step-2',
    targetSelector: SHARED_IMAGE_PANELS.canvas,
    stepNumber: 2,
    title: '2. Ink Optimizer & Cropping',
    description:
      'Enhance black/blue pen ink contrast and crop out surrounding desk or background shadows.',
  },
  {
    id: 'sign-step-3',
    targetSelector: SHARED_IMAGE_PANELS.result,
    stepNumber: 3,
    title: '3. Download Signature',
    description:
      'Save clean signature image with exact pixel aspect ratio and verified maximum file size.',
  },
];

const IMAGE_TOOL_STEPS_MAP: Record<string, TourStep[]> = {
  'image-crop': IMAGE_CROP_STEPS,
  'image/crop': IMAGE_CROP_STEPS,
  'image-compress': IMAGE_COMPRESS_STEPS,
  'image/compress': IMAGE_COMPRESS_STEPS,
  'image-resize': IMAGE_RESIZE_STEPS,
  'image/resize': IMAGE_RESIZE_STEPS,
  'image-format-converter': IMAGE_CONVERT_STEPS,
  'image/convert': IMAGE_CONVERT_STEPS,
  'image-background-remover': BG_REMOVER_STEPS,
  'image/remove-background': BG_REMOVER_STEPS,
  'image-enlarger': ENLARGER_STEPS,
  'image/enlarge': ENLARGER_STEPS,
  'image-metadata-remover': METADATA_STEPS,
  'image/metadata-remove': METADATA_STEPS,
  'image-watermark': WATERMARK_STEPS,
  'image/watermark': WATERMARK_STEPS,
  'passport-photo-resizer': PASSPORT_STEPS,
  'image/passport-photo': PASSPORT_STEPS,
  'photo-size-reducer': PHOTO_SIZE_STEPS,
  'image/photo-size': PHOTO_SIZE_STEPS,
  'signature-resizer': SIGNATURE_STEPS,
  'image/signature': SIGNATURE_STEPS,
};

export function getImageTourSteps(toolId: string): TourStep[] | null {
  return IMAGE_TOOL_STEPS_MAP[toolId] ?? null;
}
