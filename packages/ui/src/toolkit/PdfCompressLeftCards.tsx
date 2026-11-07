import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import { RefCardHead } from './PdfRefParts.tsx';
import { fileMeta } from './pdfFileMeta.ts';
import styles from './pdfRef.module.css';
import type { CompressionPreset, usePdfCompressStudio } from './usePdfCompressStudio.ts';

type CompressStudioState = ReturnType<typeof usePdfCompressStudio>;

function PdfCompressFileCard({ studio }: { studio: CompressStudioState }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fileName, fileSizeBytes, totalPages, handleAddNativeFile, clearAll } = studio;

  function onFileInputChange(e: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const file = e.currentTarget.files?.[0];
    if (file) void handleAddNativeFile(file);
  }

  return (
    <section class={styles.card} data-tour="pdf-upload" aria-label="Add PDF file">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={onFileInputChange}
      />
      <RefCardHead step={1} title="Add PDF file" />
      <div data-primary-result="" class="visually-hidden">
        <output>
          {studio.result
            ? `${Math.round(((studio.result.originalBytes - studio.result.compressedBytes) / studio.result.originalBytes) * 100)}%`
            : ''}
        </output>
      </div>
      <button type="button" class={styles.drop} onClick={() => fileInputRef.current?.click()}>
        <Icon name="file-plus" />
        <span class={styles.dropTitle}>
          {fileName
            ? 'Drag & drop another PDF here, or click to browse'
            : 'Drag & drop a PDF file here, or click to browse'}
        </span>
        <span class={styles.dropSub}>
          Supports PDF files · Max 500 MB · Files stay in your browser
        </span>
        <span class={styles.dropBtn}>Choose PDF File</span>
      </button>
      {fileName ? (
        <div class={styles.fileRow}>
          <span class={styles.fileBadge}>PDF</span>
          <span class={styles.fileText}>
            <span class={styles.fileName}>{fileName}</span>
            <span class={styles.fileMeta}>{fileMeta(totalPages, fileSizeBytes)}</span>
          </span>
          <button type="button" class={styles.iconBtn} onClick={clearAll} aria-label="Remove file">
            <Icon name="trash-2" />
          </button>
        </div>
      ) : null}
    </section>
  );
}

const PRESET_OPTIONS: readonly {
  id: CompressionPreset;
  icon: string;
  tone: string;
  title: string;
  desc: string;
  foot: string;
}[] = [
  {
    id: 'light',
    icon: 'leaf',
    tone: styles.toneGreen as string,
    title: 'Light Compression',
    desc: 'Minimal quality loss. Images kept sharp.',
    foot: 'JPEG 82% · 3000 px',
  },
  {
    id: 'balanced',
    icon: 'scale',
    tone: styles.toneBlue as string,
    title: 'Balanced (Recommended)',
    desc: 'Good balance of file size and visual quality.',
    foot: 'JPEG 70% · 2000 px',
  },
  {
    id: 'strong',
    icon: 'database',
    tone: styles.toneSlate as string,
    title: 'Strong Compression',
    desc: 'Maximum size reduction with lower image quality.',
    foot: 'JPEG 50% · 1400 px',
  },
  {
    id: 'custom',
    icon: 'settings',
    tone: styles.toneDark as string,
    title: 'Custom',
    desc: 'Choose the image quality yourself.',
    foot: 'Your quality · 2000 px',
  },
];

function PresetOptions({ studio }: { studio: CompressStudioState }) {
  return (
    <fieldset class={styles.options} aria-label="Compression level">
      {PRESET_OPTIONS.map((o) => {
        const active = studio.preset === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            class={`${styles.option} ${active ? styles.optionActive : ''}`}
            onClick={() => studio.setPreset(o.id)}
          >
            <span class={`${styles.optionIcon} ${o.tone}`}>
              <Icon name={o.icon} />
            </span>
            <span class={styles.optionTitle}>{o.title}</span>
            <span class={styles.optionDesc}>{o.desc}</span>
            <span class={styles.optionFoot}>
              <span class={styles.radio} aria-hidden="true" />
              {o.foot}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}

function Check(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
      {props.label}
    </label>
  );
}

function AdvancedSettings({ studio }: { studio: CompressStudioState }) {
  const { imageQuality, setImageQuality, maxOutputSizeMb, setMaxOutputSizeMb } = studio;
  return (
    <details class={styles.advanced} open>
      <summary>
        <Icon name="settings" />
        Advanced settings <small>(optional)</small>
        <span class={styles.advancedChevron}>
          <Icon name="chevron-down" />
        </span>
      </summary>
      <div class={styles.advancedBody}>
        <div>
          <label class={styles.fieldLabel} for="compress-image-quality">
            Image quality
          </label>
          <div class={styles.rangeRow}>
            <input
              id="compress-image-quality"
              type="range"
              min={10}
              max={100}
              value={imageQuality}
              onInput={(e) => {
                setImageQuality(Number(e.currentTarget.value));
                studio.setPreset('custom');
              }}
            />
            <span class={styles.rangeValue}>{imageQuality}%</span>
          </div>
          <div class={styles.rangeEnds}>
            <span>Lower size</span>
            <span>Higher quality</span>
          </div>
        </div>
        <div class={styles.checks}>
          <Check
            label="Convert images to grayscale"
            checked={studio.convertToGrayscale}
            onChange={studio.setConvertToGrayscale}
          />
          <Check
            label="Remove page thumbnails"
            checked={studio.removeThumbnails}
            onChange={studio.setRemoveThumbnails}
          />
          <Check
            label="Aim for a maximum size"
            checked={studio.useSizeTarget}
            onChange={studio.setUseSizeTarget}
          />
        </div>
        <div>
          <label class={styles.fieldLabel} for="compress-max-size">
            Maximum output size (MB)
          </label>
          <input
            id="compress-max-size"
            type="number"
            class={styles.input}
            value={maxOutputSizeMb}
            onInput={(e) => setMaxOutputSizeMb(Number(e.currentTarget.value) || 1)}
            disabled={!studio.useSizeTarget}
            min={0.1}
            step={0.1}
            max={100}
          />
        </div>
        <p class={styles.note}>
          JPEG images are re-encoded in your browser. Text, fonts and vector graphics are never
          changed, so text stays searchable. Other image types are kept as they are.
        </p>
      </div>
    </details>
  );
}

function PdfCompressSettingsCard({ studio }: { studio: CompressStudioState }) {
  return (
    <section class={styles.card} data-tour="pdf-arrange" aria-label="Compression settings">
      <RefCardHead step={2} title="Compression settings" />
      <PresetOptions studio={studio} />
      <AdvancedSettings studio={studio} />
    </section>
  );
}

export function PdfCompressLeftCards({ studio }: { studio: CompressStudioState }) {
  return (
    <div class={styles.column}>
      <PdfCompressFileCard studio={studio} />
      <PdfCompressSettingsCard studio={studio} />
    </div>
  );
}
