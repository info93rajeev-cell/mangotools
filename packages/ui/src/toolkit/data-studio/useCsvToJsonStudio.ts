import type { FieldValue, ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { copyText, downloadText } from '../actions.ts';
import { messageFor } from '../presentation.ts';
import { type CsvShape, readCsvResult } from './csvToJsonResult.ts';

/** The sample shown on first open; matches the approved reference screen. */
export const FIRST_SAMPLE_ID = 'employees';

export type CsvInputTab = 'text' | 'file' | 'sheet' | 'sample';
export type CsvOutputTab = 'formatted' | 'minified' | 'table';

export interface CsvOptions {
  delimiter: string;
  header: boolean;
  trim: boolean;
  skipEmptyRows: boolean;
  inferTypes: boolean;
  emptyAsNull: boolean;
  nullValues: string;
  maxRows: string;
  shape: CsvShape;
  excludeColumns: string;
  metadata: boolean;
  pretty: boolean;
}

function readOptions(values: ToolSnapshot['values']): CsvOptions {
  const text = (key: string, fallback: string) =>
    typeof values[key] === 'string' && values[key] !== '' ? String(values[key]) : fallback;
  const flag = (key: string, fallback: boolean) =>
    typeof values[key] === 'boolean' ? (values[key] as boolean) : fallback;
  return {
    delimiter: text('delimiter', 'comma'),
    header: flag('header', true),
    trim: flag('trim', false),
    skipEmptyRows: flag('skipEmptyRows', false),
    inferTypes: flag('inferTypes', false),
    emptyAsNull: flag('emptyAsNull', false),
    nullValues: text('nullValues', ''),
    maxRows: text('maxRows', ''),
    shape: text('shape', 'objects') as CsvShape,
    excludeColumns: text('excludeColumns', ''),
    metadata: flag('metadata', false),
    pretty: flag('pretty', true),
  };
}

function sampleText(preset: ResolvedPreset, id: string): string {
  const text = preset.samples[id]?.input.text;
  return typeof text === 'string' ? text : '';
}

function readFile(file: File, onText: (text: string) => void) {
  const reader = new FileReader();
  reader.onload = () => onText(typeof reader.result === 'string' ? reader.result : '');
  reader.readAsText(file);
}

function useCsvActions(
  preset: ResolvedPreset,
  store: ToolStore,
  notify: (msg: string) => void,
  setText: (text: string) => void,
  outputText: string,
) {
  const fileName = preset.ui?.outputFileName ?? 'data.json';
  return {
    loadSample(id: string) {
      const sample = preset.samples[id];
      if (!sample) return;
      store.setMany({
        text: sampleText(preset, id),
        ...(sample.params as Record<string, FieldValue>),
      });
      notify('Sample loaded');
    },
    loadFile(file: File) {
      readFile(file, (text) => {
        setText(text);
        notify(`Loaded ${file.name}`);
      });
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
    resetAll() {
      store.reset();
      store.set('text', sampleText(preset, FIRST_SAMPLE_ID));
      notify('Reset to the sample and default options');
    },
    clearAll() {
      store.setMany({ text: '', excludeColumns: '' });
      notify('Cleared');
    },
    async copy() {
      if (!outputText) return;
      notify((await copyText(outputText)) ? 'JSON copied to clipboard' : 'Copy failed');
    },
    download() {
      if (!outputText) return;
      downloadText(outputText, fileName, 'application/json');
      notify(`Downloaded ${fileName}`);
    },
    openInNewTab() {
      if (!outputText) return;
      const url = URL.createObjectURL(new Blob([outputText], { type: 'application/json' }));
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    async convert() {
      await store.runNow();
      notify('CSV converted to JSON');
    },
  };
}

export function useCsvToJsonStudio(
  preset: ResolvedPreset,
  snapshot: ToolSnapshot,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const storeText = typeof snapshot.values.text === 'string' ? snapshot.values.text : '';
  const [input, setInput] = useState(storeText);
  const [inputTab, setInputTab] = useState<CsvInputTab>('text');
  const [tableView, setTableView] = useState(false);

  useEffect(() => {
    if (storeText !== input) setInput(storeText);
  }, [storeText]);

  // First open: show the reference sample so every panel has something to explain.
  useEffect(() => {
    if (storeText.trim() === '') store.set('text', sampleText(preset, FIRST_SAMPLE_ID));
  }, []);

  const setText = (text: string) => {
    setInput(text);
    store.set('text', text);
  };
  const options = readOptions(snapshot.values);
  const result = useMemo(() => readCsvResult(snapshot.result?.value), [snapshot.result]);
  const hasInput = input.trim() !== '';
  const error = snapshot.error && hasInput ? messageFor(preset, snapshot.error) : null;
  const shown = hasInput && !error ? result : null;
  const outputTab: CsvOutputTab = tableView ? 'table' : options.pretty ? 'formatted' : 'minified';

  return {
    input,
    setText,
    inputTab,
    setInputTab,
    options,
    setOption: (key: keyof CsvOptions, value: FieldValue) => store.set(key, value),
    result: shown,
    error,
    warnings: shown ? (snapshot.result?.warnings ?? []).map((w) => messageFor(preset, w)) : [],
    outputTab,
    setOutputTab(tab: CsvOutputTab) {
      setTableView(tab === 'table');
      if (tab !== 'table') store.set('pretty', tab === 'formatted');
    },
    ...useCsvActions(preset, store, notify, setText, shown?.text ?? ''),
  };
}

export type CsvStudio = ReturnType<typeof useCsvToJsonStudio>;
