import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import type { FileToolState } from '../archetypes/useFileTool.ts';
import { Button } from '../primitives/Button.tsx';
import { NumberField, Select, TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import styles from './imageCompress.module.css';
import { label } from './presentation.ts';

export interface StageTwoCardProps {
  idPrefix: string;
  preset: ResolvedPreset;
  tool: FileToolState;
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

const TARGET_PRESETS = [
  { id: 'auto', label: 'Auto', kb: '', hint: 'Smart' },
  { id: '20', label: '20 KB', kb: '20', hint: 'Signatures' },
  { id: '50', label: '50 KB', kb: '50', hint: 'Passport/ID' },
  { id: '100', label: '100 KB', kb: '100', hint: 'Portals' },
  { id: '200', label: '200 KB', kb: '200', hint: 'KYC / HD' },
  { id: 'custom', label: 'Custom', kb: null, hint: 'Enter KB' },
] as const;

interface FormatSelectorProps {
  idPrefix: string;
  selectedFormat: string;
  onSelectFormat: (val: string) => void;
}

function FormatSelector({ idPrefix, selectedFormat, onSelectFormat }: FormatSelectorProps) {
  return (
    <>
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
              onClick={() => onSelectFormat(card.value)}
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
          onValue={onSelectFormat}
        />
      </div>
    </>
  );
}

interface TargetPillsProps {
  idPrefix: string;
  currentMaxKb: string;
  onSelectKb: (kb: string) => void;
}

function TargetPills({ idPrefix, currentMaxKb, onSelectKb }: TargetPillsProps) {
  const [customKbValue, setCustomKbValue] = useState<string>('75');
  const activePresetId = (() => {
    if (!currentMaxKb) return 'auto';
    if (['20', '50', '100', '200'].includes(currentMaxKb)) return currentMaxKb;
    return 'custom';
  })();

  const handleSelect = (id: string, kb: string | null) => {
    if (id === 'auto') {
      onSelectKb('');
    } else if (id === 'custom') {
      onSelectKb(customKbValue || '75');
    } else if (kb) {
      onSelectKb(kb);
    }
  };

  return (
    <>
      <fieldset class={styles.targetPillsGrid}>
        <legend class="sr-only">Target size limit in kilobytes</legend>
        {TARGET_PRESETS.map((p) => {
          const active = activePresetId === p.id;
          return (
            <button
              type="button"
              key={p.id}
              class={`${styles.targetPill} ${active ? styles.targetPillActive : ''}`}
              aria-pressed={active}
              onClick={() => handleSelect(p.id, p.kb)}
            >
              <span class={styles.targetPillValue}>{p.label}</span>
              <span class={styles.targetPillHint}>{p.hint}</span>
            </button>
          );
        })}
      </fieldset>

      {activePresetId === 'custom' && (
        <div class={styles.customInputRow}>
          <label class={styles.customInputLabel} for={`${idPrefix}-custom-kb`}>
            Max file size:
          </label>
          <input
            type="number"
            id={`${idPrefix}-custom-kb`}
            class={styles.customInput}
            min="5"
            max="25000"
            value={customKbValue}
            aria-label="Custom target size in KB"
            onInput={(e) => {
              const v = (e.target as HTMLInputElement).value;
              setCustomKbValue(v);
              onSelectKb(v);
            }}
          />
          <span class={styles.customUnit}>KB</span>
        </div>
      )}

      <div class={styles.guidanceCallout}>
        <span aria-hidden="true">🎯</span>
        <span>
          {activePresetId === 'auto'
            ? 'Smart Mode: Automatically finds the highest-quality candidate strictly smaller than the original file.'
            : `Target Limit: Engine searches quality levels to stay strictly under ${currentMaxKb || customKbValue} KB with zero server uploads.`}
        </span>
      </div>
    </>
  );
}

interface QualitySliderProps {
  idPrefix: string;
  quality: number;
  onQualityChange: (val: string) => void;
}

function QualitySlider({ idPrefix, quality, onQualityChange }: QualitySliderProps) {
  return (
    <div class={styles.sliderSection}>
      <div class={styles.sliderHeader}>
        <label class={styles.sliderLabel} for={`${idPrefix}-quality`}>
          Quality
        </label>
        <span class={styles.sliderValueBadge}>{quality}%</span>
      </div>

      <input
        type="range"
        id={`${idPrefix}-quality-range`}
        min="50"
        max="100"
        value={quality}
        class={styles.rangeSlider}
        aria-label="Compression level slider"
        onInput={(e) => onQualityChange((e.target as HTMLInputElement).value)}
      />

      <div class="sr-only">
        <NumberField
          id={`${idPrefix}-quality`}
          aria-label="Quality"
          value={String(quality)}
          min={50}
          max={100}
          onValue={onQualityChange}
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
  );
}

export function StageTwoCard({ idPrefix, preset, tool }: StageTwoCardProps) {
  const selectedFormat = String(tool.values.outputFormat ?? 'same');
  const qualityVal = Number(tool.values.quality ?? 80);
  const currentMaxKb = tool.values.maxFileSizeKB ? String(tool.values.maxFileSizeKB) : '';
  const [compressMode, setCompressMode] = useState<'target' | 'manual'>('target');
  const isRunning = tool.phase === 'running';
  const isPng = selectedFormat === 'png';

  const handleModeSwitch = (mode: 'target' | 'manual') => {
    setCompressMode(mode);
    if (mode === 'manual') tool.setValue('maxFileSizeKB', '');
  };

  return (
    <div class={styles.stageCard} data-stage="2">
      <div class={styles.stepHeader}>
        <div class={styles.stepTitleGroup}>
          <span class={styles.stepBadge}>2</span>
          <h3 class={styles.stepTitle}>Choose compression settings</h3>
        </div>
      </div>

      <FormatSelector
        idPrefix={idPrefix}
        selectedFormat={selectedFormat}
        onSelectFormat={(val) => tool.setValue('outputFormat', val)}
      />

      {!isPng && (
        <div class={styles.targetSection}>
          <div class={styles.targetHeader}>
            <span class={styles.targetLabel}>Compression control</span>
            <fieldset class={styles.modeToggle}>
              <legend class="sr-only">Compression mode</legend>
              <button
                type="button"
                class={`${styles.modeBtn} ${compressMode === 'target' ? styles.modeBtnActive : ''}`}
                aria-pressed={compressMode === 'target'}
                onClick={() => handleModeSwitch('target')}
              >
                Target Size (KB)
              </button>
              <button
                type="button"
                class={`${styles.modeBtn} ${compressMode === 'manual' ? styles.modeBtnActive : ''}`}
                aria-pressed={compressMode === 'manual'}
                onClick={() => handleModeSwitch('manual')}
              >
                Manual Quality (%)
              </button>
            </fieldset>
          </div>

          {compressMode === 'target' ? (
            <TargetPills
              idPrefix={idPrefix}
              currentMaxKb={currentMaxKb}
              onSelectKb={(kb) => tool.setValue('maxFileSizeKB', kb)}
            />
          ) : (
            <QualitySlider
              idPrefix={idPrefix}
              quality={qualityVal}
              onQualityChange={(q) => tool.setValue('quality', q)}
            />
          )}
        </div>
      )}

      {isPng && (
        <div class={styles.guidanceCallout}>
          <span aria-hidden="true">ℹ️</span>
          <span>
            PNG uses lossless compression. To reach specific KB targets like 20 KB or 50 KB, choose
            JPG or WebP above.
          </span>
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
