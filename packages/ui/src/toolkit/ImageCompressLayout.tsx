import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { FileDropZone } from '../archetypes/FileDropZone.tsx';
import { formatFileSize, type QueuedFile } from '../archetypes/FileQueue.tsx';
import { type FilePhase, type FileToolState, useFileTool } from '../archetypes/useFileTool.ts';
import { Button } from '../primitives/Button.tsx';
import { InlineAlert } from '../primitives/feedback.tsx';
import { NumberField, Select, TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import { ImageCompressResult } from './ImageCompressResult.tsx';
import styles from './imageCompress.module.css';
import { label, messageFor } from './presentation.ts';

export interface ImageCompressLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

const FORMAT_OPTIONS = [
  { value: 'same', label: 'Same as input' },
  { value: 'jpg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
];

const FORMAT_CARDS = [
  { value: 'jpg', name: 'JPG', desc: 'Best for photos · Smaller file size' },
  { value: 'png', name: 'PNG', desc: 'Lossless quality · Larger file size' },
  { value: 'webp', name: 'WebP', desc: 'Modern format · Smallest size' },
] as const;

interface StageOneCardProps {
  file: QueuedFile;
  previewUrl: string | null;
  onClear: () => void;
}

function StageOneCard({ file, previewUrl, onClear }: StageOneCardProps) {
  const [naturalDims, setNaturalDims] = useState<{
    width: number;
    height: number;
  } | null>(null);

  return (
    <div class={styles.stage1Column}>
      <div class={styles.stageCard} data-stage="1">
        <div class={styles.stepHeader}>
          <div class={styles.stepTitleGroup}>
            <span class={styles.stepBadge}>1</span>
            <h3 class={styles.stepTitle}>Uploaded image</h3>
          </div>
          <button type="button" class={styles.textAction} onClick={onClear}>
            Replace image
          </button>
        </div>

        <div class={styles.previewWrap}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              class={styles.previewImg}
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalDims({
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                });
              }}
            />
          ) : null}
        </div>

        <div class={styles.fileInfo}>
          <div class={styles.fileName}>{file.name}</div>
          <div class={styles.fileMeta}>
            {formatFileSize(file.size)}
            {naturalDims ? ` · ${naturalDims.width} × ${naturalDims.height} px` : ''}
          </div>
        </div>

        <div class={styles.statusBadge}>
          <span class={styles.statusCheck} aria-hidden="true">
            ✓
          </span>
          <div>
            <strong class={styles.statusTitle}>Image loaded successfully</strong>
            <div class={styles.statusSub}>Ready to compress. Adjust settings on the right.</div>
          </div>
        </div>
      </div>

      <div class={styles.relatedCard}>
        <div class={styles.relatedLeft}>
          <span class={styles.relatedIcon} aria-hidden="true">
            PDF
          </span>
          <div class={styles.relatedText}>
            <span class={styles.relatedTitle}>Need a smaller PDF instead?</span>
            <span class={styles.relatedSub}>Convert images directly to compressed PDF.</span>
          </div>
        </div>
        <a href="/jpg-to-pdf" class={styles.relatedLink}>
          Open JPG to PDF →
        </a>
      </div>
    </div>
  );
}

interface StageTwoCardProps {
  idPrefix: string;
  preset: ResolvedPreset;
  tool: FileToolState;
}

