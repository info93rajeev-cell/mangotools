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

  const handleCopy = async () => {
    if (!output) return;
    const ok = await copyText(output);
    notify(ok ? 'Copied to clipboard!' : 'Failed to copy');
  };

  const handleDownload = () => {
    if (!output) return;
    downloadText(output, 'url-encoded.txt', 'text/plain');
    notify('Downloaded url-encoded.txt');
  };

  const handleSwap = () => {
    if (output && !error) {
      setInput(output);
      store.set('text', output);
      setDirection((d) => (d === 'encode' ? 'decode' : 'encode'));
      notify('Swapped Input and Output');
    }
  };

  const handleReset = () => {
    setInput(DEFAULT_URL);
    store.set('text', DEFAULT_URL);
    setDirection('encode');
    notify('Reset to default URL');
  };

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
    handleCopy,
    handleDownload,
    handleSwap,
    handleReset,
  };
}
