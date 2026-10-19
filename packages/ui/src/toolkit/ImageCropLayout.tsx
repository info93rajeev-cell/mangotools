import type { ResolvedPreset } from '@mangotools/schemas';
import { FileDropZone } from '../archetypes/FileDropZone.tsx';
import { formatFileSize } from '../archetypes/FileQueue.tsx';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { Button } from '../primitives/Button.tsx';
import { InlineAlert } from '../primitives/feedback.tsx';
import { NumberField, Select, TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import fileToolStyles from './fileTool.module.css';
import { ImageCropResult } from './ImageCropResult.tsx';
import { ImageWorkbench } from './ImageWorkbench.tsx';
import styles from './imageCrop.module.css';
import { label, messageFor } from './presentation.ts';
import { type CropOutputFormat, useImageCrop } from './useImageCrop.ts';

export interface ImageCropLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

const FORMAT_OPTIONS: { value: CropOutputFormat; label: string }[] = [
  { value: 'same', label: 'Same as input' },
  { value: 'jpg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
];

interface NumericFieldsProps {
  idPrefix: string;
  crop: ReturnType<typeof useImageCrop>;
}

function NumericFields({ idPrefix, crop }: NumericFieldsProps) {
  const { cropRect, updateNumeric } = crop;
  return (
    <fieldset class={styles.numericGrid}>
      <legend class="sr-only">Crop coordinates and dimensions</legend>
      <label class={styles.numericField} for={`${idPrefix}-crop-x`}>
        <span class={styles.numericLabel}>X (px)</span>
        <NumberField
          id={`${idPrefix}-crop-x`}
          aria-label="Crop X"
          value={String(Math.round(cropRect.x))}
          onValue={(v: string) => updateNumeric('x', Number(v))}
        />
      </label>
      <label class={styles.numericField} for={`${idPrefix}-crop-y`}>
        <span class={styles.numericLabel}>Y (px)</span>
        <NumberField
          id={`${idPrefix}-crop-y`}
          aria-label="Crop Y"
          value={String(Math.round(cropRect.y))}
          onValue={(v: string) => updateNumeric('y', Number(v))}
        />
      </label>
      <label class={styles.numericField} for={`${idPrefix}-crop-w`}>
        <span class={styles.numericLabel}>Width (px)</span>
        <NumberField
          id={`${idPrefix}-crop-w`}
          aria-label="Crop width"
          value={String(Math.round(cropRect.width))}
          onValue={(v: string) => updateNumeric('width', Number(v))}
        />
      </label>
      <label class={styles.numericField} for={`${idPrefix}-crop-h`}>
        <span class={styles.numericLabel}>Height (px)</span>
        <NumberField
          id={`${idPrefix}-crop-h`}
          aria-label="Crop height"
          value={String(Math.round(cropRect.height))}
          onValue={(v: string) => updateNumeric('height', Number(v))}
        />
      </label>
    </fieldset>
  );
}

interface OptionsRowProps {
  idPrefix: string;
  crop: ReturnType<typeof useImageCrop>;
}

function OptionsRow({ idPrefix, crop }: OptionsRowProps) {
  return (
    <div class={styles.optionsRow}>
      <label class={styles.selectField} for={`${idPrefix}-output-format`}>
        <span>Output format</span>
        <Select
          id={`${idPrefix}-output-format`}
          aria-label="Output format"
          value={crop.outputFormat}
          options={FORMAT_OPTIONS}
          onValue={(v: string) => crop.setOutputFormat(v as CropOutputFormat)}
        />
      </label>
      {crop.resolvedFormat !== 'png' && (
        <label class={styles.numericField} for={`${idPrefix}-quality`}>
          <span>Quality (%)</span>
          <NumberField
            id={`${idPrefix}-quality`}
            aria-label="Quality"
            value={String(crop.quality)}
            onValue={(v: string) => crop.setQuality(Number(v))}
          />
        </label>
      )}
      <label class={fileToolStyles.outputNameField} for={`${idPrefix}-output-name`}>
        <span>{t('fileTool.outputNameLabel')}</span>
        <TextInput
          id={`${idPrefix}-output-name`}
          aria-label="Output file name"
          value={crop.customFileName}
          onValue={crop.setCustomFileName}
          placeholder={crop.suggestedFileName}
        />
      </label>
    </div>
  );
}

interface WorkbenchPanelProps {
  idPrefix: string;
  preset: ResolvedPreset;
  crop: ReturnType<typeof useImageCrop>;
}

function WorkbenchPanel({ idPrefix, preset, crop }: WorkbenchPanelProps) {
  return (
    <div class={styles.workbenchWrap}>
      <ImageWorkbench
        idPrefix={idPrefix}
        imageSrc={crop.imageSrc ?? ''}
        imageAlt={crop.file?.name ?? ''}
        sourceWidth={crop.sourceDims.width}
        sourceHeight={crop.sourceDims.height}
        value={crop.cropRect}
        onChange={crop.setCropRect}
        aspectRatio={crop.ratio}
        onAspectRatioChange={crop.setRatio}
        showAspectRatioControls={true}
        showResetButton={true}
        showCoordinates={false}
      />
      <NumericFields idPrefix={idPrefix} crop={crop} />
      <OptionsRow idPrefix={idPrefix} crop={crop} />
      <div class={styles.actions}>
        <Button
          variant="primary"
          icon="download"
          onClick={crop.runCrop}
          loading={crop.phase === 'running'}
          disabled={crop.phase === 'running'}
          data-crop-button=""
        >
          {label(preset, 'fileTool.downloadCta')}
        </Button>
        <Button variant="ghost" icon="x" onClick={crop.clearAll}>
          {t('fileTool.clearAll')}
        </Button>
      </div>
    </div>
  );
}

export function ImageCropLayout({
  idPrefix,
  toolId,
  preset,
  notify,
  onPhase,
}: ImageCropLayoutProps) {
  const crop = useImageCrop(preset, toolId, notify, onPhase);

  return (
    <div class={styles.container} data-image-crop-layout="">
      {!crop.file ? (
        <FileDropZone
          accept={preset.ui.fileAccept ?? 'image/jpeg,image/png,image/webp'}
          dropHint={label(preset, 'fileTool.dropHint')}
          multiple={false}
          onFiles={(list) => {
            const first = list[0];
            if (first) void crop.loadFile(first);
          }}
        />
      ) : (
        <>
          <div class={fileToolStyles.queueRow} data-file-row="">
            <span class={fileToolStyles.queueName}>{crop.file.name}</span>
            <span class={fileToolStyles.queueSize}>
              {formatFileSize(crop.file.size)} • {crop.sourceDims.width} × {crop.sourceDims.height}{' '}
              px
            </span>
            <Button
              variant="ghost"
              icon="x"
              size="sm"
              onClick={crop.clearAll}
              aria-label="Remove image"
            />
          </div>
          {crop.imageSrc && crop.sourceDims.width > 0 && (
            <WorkbenchPanel idPrefix={idPrefix} preset={preset} crop={crop} />
          )}
        </>
      )}

      {crop.phase === 'error' && crop.error && (
        <InlineAlert tone="danger" role="alert" data-crop-error="">
          {messageFor(preset, crop.error)}
        </InlineAlert>
      )}

      {crop.phase === 'result' && crop.result && crop.resultUrl && (
        <ImageCropResult
          preset={preset}
          result={crop.result}
          resultUrl={crop.resultUrl}
          onDownload={crop.downloadCurrentResult}
        />
      )}
    </div>
  );
}
