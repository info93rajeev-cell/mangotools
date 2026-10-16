import {
  createToolPresetStore,
  type FieldValues,
  MAX_PRESET_NAME_LENGTH,
  type ToolPreset,
  type ToolPresetStore,
} from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useState } from 'preact/hooks';
import { Button } from '../primitives/Button.tsx';
import { Field } from '../primitives/Field.tsx';
import { InlineAlert } from '../primitives/feedback.tsx';
import { Select, TextInput } from '../primitives/inputs.tsx';
import { t } from '../strings/en.ts';
import styles from './toolPresets.module.css';
import {
  clearPresetsAction,
  deletePresetAction,
  loadPresetAction,
  type PresetOutcome,
  renamePresetAction,
  savePresetAction,
} from './toolPresets.ts';

export interface ToolPresetManagerProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  /** Current form values; saved only when the user presses Save. */
  values: FieldValues;
  /** Replaces the form values with a loaded preset's restored values. */
  onApply: (values: FieldValues) => void;
  /** Optional: resets the form to its defaults. Never deletes saved presets. */
  onReset?: (() => void) | undefined;
  disabled?: boolean;
  /** Injectable for tests; defaults to the browser-local store. */
  store?: ToolPresetStore;
}

type Mode = 'idle' | 'save' | 'rename' | 'delete' | 'clear';

interface ManagerState {
  presets: ToolPreset[];
  selectedId: string | null;
  mode: Mode;
  name: string;
  status: { ok: boolean; message: string } | null;
}

function usePresetManager(props: ToolPresetManagerProps) {
  const { toolId, preset, values, onApply } = props;
  const [store, setStore] = useState(() => props.store ?? createToolPresetStore({ storage: null }));
  const [state, setState] = useState<ManagerState>(() => ({
    presets: [],
    selectedId: null,
    mode: 'idle',
    name: '',
    status: null,
  }));
  useEffect(() => {
    const mountedStore = props.store ?? createToolPresetStore();
    setStore(mountedStore);
    setState((s) => ({ ...s, presets: mountedStore.list(toolId) }));
  }, [props.store, toolId]);
  const selected = state.presets.find((p) => p.id === state.selectedId) ?? null;
  const finish = (outcome: PresetOutcome, keepMode = false) => {
    setState((s) => ({
      ...s,
      presets: outcome.presets,
      selectedId: outcome.selectedId,
      mode: keepMode && !outcome.ok ? s.mode : 'idle',
      status: { ok: outcome.ok, message: outcome.message },
    }));
    if (outcome.ok && outcome.values) onApply(outcome.values);
  };
  const set = (next: Partial<ManagerState>) => setState((s) => ({ ...s, ...next }));
  return {
    state,
    selected,
    select: (id: string) => set({ selectedId: id === '' ? null : id, status: null }),
    begin: (mode: Mode) =>
      set({ mode, status: null, name: mode === 'rename' ? (selected?.name ?? '') : '' }),
    cancel: () => set({ mode: 'idle' }),
    setName: (name: string) => set({ name }),
    load: () => selected && finish(loadPresetAction(store, toolId, selected.id, preset)),
    confirm: () => {
      if (state.mode === 'save') {
        finish(savePresetAction(store, toolId, state.name, values, state.selectedId), true);
      } else if (state.mode === 'rename' && selected) {
        finish(renamePresetAction(store, toolId, selected.id, state.name), true);
      } else if (state.mode === 'delete' && selected) {
        finish(deletePresetAction(store, toolId, selected.id));
      } else if (state.mode === 'clear') finish(clearPresetsAction(store, toolId));
    },
  };
}

type Manager = ReturnType<typeof usePresetManager>;

