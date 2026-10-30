import styles from './imageWatermark.module.css';
import type { UseImageWatermarkReturn, WatermarkOutputFormat } from './useImageWatermark.ts';

export function isWatermarkDownloadDisabled(watermark: {
  file: unknown;
  imageSrc: string | null;
  error: unknown;
  phase: string;
}): boolean {
  return (
    !watermark.file ||
    !watermark.imageSrc ||
    !!watermark.error ||
    watermark.phase === 'running' ||
    watermark.phase === 'error'
  );
}

const FORMAT_ITEMS = [
  { id: 'jpg' as const, title: 'JPG', sub: 'Best for photos', note: 'Smaller file size' },
  { id: 'png' as const, title: 'PNG', sub: 'Best for graphics', note: 'Supports transparency' },
  { id: 'webp' as const, title: 'WebP', sub: 'Modern format', note: 'Smaller size, great quality' },
];

export interface WatermarkChooseFormatCardProps {
  idPrefix: string;
  watermark: UseImageWatermarkReturn;
}

export function WatermarkChooseFormatCard({ idPrefix, watermark }: WatermarkChooseFormatCardProps) {
  const isExecuting = watermark.phase === 'running';
  const activeFmt =
    watermark.outputFormat === 'same'
      ? watermark.file?.name.toLowerCase().endsWith('.png')
        ? 'png'
        : watermark.file?.name.toLowerCase().endsWith('.webp')
          ? 'webp'
          : 'jpg'
      : watermark.outputFormat;

  return (
    <div class={styles.studioCard}>
      <div class={styles.cardHeader}>
        <span class={styles.cardTitle}>3. Choose output format</span>
      </div>
      <div class={styles.card3Body}>
        <select
          id={`${idPrefix}-format`}
          aria-label="Output format"
          class="visually-hidden"
          value={watermark.outputFormat}
          onChange={(e) =>
            watermark.setOutputFormat(
              (e.target as HTMLSelectElement).value as WatermarkOutputFormat,
            )
          }
        >
          <option value="same">Same as input</option>
          <option value="jpg">JPG</option>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
        </select>

        <input
          id={`${idPrefix}-custom-name`}
          aria-label="Output file name"
          type="text"
          class="visually-hidden"
          value={watermark.customFileName}
          onInput={(e) => watermark.setCustomFileName((e.target as HTMLInputElement).value)}
        />

        <div class={styles.formatCardsRow}>
          {FORMAT_ITEMS.map((fmt) => {
            const isActive = activeFmt === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                class={styles.formatCard}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => watermark.setOutputFormat(fmt.id)}
              >
                {isActive && <span class={styles.checkBadge}>✓</span>}
                <span class={styles.formatIcon}>📄</span>
                <span class={styles.formatTitle}>{fmt.title}</span>
                <span class={styles.formatSub}>{fmt.sub}</span>
                <span class={styles.formatNote}>{fmt.note}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          class={styles.primaryActionBtn}
          data-action="download-watermarked"
          onClick={() => void watermark.executeWatermarkAndDownload()}
          disabled={isWatermarkDownloadDisabled(watermark)}
        >
          <span>📥</span>
          <span>{isExecuting ? 'Watermarking...' : 'Download watermarked image'}</span>
        </button>

        <div class={styles.infoCalloutBox}>
          <span class={styles.infoCalloutIcon}>ℹ</span>
          <span>
            This adds a visible text watermark to your image. It helps discourage unauthorized use
            but is not copyright proof by itself.
          </span>
        </div>
      </div>
    </div>
  );
}
