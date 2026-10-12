import {
  type FieldValues,
  restoreValues,
  type ToolPreset,
  type ToolPresetError,
  type ToolPresetStore,
} from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { type StringKey, t } from '../strings/en.ts';

/**
 * Pure orchestration for the saved-preset manager (TASK-008L PR 4A). Every action goes through the
 * runtime's `ToolPresetStore`; this module only turns its typed results into the next UI state and a
 * short message. Nothing here touches the network, analytics or the URL.
 */

const ERROR_KEY: Record<ToolPresetError, StringKey> = {
  STORAGE_UNAVAILABLE: 'presets.error.storageUnavailable',
  WRITE_FAILED: 'presets.error.writeFailed',
  UNSUPPORTED_VERSION: 'presets.error.unsupportedVersion',
  INVALID_TOOL_ID: 'presets.error.writeFailed',
  NAME_REQUIRED: 'presets.error.nameRequired',
  NAME_TOO_LONG: 'presets.error.nameTooLong',
  INVALID_VALUES: 'presets.error.invalidValues',
  TOO_LARGE: 'presets.error.tooLarge',
  TOO_MANY_PRESETS: 'presets.error.tooMany',
  NOT_FOUND: 'presets.error.notFound',
};

/** A concise user-facing message for a runtime preset error (never the raw code alone). */
export function presetErrorMessage(code: ToolPresetError): string {
  return t(ERROR_KEY[code]);
}

export interface PresetOutcome {
  ok: boolean;
  message: string;
  presets: ToolPreset[];
  /** The preset selected after the action (null when none). */
  selectedId: string | null;
  /** Form values to apply (load only). */
  values?: FieldValues;
}

const success = (
  store: ToolPresetStore,
  toolId: string,
  message: string,
  selectedId: string | null,
): PresetOutcome => ({ ok: true, message, presets: store.list(toolId), selectedId });

const failure = (
  store: ToolPresetStore,
  toolId: string,
  code: ToolPresetError,
  selectedId: string | null,
): PresetOutcome => ({
  ok: false,
  message: presetErrorMessage(code),
  presets: store.list(toolId),
  selectedId,
});

/** Saves the current form values as a new preset (names may repeat; ids never do). */
export function savePresetAction(
  store: ToolPresetStore,
  toolId: string,
  name: string,
  values: FieldValues,
  selectedId: string | null,
): PresetOutcome {
  const result = store.save(toolId, { name, values });
  return result.ok
    ? success(store, toolId, t('presets.saved', { name: result.value.name }), result.value.id)
    : failure(store, toolId, result.error, selectedId);
}

/** Loads a saved preset: values pass through `restoreValues`, so unknown or stale keys are dropped. */
export function loadPresetAction(
  store: ToolPresetStore,
  toolId: string,
  presetId: string,
  preset: ResolvedPreset,
): PresetOutcome {
  const saved = store.get(toolId, presetId);
  if (!saved) return failure(store, toolId, 'NOT_FOUND', null);
  return {
    ...success(store, toolId, t('presets.loaded', { name: saved.name }), saved.id),
    values: restoreValues(preset, saved.values),
  };
}

export function renamePresetAction(
  store: ToolPresetStore,
  toolId: string,
  presetId: string,
  name: string,
): PresetOutcome {
  const result = store.rename(toolId, presetId, name);
  return result.ok
    ? success(store, toolId, t('presets.renamed', { name: result.value.name }), presetId)
    : failure(store, toolId, result.error, presetId);
}

export function deletePresetAction(
  store: ToolPresetStore,
  toolId: string,
  presetId: string,
): PresetOutcome {
  const result = store.remove(toolId, presetId);
  return result.ok
    ? success(store, toolId, t('presets.deleted'), null)
    : failure(store, toolId, result.error, presetId);
}

/** Deletes every saved preset of this tool only. A form reset never calls this. */
export function clearPresetsAction(store: ToolPresetStore, toolId: string): PresetOutcome {
  const result = store.clear(toolId);
  return result.ok
    ? success(store, toolId, t('presets.cleared'), null)
    : failure(store, toolId, result.error, null);
}
