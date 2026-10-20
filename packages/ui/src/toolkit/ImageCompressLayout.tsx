import type { ResolvedPreset } from '@mangotools/schemas';
import { FileDropZone } from '../archetypes/FileDropZone.tsx';
import { type FilePhase, useFileTool } from '../archetypes/useFileTool.ts';
import { InlineAlert } from '../primitives/feedback.tsx';
import { ImageCompressResult } from './ImageCompressResult.tsx';
import { StageTwoCard } from './ImageCompressSettings.tsx';
import { StageOneCard } from './ImageCompressStageOne.tsx';
import styles from './imageCompress.module.css';
import { label, messageFor } from './presentation.ts';

export interface ImageCompressLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
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
