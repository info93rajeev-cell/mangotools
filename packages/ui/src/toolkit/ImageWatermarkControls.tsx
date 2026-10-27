import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './imageWatermark.module.css';
import type {
  UseImageWatermarkReturn,
  WatermarkOutputFormat,
  WatermarkPosition,
} from './useImageWatermark.ts';

export interface ImageWatermarkControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  watermark: UseImageWatermarkReturn;
}

const POS_GRID_ITEMS: Array<{
  id: WatermarkPosition;
  gridPos: [number, number];
  name: string;
}> = [
  { id: 'top-left', gridPos: [0, 0], name: 'Top Left' },
  { id: 'center', gridPos: [0, 1], name: 'Top Center' },
  { id: 'top-right', gridPos: [0, 2], name: 'Top Right' },
  { id: 'center', gridPos: [1, 0], name: 'Middle Left' },
  { id: 'center', gridPos: [1, 1], name: 'Center' },
  { id: 'center', gridPos: [1, 2], name: 'Middle Right' },
  { id: 'bottom-left', gridPos: [2, 0], name: 'Bottom Left' },
  { id: 'bottom-right', gridPos: [2, 1], name: 'Bottom Center' },
  { id: 'bottom-right', gridPos: [2, 2], name: 'Bottom Right' },
];

const FORMAT_ITEMS = [
  { id: 'jpg' as const, title: 'JPG', sub: 'Best for photos', note: 'Smaller file size' },
  { id: 'png' as const, title: 'PNG', sub: 'Best for graphics', note: 'Supports transparency' },
  { id: 'webp' as const, title: 'WebP', sub: 'Modern format', note: 'Smaller size, great quality' },
];

function isPosActive(item: (typeof POS_GRID_ITEMS)[number], pos: WatermarkPosition): boolean {
  if (item.id === 'center' && item.gridPos[0] === 1 && item.gridPos[1] === 1) {
    return pos === 'center';
  }
  if (item.id === 'bottom-right' && item.gridPos[0] === 2 && item.gridPos[1] === 2) {
    return pos === 'bottom-right';
  }
  if (item.id === 'top-left' && item.gridPos[0] === 0 && item.gridPos[1] === 0) {
    return pos === 'top-left';
  }
  if (item.id === 'top-right' && item.gridPos[0] === 0 && item.gridPos[1] === 2) {
    return pos === 'top-right';
  }
  if (item.id === 'bottom-left' && item.gridPos[0] === 2 && item.gridPos[1] === 0) {
    return pos === 'bottom-left';
  }
  return false;
}

interface WatermarkSettingsCardProps {
  idPrefix: string;
  watermark: UseImageWatermarkReturn;
}

