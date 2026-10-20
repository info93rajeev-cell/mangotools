import type { ResolvedPreset } from '@mangotools/schemas';
import { formatFileSize } from '../archetypes/FileQueue.tsx';
import { Button } from '../primitives/Button.tsx';
import { NumberField, TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import fileToolStyles from './fileTool.module.css';
import styles from './imageCrop.module.css';
import type { AspectRatioPreset, PixelRect } from './imageWorkbenchGeometry.ts';
import { label } from './presentation.ts';
import type { CropOutputFormat, useImageCrop } from './useImageCrop.ts';

export interface ImageCropControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  crop: ReturnType<typeof useImageCrop>;
  lockRatio: boolean;
  onToggleLockRatio: () => void;
  onSelectFile: (file: File) => void;
  onTryPalaceSample: () => void;
}

const RATIO_PRESETS: { value: AspectRatioPreset; label: string; sub: string }[] = [
  { value: 'free', label: 'Free', sub: 'Custom' },
  { value: '1:1', label: '1:1', sub: 'Square' },
  { value: '4:3', label: '4:3', sub: 'Standard' },
  { value: '16:9', label: '16:9', sub: 'Wide' },
  { value: '35:45', label: '3:5', sub: 'Portrait' },
];

const FORMAT_PRESETS: { value: CropOutputFormat; label: string; sub: string }[] = [
  { value: 'same', label: 'Same', sub: 'Source' },
  { value: 'jpg', label: 'JPG', sub: 'Photo' },
  { value: 'png', label: 'PNG', sub: 'Lossless' },
  { value: 'webp', label: 'WebP', sub: 'Smallest' },
];