function NameForm({ id, manager }: { id: string; manager: Manager }) {
  const { state } = manager;
  return (
    <form
      class={styles.inline}
      onSubmit={(event) => {
        event.preventDefault();
        manager.confirm();
      }}
    >
      <Field id={`${id}-name`} label={t('presets.name')}>
        <TextInput
          id={`${id}-name`}
          value={state.name}
          maxLength={MAX_PRESET_NAME_LENGTH}
          autoFocus
          onValue={manager.setName}
        />
      </Field>
      <Button type="submit" size="sm" variant="primary">
        {state.mode === 'save' ? t('presets.saveConfirm') : t('presets.renameConfirm')}
      </Button>
      <Button size="sm" variant="ghost" onClick={manager.cancel}>
        {t('presets.cancel')}
      </Button>
    </form>
  );
}

function ConfirmBar({ manager }: { manager: Manager }) {
  const question =
    manager.state.mode === 'clear'
      ? t('presets.clearQuestion')
      : t('presets.deleteQuestion', { name: manager.selected?.name ?? '' });
  return (
    <div class={styles.inline}>
      <p class={styles.question}>{question}</p>
      <Button size="sm" variant="primary" onClick={manager.confirm}>
        {manager.state.mode === 'clear' ? t('presets.clearConfirm') : t('presets.deleteConfirm')}
      </Button>
      <Button size="sm" variant="ghost" onClick={manager.cancel}>
        {t('presets.cancel')}
      </Button>
    </div>
  );
}

function Toolbar({ id, manager, disabled }: { id: string; manager: Manager; disabled: boolean }) {
  const { state, selected } = manager;
  const busy = disabled || state.mode !== 'idle';
  const options = [
    { value: '', label: t('presets.choose') },
    ...state.presets.map((p) => ({ value: p.id, label: p.name })),
  ];
  return (
    <div class={styles.toolbar}>
      <Field id={`${id}-select`} label={t('presets.list')} hideLabel>
        <Select
          id={`${id}-select`}
          value={state.selectedId ?? ''}
          options={options}
          disabled={disabled || state.presets.length === 0}
          onValue={manager.select}
        />
      </Field>
      <Button size="sm" disabled={busy || !selected} onClick={manager.load}>
        {t('presets.load')}
      </Button>
      <Button size="sm" disabled={busy} onClick={() => manager.begin('save')}>
        {t('presets.save')}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy || !selected}
        onClick={() => manager.begin('rename')}
      >
        {t('presets.rename')}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy || !selected}
        onClick={() => manager.begin('delete')}
      >
        {t('presets.delete')}
      </Button>
    </div>
  );
}

/** Save, load, rename and delete named sets of form values kept in this browser only. */
export function ToolPresetManager(props: ToolPresetManagerProps) {
  const manager = usePresetManager(props);
  const { state } = manager;
  const id = `${props.idPrefix}-presets`;
  const disabled = props.disabled ?? false;
  return (
    <section
      class={`${styles.manager} no-print`}
      aria-labelledby={`${id}-title`}
      data-tool-presets=""
    >
      <h3 id={`${id}-title`} class={styles.title}>
        {t('presets.title')}
      </h3>
      <Toolbar id={id} manager={manager} disabled={disabled} />
      {state.mode === 'save' || state.mode === 'rename' ? (
        <NameForm id={id} manager={manager} />
      ) : null}
      {state.mode === 'delete' || state.mode === 'clear' ? <ConfirmBar manager={manager} /> : null}
      {state.status ? (
        state.status.ok ? (
          <p class={styles.status} role="status" aria-live="polite">
            {state.status.message}
          </p>
        ) : (
          <InlineAlert tone="danger" role="alert">
            <p>{state.status.message}</p>
          </InlineAlert>
        )
      ) : null}
      <div class={styles.footer}>
        <p class={styles.note}>{t('presets.localOnly')}</p>
        {props.onReset ? (
          <Button
            size="sm"
            variant="ghost"
            icon="rotate-ccw"
            disabled={disabled}
            onClick={props.onReset}
          >
            {t('presets.resetForm')}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          icon="trash-2"
          disabled={disabled || state.mode !== 'idle' || state.presets.length === 0}
          onClick={() => manager.begin('clear')}
        >
          {t('presets.clearAll')}
        </Button>
      </div>
    </section>
  );
}
