import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import styles from './dataStudio.module.css';
import { type MobileViewMode, MobileViewSwitcher } from './MobileViewSwitcher.tsx';
import { UrlEncoderAuxCards } from './UrlEncoderAuxCards.tsx';
import { useUrlEncoderStudio } from './useUrlEncoderStudio.ts';

export interface UrlEncoderStudioLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

function UrlInputPanel({
  idPrefix,
  input,
  direction,
  mode,
  onDirection,
  onMode,
  onInput,
}: {
  idPrefix: string;
  input: string;
  direction: 'encode' | 'decode';
  mode: 'component' | 'full-url' | 'form';
  onDirection: (d: 'encode' | 'decode') => void;
  onMode: (m: 'component' | 'full-url' | 'form') => void;
  onInput: (v: string) => void;
}) {
  return (
    <section class={`${styles.panel} ${styles.inputPanel}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128279;</span>
          <strong>Input Text / URL</strong>
        </div>
        <div class={styles.toolactions}>
          <button
            type="button"
            class={styles.sampleMiniBtn}
            data-try-sample=""
            onClick={() =>
              onInput('https://api.example.com/search?q=beyond the ai&filter=developer & tools')
            }
            title="Load sample URL"
          >
            ✨ Try sample
          </button>
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
        <button
          type="button"
          class={`${styles.chip} ${mode === 'component' ? styles.chipBlue : styles.chipAmber}`}
          onClick={() => onMode('component')}
        >
          Component
        </button>
        <button
          type="button"
          class={`${styles.chip} ${mode === 'full-url' ? styles.chipPurple : styles.chipAmber}`}
          onClick={() => onMode('full-url')}
        >
          Full URL
        </button>
        <button
          type="button"
          class={`${styles.chip} ${mode === 'form' ? styles.chipGreen : styles.chipAmber}`}
          onClick={() => onMode('form')}
        >
          Form / Query
        </button>
      </div>
      <div class={styles.editorWrapper}>
        <textarea
          id={`${idPrefix}-input`}
          class={styles.editor}
          value={input}
          onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Paste URL or component string..."
          spellcheck={false}
        />
      </div>
      <div class={styles.callout}>
        <span>&#9432;</span>
        <div>
          {mode === 'component'
            ? 'Component mode percent-encodes all reserved delimiters including ? and &.'
            : mode === 'full-url'
              ? 'Full URL mode preserves protocol, domain, and path slashes.'
              : 'Form mode converts spaces to + (application/x-www-form-urlencoded).'}
        </div>
      </div>
      <div class={styles.noteLine}>
        <span>UTF-8 &middot; Percent-encoding</span>
        <span>{input.length} characters</span>
      </div>
    </section>
  );
}

function UrlOutputPanel({
  idPrefix,
  mode,
  output,
  error,
  onSwap,
  onCopy,
  onDownload,
}: {
  idPrefix: string;
  mode: 'component' | 'full-url' | 'form';
  output: string;
  error: string | null;
  onSwap: () => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <section class={`${styles.panel} ${styles.outputPanel}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128187;</span>
          <strong>Result</strong>
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
        <span class={styles.chipBlue}>Space → {mode === 'form' ? '+' : '%20'}</span>
        <span class={styles.chipPurple}>+ → %2B</span>
        <span class={styles.chipAmber}>/ → {mode === 'component' ? '%2F' : '/'}</span>
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
          <strong>{error ? error : `Valid percent-encoded ${mode}`}</strong>
        </div>
        <div class={styles.noteLine} style={{ marginTop: 6 }}>
          <span>Output: {output.length} characters</span>
          <span>Reversible: {error ? 'No' : 'Yes'}</span>
        </div>
      </div>
    </section>
  );
}

function UrlSidePanel({
  mode,
  error,
  parts,
  queryParams,
}: {
  mode: string;
  error: string | null;
  parts: { scheme: string; host: string };
  queryParams: [string, string][];
}) {
  return (
    <div class={`${styles.side} ${styles.sidePanel}`}>
      <section class={`${styles.panel} ${styles.sideTopCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128202;</span>Summary
        </div>
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Mode</small>
            <b>{mode}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniGreen}`}>
            <small>Charset</small>
            <b>UTF-8</b>
          </div>
          <div class={`${styles.mini} ${styles.miniPurple}`}>
            <small>Spaces</small>
            <b>{mode === 'form' ? '+' : '%20'}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniAmber}`}>
            <small>Errors</small>
            <b>{error ? 1 : 0}</b>
          </div>
        </div>
        <div class={styles.callout}>
          Form mode encodes spaces as <b>+</b>; component uses <b>%20</b>.
        </div>
      </section>

      <section class={`${styles.panel} ${styles.sideBottomCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128065;</span>URL Inspector
        </div>
        <div class={styles.kv}>
          <span>Scheme</span>
          <b>{parts.scheme}</b>
        </div>
        <div class={styles.kv}>
          <span>Host</span>
          <b>{parts.host}</b>
        </div>
        <div class={styles.kv}>
          <span>Query Keys</span>
          <b>{queryParams.length}</b>
        </div>
        <div class={styles.kv}>
          <span>Status</span>
          <b>{error ? 'Malformed' : 'Valid'}</b>
        </div>
      </section>
    </div>
  );
}

function UrlStatusBar({
  direction,
  onDirection,
  onCopy,
  onDownload,
  onReset,
  notify,
}: {
  direction: 'encode' | 'decode';
  onDirection: (fn: (d: 'encode' | 'decode') => 'encode' | 'decode') => void;
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
          onClick={() => onDirection((d) => (d === 'encode' ? 'encode' : 'decode'))}
        >
          {direction === 'encode' ? 'Encode URL' : 'Decode URL'}
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

export function UrlEncoderStudioLayout({
  idPrefix,
  snapshot,
  store,
  notify,
}: UrlEncoderStudioLayoutProps) {
  const [mobileView, setMobileView] = useState<MobileViewMode>('split');
  const {
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
  } = useUrlEncoderStudio(snapshot, store, notify);

  return (
    <div class={styles.container} data-url-encoder-studio-layout="">
      <MobileViewSwitcher activeView={mobileView} onChange={setMobileView} />
      <div class={styles.work} data-mobile-view={mobileView}>
        <UrlInputPanel
          idPrefix={idPrefix}
          input={input}
          direction={direction}
          mode={mode}
          onDirection={setDirection}
          onMode={setMode}
          onInput={handleInput}
        />
        <UrlOutputPanel
          idPrefix={idPrefix}
          mode={mode}
          output={output}
          error={error}
          onSwap={handleSwap}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
        <UrlSidePanel mode={mode} error={error} parts={parts} queryParams={queryParams} />
      </div>

      <UrlEncoderAuxCards mode={mode} onMode={setMode} queryParams={queryParams} />

      <UrlStatusBar
        direction={direction}
        onDirection={setDirection}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onReset={handleReset}
        notify={notify}
      />
    </div>
  );
}
