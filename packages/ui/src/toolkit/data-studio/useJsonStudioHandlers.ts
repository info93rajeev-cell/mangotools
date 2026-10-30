import type { ToolStore } from '@mangotools/runtime';
import { copyText, downloadText } from '../actions.ts';
import { DEFAULT_JSON, JSON_PRESET_EXAMPLES, type ParseResult } from './useJsonFormatterStudio.ts';

async function readClipboardText(autoFormat: boolean): Promise<string | null> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) return null;
  try {
    let text = await navigator.clipboard.readText();
    if (text && autoFormat) {
      try {
        text = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // preserve raw
      }
    }
    return text;
  } catch {
    return null;
  }
}

export function useJsonStudioHandlers(
  _input: string,
  setInput: (v: string) => void,
  store: ToolStore,
  notify: (msg: string) => void,
  parsedResult: ParseResult,
  outputFormatted: string,
  activeTab: 'tree' | 'table' | 'raw',
  autoFormatOnPaste: boolean,
) {
  const handleInput = (val: string) => {
    setInput(val);
    store.set('text', val);
  };

  const handleCopy = async () => {
    const text = activeTab === 'raw' ? outputFormatted : JSON.stringify(parsedResult.data, null, 2);
    if (!text) return;
    const ok = await copyText(text);
    notify(ok ? 'JSON copied to clipboard!' : 'Failed to copy');
  };

  const handleDownload = () => {
    if (!outputFormatted) return;
    downloadText(outputFormatted, 'formatted.json', 'application/json');
    notify('Downloaded formatted.json');
  };

  const handleReset = () => {
    setInput(DEFAULT_JSON);
    store.set('text', DEFAULT_JSON);
    notify('Reset to default sample JSON');
  };

  const handleClearAll = () => {
    setInput('');
    store.set('text', '');
    notify('Cleared all JSON input');
  };

  const handleLoadSample = (sampleKey = 'user') => {
    const sample = JSON_PRESET_EXAMPLES[sampleKey] || DEFAULT_JSON;
    setInput(sample);
    store.set('text', sample);
    notify(`Loaded ${sampleKey === 'user' ? 'Sample JSON' : `${sampleKey} example`}`);
  };

  const handlePaste = async () => {
    const text = await readClipboardText(autoFormatOnPaste);
    if (text) {
      handleInput(text);
      notify('Pasted from clipboard');
      return;
    }
    notify('Use Ctrl+V or Cmd+V to paste');
  };

  const handleOpenFile = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      handleInput(content);
      notify(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    target.value = '';
  };

  return {
    handleInput,
    handleCopy,
    handleDownload,
    handleReset,
    handleClearAll,
    handleLoadSample,
    handlePaste,
    handleOpenFile,
  };
}
