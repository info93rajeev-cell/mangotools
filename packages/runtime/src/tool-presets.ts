import { browserStorage, type StorageLike } from './preferences.ts';

/**
 * Browser-local, user-defined tool presets (TASK-008L PR 3).
 *
 * - One localStorage key, `mt.toolPresets`, separate from theme and recent tools.
 * - Presets are saved only on an explicit call (no autosave) and never leave the browser: this
 *   module makes no network request and never calls analytics.
 * - Each tool's presets are keyed by the tool's manifest `id`; one tool never sees another's.
 * - Values are any JSON object of strings, booleans, null, arrays and nested objects. Numbers are
 *   rejected so decimal strings are never coerced. Callers validate values on load
 *   (`restoreValues`).
 * - Resetting a calculator form is a form operation (`ToolStore.reset`) and never touches this
 *   store; `remove` deletes one preset and `clear` deletes every preset of one tool, explicitly.
 *
 * Version and corruption policy: the stored document is `{ version: 1, tools: { [toolId]: [...] } }`.
 * Unreadable JSON or a wrong shape reads as empty and is replaced on the next save. A document with
 * a newer `version` reads as empty and every write is refused (`UNSUPPORTED_VERSION`) so data from a
 * newer app is never destroyed. Invalid entries inside one tool's list are skipped on read and
 * dropped when that tool is next written; other tools' entries are kept exactly as stored.
 */

export const TOOL_PRESETS_KEY = 'mt.toolPresets';
export const TOOL_PRESETS_VERSION = 1;
export const MAX_PRESETS_PER_TOOL = 20;
export const MAX_PRESET_NAME_LENGTH = 60;
/** Upper bound for one preset's serialized values, in UTF-16 code units. */
export const MAX_PRESET_VALUES_SIZE = 16_000;

export type PresetJson = string | boolean | null | PresetJson[] | { [key: string]: PresetJson };
export type PresetValues = { [key: string]: PresetJson };

export interface ToolPreset {
  id: string;
  name: string;
  values: PresetValues;
}

export type ToolPresetError =
  | 'STORAGE_UNAVAILABLE'
  | 'WRITE_FAILED'
  | 'UNSUPPORTED_VERSION'
  | 'INVALID_TOOL_ID'
  | 'NAME_REQUIRED'
  | 'NAME_TOO_LONG'
  | 'INVALID_VALUES'
  | 'TOO_LARGE'
  | 'TOO_MANY_PRESETS'
  | 'NOT_FOUND';

export type ToolPresetResult<T> = { ok: true; value: T } | { ok: false; error: ToolPresetError };

const TOOL_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PRESET_ID = /^[A-Za-z0-9_-]{1,64}$/;

const fail = <T>(error: ToolPresetError): ToolPresetResult<T> => ({ ok: false, error });
const done = <T>(value: T): ToolPresetResult<T> => ({ ok: true, value });

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

function isPresetJson(v: unknown, depth = 0): v is PresetJson {
  if (depth > 8) return false;
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return true;
  if (Array.isArray(v)) return v.every((item) => isPresetJson(item, depth + 1));
  return isRecord(v) && Object.values(v).every((item) => isPresetJson(item, depth + 1));
}

const isValues = (v: unknown): v is PresetValues => isRecord(v) && isPresetJson(v);

function isPreset(v: unknown): v is ToolPreset {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    PRESET_ID.test(v.id) &&
    typeof v.name === 'string' &&
    v.name.trim() !== '' &&
    isValues(v.values)
  );
}

type Document =
  | { kind: 'ok'; tools: Record<string, unknown> }
  | { kind: 'newer' }
  | { kind: 'unavailable' };

/** Generates an opaque preset id; injectable for tests. */
export type IdSource = () => string;

const defaultIds: IdSource = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

export interface ToolPresetStoreOptions {
  storage?: StorageLike | null;
  ids?: IdSource;
}

export interface ToolPresetStore {
  list(toolId: string): ToolPreset[];
  get(toolId: string, presetId: string): ToolPreset | null;
  /** Creates a preset, or replaces the values (and name) of `presetId` when given. */
  save(
    toolId: string,
    preset: { name: string; values: PresetValues; presetId?: string },
  ): ToolPresetResult<ToolPreset>;
  rename(toolId: string, presetId: string, name: string): ToolPresetResult<ToolPreset>;
  remove(toolId: string, presetId: string): ToolPresetResult<true>;
  /** Deletes every saved preset of one tool. Never called by a form reset. */
  clear(toolId: string): ToolPresetResult<true>;
}

function readDocument(storage: StorageLike | null): Document {
  if (!storage) return { kind: 'unavailable' };
  let raw: string | null;
  try {
    raw = storage.getItem(TOOL_PRESETS_KEY);
  } catch {
    return { kind: 'unavailable' };
  }
  if (raw === null) return { kind: 'ok', tools: {} };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: 'ok', tools: {} };
  }
  if (!isRecord(parsed) || typeof parsed.version !== 'number') return { kind: 'ok', tools: {} };
  if (parsed.version > TOOL_PRESETS_VERSION) return { kind: 'newer' };
  const valid = parsed.version === TOOL_PRESETS_VERSION && isRecord(parsed.tools);
  return { kind: 'ok', tools: valid ? (parsed.tools as Record<string, unknown>) : {} };
}

