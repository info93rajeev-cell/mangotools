import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { AdvancedPenStudioLayout } from './AdvancedPenStudioLayout.tsx';
import penStyles from './advancedPenSelection.module.css';
import { ImageBackgroundRemoverCanvas } from './ImageBackgroundRemoverCanvas.tsx';
import { ImageBackgroundRemoverControls } from './ImageBackgroundRemoverControls.tsx';
import { ImageBackgroundRemoverResult } from './ImageBackgroundRemoverResult.tsx';
import { ImageMobileActionBar } from './ImageMobileActionBar.tsx';
import styles from './imageBackgroundRemover.module.css';
import { useImageBackgroundRemover } from './useImageBackgroundRemover.ts';

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
  const [activeMode, setActiveMode] = useState<'quick' | 'pen'>('pen');
  const bgRemover = useImageBackgroundRemover(preset, toolId, notify, onPhase);

  const hasFile = !!bgRemover.file;
  const isError = bgRemover.phase === 'error' || !!bgRemover.error;
  const isBusy = bgRemover.phase === 'running';

  return (
    <div class={styles.container} data-image-bg-remover-layout="">
      {/* MODE SWITCHER TABS */}
      <div class={penStyles.modeSwitcherBar}>
        <button
          type="button"
          class={`${penStyles.modeTabBtn} ${activeMode === 'pen' ? penStyles.modeTabActive : ''}`}
          onClick={() => setActiveMode('pen')}
        >
          <span>✒️</span>
          <span>Advanced Pen Selection & Feather</span>
        </button>

        <button
          type="button"
          class={`${penStyles.modeTabBtn} ${activeMode === 'quick' ? penStyles.modeTabActive : ''}`}
          onClick={() => setActiveMode('quick')}
        >
          <span>🪄</span>
          <span>Quick Auto Removal</span>
        </button>
      </div>

      {activeMode === 'pen' ? (
        /* ADVANCED BEZIER PEN SELECTION & FEATHER STUDIO */
        <AdvancedPenStudioLayout notify={notify} />
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
