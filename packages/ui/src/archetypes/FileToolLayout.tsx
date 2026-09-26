import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import { TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import fileToolStyles from '../toolkit/fileTool.module.css';
import { label } from '../toolkit/presentation.ts';
import styles from '../toolkit/toolkit.module.css';
import { FileDropZone } from './FileDropZone.tsx';
import { FileQueue } from './FileQueue.tsx';
import { FileToolOutcome } from './FileToolOutcome.tsx';
import { type FilePhase, useFileTool } from './useFileTool.ts';

export interface FileToolLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

/** Archetype D: a reorderable multi-file queue, an output name, and a single download action. */
export function FileToolLayout({ idPrefix, toolId, preset, notify, onPhase }: FileToolLayoutProps) {
  const tool = useFileTool(preset, toolId, notify, onPhase);
  const problemFileName =
    typeof tool.error?.details?.name === 'string' ? (tool.error.details.name as string) : null;

  return (
    <div class={fileToolStyles.fileTool} data-file-count={tool.files.length}>
      <FileDropZone
        accept={preset.ui.fileAccept ?? 'application/pdf'}
        dropHint={label(preset, 'fileTool.dropHint')}
        onFiles={(list) => void tool.addFiles(list)}
      />

      {tool.files.length === 0 ? (
        <p class={styles.placeholder}>{label(preset, 'fileTool.noFilesYet')}</p>
      ) : (
        <>
          <FileQueue
            queueLabel={label(preset, 'fileTool.queueLabel')}
            files={tool.files}
            problemFileName={problemFileName}
            onRemove={tool.removeFile}
            onMove={tool.moveFile}
          />
          <div class={fileToolStyles.controls}>
            <label class={fileToolStyles.outputNameField} for={`${idPrefix}-output-name`}>
              {t('fileTool.outputNameLabel')}
              <TextInput
                id={`${idPrefix}-output-name`}
                value={tool.outputFileName}
                onValue={tool.setOutputFileName}
                placeholder={label(preset, 'fileTool.outputNamePlaceholder')}
              />
            </label>
            <div class={fileToolStyles.actions}>
              <Button
                variant="primary"
                icon="download"
                onClick={tool.primaryAction}
                loading={tool.phase === 'running'}
                disabled={tool.phase === 'running'}
              >
                {label(preset, 'fileTool.downloadCta')}
              </Button>
              <Button variant="ghost" icon="x" onClick={tool.clearAll}>
                {t('fileTool.clearAll')}
              </Button>
            </div>
          </div>
        </>
      )}

      <FileToolOutcome preset={preset} phase={tool.phase} result={tool.result} error={tool.error} />
    </div>
  );
}
