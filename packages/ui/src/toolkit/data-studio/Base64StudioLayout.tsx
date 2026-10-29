import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './dataStudio.module.css';
import { useBase64Studio } from './useBase64Studio.ts';

export interface Base64StudioLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

function Base64InputPanel({
  idPrefix,
  input,
  direction,
  variant,
  sourceBytes,
  onDirection,
  onInput,
}: {
  idPrefix: string;
  input: string;
  direction: 'encode' | 'decode';
  variant: 'standard' | 'url-safe';
  sourceBytes: number;
  onDirection: (d: 'encode' | 'decode') => void;
  onInput: (v: string) => void;
}) {
  return (
    <section class={styles.panel}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#60;&#47;&#62;</span>
          <strong>{direction === 'encode' ? 'Input Text' : 'Input Base64'}</strong>
        </div>
        <div class={styles.toolactions}>
          <button
            type="button"
            class={direction === 'encode' ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => onDirection('encode')}
          >
            Encode
          </button>
          <button
            type="button"
            class={direction === 'decode' ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => onDirection('decode')}
          >
            Decode
          </button>
        </div>
      </div>
      <div class={styles.rowchips}>
        <span
          class={`${styles.chip} ${direction === 'encode' ? styles.chipBlue : styles.chipPurple}`}
        >
          {direction === 'encode' ? 'Mode: Encode' : 'Mode: Decode'}
        </span>
        <span class={styles.chipGreen}>UTF-8</span>
        <span class={styles.chipAmber}>
          {variant === 'standard' ? 'Standard RFC 4648' : 'Base64URL'}
        </span>
      </div>
      <div class={styles.editorWrapper}>
        <textarea
          id={`${idPrefix}-input`}
          class={styles.editor}
          value={input}
          onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
          placeholder={
            direction === 'encode'
              ? 'Type or paste text to encode...'
              : 'Paste Base64 string to decode...'
          }
          spellcheck={false}
        />
      </div>
      <div class={styles.noteLine}>
        <span>UTF-8 Unicode source</span>
        <span>
          {input.length} chars &middot; {sourceBytes} bytes
        </span>
      </div>
    </section>
  );
}

function Base64OutputPanel({
  idPrefix,
  direction,
  variant,
  output,
  error,
  outputLength,
  onSwap,
  onCopy,
  onDownload,
}: {
  idPrefix: string;
  direction: 'encode' | 'decode';
  variant: 'standard' | 'url-safe';
  output: string;
  error: string | null;
  outputLength: number;
  onSwap: () => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <section class={styles.panel}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128274;</span>
          <strong>{direction === 'encode' ? 'Base64 Output' : 'Decoded Text'}</strong>
        </div>
        <div class={styles.toolactions}>
          <button type="button" class={styles.btnSecondary} onClick={onSwap}>
            Swap &#8644;
          </button>
          <button type="button" class={styles.btnSecondary} onClick={onCopy}>
            Copy
          </button>
          <button type="button" class={styles.btnSecondary} onClick={onDownload}>
            Download
          </button>
        </div>
      </div>
      <div class={styles.rowchips}>
        <span class={styles.chipBlue}>
          {variant === 'standard' ? 'Standard Base64' : 'URL-safe'}
        </span>
        <span class={styles.chipGreen}>{error ? 'Error' : 'Processed ✓'}</span>
      </div>
      <div class={styles.editorWrapper}>
        <textarea
          id={`${idPrefix}-output`}
          class={styles.editor}
          value={error ? `Error: ${error}` : output}
          readOnly
          spellcheck={false}
        />
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div class={error ? styles.badgeErr : styles.badgeOk}>
          <span>{error ? '⚠' : '✓'}</span>
          <strong>
            {error
              ? error
              : `${direction === 'encode' ? 'Encoding' : 'Decoding'} completed · reversible text`}
          </strong>
        </div>
        <div class={styles.noteLine} style={{ marginTop: 6 }}>
          <span>{direction === 'encode' ? 'UTF-8 → Base64' : 'Base64 → UTF-8'}</span>
          <span>{outputLength} characters</span>
        </div>
      </div>
    </section>
  );
}

