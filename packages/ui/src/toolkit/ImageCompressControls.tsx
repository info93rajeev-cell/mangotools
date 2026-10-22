import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import styles from './imageCompress.module.css';
import type { CompressOutputFormat, UseImageCompressReturn } from './useImageCompress.ts';

export interface ImageCompressControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  compress: UseImageCompressReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

const TARGET_PRESETS: { id: string; label: string; kb: number | null; hint: string }[] = [
  { id: 'auto', label: 'Auto', kb: null, hint: 'Smart' },
  { id: '20', label: '20 KB', kb: 20, hint: 'Signatures' },
  { id: '50', label: '50 KB', kb: 50, hint: 'Passport/ID' },
  { id: '100', label: '100 KB', kb: 100, hint: 'Portals' },
  { id: '200', label: '200 KB', kb: 200, hint: 'KYC / HD' },
  { id: 'custom', label: 'Custom', kb: -1, hint: 'Enter KB' },
];

const FORMAT_OPTIONS: { id: CompressOutputFormat; name: string; desc: string }[] = [
  { id: 'same', name: 'Same', desc: 'Auto' },
  { id: 'jpg', name: 'JPG', desc: 'Photo' },
  { id: 'png', name: 'PNG', desc: 'Lossless' },
  { id: 'webp', name: 'WebP', desc: 'Small' },
  { id: 'pdf', name: 'PDF', desc: 'Document' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function UploadSection({
  idPrefix,
  preset,
  compress,
  onSelectFile,
  onTrySample,
}: {
  idPrefix: string;
  preset: ResolvedPreset;
  compress: UseImageCompressReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}) {
  const fileInputId = `${idPrefix}-file-input`;
  const isExecuting = compress.phase === 'running';

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>1. Upload Image</span>
        <Button variant="ghost" icon="sparkle" onClick={onTrySample} disabled={isExecuting}>
          Try Sample
        </Button>
      </div>

      <input
        id={fileInputId}
        type="file"
        accept={preset.ui.fileAccept ?? 'image/jpeg,image/png,image/webp'}
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (f) onSelectFile(f);
        }}
      />

      <div class={styles.uploadRow}>
        <label for={fileInputId} class={styles.uploadMainBtn} data-upload-button="">
          📁 Upload Image
        </label>
      </div>

      {compress.file ? (
        <div class={styles.activeFileBadge}>
          <span class={styles.activeFileName} title={compress.file?.name}>
            {compress.file?.name}
          </span>
          <span class={styles.activeFileMeta}>
            {compress.sourceDims.width} × {compress.sourceDims.height} px •{' '}
            {formatBytes(compress.file.size)}
          </span>
        </div>
      ) : (
        <label
          for={fileInputId}
          class={styles.compactDropZone}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer?.files?.[0];
            if (f) onSelectFile(f);
          }}
        >
          <span class={styles.dropZoneHint}>Drop JPG, PNG, or WebP here</span>
        </label>
      )}
    </section>
  );
}

