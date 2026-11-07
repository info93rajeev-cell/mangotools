import type { ResolvedPreset } from '@mangotools/schemas';
import { useMemo, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { AdvancedPenStudioLayout } from './AdvancedPenStudioLayout.tsx';
import penStyles from './advancedPenSelection.module.css';
import { ImageBackgroundRemoverCanvas } from './ImageBackgroundRemoverCanvas.tsx';
import { ImageBackgroundRemoverControls } from './ImageBackgroundRemoverControls.tsx';
import { ImageBackgroundRemoverResult } from './ImageBackgroundRemoverResult.tsx';
import { ImageMobileActionBar } from './ImageMobileActionBar.tsx';
import styles from './imageBackgroundRemover.module.css';
import type { CropFile } from './imageFileInspection.ts';
import { SAMPLE_NAME } from './samplePalaceImage.ts';
import { useImageBackgroundRemover } from './useImageBackgroundRemover.ts';

/** The photo open in Quick Auto, as a File for the pen studio (the sample is not handed over). */
function toBrowserFile(f: CropFile | null): File | null {
  if (!f || f.name === SAMPLE_NAME) return null;
  const ext = f.name.split('.').pop()?.toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return new File([f.bytes as BlobPart], f.name, { type });
}

export interface ImageBackgroundRemoverLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

export function ImageBackgroundRemoverLayout({
  idPrefix,
  toolId,
  preset,
  notify,
  onPhase,
}: ImageBackgroundRemoverLayoutProps) {
  const [activeMode, setActiveMode] = useState<'quick' | 'pen'>('quick');
  const bgRemover = useImageBackgroundRemover(preset, toolId, notify, onPhase);

  const hasFile = !!bgRemover.file;
  const handOver = useMemo(() => toBrowserFile(bgRemover.file), [bgRemover.file]);
  const isError = bgRemover.phase === 'error' || !!bgRemover.error;
  const isBusy = bgRemover.phase === 'running';

  return (
    <div class={styles.container} data-image-bg-remover-layout="">
      {/* MODE SWITCHER TABS */}
      <div class={penStyles.modeSwitcherBar}>
        <button
          type="button"
          aria-pressed={activeMode === 'quick'}
          class={`${penStyles.modeTabBtn} ${activeMode === 'quick' ? penStyles.modeTabActive : ''}`}
          onClick={() => setActiveMode('quick')}
        >
          <span>🪄</span>
          <span>Quick Auto Removal</span>
        </button>

        <button
          type="button"
          aria-pressed={activeMode === 'pen'}
          class={`${penStyles.modeTabBtn} ${activeMode === 'pen' ? penStyles.modeTabActive : ''}`}
          onClick={() => setActiveMode('pen')}
        >
          <span>✒️</span>
          <span>Advanced Pen Selection & Feather</span>
        </button>
      </div>

      <p class={styles.aiDisclosure} data-ai-disclosure={activeMode}>
        {activeMode === 'pen'
          ? preset.strings['disclosure.pen']
          : preset.strings['disclosure.quick']}
      </p>

      {activeMode === 'pen' ? (
        /* ADVANCED BEZIER PEN SELECTION & FEATHER STUDIO */
        <AdvancedPenStudioLayout notify={notify} initialFile={handOver} />
      ) : (
        /* STANDARD 3-PANEL AUTO REMOVAL WORKBENCH */
        <div class={styles.workbench3Panel} data-has-file={String(hasFile)}>
          <ImageBackgroundRemoverControls
            idPrefix={idPrefix}
            preset={preset}
            bgRemover={bgRemover}
            onSelectFile={(file) => void bgRemover.loadFile(file)}
            onTrySample={() => void bgRemover.loadSample()}
          />
          <ImageBackgroundRemoverCanvas idPrefix={idPrefix} bgRemover={bgRemover} />
          <ImageBackgroundRemoverResult idPrefix={idPrefix} preset={preset} bgRemover={bgRemover} />
        </div>
      )}

      {activeMode === 'quick' && (
        <ImageMobileActionBar
          hasFile={hasFile}
          phase={bgRemover.phase}
          primaryLabel={isBusy ? 'Removing background...' : 'Remove Background'}
          onPrimaryClick={() => void bgRemover.executeRemoveBackgroundAndDownload()}
          outputFileSize={bgRemover.result?.outputFileSize}
          onDownload={() => void bgRemover.downloadResult('original')}
          downloadLabel="Download transparent image"
          isDownloadDisabled={!hasFile || isBusy || isError}
          onReset={bgRemover.reset}
        />
      )}
    </div>
  );
}
