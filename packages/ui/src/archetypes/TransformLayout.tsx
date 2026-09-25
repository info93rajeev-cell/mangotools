import { type FieldValues, type ToolSnapshot, type ToolStore, track } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef } from 'preact/hooks';
import { IconButton } from '../primitives/Button.tsx';
import { t } from '../strings/en.ts';
import { copyText, downloadText, readClipboard, readTextFile } from '../toolkit/actions.ts';
import { OptionControls } from '../toolkit/OptionControls.tsx';
import { label, outputRows, reconcileOptions } from '../toolkit/presentation.ts';
import styles from '../toolkit/toolkit.module.css';
import { InputPane, OutputPane, StatusLine } from './TransformPanes.tsx';

export interface TransformLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (message: string) => void;
}

/** The text field this archetype edits: the first text field of the preset. */
const textField = (preset: ResolvedPreset) =>
  Object.entries(preset.fields).find(([, f]) => f.kind === 'text') ?? ['text', undefined];

/** Swap is offered when the preset has a two-way "direction" option. */
function swapTarget(preset: ResolvedPreset, current: string): string | null {
  const values = Object.keys(preset.userOptions.direction?.values ?? {});
  if (values.length !== 2) return null;
  return values.find((v) => v !== current) ?? null;
}

function goTo(area: HTMLTextAreaElement | null, offset: number) {
  if (!area) return;
  area.focus();
  area.setSelectionRange(offset, Math.min(offset + 1, area.value.length));
  const line = area.value.slice(0, offset).split('\n').length;
  const lineHeight = Number.parseFloat(getComputedStyle(area).lineHeight) || 20;
  area.scrollTop = Math.max(0, (line - 3) * lineHeight);
}

interface ActionContext {
  toolId: string;
  preset: ResolvedPreset;
  store: ToolStore;
  fieldKey: string;
  output: string;
  notify: (message: string) => void;
}

/** Copy, download, paste and open-file handlers for the transform panes. */
function transformActions({ toolId, preset, store, fieldKey, output, notify }: ActionContext) {
  return {
    copy: async () => {
      const ok = await copyText(output);
      notify(ok ? t('toast.copied') : t('toast.copyFailed'));
      if (ok) track('tool_complete', { toolId, method: 'copy' });
    },
    download: () => {
      const name = preset.ui.outputFileName ?? 'result.txt';
      downloadText(output, name, preset.ui.outputMime ?? 'text/plain');
      track('tool_complete', { toolId, method: 'download' });
      notify(t('toast.downloaded', { name }));
    },
    paste: async () => {
      const text = await readClipboard();
      if (text === null) notify(t('toast.pasteFailed'));
      else store.set(fieldKey, text);
    },
    openFile: async (file: File) => {
      const text = await readTextFile(file);
      if (text === null) return notify(t('toast.fileTooLarge'));
      store.set(fieldKey, text);
      notify(t('toast.fileRead', { name: file.name }));
    },
  };
}

interface TransformBarProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  /** Values after a swap, or null when the tool has no two-way direction. */
  swap: (() => FieldValues) | null;
}

function TransformBar({ idPrefix, preset, snapshot, store, swap }: TransformBarProps) {
  const apply = (values: FieldValues) => store.setMany(reconcileOptions(preset, values));
  return (
    <div class={styles.transformBar}>
      <OptionControls
        idPrefix={idPrefix}
        preset={preset}
        values={snapshot.values}
        onChange={(key, next) => apply({ ...snapshot.values, [key]: next })}
      />
      {swap ? (
        <IconButton
          icon="arrow-left-right"
          label={t('action.swapLabel')}
          onClick={() => apply(swap())}
          data-swap=""
        />
      ) : null}
    </div>
  );
}

/** Archetype A: options bar, input pane and output pane, side by side on wide screens. */
export function TransformLayout({
  idPrefix,
  toolId,
  preset,
  snapshot,
  store,
  notify,
}: TransformLayoutProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const [fieldKey, field] = textField(preset);
  const input = String(snapshot.values[fieldKey] ?? '');
  const rows = snapshot.result ? outputRows(preset, snapshot.result.value, snapshot.values) : [];
  const primary = rows.find((r) => r.primary);
  const hasResult = snapshot.phase === 'result' && primary !== undefined;
  const swapTo = swapTarget(preset, String(snapshot.values.direction ?? ''));
  const actions = transformActions({
    toolId,
    preset,
    store,
    fieldKey,
    output: primary?.value ?? '',
    notify,
  });
  const swap = swapTo
    ? () => ({ ...snapshot.values, direction: swapTo, [fieldKey]: primary?.value ?? input })
    : null;

  return (
    <div class={styles.transform}>
      <TransformBar
        idPrefix={idPrefix}
        preset={preset}
        snapshot={snapshot}
        store={store}
        swap={swap}
      />
      <div class={styles.panes}>
        <InputPane
          id={`${idPrefix}-input`}
          label={label(preset, field?.labelKey) || t('input.label')}
          placeholder={label(preset, field?.placeholderKey)}
          value={input}
          invalid={snapshot.phase === 'error'}
          textareaRef={area}
          onValue={(next) => store.set(fieldKey, next)}
          onPaste={() => void actions.paste()}
          onClear={() => store.set(fieldKey, '')}
          onFile={(file) => void actions.openFile(file)}
        />
        <OutputPane
          id={`${idPrefix}-output`}
          label={primary?.label ?? t('output.label')}
          primary={snapshot.phase === 'idle' ? '' : (primary?.value ?? '')}
          secondary={rows.filter((r) => !r.primary)}
          hasResult={hasResult}
          stale={snapshot.phase === 'error'}
          onCopy={() => void actions.copy()}
          onDownload={actions.download}
        >
          <StatusLine
            preset={preset}
            phase={snapshot.phase}
            error={snapshot.error}
            warnings={snapshot.result?.warnings ?? []}
            input={input}
            onGoTo={(offset) => goTo(area.current, offset)}
          />
        </OutputPane>
      </div>
    </div>
  );
}
