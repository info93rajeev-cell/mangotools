import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import { NumberField, TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import styles from './imageCrop.module.css';
import type { AspectRatioPreset } from './imageWorkbenchGeometry.ts';
import { UniversalUploadDropzone } from './UniversalUploadDropzone.tsx';
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
  { value: '16:9', label: '16:9', sub: 'Widescreen' },
  { value: '35:45', label: '35:45', sub: 'Portrait' },
];

const FORMAT_PRESETS: { value: CropOutputFormat; label: string; sub: string }[] = [
  { value: 'same', label: 'Same', sub: 'Auto' },
  { value: 'jpg', label: 'JPG', sub: 'Photos' },
  { value: 'png', label: 'PNG', sub: 'Lossless' },
  { value: 'webp', label: 'WebP', sub: 'Small' },
];

function UploadSection({
  fileInputId,
  preset,
  crop,
  onSelectFile,
  onTryPalaceSample,
}: {
  fileInputId: string;
  preset: ResolvedPreset;
  crop: ReturnType<typeof useImageCrop>;
  onSelectFile: (file: File) => void;
  onTryPalaceSample: () => void;
}) {
  return (
    <div>
      <div class={styles.panelCardHead}>
        <h3 class={styles.panelCardTitle}>1. Upload Image</h3>
        <button
          type="button"
          class={styles.samplePillBtn}
          onClick={onTryPalaceSample}
          title="Load Jaipur Palace sample"
        >
          ✨ Try Sample
        </button>
      </div>

      <UniversalUploadDropzone
        idPrefix={fileInputId}
        accept={preset.ui.fileAccept ?? 'image/jpeg,image/png,image/webp'}
        file={crop.file}
        thumbnailUrl={crop.imageSrc}
        dimensions={crop.sourceDims.width ? crop.sourceDims : null}
        onSelectFile={onSelectFile}
        onClear={crop.clearAll}
        browseText="Upload Image"
      />
    </div>
  );
}