function StageTwoCard({ idPrefix, preset, tool }: StageTwoCardProps) {
  const selectedFormat = String(tool.values.outputFormat ?? 'same');
  const qualityVal = Number(tool.values.quality ?? 80);
  const isRunning = tool.phase === 'running';

  return (
    <div class={styles.stageCard} data-stage="2">
      <div class={styles.stepHeader}>
        <div class={styles.stepTitleGroup}>
          <span class={styles.stepBadge}>2</span>
          <h3 class={styles.stepTitle}>Choose compression settings</h3>
        </div>
      </div>

      <fieldset class={styles.formatCardsGrid}>
        <legend class="sr-only">Target format selection</legend>
        {FORMAT_CARDS.map((card) => {
          const active = selectedFormat === card.value;
          return (
            <button
              type="button"
              key={card.value}
              class={`${styles.formatCard} ${active ? styles.formatCardActive : ''}`}
              aria-pressed={active}
              onClick={() => tool.setValue('outputFormat', card.value)}
            >
              {active && (
                <span class={styles.formatCardCheck} aria-hidden="true">
                  ✓
                </span>
              )}
              <div class={styles.formatCardName}>{card.name}</div>
              <div class={styles.formatCardDesc}>{card.desc}</div>
            </button>
          );
        })}
      </fieldset>

      <div class={styles.formatSelectRow}>
        <label for={`${idPrefix}-output-format`}>Output format</label>
        <Select
          id={`${idPrefix}-output-format`}
          aria-label="Output format"
          value={selectedFormat}
          options={FORMAT_OPTIONS}
          onValue={(val) => tool.setValue('outputFormat', val)}
        />
      </div>

      {selectedFormat !== 'png' && (
        <div class={styles.sliderSection}>
          <div class={styles.sliderHeader}>
            <label class={styles.sliderLabel} for={`${idPrefix}-quality`}>
              Quality
            </label>
            <span class={styles.sliderValueBadge}>{qualityVal}%</span>
          </div>

          <input
            type="range"
            id={`${idPrefix}-quality-range`}
            min="50"
            max="100"
            value={qualityVal}
            class={styles.rangeSlider}
            aria-label="Compression level slider"
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              tool.setValue('quality', target.value);
            }}
          />

          <div class="sr-only">
            <NumberField
              id={`${idPrefix}-quality`}
              aria-label="Quality"
              value={String(qualityVal)}
              min={50}
              max={100}
              onValue={(val) => tool.setValue('quality', val)}
            />
          </div>

          <div class={styles.sliderCaptions}>
            <span>Smaller file size (50%)</span>
            <span>Higher quality (100%)</span>
          </div>

          <div class={styles.guidanceCallout}>
            <span aria-hidden="true">ℹ️</span>
            <span>Lower quality gives a smaller file size. Recommended range: 60% – 80%.</span>
          </div>
        </div>
      )}

      <div class={styles.fieldRow}>
        <label class={styles.fieldLabel} for={`${idPrefix}-output-name`}>
          <span>{t('fileTool.outputNameLabel')}</span>
          <TextInput
            id={`${idPrefix}-output-name`}
            aria-label="Output file name"
            value={tool.outputFileName}
            onValue={tool.setOutputFileName}
            placeholder={label(preset, 'fileTool.outputNamePlaceholder')}
          />
        </label>
      </div>

      <div class={styles.ctaSection}>
        <Button
          variant="primary"
          icon="download"
          onClick={tool.primaryAction}
          loading={isRunning}
          disabled={isRunning}
        >
          {label(preset, 'fileTool.downloadCta')}
        </Button>
        <p class={styles.trustNote}>
          Your image is processed locally in your browser. No data is uploaded to our servers.
        </p>
      </div>
    </div>
  );
}

export function ImageCompressLayout({
  idPrefix,
  toolId,
  preset,
  notify,
  onPhase,
}: ImageCompressLayoutProps) {
  const tool = useFileTool(preset, toolId, notify, onPhase);
  const file = tool.files[0];

  if (!file) {
    return (
      <div class={styles.emptyState}>
        <FileDropZone
          accept={preset.ui.fileAccept ?? 'image/jpeg,image/png,image/webp'}
          dropHint={label(preset, 'fileTool.dropHint')}
          multiple={false}
          onFiles={(list) => void tool.addFiles(list)}
        />
        {tool.error && (
          <InlineAlert tone="danger" role="alert">
            {messageFor(preset, tool.error)}
          </InlineAlert>
        )}
        <div class={styles.trustStrip}>
          <span class={styles.trustItem}>🔒 100% Client-Side In-Browser Processing</span>
          <span class={styles.trustItem}>✓ Zero Server Uploads</span>
          <span class={styles.trustItem}>✓ Bounded Quality Search</span>
          <span class={styles.trustItem}>✓ Free & Unlimited</span>
        </div>
      </div>
    );
  }

  return (
    <div class={styles.container}>
      <div class={styles.topGrid}>
        <StageOneCard file={file} previewUrl={tool.previewUrl} onClear={tool.clearAll} />
        <StageTwoCard idPrefix={idPrefix} preset={preset} tool={tool} />
      </div>

      <ImageCompressResult
        preset={preset}
        result={tool.result}
        error={tool.error}
        onDownload={tool.primaryAction}
        onClear={tool.clearAll}
      />
    </div>
  );
}
