import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './photoSizeReducer.module.css';
import { UniversalUploadDropzone } from './UniversalUploadDropzone.tsx';
import type { PhotoSizeOutputFormat, UsePhotoSizeReducerReturn } from './usePhotoSizeReducer.ts';

export interface PhotoSizeReducerControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  photoSize: UsePhotoSizeReducerReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

const KB_PRESETS: { id: string; label: string; kb: number | null; hint: string }[] = [
  { id: '20', label: '20 KB', kb: 20, hint: 'UPSC / SSC / Signature' },
  { id: '50', label: '50 KB', kb: 50, hint: 'Passport / Exams' },
  { id: '100', label: '100 KB', kb: 100, hint: 'Job Portals / KYC' },
  { id: '200', label: '200 KB', kb: 200, hint: 'KYC / University' },
  { id: '500', label: '500 KB', kb: 500, hint: 'Web / Email' },
];

const FORMAT_OPTIONS: { id: PhotoSizeOutputFormat; name: string; desc: string }[] = [
  { id: 'jpg', name: 'JPG', desc: 'Portals' },
  { id: 'png', name: 'PNG', desc: 'Lossless' },
  { id: 'webp', name: 'WebP', desc: 'Compact' },
  { id: 'pdf', name: 'PDF', desc: 'Document' },
];

function UploadSection({
  idPrefix,
  _preset,
  photoSize,
  onSelectFile,
  onTrySample,
}: {
  idPrefix: string;
  _preset: ResolvedPreset;
  photoSize: UsePhotoSizeReducerReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}) {
  const isExecuting = photoSize.phase === 'running';

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>1. Upload Photo</span>
        <div style={{ display: 'flex', gap: '3px' }}>
          <button
            type="button"
            class={styles.miniGhostBtn}
            onClick={onTrySample}
            disabled={isExecuting}
            title="Try sample photo"
          >
            ✨ Try Sample
          </button>
          <button
            type="button"
            class={styles.miniGhostBtn}
            onClick={photoSize.clearAll}
            disabled={isExecuting}
            title="Clear photo and start over"
          >
            ✕ Clear all
          </button>
        </div>
      </div>

      <UniversalUploadDropzone
        idPrefix={idPrefix}
        accept={_preset.ui.fileAccept ?? 'image/*,image/jpeg,image/png,image/webp'}
        file={photoSize.file}
        thumbnailUrl={photoSize.imageSrc}
        dimensions={photoSize.sourceDims.width ? photoSize.sourceDims : null}
        onSelectFile={onSelectFile}
        onClear={photoSize.clearAll}
        disabled={isExecuting}
        browseText="Upload Image"
      />
    </section>
  );
}

function TargetSizeSection({
  idPrefix,
  photoSize,
}: {
  idPrefix: string;
  photoSize: UsePhotoSizeReducerReturn;
}) {
  const isExecuting = photoSize.phase === 'running';
  const hasFile = !!photoSize.file;

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>2. Target Size (KB)</span>
        <span style={{ fontSize: '10px', color: 'var(--color-accent-text)', fontWeight: 'bold' }}>
          {photoSize.maxFileSizeKB ? `≤ ${photoSize.maxFileSizeKB} KB` : 'Auto'}
        </span>
      </div>

      <fieldset class={styles.kbPresetsRow} style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend class="visually-hidden">Quick Target Size Presets</legend>
        {KB_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            class={styles.kbPresetBtn}
            data-active={String(photoSize.maxFileSizeKB === p.kb)}
            onClick={() => p.kb && photoSize.setMaxFileSizeKB(p.kb)}
            disabled={!hasFile || isExecuting}
            title={p.hint}
          >
            {p.label}
          </button>
        ))}
      </fieldset>

      <div class={styles.fieldRow}>
        <label class={styles.fieldLabel} for={`${idPrefix}-maxFileSizeKB`}>
          Maximum file size
        </label>
        <div class={styles.inputWrapper}>
          <input
            id={`${idPrefix}-maxFileSizeKB`}
            type="number"
            class={styles.numInput}
            value={photoSize.maxFileSizeKB ?? ''}
            min={1}
            max={25000}
            placeholder="100"
            disabled={!hasFile || isExecuting}
            onInput={(e) => {
              const val = (e.target as HTMLInputElement).value;
              photoSize.setMaxFileSizeKB(val === '' ? undefined : Number(val));
            }}
          />
          <span class={styles.suffix}>KB</span>
        </div>
      </div>

      <div class={styles.dimsRow}>
        <div class={styles.fieldRow} style={{ flex: 1 }}>
          <label class={styles.fieldLabel} for={`${idPrefix}-targetWidth`}>
            Maximum width
          </label>
          <div class={styles.inputWrapper}>
            <input
              id={`${idPrefix}-targetWidth`}
              type="number"
              class={styles.numInput}
              value={photoSize.targetWidth || ''}
              placeholder={String(photoSize.sourceDims.width || 800)}
              disabled={!hasFile || isExecuting}
              onInput={(e) => {
                const val = (e.target as HTMLInputElement).value;
                photoSize.setTargetWidth(val === '' ? 0 : Number(val));
              }}
            />
            <span class={styles.suffix}>px</span>
          </div>
        </div>

        <div class={styles.fieldRow} style={{ flex: 1 }}>
          <label class={styles.fieldLabel} for={`${idPrefix}-targetHeight`}>
            Maximum height
          </label>
          <div class={styles.inputWrapper}>
            <input
              id={`${idPrefix}-targetHeight`}
              type="number"
              class={styles.numInput}
              value={photoSize.targetHeight || ''}
              placeholder={String(photoSize.sourceDims.height || 600)}
              disabled={!hasFile || isExecuting}
              onInput={(e) => {
                const val = (e.target as HTMLInputElement).value;
                photoSize.setTargetHeight(val === '' ? 0 : Number(val));
              }}
            />
            <span class={styles.suffix}>px</span>
          </div>
        </div>
      </div>

      <div class={styles.switchRow}>
        <label
          class={styles.switchToggleLabel}
          title="Permits smart dimension scaling down to hit strict KB limits (e.g. 20 KB / 50 KB)."
        >
          <input
            type="checkbox"
            role="switch"
            aria-label="Allow smaller dimensions"
            aria-checked={photoSize.allowDimensionReduction}
            checked={photoSize.allowDimensionReduction}
            onChange={photoSize.toggleAllowDimensionReduction}
            disabled={!hasFile || isExecuting}
          />
          <span>Allow smaller dimensions</span>
        </label>
      </div>
    </section>
  );
}