function WatermarkTextAndPos({ idPrefix, watermark }: WatermarkSettingsCardProps) {
  return (
    <div class={styles.subCol}>
      <div class={styles.inputGroup}>
        <label for={`${idPrefix}-text`} class={styles.fieldLabel}>
          Watermark text
        </label>
        <input
          id={`${idPrefix}-text`}
          aria-label="Watermark text"
          type="text"
          placeholder="BeyondTheAI"
          class={styles.textInput}
          value={watermark.text}
          onInput={(e) => watermark.setText((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class={styles.inputGroup}>
        <span class={styles.fieldLabel}>Position</span>
        <select
          id={`${idPrefix}-position`}
          aria-label="Position"
          class="visually-hidden"
          value={watermark.position}
          onChange={(e) =>
            watermark.setPosition((e.target as HTMLSelectElement).value as WatermarkPosition)
          }
        >
          <option value="top-left">Top left</option>
          <option value="top-right">Top right</option>
          <option value="center">Center</option>
          <option value="bottom-left">Bottom left</option>
          <option value="bottom-right">Bottom right</option>
        </select>

        <div class={styles.pos3x3Grid}>
          {POS_GRID_ITEMS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              class={styles.posSlotBtn}
              data-active={isPosActive(item, watermark.position) ? 'true' : 'false'}
              onClick={() => watermark.setPosition(item.id)}
              title={item.name}
            >
              <span class={styles.posDot}>•</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WatermarkStyleSliders({ idPrefix, watermark }: WatermarkSettingsCardProps) {
  return (
    <div class={styles.subCol}>
      <div class={styles.sliderGroup}>
        <div class={styles.sliderHeader}>
          <span class={styles.fieldLabel}>Font size</span>
          <span class={styles.sliderVal}>{watermark.fontSize} px</span>
        </div>
        <input
          type="range"
          min="8"
          max="120"
          value={watermark.fontSize}
          class={styles.rangeSlider}
          aria-hidden="true"
          tabIndex={-1}
          onInput={(e) => watermark.setFontSize(Number((e.target as HTMLInputElement).value))}
        />
        <input
          id={`${idPrefix}-font-size`}
          aria-label="Font size"
          type="number"
          min="8"
          max="200"
          class="visually-hidden"
          value={String(watermark.fontSize)}
          onInput={(e) => watermark.setFontSize(Number((e.target as HTMLInputElement).value))}
        />
      </div>

      <div class={styles.sliderGroup}>
        <div class={styles.sliderHeader}>
          <span class={styles.fieldLabel}>Opacity</span>
          <span class={styles.sliderVal}>{watermark.opacity}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          value={watermark.opacity}
          class={styles.rangeSlider}
          aria-hidden="true"
          tabIndex={-1}
          onInput={(e) => watermark.setOpacity(Number((e.target as HTMLInputElement).value))}
        />
        <input
          id={`${idPrefix}-opacity`}
          aria-label="Opacity"
          type="number"
          min="10"
          max="100"
          class="visually-hidden"
          value={String(watermark.opacity)}
          onInput={(e) => watermark.setOpacity(Number((e.target as HTMLInputElement).value))}
        />
      </div>

      <div class={styles.inputGroup}>
        <label for={`${idPrefix}-color`} class={styles.fieldLabel}>
          Text color
        </label>
        <div class={styles.colorInputRow}>
          <div class={styles.colorSwatchSquare} style={{ backgroundColor: watermark.color }} />
          <input
            id={`${idPrefix}-color`}
            aria-label="Text color"
            type="text"
            class={styles.colorTextInput}
            value={watermark.color}
            onInput={(e) => watermark.setColor((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      <div class={styles.inputGroup}>
        <label for={`${idPrefix}-font-style`} class={styles.fieldLabel}>
          Font style
        </label>
        <select id={`${idPrefix}-font-style`} class={styles.selectInput}>
          <option value="Inter">Inter (Default)</option>
          <option value="Arial">Arial</option>
          <option value="Roboto">Roboto</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>
    </div>
  );
}

function WatermarkSettingsCard({ idPrefix, watermark }: WatermarkSettingsCardProps) {
  return (
    <div class={styles.studioCard}>
      <div class={styles.cardHeader}>
        <span class={styles.cardTitle}>2. Watermark settings</span>
      </div>
      <div class={styles.settings2ColBody}>
        <WatermarkTextAndPos idPrefix={idPrefix} watermark={watermark} />
        <WatermarkStyleSliders idPrefix={idPrefix} watermark={watermark} />
      </div>
    </div>
  );
}

function ChooseFormatCard({ idPrefix, watermark }: WatermarkSettingsCardProps) {
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
          disabled={isExecuting}
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

export function ImageWatermarkControls({
  idPrefix,
  preset: _preset,
  watermark,
}: ImageWatermarkControlsProps) {
  return (
    <div class={styles.controlsCol}>
      <WatermarkSettingsCard idPrefix={idPrefix} watermark={watermark} />
      <ChooseFormatCard idPrefix={idPrefix} watermark={watermark} />
    </div>
  );
}