function SourceUploadCard({
  idPrefix,
  preset,
  crop,
  onSelectFile,
  onTryPalaceSample,
}: {
  idPrefix: string;
  preset: ResolvedPreset;
  crop: ReturnType<typeof useImageCrop>;
  onSelectFile: (file: File) => void;
  onTryPalaceSample: () => void;
}) {
  return (
    <div class={styles.panelCard}>
      <div class={styles.panelCardHead}>
        <h3 class={styles.panelCardTitle}>1. Source Image</h3>
        <button
          type="button"
          class={styles.samplePillBtn}
          onClick={onTryPalaceSample}
          title="Load Jaipur Palace sample"
        >
          ✨ Try Sample
        </button>
      </div>

      <label
        class={styles.compactDropZone}
        for={`${idPrefix}-file-upload`}
        data-compact-dropzone=""
      >
        <input
          id={`${idPrefix}-file-upload`}
          type="file"
          class={styles.hiddenFileInput}
          accept={preset.ui.fileAccept ?? 'image/jpeg,image/png,image/webp'}
          onChange={(e) => {
            const file = (e.currentTarget as HTMLInputElement).files?.[0];
            if (file) onSelectFile(file);
          }}
        />
        <span class={styles.dropIcon} aria-hidden="true">
          📁
        </span>
        <span class={styles.dropText}>
          <strong>Choose an image</strong> or drop here
        </span>
        <span class={styles.dropSub}>JPG, PNG, WebP up to 25 MB</span>
      </label>

      {crop.file && (
        <div class={styles.activeFileBadge} data-file-row="">
          <div class={styles.activeFileInfo}>
            <div class={styles.activeFileName} title={crop.file.name}>
              {crop.file.name}
            </div>
            <div class={styles.activeFileMeta}>
              {crop.sourceFormat?.toUpperCase() ?? 'JPG'} • {crop.sourceDims.width} ×{' '}
              {crop.sourceDims.height} px • {formatFileSize(crop.file.size)}
            </div>
          </div>
          <button
            type="button"
            class={styles.removeFileBtn}
            onClick={crop.clearAll}
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function AspectRatioCard({
  ratio,
  onRatio,
}: {
  ratio: AspectRatioPreset;
  onRatio: (r: AspectRatioPreset) => void;
}) {
  return (
    <div class={styles.panelCard}>
      <h3 class={styles.panelCardTitle}>2. Aspect Ratio</h3>
      <div class={styles.ratioGrid}>
        {RATIO_PRESETS.map((p) => {
          const active = ratio === p.value;
          return (
            <button
              key={p.value}
              type="button"
              class={styles.ratioCard}
              data-active={String(active)}
              aria-pressed={active}
              onClick={() => onRatio(p.value)}
            >
              <span class={styles.ratioCardMain}>{p.label}</span>
              <span class={styles.ratioCardSub}>{p.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CoordinatesCard({
  idPrefix,
  cropRect,
  updateNumeric,
  lockRatio,
  onToggleLockRatio,
}: {
  idPrefix: string;
  cropRect: PixelRect;
  updateNumeric: (k: 'x' | 'y' | 'width' | 'height', v: number) => void;
  lockRatio: boolean;
  onToggleLockRatio: () => void;
}) {
  return (
    <div class={styles.panelCard}>
      <div class={styles.panelCardHead}>
        <h3 class={styles.panelCardTitle}>3. Coordinates & Size</h3>
        <label class={styles.lockRatioLabel}>
          <input
            type="checkbox"
            checked={lockRatio}
            onChange={onToggleLockRatio}
            class={styles.lockCheckbox}
          />
          <span>Lock ratio</span>
        </label>
      </div>
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
    </div>
  );
}

function OutputFormatCard({
  idPrefix,
  preset,
  crop,
}: {
  idPrefix: string;
  preset: ResolvedPreset;
  crop: ReturnType<typeof useImageCrop>;
}) {
  return (
    <div class={styles.panelCard}>
      <h3 class={styles.panelCardTitle}>4. Output Format</h3>
      <div class={styles.formatGrid}>
        {FORMAT_PRESETS.map((f) => {
          const active = crop.outputFormat === f.value;
          return (
            <button
              key={f.value}
              type="button"
              class={styles.formatCard}
              data-active={String(active)}
              aria-pressed={active}
              onClick={() => crop.setOutputFormat(f.value)}
            >
              <span class={styles.formatCardMain}>{f.label}</span>
              <span class={styles.formatCardSub}>{f.sub}</span>
            </button>
          );
        })}
      </div>

      {crop.resolvedFormat !== 'png' && (
        <div class={styles.qualityRow}>
          <label class={styles.numericField} for={`${idPrefix}-quality`}>
            <span class={styles.numericLabel}>Quality ({crop.quality}%)</span>
            <NumberField
              id={`${idPrefix}-quality`}
              aria-label="Quality"
              value={String(crop.quality)}
              onValue={(v: string) => crop.setQuality(Number(v))}
            />
          </label>
        </div>
      )}

      <div class={styles.filenameRow}>
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

      <div class={styles.panelActions}>
        <Button
          variant="primary"
          icon="crop"
          onClick={crop.runCrop}
          loading={crop.phase === 'running'}
          disabled={crop.phase === 'running'}
          data-crop-button=""
        >
          {label(preset, 'fileTool.downloadCta')}
        </Button>
        <Button variant="ghost" icon="rotate-ccw" onClick={crop.clearAll}>
          {t('fileTool.clearAll')}
        </Button>
      </div>
    </div>
  );
}

export function ImageCropControls(props: ImageCropControlsProps) {
  const { idPrefix, preset, crop, lockRatio, onToggleLockRatio, onSelectFile, onTryPalaceSample } =
    props;

  return (
    <aside class={styles.controlPanel} aria-label="Crop settings and controls">
      <SourceUploadCard
        idPrefix={idPrefix}
        preset={preset}
        crop={crop}
        onSelectFile={onSelectFile}
        onTryPalaceSample={onTryPalaceSample}
      />
      <AspectRatioCard ratio={crop.ratio} onRatio={crop.setRatio} />
      <CoordinatesCard
        idPrefix={idPrefix}
        cropRect={crop.cropRect}
        updateNumeric={crop.updateNumeric}
        lockRatio={lockRatio}
        onToggleLockRatio={onToggleLockRatio}
      />
      <OutputFormatCard idPrefix={idPrefix} preset={preset} crop={crop} />
    </aside>
  );
}
