import type { FieldValues, ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { copyText, downloadText } from '../actions.ts';
import { messageFor } from '../presentation.ts';
import {
  baseOf,
  isHttpUrl,
  REFERENCE_TEXT,
  type Row,
  readUrlResult,
  rowsFromParams,
  rowsToPairs,
  type UrlMode,
  type UrlSource,
} from './urlStudio.ts';

function reference(_preset: ResolvedPreset): string {
  return REFERENCE_TEXT;
}

function readOptions(v: ToolSnapshot['values']) {
  const mode = (typeof v.mode === 'string' ? v.mode : 'component') as UrlMode;
  const space = typeof v.space === 'string' ? v.space : 'default';
  return {
    direction: v.direction === 'decode' ? 'decode' : 'encode',
    mode,
    spacesAsPercent: space === 'percent' || (space === 'default' && mode !== 'form'),
    encodeSubDelims: v.encodeSubDelims !== false,
    keepEscapes: v.keepEscapes === true,
    crlf: v.crlf === true,
    perLine: v.perLine !== false,
  } as const;
}

/** Store values for the rows tabs: key/value pairs, always encoded. */
function pairValues(rows: readonly Row[], form: boolean): FieldValues {
  return {
    text: rowsToPairs(rows),
    source: 'pairs',
    direction: 'encode',
    mode: form ? 'form' : 'component',
    space: 'default',
  };
}

export function useUrlEncoderStudio(
  preset: ResolvedPreset,
  snapshot: ToolSnapshot,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const storeText = typeof snapshot.values.text === 'string' ? snapshot.values.text : '';
  const pairsMode = snapshot.values.source === 'pairs';
  const [source, setSourceState] = useState<UrlSource>('text');
  const [draft, setDraft] = useState('');
  const [rows, setRowsState] = useState<Row[]>([['', '']]);
  const [base, setBase] = useState('');
  const options = readOptions(snapshot.values);

  useEffect(() => {
    if (!pairsMode && storeText !== draft) setDraft(storeText);
  }, [storeText]);
  useEffect(() => {
    if (storeText === '') store.setMany({ text: reference(preset), source: 'text' });
  }, []);

  const result = useMemo(() => readUrlResult(snapshot.result?.value), [snapshot.result]);
  const error = snapshot.error && storeText !== '' ? messageFor(preset, snapshot.error) : null;
  const shown = storeText !== '' && !error ? result : null;
  const built = shown && pairsMode && base && shown.text ? `${base}?${shown.text}` : '';
  const outputText = built || (shown?.text ?? '');

  const setText = (text: string) => {
    setDraft(text);
    store.setMany({ text, source: 'text' });
  };
  const setRows = (next: Row[]) => {
    setRowsState(next);
    store.setMany(pairValues(next, source === 'form'));
  };
  const setSource = (next: UrlSource) => {
    setSourceState(next);
    if (next === 'query' || next === 'form') {
      const start = rows.some(([k]) => k) ? rows : rowsFromParams(shown?.params ?? []);
      if (next === 'query' && !base) setBase(baseOf(draft));
      setRowsState(start);
      store.setMany(pairValues(start, next === 'form'));
    } else if (pairsMode) {
      store.setMany({ text: draft, source: 'text', mode: 'component' });
    }
  };

  return {
    source,
    setSource,
    draft,
    setText,
    rows,
    setRows,
    base,
    setBase,
    options,
    setOption: (key: string, value: string | boolean) => store.set(key, value),
    setMode: (mode: UrlMode) => store.setMany({ mode, space: 'default' }),
    setDirection: (direction: 'encode' | 'decode') => store.set('direction', direction),
    result: shown,
    error,
    outputText,
    ...useUrlActions({ preset, store, notify, outputText, setText, setSourceState, options }),
  };
}

interface ActionArgs {
  preset: ResolvedPreset;
  store: ToolStore;
  notify: (msg: string) => void;
  outputText: string;
  setText: (text: string) => void;
  setSourceState: (s: UrlSource) => void;
  options: ReturnType<typeof readOptions>;
}

function useUrlActions(a: ActionArgs) {
  const toText = (text: string) => {
    a.setSourceState('text');
    a.setText(text);
  };
  return {
    async copy() {
      if (!a.outputText) return;
      a.notify((await copyText(a.outputText)) ? 'Copied to clipboard.' : 'Copy failed');
    },
    download() {
      if (!a.outputText) return;
      downloadText(a.outputText, 'url-result.txt', 'text/plain');
      a.notify('Downloaded url-result.txt');
    },
    openInNewTab() {
      if (!a.outputText) return;
      const target = isHttpUrl(a.outputText)
        ? a.outputText.trim()
        : URL.createObjectURL(new Blob([a.outputText], { type: 'text/plain;charset=utf-8' }));
      window.open(target, '_blank', 'noopener');
    },
    swap() {
      if (!a.outputText) return;
      const next = a.options.direction === 'encode' ? 'decode' : 'encode';
      toText(a.outputText);
      a.store.set('direction', next);
      a.notify('Input and output swapped');
    },
    loadFile(file: File) {
      const reader = new FileReader();
      reader.onload = () => {
        toText(typeof reader.result === 'string' ? reader.result : '');
        a.notify(`Loaded ${file.name}`);
      };
      reader.readAsText(file);
    },
    applyExample(text: string, group: string) {
      toText(text);
      const mode = group === 'URL' ? 'full-url' : group === 'Form Data' ? 'form' : 'component';
      a.store.setMany({ direction: 'encode', mode, space: 'default' });
    },
    loadSample() {
      toText(reference(a.preset));
      a.store.setMany({ direction: 'encode', mode: 'component', space: 'default' });
      a.notify('Example loaded');
    },
    clearAll() {
      toText('');
      a.notify('Cleared');
    },
    resetAll() {
      a.store.reset();
      toText(reference(a.preset));
      a.notify('Reset to the example and default options');
    },
    convert: () => a.store.runNow(),
  };
}

export type UrlStudio = ReturnType<typeof useUrlEncoderStudio>;
