import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef, useState } from 'preact/hooks';
import { Base64AuxCards } from './Base64AuxCards.tsx';
import { DataStudioStatusBar } from './DataStudioStatusBar.tsx';
import styles from './dataStudio.module.css';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
import { DEFAULT_TEXT, useBase64Studio } from './useBase64Studio.ts';

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
  sourceBytes,
  onDirection,
  onInput,
  onSample,
  onOpenFile,
  onPaste,
  onClear,
}: {
  idPrefix: string;
  input: string;
  direction: 'encode' | 'decode';
  sourceBytes: number;
  onDirection: (d: 'encode' | 'decode') => void;
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
          <span class={styles.toolIcon}>&#60;&#47;&#62;</span>
          <strong>{direction === 'encode' ? 'Input Text' : 'Input Base64'}</strong>
        </div>
        <div class={styles.toolactions}>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={onSample}
            data-try-sample=""
            title="Load sample text"
          >
            ✨ Try sample
          </button>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={() => fileInputRef.current?.click()}
            title="Open text or binary file"
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
        <span class={styles.chipGreen}>Text</span>
        <button
          type="button"
          class={`${styles.chip} ${styles.chipAmber}`}
          style={{ border: 'none', cursor: 'pointer' }}
          onClick={() => fileInputRef.current?.click()}
        >
          File
        </button>
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
          {input.length} characters &middot; {sourceBytes} bytes
        </span>
      </div>
    </section>
  );
}

function Base64OutputPanel({
  direction,
  variant,
  output,
  error,
  sourceBytes,
  outputLength,
  onSwap,
  onCopy,
  onDownload,
}: {
  direction: 'encode' | 'decode';
  variant: 'standard' | 'url-safe';
  output: string;
  error: string | null;
  sourceBytes: number;
  outputLength: number;
  onSwap: () => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <section class={`${styles.panel} ${styles.outputPanel}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128274;</span>
          <strong>{direction === 'encode' ? 'Base64 Output' : 'Decoded Text'}</strong>
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
      <div class={styles.rowchips}>
        <span class={styles.chipBlue}>
          {variant === 'standard' ? 'Standard Base64' : 'Base64URL'}
        </span>
        <span class={styles.chipGreen}>{error ? 'Error' : 'Encoded ✓'}</span>
      </div>
      <div class={styles.bigoutput}>{error ? `Error: ${error}` : output}</div>

      <div class={styles.conversionRatioStrip}>
        <span>UTF-8 text</span> &rarr; <span>{sourceBytes} bytes</span> &rarr;{' '}
        <span>{outputLength} Base64 chars</span>
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
}: {
  sourceBytes: number;
  outputLength: number;
  expansionRatio: string;
  variant: 'standard' | 'url-safe';
  padding: boolean;
}) {
  return (
    <div class={`${styles.side} ${styles.sidePanel}`}>
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
            <small>Base64 chars</small>
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
          <span class={styles.toolIcon}>&#9881;</span>Binary / Text modes
        </div>
        <div class={styles.kv}>
          <span>Content type</span>
          <b>Text (UTF-8)</b>
        </div>
        <div class={styles.kv}>
          <span>Padding</span>
          <b>{padding ? '= enabled' : 'none'}</b>
        </div>
        <div class={styles.kv}>
          <span>File support</span>
          <b>Binary-safe</b>
        </div>
        <div class={styles.kv}>
          <span>Invalid input</span>
          <b>Report error</b>
        </div>
      </section>
    </div>
  );
}

export function Base64StudioLayout({ idPrefix, snapshot, store, notify }: Base64StudioLayoutProps) {
  const [mobileView, setMobileView] = useState<StudioMobileView>('split');
  const studio = useBase64Studio(snapshot, store, notify);

  return (
    <div class={styles.container} data-mobile-view={mobileView}>
      <MobileViewSwitcher activeView={mobileView} onViewChange={setMobileView} />

      <main class={styles.work}>
        <Base64InputPanel
          idPrefix={idPrefix}
          input={studio.input}
          direction={studio.direction}
          sourceBytes={studio.sourceBytes}
          onDirection={studio.setDirection}
          onInput={studio.handleInput}
          onSample={() => {
            studio.handleInput(DEFAULT_TEXT);
            studio.setDirection('encode');
            notify('Sample text loaded');
          }}
          onOpenFile={studio.handleOpenFile}
          onPaste={studio.handlePaste}
          onClear={studio.handleClear}
        />

        <Base64OutputPanel
          direction={studio.direction}
          variant={studio.variant}
          output={studio.output}
          error={studio.error}
          sourceBytes={studio.sourceBytes}
          outputLength={studio.outputLength}
          onSwap={studio.handleSwap}
          onCopy={studio.handleCopy}
          onDownload={studio.handleDownload}
        />

        <Base64SidePanel
          sourceBytes={studio.sourceBytes}
          outputLength={studio.outputLength}
          expansionRatio={studio.expansionRatio}
          variant={studio.variant}
          padding={studio.padding}
        />
      </main>

      <Base64AuxCards
        variant={studio.variant}
        onVariant={studio.setVariant}
        padding={studio.padding}
        onPadding={studio.setPadding}
        lineWrap={studio.lineWrap}
        onLineWrap={studio.setLineWrap}
        onOpenFile={studio.handleOpenFile}
      />

      <DataStudioStatusBar
        primaryLabel={studio.direction === 'encode' ? 'Encode to Base64' : 'Decode Base64'}
        onPrimary={() => {
          if (studio.direction === 'encode') {
            notify('Encoded to Base64');
          } else {
            notify('Decoded from Base64');
          }
        }}
        onCopy={studio.handleCopy}
        onDownload={studio.handleDownload}
        onReset={studio.handleReset}
        notify={notify}
      />
    </div>
  );
}
