import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { copyText, downloadText } from '../actions.ts';

export const DEFAULT_TEXT = 'Hello, BeyondTheAI! 🌍\nData stays in your browser.';

export function encodeUtf8Base64(
  text: string,
  urlSafe: boolean,
  padding: boolean,
  wrap76: boolean,
): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let base64 = btoa(binary);
  if (urlSafe) base64 = base64.replace(/\+/g, '-').replace(/\//g, '_');
  if (!padding) base64 = base64.replace(/=+$/, '');
  if (wrap76) base64 = base64.match(/.{1,76}/g)?.join('\n') || base64;
  return base64;
}

export function decodeUtf8Base64(
  base64Input: string,
  urlSafe: boolean,
): { text: string; error: string | null } {
  let cleaned = base64Input.trim().replace(/\s+/g, '');
  if (urlSafe || cleaned.includes('-') || cleaned.includes('_')) {
    cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  }
  while (cleaned.length % 4 !== 0) cleaned += '=';
  try {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { text: decoded, error: null };
  } catch (err: unknown) {
    return {
      text: '',
      error: err instanceof Error ? err.message : 'Invalid Base64 or non-UTF-8 sequence',
    };
  }
}

function computeBase64(
  input: string,
  direction: 'encode' | 'decode',
  variant: 'standard' | 'url-safe',
  padding: boolean,
  lineWrap: 'none' | '76',
) {
  const bytes = new TextEncoder().encode(input);
  const sLen = bytes.length;
  if (direction === 'encode') {
    const enc = encodeUtf8Base64(input, variant === 'url-safe', padding, lineWrap === '76');
    const ratio = sLen > 0 ? (((enc.length - sLen) / sLen) * 100).toFixed(1) : '0';
    return {
      output: enc,
      error: null,
      sourceBytes: sLen,
      outputLength: enc.length,
      expansionRatio: `+${ratio}%`,
    };
  }
  const { text, error: decErr } = decodeUtf8Base64(input, variant === 'url-safe');
  return {
    output: text,
    error: decErr,
    sourceBytes: sLen,
    outputLength: text.length,
    expansionRatio: '-25.0%',
  };
}

export function useBase64Studio(
  snapshot: ToolSnapshot,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const initialText =
    typeof snapshot.values.text === 'string' && snapshot.values.text.trim().length > 0
      ? snapshot.values.text
      : DEFAULT_TEXT;
  const [input, setInput] = useState<string>(initialText);

  useEffect(() => {
    const val = snapshot.values.text;
    if (typeof val === 'string' && val.trim().length > 0 && val !== input) {
      setInput(val);
    }
  }, [snapshot.values.text]);

  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [variant, setVariant] = useState<'standard' | 'url-safe'>('standard');
  const [padding, setPadding] = useState<boolean>(true);
  const [lineWrap, setLineWrap] = useState<'none' | '76'>('none');

  const { output, error, sourceBytes, outputLength, expansionRatio } = useMemo(
    () => computeBase64(input, direction, variant, padding, lineWrap),
    [input, direction, variant, padding, lineWrap],
  );

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
    downloadText(output, direction === 'encode' ? 'encoded.b64' : 'decoded.txt', 'text/plain');
    notify('Downloaded file');
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
    setInput(DEFAULT_TEXT);
    store.set('text', DEFAULT_TEXT);
    setDirection('encode');
    notify('Reset to default sample');
  };

  return {
    input,
    handleInput,
    direction,
    setDirection,
    variant,
    setVariant,
    padding,
    setPadding,
    lineWrap,
    setLineWrap,
    output,
    error,
    sourceBytes,
    outputLength,
    expansionRatio,
    handleCopy,
    handleDownload,
    handleSwap,
    handleReset,
  };
}
