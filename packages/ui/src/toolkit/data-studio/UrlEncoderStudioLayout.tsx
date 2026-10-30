import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef, useState } from 'preact/hooks';
import { DataStudioStatusBar } from './DataStudioStatusBar.tsx';
import styles from './dataStudio.module.css';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
import { UrlEncoderAuxCards } from './UrlEncoderAuxCards.tsx';
import { DEFAULT_URL, useUrlEncoderStudio } from './useUrlEncoderStudio.ts';

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
  onSample,
  onOpenFile,
  onPaste,
  onClear,
}: {
  idPrefix: string;
  input: string;
  direction: 'encode' | 'decode';
  mode: 'component' | 'full-url' | 'form';
  onDirection: (d: 'encode' | 'decode') => void;
  onMode: (m: 'component' | 'full-url' | 'form') => void;
  onInput: (v: string) => void;
  onSample: () => void;
  onOpenFile: (e: Event) => void;
  onPaste: () => void;
  onClear: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section class={`${styles.panel} ${styles.inputPanel}`}>
      <input
        ref={fileInputRef}
        type="file"
        class={styles.hiddenFileInput}
        onChange={onOpenFile}
        tabIndex={-1}
      />
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128279;</span>
          <strong>Input Text / URL</strong>
        </div>
        <div class={styles.toolactions}>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={onSample}
            data-try-sample=""
            title="Load sample URL"
          >
            ✨ Try sample
          </button>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={() => fileInputRef.current?.click()}
            title="Open file"
          >
            &#128194; Open File
          </button>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={onPaste}
            title="Paste from clipboard"
          >
            &#128203; Paste
          </button>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={onClear}
            title="Clear input text"
          >
            Clear
          </button>
        </div>
      </div>
      <div class={styles.rowchips}>
        <button
          type="button"
          class={`${styles.chip} ${direction === 'encode' ? styles.chipBlue : styles.chipAmber}`}
          onClick={() => onDirection('encode')}
        >
          Encode
        </button>
        <button
          type="button"
          class={`${styles.chip} ${direction === 'decode' ? styles.chipPurple : styles.chipAmber}`}
          onClick={() => onDirection('decode')}
        >
          Decode
        </button>
        <button
          type="button"
          class={`${styles.chip} ${mode === 'component' ? styles.chipGreen : styles.chipAmber}`}
          onClick={() => onMode('component')}
        >
          Component
        </button>
        <button
          type="button"
          class={`${styles.chip} ${mode === 'form' ? styles.chipPurple : styles.chipAmber}`}
          onClick={() => onMode('form')}
        >
          Query / Form
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
            ? 'This example encodes a component; full URL parsing is a separate mode.'
            : mode === 'full-url'
              ? 'Full URL mode preserves protocol, domain, and path slashes.'
              : 'Form/query mode encodes spaces as + (application/x-www-form-urlencoded).'}
        </div>
      </div>
      <div class={styles.noteLine}>
        <span>UTF-8 &bull; Percent-encoding</span>
        <span>Literal + preserved in component mode</span>
      </div>
    </section>
  );
}

function UrlOutputPanel({
  mode,
  output,
  error,
  onSwap,
  onCopy,
  onDownload,
}: {
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
          <strong>Encoded Result</strong>
        </div>
        <div class={styles.toolactions}>
          <button type="button" class={styles.btnSecondary} onClick={onSwap} title="Swap fields">
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
      <div class={styles.bigoutput}>{error ? `Error: ${error}` : output}</div>
      <div class={styles.replacementChips}>
        <span class={styles.chipBlue}>Space &rarr; {mode === 'form' ? '+' : '%20'}</span>
        <span class={styles.chipPurple}>+ &rarr; %2B</span>
        <span class={styles.chipAmber}>/ &rarr; {mode === 'component' ? '%2F' : '/'}</span>
        <span class={styles.chipGreen}>Non-ASCII &rarr; UTF-8</span>
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
  onInspect,
}: {
  mode: string;
  error: string | null;
  parts: { scheme: string; host: string };
  queryParams: [string, string][];
  onInspect?: () => void;
}) {
  return (
    <div class={`${styles.side} ${styles.sidePanel}`}>
      <section class={`${styles.panel} ${styles.sideTopCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128202;</span>Encoding Summary
        </div>
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Mode</small>
            <b>{mode === 'component' ? 'Component' : mode === 'full-url' ? 'Full URL' : 'Form'}</b>
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
          Form/query mode may encode spaces as <b>+</b>; component mode uses <b>%20</b>.
        </div>
      </section>

      <section class={`${styles.panel} ${styles.sideBottomCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128065;</span>Sample URL Inspector
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
          <span>Query keys</span>
          <b>{queryParams.length}</b>
        </div>
        <div class={styles.kv}>
          <span>Fragment</span>
          <b>&mdash;</b>
        </div>
        <div class={styles.noteLine} style={{ marginTop: 4 }}>
          <button
            type="button"
            class={`${styles.chip} ${styles.chipBlue}`}
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={onInspect}
          >
            Open inspector
          </button>
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
  const [mobileView, setMobileView] = useState<StudioMobileView>('split');
  const studio = useUrlEncoderStudio(snapshot, store, notify);

  return (
    <div class={styles.container} data-mobile-view={mobileView}>
      <MobileViewSwitcher activeView={mobileView} onViewChange={setMobileView} />

      <main class={styles.work}>
        <UrlInputPanel
          idPrefix={idPrefix}
          input={studio.input}
          direction={studio.direction}
          mode={studio.mode}
          onDirection={studio.setDirection}
          onMode={studio.setMode}
          onInput={studio.handleInput}
          onSample={() => {
            studio.handleInput(DEFAULT_URL);
            notify('Sample URL loaded');
          }}
          onOpenFile={studio.handleOpenFile}
          onPaste={studio.handlePaste}
          onClear={studio.handleClear}
        />

        <UrlOutputPanel
          mode={studio.mode}
          output={studio.output}
          error={studio.error}
          onSwap={studio.handleSwap}
          onCopy={studio.handleCopy}
          onDownload={studio.handleDownload}
        />

        <UrlSidePanel
          mode={studio.mode}
          error={studio.error}
          parts={studio.parts}
          queryParams={studio.queryParams}
          onInspect={() => notify(`Inspecting ${studio.queryParams.length} query params`)}
        />
      </main>

      <UrlEncoderAuxCards
        mode={studio.mode}
        direction={studio.direction}
        onModeChange={(m, d) => {
          studio.setMode(m);
          if (d) studio.setDirection(d);
        }}
        queryParams={studio.queryParams}
      />

      <DataStudioStatusBar
        primaryLabel={studio.direction === 'encode' ? 'Encode URL' : 'Decode URL'}
        onPrimary={() => {
          notify(studio.direction === 'encode' ? 'URL Encoded' : 'URL Decoded');
        }}
        onCopy={studio.handleCopy}
        onDownload={studio.handleDownload}
        onReset={studio.handleReset}
        notify={notify}
      />
    </div>
  );
}
