import type { ResolvedPreset } from '@mangotools/schemas';
import type { ComponentChildren } from 'preact';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import {
  DynamicImageBackgroundRemoverLayout,
  DynamicImageCompressLayout,
  DynamicImageEnlargerLayout,
  DynamicImageFormatConverterLayout,
  DynamicImageMetadataRemoverLayout,
  DynamicImageResizeLayout,
  DynamicImageToPdfLayout,
  DynamicImageWatermarkLayout,
  DynamicPassportPhotoLayout,
  DynamicPhotoSizeReducerLayout,
  DynamicSignatureResizerLayout,
} from './DynamicImageToolLayouts.tsx';
import { ImageCropLayout } from './ImageCropLayout.tsx';

const IMAGE_CROP_PRESET_ID = 'image/crop';
const IMAGE_COMPRESS_PRESET_ID = 'image/compress';
const IMAGE_RESIZE_PRESET_ID = 'image/resize';
const IMAGE_ENLARGER_PRESET_ID = 'image/enlarge';
const IMAGE_FORMAT_CONVERTER_PRESET_ID = 'image/convert';
const IMAGE_REMOVE_BACKGROUND_PRESET_ID = 'image/remove-background';
const PHOTO_SIZE_REDUCER_PRESET_ID = 'image/photo-size';
const PASSPORT_PHOTO_PRESET_ID = 'image/passport-photo';
const SIGNATURE_RESIZER_PRESET_ID = 'image/signature';
const IMAGE_METADATA_REMOVER_PRESET_ID = 'image/metadata-remove';
const IMAGE_WATERMARK_PRESET_ID = 'image/watermark';
const JPG_TO_PDF_PRESET_ID = 'pdf/jpg-to-pdf';

export interface ImageStudioProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (msg: string) => void;
  onFilePhase: (phase: FilePhase) => void;
}

export function renderBasicImageStudio(props: ImageStudioProps): ComponentChildren | null {
  const { idPrefix, toolId, preset, notify, onFilePhase } = props;
  if (preset.id === IMAGE_CROP_PRESET_ID) {
    return (
      <ImageCropLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_COMPRESS_PRESET_ID) {
    return (
      <DynamicImageCompressLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_RESIZE_PRESET_ID) {
    return (
      <DynamicImageResizeLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  return null;
}

export function renderAdvancedImageStudio(props: ImageStudioProps): ComponentChildren | null {
  const { idPrefix, toolId, preset, notify, onFilePhase } = props;
  if (preset.id === IMAGE_FORMAT_CONVERTER_PRESET_ID) {
    return (
      <DynamicImageFormatConverterLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_REMOVE_BACKGROUND_PRESET_ID) {
    return (
      <DynamicImageBackgroundRemoverLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_ENLARGER_PRESET_ID) {
    return (
      <DynamicImageEnlargerLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === PHOTO_SIZE_REDUCER_PRESET_ID || toolId === 'photo-size-reducer') {
    return (
      <DynamicPhotoSizeReducerLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  return renderDocumentAndWatermarkStudio(props);
}

function renderDocumentAndWatermarkStudio(props: ImageStudioProps): ComponentChildren | null {
  const { idPrefix, toolId, preset, notify, onFilePhase } = props;
  if (preset.id === PASSPORT_PHOTO_PRESET_ID || toolId === 'passport-photo-resizer') {
    return (
      <DynamicPassportPhotoLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === SIGNATURE_RESIZER_PRESET_ID || toolId === 'signature-resizer') {
    return (
      <DynamicSignatureResizerLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_METADATA_REMOVER_PRESET_ID || toolId === 'image-metadata-remover') {
    return (
      <DynamicImageMetadataRemoverLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === IMAGE_WATERMARK_PRESET_ID || toolId === 'image-watermark') {
    return (
      <DynamicImageWatermarkLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  if (preset.id === JPG_TO_PDF_PRESET_ID || toolId === 'jpg-to-pdf') {
    return (
      <DynamicImageToPdfLayout
        idPrefix={idPrefix}
        toolId={toolId}
        preset={preset}
        notify={notify}
        onPhase={onFilePhase}
      />
    );
  }
  return null;
}

export function renderImageStudioLayout(props: ImageStudioProps): ComponentChildren | null {
  return renderBasicImageStudio(props) ?? renderAdvancedImageStudio(props);
}