function AspectRatioSection({ crop }: { crop: ReturnType<typeof useImageCrop> }) {
  return (
    <div class={styles.controlSection}>
      <div class={styles.panelCardHead}>
        <h3 class={styles.panelCardTitle}>2. Aspect Ratio</h3>
        <span class={styles.activeRatioHint}>{crop.ratio.toUpperCase()}</span>
      </div>
      <div class={styles.ratioGrid}>
        {RATIO_PRESETS.map((p) => {
          const active = crop.ratio === p.value;
          return (
            <button
              key={p.value}
              type="button"
              class={styles.ratioCard}
              data-active={String(active)}
              aria-pressed={active}
              onClick={() => crop.setRatio(p.value)}
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

function CoordinatesSection({
  idPrefix,
  crop,
  lockRatio,
  onToggleLockRatio,
}: {
  idPrefix: string;
  crop: ReturnType<typeof useImageCrop>;
  lockRatio: boolean;
  onToggleLockRatio: () => void;
}) {
  return (
    <div class={styles.controlSection}>
      <div class={styles.panelCardHead}>
        <h3 class={styles.panelCardTitle}>3. Coordinates (px)</h3>
        <label class={styles.lockRatioLabel}>
          <input
            type="checkbox"
            checked={lockRatio}
            onChange={onToggleLockRatio}
            class={styles.lockCheckbox}
          />
          <span>Lock ({crop.ratio === 'free' ? 'free' : crop.ratio})</span>
        </label>
      </div>
      <fieldset class={styles.numericGrid}>
        <legend class="sr-only">Crop coordinates and dimensions</legend>
        <label class={styles.numericField} for={`${idPrefix}-crop-x`}>
          <span class={styles.numericLabel}>X</span>
          <NumberField
            id={`${idPrefix}-crop-x`}
            aria-label="Crop X"
            value={String(Math.round(crop.cropRect.x))}
            onValue={(v: string) => crop.updateNumeric('x', Number(v))}
          />
        </label>
        <label class={styles.numericField} for={`${idPrefix}-crop-y`}>
          <span class={styles.numericLabel}>Y</span>
          <NumberField
            id={`${idPrefix}-crop-y`}
            aria-label="Crop Y"
            value={String(Math.round(crop.cropRect.y))}
            onValue={(v: string) => crop.updateNumeric('y', Number(v))}
          />
        </label>
        <label class={styles.numericField} for={`${idPrefix}-crop-w`}>
          <span class={styles.numericLabel}>Width</span>
          <NumberField
            id={`${idPrefix}-crop-w`}
            aria-label="Crop width"
            value={String(Math.round(crop.cropRect.width))}
            onValue={(v: string) => crop.updateNumeric('width', Number(v))}
          />
        </label>
        <label class={styles.numericField} for={`${idPrefix}-crop-h`}>
          <span class={styles.numericLabel}>Height</span>
          <NumberField
            id={`${idPrefix}-crop-h`}
            aria-label="Crop height"
            value={String(Math.round(crop.cropRect.height))}
            onValue={(v: string) => crop.updateNumeric('height', Number(v))}
          />
        </label>
      </fieldset>
    </div>
  );
}

function FormatOptionCards({ crop }: { crop: ReturnType<typeof useImageCrop> }) {
  return (
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
  );
}

function OutputFormatSection({
  idPrefix,
  crop,
}: {
  idPrefix: string;
  crop: ReturnType<typeof useImageCrop>;
}) {
  return (
    <div class={styles.controlSection}>
      <div class={styles.panelCardHead}>
        <h3 class={styles.panelCardTitle}>4. Output Format</h3>
        <span class={styles.activeFormatHint}>{crop.resolvedFormat.toUpperCase()}</span>
      </div>

      <label for={`${idPrefix}-output-format`} class="sr-only">
        Output format
      </label>
      <select
        id={`${idPrefix}-output-format`}
        aria-label="Output format"
        value={crop.outputFormat}
        onChange={(e) => crop.setOutputFormat(e.currentTarget.value as CropOutputFormat)}
        class={styles.hiddenSelect}
      >
        <option value="same">Same as input</option>
        <option value="jpg">jpg</option>
        <option value="png">png</option>
        <option value="webp">webp</option>
      </select>

      <FormatOptionCards crop={crop} />

      <div class={styles.settingsSubGrid}>
        {crop.resolvedFormat !== 'png' ? (
          <label class={styles.numericField} for={`${idPrefix}-quality`}>
            <span class={styles.numericLabel}>Quality ({crop.quality}%)</span>
            <NumberField
              id={`${idPrefix}-quality`}
              aria-label="Quality"
              value={String(crop.quality)}
              onValue={(v: string) => crop.setQuality(Number(v))}
            />
          </label>
        ) : null}
        <label class={styles.numericField} for={`${idPrefix}-output-name`}>
          <span class={styles.numericLabel}>{t('fileTool.outputNameLabel')}</span>
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
          Crop Image
        </Button>
        <button type="button" class={styles.resetGhostBtn} onClick={crop.clearAll}>
          ↺ Reset Settings
        </button>
      </div>
    </div>
  );
}

export function ImageCropControls(props: ImageCropControlsProps) {
  const { idPrefix, preset, crop, lockRatio, onToggleLockRatio, onSelectFile, onTryPalaceSample } =
    props;
  const fileInputId = `${idPrefix}-file-upload`;

  return (
    <aside class={styles.controlPanel} aria-label="Crop settings and controls">
      <div class={styles.panelCard}>
        <UploadSection
          fileInputId={fileInputId}
          preset={preset}
          crop={crop}
          onSelectFile={onSelectFile}
          onTryPalaceSample={onTryPalaceSample}
        />
        <AspectRatioSection crop={crop} />
        <CoordinatesSection
          idPrefix={idPrefix}
          crop={crop}
          lockRatio={lockRatio}
          onToggleLockRatio={onToggleLockRatio}
        />
        <OutputFormatSection idPrefix={idPrefix} crop={crop} />
      </div>
    </aside>
  );
}
