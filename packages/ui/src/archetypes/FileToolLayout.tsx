import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import { TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import fileToolStyles from '../toolkit/fileTool.module.css';
import { OptionControls } from '../toolkit/OptionControls.tsx';
import { label, visibleEntries } from '../toolkit/presentation.ts';
import styles from '../toolkit/toolkit.module.css';
import { CalculatorFields } from './CalculatorFields.tsx';
import { FileDropZone } from './FileDropZone.tsx';
import { FileQueue } from './FileQueue.tsx';
import { FileToolOutcome } from './FileToolOutcome.tsx';
import { ImagePreview } from './ImagePreview.tsx';
import { type FilePhase, type FileToolState, useFileTool } from './useFileTool.ts';

export interface FileToolLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

interface ExtraFieldsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  tool: FileToolState;
}

/** The preset's own `userOptions` (aspect-ratio toggle, output format) and `fields` (width, height,
 * quality) — reusing archetype B's field-rendering components against local state instead of a
 * `ToolStore`, since none of those components depend on it. Renders nothing for a preset with
 * neither (every prior file tool). */
function ExtraFields({ idPrefix, preset, tool }: ExtraFieldsProps) {
  const hasOptions = Object.keys(preset.userOptions).length > 0;
  const hasFields = Object.keys(preset.fields).length > 0;
  if (!hasOptions && !hasFields) return null;
  const fields = visibleEntries(preset.fields, tool.values);
  return (
    <div class={fileToolStyles.fieldsRow}>
      <OptionControls
        idPrefix={idPrefix}
        preset={preset}
        values={tool.values}
        onChange={(key, next) => tool.setValue(key, next)}
      />
      <CalculatorFields
        idPrefix={idPrefix}
        preset={preset}
        fields={fields}
        values={tool.values}
        errorFor={() => null}
        onValue={(key, next) => tool.setValue(key, next)}
      />
    </div>
  );
}

/** Archetype D: a file queue (single- or multi-file), optional extra fields, and a download action. */
export function FileToolLayout({ idPrefix, toolId, preset, notify, onPhase }: FileToolLayoutProps) {
  const tool = useFileTool(preset, toolId, notify, onPhase);
  const problemFileName =
    typeof tool.error?.details?.name === 'string' ? (tool.error.details.name as string) : null;
  const singleFile = preset.ui.maxFiles === 1;

  return (
    <div class={fileToolStyles.fileTool} data-file-count={tool.files.length}>
      <FileDropZone
        accept={preset.ui.fileAccept ?? 'application/pdf'}
        dropHint={label(preset, 'fileTool.dropHint')}
        multiple={!singleFile}
        onFiles={(list) => void tool.addFiles(list)}
      />

      {tool.files.length === 0 ? (
        <p class={styles.placeholder}>{label(preset, 'fileTool.noFilesYet')}</p>
      ) : (
        <>
          {singleFile && tool.previewUrl ? (
            <ImagePreview
              src={tool.previewUrl}
              alt={tool.files[0]?.name ?? ''}
              onLoad={tool.onPreviewLoad}
            />
          ) : null}
          <FileQueue
            queueLabel={label(preset, 'fileTool.queueLabel')}
            files={tool.files}
            problemFileName={problemFileName}
            onRemove={tool.removeFile}
            onMove={tool.moveFile}
          />
          <ExtraFields idPrefix={idPrefix} preset={preset} tool={tool} />
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