function presetsOf(tools: Record<string, unknown>, toolId: string): ToolPreset[] {
  const list = tools[toolId];
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const presets: ToolPreset[] = [];
  for (const item of list) {
    if (!isPreset(item) || seen.has(item.id)) continue;
    seen.add(item.id);
    presets.push({ id: item.id, name: item.name, values: item.values });
  }
  return presets;
}

function validName(name: string): ToolPresetResult<string> {
  const trimmed = name.trim();
  if (trimmed === '') return fail('NAME_REQUIRED');
  if ([...trimmed].length > MAX_PRESET_NAME_LENGTH) return fail('NAME_TOO_LONG');
  return done(trimmed);
}

function validValues(values: unknown): ToolPresetResult<PresetValues> {
  if (!isValues(values)) return fail('INVALID_VALUES');
  const copy = JSON.parse(JSON.stringify(values)) as PresetValues;
  return JSON.stringify(copy).length > MAX_PRESET_VALUES_SIZE ? fail('TOO_LARGE') : done(copy);
}

function newId(existing: readonly ToolPreset[], ids: IdSource): string | null {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = ids();
    if (PRESET_ID.test(id) && !existing.some((p) => p.id === id)) return id;
  }
  return null;
}

type Change<T> = (presets: ToolPreset[]) => ToolPresetResult<{ presets: ToolPreset[]; result: T }>;

/** Reads the document, applies `change` to one tool's list and writes the whole document back. */
function updateTool<T>(
  storage: StorageLike | null,
  toolId: string,
  change: Change<T>,
): ToolPresetResult<T> {
  if (!TOOL_ID.test(toolId)) return fail('INVALID_TOOL_ID');
  const doc = readDocument(storage);
  if (doc.kind === 'unavailable' || !storage) return fail('STORAGE_UNAVAILABLE');
  if (doc.kind === 'newer') return fail('UNSUPPORTED_VERSION');
  const changed = change(presetsOf(doc.tools, toolId));
  if (!changed.ok) return changed;
  const tools = { ...doc.tools, [toolId]: changed.value.presets };
  if (changed.value.presets.length === 0) delete tools[toolId];
  try {
    storage.setItem(TOOL_PRESETS_KEY, JSON.stringify({ version: TOOL_PRESETS_VERSION, tools }));
  } catch {
    return fail('WRITE_FAILED');
  }
  return done(changed.value.result);
}

/** A change that edits one existing preset in place, keeping its position and id. */
function editPreset(
  presetId: string,
  edit: (preset: ToolPreset) => ToolPreset,
): Change<ToolPreset> {
  return (presets) => {
    const index = presets.findIndex((p) => p.id === presetId);
    const current = presets[index];
    if (!current) return fail('NOT_FOUND');
    const next = edit(current);
    return done({ presets: presets.map((p, i) => (i === index ? next : p)), result: next });
  };
}

function appendPreset(ids: IdSource, name: string, values: PresetValues): Change<ToolPreset> {
  return (presets) => {
    if (presets.length >= MAX_PRESETS_PER_TOOL) return fail('TOO_MANY_PRESETS');
    const id = newId(presets, ids);
    if (id === null) return fail('WRITE_FAILED');
    const created = { id, name, values };
    return done({ presets: [...presets, created], result: created });
  };
}

/** Creates the store. Without a storage argument it uses localStorage when available. */
export function createToolPresetStore(options: ToolPresetStoreOptions = {}): ToolPresetStore {
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  const ids = options.ids ?? defaultIds;
  const list = (toolId: string): ToolPreset[] => {
    if (!TOOL_ID.test(toolId)) return [];
    const doc = readDocument(storage);
    return doc.kind === 'ok' ? presetsOf(doc.tools, toolId) : [];
  };
  return {
    list,
    get: (toolId, presetId) => list(toolId).find((p) => p.id === presetId) ?? null,
    save(toolId, { name, values, presetId }) {
      const checkedName = validName(name);
      if (!checkedName.ok) return checkedName;
      const checkedValues = validValues(values);
      if (!checkedValues.ok) return checkedValues;
      const change =
        presetId === undefined
          ? appendPreset(ids, checkedName.value, checkedValues.value)
          : editPreset(presetId, (p) => ({
              id: p.id,
              name: checkedName.value,
              values: checkedValues.value,
            }));
      return updateTool(storage, toolId, change);
    },
    rename(toolId, presetId, name) {
      const checkedName = validName(name);
      if (!checkedName.ok) return checkedName;
      return updateTool(
        storage,
        toolId,
        editPreset(presetId, (p) => ({ ...p, name: checkedName.value })),
      );
    },
    remove: (toolId, presetId) =>
      updateTool(storage, toolId, (presets) =>
        presets.some((p) => p.id === presetId)
          ? done({ presets: presets.filter((p) => p.id !== presetId), result: true as const })
          : fail('NOT_FOUND'),
      ),
    clear: (toolId) =>
      updateTool(storage, toolId, () => done({ presets: [], result: true as const })),
  };
}