function QualitySection({
  idPrefix,
  photoSize,
  disabled,
}: {
  idPrefix: string;
  photoSize: UsePhotoSizeReducerReturn;
  disabled: boolean;
}) {
  const isLossy = photoSize.outputFormat === 'jpg' || photoSize.outputFormat === 'webp';
  if (!isLossy) return null;

  return (
    <div class={styles.qualityRow}>
      <label class={styles.qualityLabel} for={`${idPrefix}-quality`}>
        <span>Quality</span>
        <span class={styles.qualityValue}>{photoSize.quality}%</span>
      </label>
      <div class={styles.qualityInputRow}>
        <input
          id={`${idPrefix}-quality-slider`}
          aria-label="Quality slider"
          type="range"
          min={50}
          max={100}
          value={photoSize.quality}
          disabled={disabled}
          onInput={(e) => photoSize.setQuality(Number((e.target as HTMLInputElement).value))}
          class={styles.qualitySlider}
        />
        <input
          id={`${idPrefix}-quality`}
          aria-label="Quality"
          type="number"
          min={50}
          max={100}
          value={photoSize.quality}
          disabled={disabled}
          onInput={(e) => photoSize.setQuality(Number((e.target as HTMLInputElement).value))}
          class={styles.qualityNumber}
        />
      </div>
    </div>
  );
}

function FormatSection({
  idPrefix,
  photoSize,
}: {
  idPrefix: string;
  photoSize: UsePhotoSizeReducerReturn;
}) {
  const isExecuting = photoSize.phase === 'running';
  const hasFile = !!photoSize.file;

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>3. Output Format</span>
        <button
          type="button"
          class={styles.resetGhostBtn}
          onClick={photoSize.reset}
          disabled={!hasFile || isExecuting}
        >
          ↺ Reset
        </button>
      </div>

      <select
        id={`${idPrefix}-output-format`}
        aria-label="Output format"
        value={photoSize.outputFormat}
        onChange={(e) =>
          photoSize.setOutputFormat(
            (e.currentTarget as HTMLSelectElement).value as PhotoSizeOutputFormat,
          )
        }
        class="visually-hidden"
        disabled={!hasFile || isExecuting}
      >
        <option value="jpg">JPG (white background)</option>
        <option value="png">PNG (retain transparency)</option>
        <option value="webp">WebP</option>
        <option value="pdf">PDF</option>
      </select>

      <fieldset
        class={styles.kbPresetsRow}
        style={{ border: 'none', padding: 0, margin: '1px 0 0 0' }}
      >
        <legend class="visually-hidden">Quick Format Switch</legend>
        {FORMAT_OPTIONS.map((fmt) => (
          <button
            key={fmt.id}
            type="button"
            class={styles.kbPresetBtn}
            data-active={String(photoSize.outputFormat === fmt.id)}
            onClick={() => photoSize.setOutputFormat(fmt.id)}
            disabled={!hasFile || isExecuting}
            title={fmt.desc}
          >
            {fmt.name}
          </button>
        ))}
      </fieldset>

      <QualitySection
        idPrefix={idPrefix}
        photoSize={photoSize}
        disabled={!hasFile || isExecuting}
      />

      <div class={styles.inlineFilenameRow}>
        <label
          class={styles.fieldLabel}
          for={`${idPrefix}-output-filename`}
          style={{ minWidth: '40px' }}
        >
          Name:
        </label>
        <input
          id={`${idPrefix}-output-filename`}
          type="text"
          class={styles.filenameInput}
          value={photoSize.customFileName}
          placeholder={
            photoSize.file?.name
              ? `${photoSize.file.name.replace(/\.[^.]+$/, '')}-reduced`
              : 'reduced-photo'
          }
          disabled={!hasFile || isExecuting}
          onInput={(e) => photoSize.setCustomFileName((e.target as HTMLInputElement).value)}
        />
      </div>
    </section>
  );
}

export function PhotoSizeReducerControls(props: PhotoSizeReducerControlsProps) {
  return (
    <aside class={styles.controlPanel} aria-label="Photo Size Reducer Controls">
      <div class={styles.panelCard}>
        <UploadSection
          idPrefix={props.idPrefix}
          _preset={props.preset}
          photoSize={props.photoSize}
          onSelectFile={props.onSelectFile}
          onTrySample={props.onTrySample}
        />
        <TargetSizeSection idPrefix={props.idPrefix} photoSize={props.photoSize} />
        <FormatSection idPrefix={props.idPrefix} photoSize={props.photoSize} />
      </div>
    </aside>
  );
}
