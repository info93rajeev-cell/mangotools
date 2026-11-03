import type { FieldValues, ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { copyText, downloadText } from '../actions.ts';
import { messageFor } from '../presentation.ts';
import {
  type JsonToCsvDelimiter,
  type JsonToCsvNested,
  readJsonToCsvResult,
  rootKind,
  UTF8_BOM,
} from './jsonToCsvStudio.ts';

export const FIRST_SAMPLE_ID = 'team-records';

function sampleValues(preset: ResolvedPreset, id: string): FieldValues {
  const sample = preset.samples[id];
  const text = typeof sample?.input.text === 'string' ? sample.input.text : '';
  return { recordPath: '', ...(sample?.params ?? {}), text };
}

function readOptions(v: ToolSnapshot['values']) {
  return {
    delimiter: (typeof v.delimiter === 'string' ? v.delimiter : 'comma') as JsonToCsvDelimiter,
    header: v.header !== false,
    unionKeys: v.keys !== 'first',
    nested: (typeof v.nested === 'string' ? v.nested : 'flatten') as JsonToCsvNested,
    recordPath: typeof v.recordPath === 'string' ? v.recordPath : '',
    formulaGuard: v.formulaGuard === true,
  };
}

export function useJsonToCsvStudio(
  preset: ResolvedPreset,
  snapshot: ToolSnapshot,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const storeText = typeof snapshot.values.text === 'string' ? snapshot.values.text : '';
  const [draft, setDraft] = useState(storeText);
  const [bom, setBom] = useState(false);
  const options = readOptions(snapshot.values);

  useEffect(() => {
    if (storeText !== draft) setDraft(storeText);
  }, [storeText]);
  useEffect(() => {
    if (storeText === '') store.setMany(sampleValues(preset, FIRST_SAMPLE_ID));
  }, []);

  const result = useMemo(() => readJsonToCsvResult(snapshot.result?.value), [snapshot.result]);
  const error = snapshot.error && storeText !== '' ? messageFor(preset, snapshot.error) : null;
  const shown = storeText !== '' && !error ? result : null;

  const setText = (text: string) => {
    setDraft(text);
    store.set('text', text);
  };

  return {
    draft,
    setText,
    kind: rootKind(draft),
    options,
    setOption: (key: string, value: string | boolean) => store.set(key, value),
    bom,
    setBom,
    result: shown,
    error,
    csv: shown?.text ?? '',
    ...useJsonToCsvActions({ preset, store, notify, csv: shown?.text ?? '', bom, setText }),
  };
}

interface ActionArgs {
  preset: ResolvedPreset;
  store: ToolStore;
  notify: (msg: string) => void;
  csv: string;
  bom: boolean;
  setText: (text: string) => void;
}

function readClipboard(a: ActionArgs) {
  return async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        a.setText(text);
        a.notify('Pasted from clipboard');
        return;
      }
    } catch {
      // Clipboard read is blocked; fall through to the hint.
    }
    a.notify('Use Ctrl+V or Cmd+V to paste');
  };
}

function useJsonToCsvActions(a: ActionArgs) {
  const fileName = a.preset.ui.outputFileName ?? 'data.csv';
  return {
    async copy() {
      if (!a.csv) return;
      a.notify((await copyText(a.csv)) ? 'CSV copied to clipboard.' : 'Copy failed');
    },
    download() {
      if (!a.csv) return;
      downloadText(a.bom ? `${UTF8_BOM}${a.csv}` : a.csv, fileName, 'text/csv');
      a.notify(`Downloaded ${fileName}`);
    },
    paste: readClipboard(a),
    loadFile(file: File) {
      const reader = new FileReader();
      reader.onload = () => {
        a.setText(typeof reader.result === 'string' ? reader.result : '');
        a.notify(`Loaded ${file.name}`);
      };
      reader.readAsText(file);
    },
    loadSample(id: string = FIRST_SAMPLE_ID) {
      a.store.setMany(sampleValues(a.preset, id));
      a.notify('Sample JSON loaded');
    },
    clearAll() {
      a.setText('');
      a.notify('Cleared');
    },
    resetAll() {
      a.store.reset();
      a.store.setMany(sampleValues(a.preset, FIRST_SAMPLE_ID));
      a.notify('Reset to the sample and default options');
    },
    convert: () => a.store.runNow(),
  };
}

export type JsonToCsvStudio = ReturnType<typeof useJsonToCsvStudio>;
