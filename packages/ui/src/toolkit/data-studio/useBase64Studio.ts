import type { FieldValues, ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { copyText, downloadBytes, downloadText } from '../actions.ts';
import { messageFor } from '../presentation.ts';
import {
  type Base64Mode,
  type Base64Source,
  bufferToLatin1,
  extensionFor,
  latin1ToBytes,
  looksLikeBase64,
  readBase64Result,
} from './base64Studio.ts';

export const FIRST_SAMPLE_ID = 'reference';

export interface LoadedFile {
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

function reference(preset: ResolvedPreset): string {
  const text = preset.samples[FIRST_SAMPLE_ID]?.input.text;
  return typeof text === 'string' ? text : '';
}

/** Store values for typed text: text charset, no data URI, current mode. */
function textValues(text: string, direction: 'encode' | 'decode'): FieldValues {
  return {
    text,
    direction,
    charset: 'utf-8',
    dataUriMime: '',
    stripDataUri: direction === 'decode',
  };
}

function useOptions(snapshot: ToolSnapshot) {
  const v = snapshot.values;
  return {
    direction: v.direction === 'decode' ? 'decode' : 'encode',
    padding: v.padding !== false,
    oneLine: v.lineLength !== '76',
    charset: v.charset === 'latin1' ? 'latin1' : 'utf-8',
  } as const;
}

function useFileLoader(store: ToolStore, notify: (m: string) => void) {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const load = (picked: File, asImage: boolean) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      const isImage = asImage && picked.type.startsWith('image/');
      store.setMany({
        text: bufferToLatin1(reader.result as ArrayBuffer),
        direction: 'encode',
        charset: 'latin1',
        dataUriMime: isImage ? picked.type : '',
        stripDataUri: false,
      });
      setFile({
        name: picked.name,
        size: picked.size,
        type: picked.type || 'application/octet-stream',
        previewUrl: isImage ? URL.createObjectURL(picked) : undefined,
      });
      notify(`Loaded ${picked.name}`);
    };
    reader.readAsArrayBuffer(picked);
  };
  return { file, setFile, load };
}

interface SyncArgs {
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  mode: Base64Mode;
  draft: string;
  setDraft: (text: string) => void;
  urlSafe: boolean;
  binaryInput: boolean;
}

/** Keeps the form in step: first-open sample, Auto Detect direction, alphabet per direction. */
function useBase64Sync(a: SyncArgs) {
  const storeText = typeof a.snapshot.values.text === 'string' ? a.snapshot.values.text : '';
  const direction = a.snapshot.values.direction;
  useEffect(() => {
    if (!a.binaryInput && storeText !== a.draft) a.setDraft(storeText);
  }, [storeText]);
  useEffect(() => {
    if (storeText === '') a.store.setMany(textValues(reference(a.preset), 'encode'));
  }, []);
  useEffect(() => {
    if (a.mode !== 'auto' || a.binaryInput) return;
    const want = looksLikeBase64(a.draft) ? 'decode' : 'encode';
    if (want !== direction) a.store.setMany({ direction: want, stripDataUri: want === 'decode' });
  }, [a.mode, a.draft]);
  // Decoding always accepts both alphabets; the URL-safe switch chooses the encode alphabet.
  useEffect(() => {
    const variant = direction === 'decode' ? 'auto' : a.urlSafe ? 'url-safe' : 'standard';
    if (a.snapshot.values.variant !== variant) a.store.set('variant', variant);
  }, [direction, a.urlSafe]);
  return storeText;
}

export function useBase64Studio(
  preset: ResolvedPreset,
  snapshot: ToolSnapshot,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const [source, setSource] = useState<Base64Source>('text');
  const [mode, setModeState] = useState<Base64Mode>('encode');
  const [draft, setDraft] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const options = useOptions(snapshot);
  const files = useFileLoader(store, notify);
  const binaryInput = files.file !== null && options.charset === 'latin1';
  const sync = { preset, snapshot, store, mode, draft, setDraft, urlSafe, binaryInput };
  const storeText = useBase64Sync(sync);

  const result = useMemo(() => readBase64Result(snapshot.result?.value), [snapshot.result]);
  const error = snapshot.error && storeText !== '' ? messageFor(preset, snapshot.error) : null;
  const shown = storeText !== '' && !error ? result : null;

  /** Puts typed text in the form with a direction, and optionally a new mode. */
  const put = (text: string, direction: 'encode' | 'decode', nextMode?: Base64Mode) => {
    files.setFile(null);
    setDraft(text);
    if (nextMode) setModeState(nextMode);
    store.setMany(textValues(text, direction));
  };
  const guess = (text: string) =>
    mode === 'auto' ? (looksLikeBase64(text) ? 'decode' : 'encode') : options.direction;
  const setText = (text: string) => put(text, guess(text));
  const setMode = (next: Base64Mode) => {
    setModeState(next);
    if (next !== 'auto') store.setMany({ direction: next, stripDataUri: next === 'decode' });
  };
  const actions = useBase64Actions(store, notify, shown, setText, () => setMode('encode'), preset);
  const flip = options.direction === 'encode' ? 'decode' : 'encode';

  return {
    source,
    setSource,
    mode,
    setMode,
    draft,
    setText,
    applyExample(text: string, decode: boolean) {
      setSource('text');
      put(text, decode ? 'decode' : guess(text), decode ? 'decode' : undefined);
    },
    options: { ...options, urlSafe },
    setUrlSafe,
    setOption: (key: string, value: string | boolean) => store.set(key, value),
    file: binaryInput ? files.file : null,
    loadFile: files.load,
    result: shown,
    error,
    ...actions,
    swap() {
      if (!actions.outputText) return;
      setSource('text');
      put(actions.outputText, flip, flip);
      notify('Input and output swapped');
    },
  };
}

function useBase64Actions(
  store: ToolStore,
  notify: (msg: string) => void,
  result: ReturnType<typeof readBase64Result>,
  setText: (text: string) => void,
  resetMode: () => void,
  preset: ResolvedPreset,
) {
  const outputText = result?.isUtf8 || !result?.binary ? (result?.text ?? '') : '';
  return {
    outputText,
    async copy() {
      if (!outputText) return;
      notify((await copyText(outputText)) ? 'Copied to clipboard' : 'Copy failed');
    },
    download() {
      if (!result) return;
      if (result.binary && !result.isUtf8) {
        const name = `decoded.${extensionFor(result.mime)}`;
        downloadBytes(
          latin1ToBytes(result.binary),
          name,
          result.mime ?? 'application/octet-stream',
        );
        notify(`Downloaded ${name}`);
        return;
      }
      downloadText(outputText, 'base64-result.txt', 'text/plain');
      notify('Downloaded base64-result.txt');
    },
    async paste() {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          setText(text);
          notify('Pasted from clipboard');
          return;
        }
      } catch {
        // Clipboard read blocked: fall through to the hint.
      }
      notify('Use Ctrl+V or Cmd+V to paste');
    },
    loadSample() {
      resetMode();
      setText(reference(preset));
      notify('Sample loaded');
    },
    clearAll() {
      setText('');
      notify('Cleared');
    },
    resetAll() {
      store.reset();
      resetMode();
      setText(reference(preset));
      notify('Reset to the sample and default options');
    },
    convert: () => store.runNow(),
  };
}

export type Base64Studio = ReturnType<typeof useBase64Studio>;
