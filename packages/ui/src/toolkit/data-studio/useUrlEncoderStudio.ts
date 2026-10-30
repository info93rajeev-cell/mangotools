import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { copyText, downloadText } from '../actions.ts';

export const DEFAULT_URL = 'Hello world + Delhi/भारत?tag=tools&lang=en';

export function processUrlTransform(
  input: string,
  direction: 'encode' | 'decode',
  mode: 'component' | 'full-url' | 'form',
): { output: string; error: string | null } {
  try {
    if (direction === 'encode') {
      if (mode === 'component') return { output: encodeURIComponent(input), error: null };
      if (mode === 'full-url') return { output: encodeURI(input), error: null };
      return { output: encodeURIComponent(input).replace(/%20/g, '+'), error: null };
    }
    const toDecode = mode === 'form' ? input.replace(/\+/g, ' ') : input;
    return { output: decodeURIComponent(toDecode), error: null };
  } catch (e: unknown) {
    return { output: '', error: e instanceof Error ? e.message : 'URI malformed' };
  }
}

export function inspectUrl(input: string): {
  params: [string, string][];
  parts: { scheme: string; host: string };
} {
  const params: [string, string][] = [];
  let parts = { scheme: 'https', host: 'custom text' };
  try {
    const candidate = input.startsWith('http')
      ? input
      : `https://example.com/${input.startsWith('/') ? input.slice(1) : input}`;
    const url = new URL(candidate);
    parts = { scheme: url.protocol.replace(':', ''), host: url.hostname || 'example.com' };
    url.searchParams.forEach((val, key) => {
      params.push([key, val]);
    });
  } catch {
    // Ignore non-URL strings
  }
  return { params, parts };
}

function createUrlHandlers(
  state: { output: string; error: string | null },
  setInput: (v: string) => void,
  setDirection: (fn: (d: 'encode' | 'decode') => 'encode' | 'decode') => void,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const handleCopy = async () => {
    if (!state.output) return;
    const ok = await copyText(state.output);
    notify(ok ? 'Copied to clipboard!' : 'Failed to copy');
  };

  const handleDownload = () => {
    if (!state.output) return;
    downloadText(state.output, 'url-encoded.txt', 'text/plain');
    notify('Downloaded url-encoded.txt');
  };

  const handleSwap = () => {
    if (state.output && !state.error) {
      setInput(state.output);
      store.set('text', state.output);
      setDirection((d) => (d === 'encode' ? 'decode' : 'encode'));
      notify('Swapped Input and Output');
    }
  };

  const handleReset = () => {
    setInput(DEFAULT_URL);
    store.set('text', DEFAULT_URL);
    setDirection(() => 'encode');
    notify('Reset to default URL');
  };

  const handleClear = () => {
    setInput('');
    store.set('text', '');
    notify('Cleared input');
  };

  const handlePaste = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInput(text);
          store.set('text', text);
          notify('Pasted from clipboard');
          return;
        }
      } catch {
        // Fallback
      }
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
      setInput(content);
      store.set('text', content);
      notify(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    target.value = '';
  };

  return {
    handleCopy,
    handleDownload,
    handleSwap,
    handleReset,
    handleClear,
    handlePaste,
    handleOpenFile,
  };
}

export function useUrlEncoderStudio(
  snapshot: ToolSnapshot,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const initialText =
    typeof snapshot.values.text === 'string' && snapshot.values.text.trim().length > 0
      ? snapshot.values.text
      : DEFAULT_URL;
  const [input, setInput] = useState<string>(initialText);

  useEffect(() => {
    const val = snapshot.values.text;
    if (typeof val === 'string' && val.trim().length > 0 && val !== input) {
      setInput(val);
    }
  }, [snapshot.values.text]);

  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [mode, setMode] = useState<'component' | 'full-url' | 'form'>('component');

  const { output, error } = useMemo(
    () => processUrlTransform(input, direction, mode),
    [input, direction, mode],
  );
  const { params: queryParams, parts } = useMemo(() => inspectUrl(input), [input]);

  const handleInput = (v: string) => {
    setInput(v);
    store.set('text', v);
  };

  const handlers = createUrlHandlers({ output, error }, setInput, setDirection, store, notify);

  return {
    input,
    handleInput,
    direction,
    setDirection,
    mode,
    setMode,
    output,
    error,
    queryParams,
    parts,
    ...handlers,
  };
}