function TargetSizeSection({
  idPrefix,
  compress,
}: {
  idPrefix: string;
  compress: UseImageCompressReturn;
}) {
  const hasFile = !!compress.file;
  const isExecuting = compress.phase === 'running';

  const currentPresetId =
    compress.maxFileSizeKB === null
      ? 'auto'
      : [20, 50, 100, 200].includes(compress.maxFileSizeKB)
        ? String(compress.maxFileSizeKB)
        : 'custom';

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>2. Target Size & Quality</span>
        <span class={styles.badgeHint}>
          {compress.maxFileSizeKB ? `≤ ${compress.maxFileSizeKB} KB` : `${compress.quality}%`}
        </span>
      </div>

      {/* TARGET KB PRESET BUTTONS */}
      <fieldset class={styles.presetGroup} style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend class="sr-only">Target Size Presets</legend>
        <span class={styles.dimLabel}>Target file size:</span>
        <div class={styles.presetRow}>
          {TARGET_PRESETS.map((preset) => {
            const active = currentPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                class={styles.presetBtn}
                data-active={String(active)}
                onClick={() => {
                  if (preset.kb === null) {
                    compress.setMaxFileSizeKB(null);
                  } else if (preset.kb === -1) {
                    compress.setMaxFileSizeKB(compress.maxFileSizeKB || 50);
                  } else {
                    compress.setMaxFileSizeKB(preset.kb);
                  }
                }}
                disabled={!hasFile || isExecuting}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* CUSTOM KB INPUT IF SET */}
      {compress.maxFileSizeKB !== null && (
        <div class={styles.customKbRow}>
          <label for={`${idPrefix}-max-file-size`} class={styles.dimLabel}>
            Target file size limit (KB):
          </label>
          <div class={styles.dimInputWrapper}>
            <input
              id={`${idPrefix}-max-file-size`}
              aria-label="Target file size limit"
              type="number"
              min="5"
              max="10000"
              value={compress.maxFileSizeKB ?? ''}
              onInput={(e) => {
                const val = (e.currentTarget as HTMLInputElement).valueAsNumber;
                compress.setMaxFileSizeKB(Number.isNaN(val) || val <= 0 ? null : val);
              }}
              class={styles.dimInput}
              disabled={!hasFile || isExecuting}
            />
            <span class={styles.dimUnit}>KB</span>
          </div>
        </div>
      )}

      {/* QUALITY SLIDER */}
      <div class={styles.qualityGroup}>
        <div class={styles.qualityHeader}>
          <label for={`${idPrefix}-quality`} class={styles.dimLabel}>
            Quality ceiling:
          </label>
          <span class={styles.qualityValText}>{compress.quality}%</span>
        </div>
        <div class={styles.qualitySliderRow}>
          <input
            id={`${idPrefix}-quality`}
            aria-label="Quality"
            type="range"
            min="50"
            max="100"
            step="1"
            value={compress.quality}
            onInput={(e) => {
              compress.setQuality(Number((e.currentTarget as HTMLInputElement).value));
            }}
            class={styles.qualitySlider}
            disabled={!hasFile || isExecuting}
          />
        </div>
      </div>
    </section>
  );
}

function FormatSection({
  idPrefix,
  compress,
}: {
  idPrefix: string;
  compress: UseImageCompressReturn;
}) {
  const hasFile = !!compress.file;
  const isExecuting = compress.phase === 'running';

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>3. Output Format</span>
        <span class={styles.badgeHint}>{compress.outputFormat.toUpperCase()}</span>
      </div>

      <label for={`${idPrefix}-output-format`} class="visually-hidden">
        Output format
      </label>
      <select
        id={`${idPrefix}-output-format`}
        aria-label="Output format"
        value={compress.outputFormat}
        onChange={(e) =>
          compress.setOutputFormat(
            (e.currentTarget as HTMLSelectElement).value as CompressOutputFormat,
          )
        }
        class="visually-hidden"
      >
        <option value="same">Same as input</option>
        <option value="jpg">JPG</option>
        <option value="png">PNG</option>
        <option value="webp">WebP</option>
        <option value="pdf">PDF</option>
      </select>

      <fieldset class={styles.formatGrid} style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend class="visually-hidden">Output Image Format</legend>
        {FORMAT_OPTIONS.map((fmt) => (
          <button
            key={fmt.id}
            type="button"
            class={styles.formatCard}
            data-active={String(compress.outputFormat === fmt.id)}
            onClick={() => compress.setOutputFormat(fmt.id)}
            disabled={!hasFile || isExecuting}
          >
            <span class={styles.formatName}>{fmt.name}</span>
            <span class={styles.formatDesc}>{fmt.desc}</span>
          </button>
        ))}
      </fieldset>

      {/* OUTPUT FILE NAME */}
      <div class={styles.fileNameGroup}>
        <label for={`${idPrefix}-file-name`} class={styles.dimLabel}>
          Output file name:
        </label>
        <input
          id={`${idPrefix}-file-name`}
          aria-label="Output file name"
          type="text"
          placeholder={compress.file ? compress.file.name.replace(/\.[^.]+$/, '') : 'photo'}
          value={compress.customFileName}
          onInput={(e) => compress.setCustomFileName((e.currentTarget as HTMLInputElement).value)}
          class={styles.fileNameInput}
          disabled={!hasFile || isExecuting}
        />
      </div>

      {/* ACTION BUTTON */}
      <div class={styles.actionRow}>
        <Button
          variant="primary"
          icon="zap"
          class={styles.compressActionBtn}
          data-action="compress-download"
          onClick={() => void compress.executeCompressAndDownload()}
          disabled={!hasFile || isExecuting}
        >
          {isExecuting ? 'Compressing...' : 'Compress Image'}
        </Button>
      </div>

      <div class={styles.resetRow}>
        <button
          type="button"
          class={styles.resetLinkBtn}
          onClick={compress.reset}
          disabled={!hasFile || isExecuting}
        >
          ↺ Reset Settings
        </button>
      </div>
    </section>
  );
}

export function ImageCompressControls({
  idPrefix,
  preset,
  compress,
  onSelectFile,
  onTrySample,
}: ImageCompressControlsProps) {
  return (
    <aside class={styles.controlsPanel} aria-label="Image Compress Controls">
      <UploadSection
        idPrefix={idPrefix}
        preset={preset}
        compress={compress}
        onSelectFile={onSelectFile}
        onTrySample={onTrySample}
      />
      <TargetSizeSection idPrefix={idPrefix} compress={compress} />
      <FormatSection idPrefix={idPrefix} compress={compress} />
    </aside>
  );
}
