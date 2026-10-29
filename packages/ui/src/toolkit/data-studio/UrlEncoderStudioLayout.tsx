import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './dataStudio.module.css';
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
    <section class={styles.panel}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128279;</span>
          <strong>Input Text / URL</strong>
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
    <section class={styles.panel}>
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
    <div class={styles.side}>
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

function UrlAuxCards({
  mode,
  onMode,
  queryParams,
}: {
  mode: 'component' | 'full-url' | 'form';
  onMode: (m: 'component' | 'full-url' | 'form') => void;
  queryParams: [string, string][];
}) {
  return (
    <div class={styles.aux}>
      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9881;</span>Mode
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Operation Mode</span>
          <select
            class={styles.optSelect}
            value={mode}
            onChange={(e) =>
              onMode((e.target as HTMLSelectElement).value as 'component' | 'full-url' | 'form')
            }
          >
            <option value="component">Component (encodeURIComponent)</option>
            <option value="full-url">Full URL (encodeURI)</option>
            <option value="form">Form Data (spaces as +)</option>
          </select>
        </label>
        <div class={styles.optCheckboxRow}>
          <span class={styles.chipGreen}>UTF-8 Safe</span>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9776;</span>Query Params ({queryParams.length})
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 85 }}>
          {queryParams.length > 0 ? (
            queryParams.map(([k, v]) => (
              <div key={k} class={styles.kv}>
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))
          ) : (
            <div class={styles.optHelptext}>No ?key=val parameters detected in text.</div>
          )}
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9889;</span>Rules
        </div>
        <div class={styles.rowchips}>
          <span class={styles.chipBlue}>%20 &bull; space</span>
          <span class={styles.chipPurple}>%2B &bull; +</span>
          <span class={styles.chipAmber}>%26 &bull; &amp;</span>
        </div>
        <div class={styles.optHelptext} style={{ marginTop: 4 }}>
          RFC 3986 standard escapes.
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128737;</span>Diagnostics
        </div>
        <div class={styles.optHelptext}>
          Malformed % sequences and invalid UTF-8 report clear errors.
        </div>
      </section>
    </div>
  );
}

export function UrlEncoderStudioLayout({
  idPrefix,
  snapshot,
  store,
  notify,
}: UrlEncoderStudioLayoutProps) {
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
      <div class={styles.work}>
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

      <UrlAuxCards mode={mode} onMode={setMode} queryParams={queryParams} />

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
            onClick={() => setDirection((d) => (d === 'encode' ? 'encode' : 'decode'))}
          >
            {direction === 'encode' ? 'Encode URL' : 'Decode URL'}
          </button>
          <button type="button" class={styles.btnSecondary} onClick={handleCopy}>
            Copy result
          </button>
          <button type="button" class={styles.btnSecondary} onClick={handleDownload}>
            Download
          </button>
          <button type="button" class={styles.btnSecondary} onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