function Base64SidePanel({
  sourceBytes,
  outputLength,
  expansionRatio,
  variant,
  padding,
  lineWrap,
}: {
  sourceBytes: number;
  outputLength: number;
  expansionRatio: string;
  variant: 'standard' | 'url-safe';
  padding: boolean;
  lineWrap: 'none' | '76';
}) {
  return (
    <div class={styles.side}>
      <section class={`${styles.panel} ${styles.sideTopCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128202;</span>Transfer Summary
        </div>
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Source bytes</small>
            <b>{sourceBytes}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniPurple}`}>
            <small>Output chars</small>
            <b>{outputLength}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniAmber}`}>
            <small>Expansion</small>
            <b>{expansionRatio}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniGreen}`}>
            <small>Alphabet</small>
            <b>{variant === 'standard' ? 'Standard' : 'URL-Safe'}</b>
          </div>
        </div>
        <div class={styles.callout}>
          <span>&#9432;</span>
          <div>
            Base64 is <b>encoding, not encryption</b>.
          </div>
        </div>
      </section>

      <section class={`${styles.panel} ${styles.sideBottomCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#9881;</span>Binary / Text Modes
        </div>
        <div class={styles.kv}>
          <span>Content Type</span>
          <b>Text (UTF-8)</b>
        </div>
        <div class={styles.kv}>
          <span>Padding</span>
          <b>{padding ? '= enabled' : 'no padding'}</b>
        </div>
        <div class={styles.kv}>
          <span>Line Wrap</span>
          <b>{lineWrap === '76' ? '76 (MIME)' : 'None'}</b>
        </div>
        <div class={styles.kv}>
          <span>Reversible</span>
          <b>100% Client-side</b>
        </div>
      </section>
    </div>
  );
}

function Base64AuxCards({
  variant,
  onVariant,
  padding,
  onPadding,
  lineWrap,
  onLineWrap,
}: {
  variant: 'standard' | 'url-safe';
  onVariant: (v: 'standard' | 'url-safe') => void;
  padding: boolean;
  onPadding: (p: boolean) => void;
  lineWrap: 'none' | '76';
  onLineWrap: (w: 'none' | '76') => void;
}) {
  return (
    <div class={styles.aux}>
      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9881;</span>Base64 Variant
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Alphabet</span>
          <select
            class={styles.optSelect}
            value={variant}
            onChange={(e) =>
              onVariant((e.target as HTMLSelectElement).value as 'standard' | 'url-safe')
            }
          >
            <option value="standard">Standard (RFC 4648)</option>
            <option value="url-safe">URL-safe (RFC 4648 §5)</option>
          </select>
        </label>
        <div class={styles.optCheckboxRow}>
          <label class={styles.optCheckbox}>
            <input
              type="checkbox"
              checked={padding}
              onChange={(e) => onPadding((e.target as HTMLInputElement).checked)}
            />
            Keep padding (=)
          </label>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128196;</span>Text &amp; Encoding
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Character set</span>
          <select class={styles.optSelect} disabled value="utf8">
            <option value="utf8">UTF-8 Unicode</option>
          </select>
        </label>
        <div class={styles.optHelptext}>
          Emoji and international scripts preserved without loss.
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9889;</span>Line Formatting
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Line wrapping</span>
          <select
            class={styles.optSelect}
            value={lineWrap}
            onChange={(e) => onLineWrap((e.target as HTMLSelectElement).value as 'none' | '76')}
          >
            <option value="none">None (Single line)</option>
            <option value="76">76 characters (MIME)</option>
          </select>
        </label>
        <div class={styles.optHelptext}>MIME &middot; Data URI &middot; Whitespace policy</div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128737;</span>Safety &amp; Diagnostics
        </div>
        <div class={styles.optHelptext}>
          Invalid alphabet, padding and UTF-8 decoding errors are reported distinctly. No network
          upload.
        </div>
      </section>
    </div>
  );
}

function Base64StatusBar({
  direction,
  onDirection,
  onCopy,
  onDownload,
  onReset,
  notify,
}: {
  direction: 'encode' | 'decode';
  onDirection: (d: 'encode' | 'decode') => void;
  onCopy: () => void;
  onDownload: () => void;
  onReset: () => void;
  notify: (msg: string) => void;
}) {
  return (
    <div class={styles.statusBar}>
      <button
        type="button"
        class={styles.btnSecondary}
        onClick={() => notify('Local browser-safe processing')}
      >
        &#9432; Runs on your device &middot; Browser-local
      </button>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          class={styles.btnGold}
          onClick={() => onDirection(direction === 'encode' ? 'encode' : 'decode')}
        >
          {direction === 'encode' ? 'Encode to Base64' : 'Decode from Base64'}
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onCopy}>
          Copy result
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onDownload}>
          Download
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

interface Base64WorkGridProps {
  idPrefix: string;
  state: ReturnType<typeof useBase64Studio>;
}

function Base64WorkGrid({ idPrefix, state }: Base64WorkGridProps) {
  return (
    <div class={styles.work}>
      <Base64InputPanel
        idPrefix={idPrefix}
        input={state.input}
        direction={state.direction}
        variant={state.variant}
        sourceBytes={state.sourceBytes}
        onDirection={state.setDirection}
        onInput={state.handleInput}
      />
      <Base64OutputPanel
        idPrefix={idPrefix}
        direction={state.direction}
        variant={state.variant}
        output={state.output}
        error={state.error}
        outputLength={state.outputLength}
        onSwap={state.handleSwap}
        onCopy={state.handleCopy}
        onDownload={state.handleDownload}
      />
      <Base64SidePanel
        sourceBytes={state.sourceBytes}
        outputLength={state.outputLength}
        expansionRatio={state.expansionRatio}
        variant={state.variant}
        padding={state.padding}
        lineWrap={state.lineWrap}
      />
    </div>
  );
}

export function Base64StudioLayout({ idPrefix, snapshot, store, notify }: Base64StudioLayoutProps) {
  const state = useBase64Studio(snapshot, store, notify);

  return (
    <div class={styles.container} data-base64-studio-layout="">
      <Base64WorkGrid idPrefix={idPrefix} state={state} />
      <Base64AuxCards
        variant={state.variant}
        onVariant={state.setVariant}
        padding={state.padding}
        onPadding={state.setPadding}
        lineWrap={state.lineWrap}
        onLineWrap={state.setLineWrap}
      />
      <Base64StatusBar
        direction={state.direction}
        onDirection={state.setDirection}
        onCopy={state.handleCopy}
        onDownload={state.handleDownload}
        onReset={state.handleReset}
        notify={notify}
      />
    </div>
  );
}
