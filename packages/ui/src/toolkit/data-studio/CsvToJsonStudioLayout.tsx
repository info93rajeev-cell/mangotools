import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { CsvToJsonAuxCards } from './CsvToJsonAuxCards.tsx';
import styles from './dataStudio.module.css';
import { type MobileViewMode, MobileViewSwitcher } from './MobileViewSwitcher.tsx';
import { useCsvToJsonStudio } from './useCsvToJsonStudio.ts';

export interface CsvToJsonStudioLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

function CsvInputPanel({
  idPrefix,
  input,
  parsed,
  onReset,
  onInput,
}: {
  idPrefix: string;
  input: string;
  parsed: { headers: string[]; rows: string[][]; delimiter: string };
  onReset: () => void;
  onInput: (v: string) => void;
}) {
  return (
    <section class={`${styles.panel} ${styles.inputPanel}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#8862;</span>
          <strong>Input CSV / TSV</strong>
        </div>
        <div class={styles.toolactions}>
          <button
            type="button"
            class={styles.sampleMiniBtn}
            data-try-sample=""
            onClick={onReset}
            title="Load sample CSV"
          >
            ✨ Try sample
          </button>
        </div>
      </div>
      <div class={styles.editorWrapper} style={{ flex: '1 1 50%' }}>
        <textarea
          id={`${idPrefix}-input`}
          class={styles.editor}
          value={input}
          onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Paste CSV text here..."
          spellcheck={false}
        />
      </div>
      <div class={styles.tablewrap} style={{ flex: '1 1 50%' }}>
        <table class={styles.dataTable}>
          <thead>
            <tr>
              {parsed.headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {parsed.headers.map((_, cIdx) => (
                  <td key={cIdx}>{row[cIdx] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div class={styles.noteLine}>
        <span>
          {parsed.delimiter === '\t' ? 'Tab (\\t)' : parsed.delimiter} detected &middot; UTF-8
        </span>
        <span>{parsed.rows.length} data rows</span>
      </div>
    </section>
  );
}

function CsvOutputPanel({
  idPrefix,
  outputJson,
  formatShape,
  minified,
  rowsCount,
  onMinified,
  onCopy,
  onDownload,
}: {
  idPrefix: string;
  outputJson: string;
  formatShape: string;
  minified: boolean;
  rowsCount: number;
  onMinified: (m: boolean) => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <section class={`${styles.panel} ${styles.outputPanel}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#123;&#125;</span>
          <strong>JSON Output</strong>
        </div>
        <div class={styles.toolactions}>
          <div class={styles.rowchips}>
            <button
              type="button"
              class={`${styles.chip} ${!minified ? styles.chipBlue : styles.chipAmber}`}
              onClick={() => onMinified(false)}
            >
              Formatted
            </button>
            <button
              type="button"
              class={`${styles.chip} ${minified ? styles.chipPurple : styles.chipAmber}`}
              onClick={() => onMinified(true)}
            >
              Minified
            </button>
          </div>
          <button type="button" class={styles.btnSecondary} onClick={onCopy}>
            Copy
          </button>
          <button type="button" class={styles.btnSecondary} onClick={onDownload}>
            Download .json
          </button>
        </div>
      </div>
      <div class={styles.rowchips}>
        <span class={styles.chipBlue}>
          {formatShape === 'objects' ? 'Array of objects' : '2D Array'}
        </span>
        <span class={styles.chipGreen}>Values as strings</span>
      </div>
      <div class={styles.editorWrapper}>
        <textarea
          id={`${idPrefix}-output`}
          class={styles.editor}
          value={outputJson}
          readOnly
          spellcheck={false}
        />
      </div>
      <div class={styles.noteLine}>
        <span class={styles.noteLineGreen}>&#10003; {rowsCount} records converted</span>
        <span>All source fields retained</span>
      </div>
    </section>
  );
}

function CsvSidePanel({
  parsed,
}: {
  parsed: { headers: string[]; rows: string[][]; delimiter: string };
}) {
  return (
    <div class={`${styles.side} ${styles.sidePanel}`}>
      <section class={`${styles.panel} ${styles.sideTopCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#10003;</span>Import Health
        </div>
        <div class={styles.badgeOk}>
          <span>&#10004;</span>
          <strong>CSV parsed successfully</strong>
        </div>
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Rows</small>
            <b>{parsed.rows.length}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniPurple}`}>
            <small>Columns</small>
            <b>{parsed.headers.length}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniGreen}`}>
            <small>Parse errors</small>
            <b>0</b>
          </div>
          <div class={`${styles.mini} ${styles.miniAmber}`}>
            <small>Delimiter</small>
            <b>{parsed.delimiter === '\t' ? '\\t' : parsed.delimiter}</b>
          </div>
        </div>
      </section>

      <section class={`${styles.panel} ${styles.sideBottomCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#9881;</span>Columns &amp; Types
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 110 }}>
          {parsed.headers.map((h, i) => (
            <div key={h} class={styles.kv}>
              <span>{h}</span>
              <b>string {parsed.rows[0]?.[i] ? `• ${parsed.rows[0][i]}` : ''}</b>
            </div>
          ))}
        </div>
        <div class={styles.optHelptext}>Type conversion is opt-in &middot; Strings preserved.</div>
      </section>
    </div>
  );
}

function CsvStatusBar({
  onCopy,
  onDownload,
  onReset,
  notify,
}: {
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
        <button type="button" class={styles.btnGold} onClick={onCopy}>
          Convert to JSON
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

export function CsvToJsonStudioLayout({
  idPrefix,
  snapshot,
  store,
  notify,
}: CsvToJsonStudioLayoutProps) {
  const [mobileView, setMobileView] = useState<MobileViewMode>('split');
  const {
    input,
    handleInput,
    delimiterChoice,
    setDelimiterChoice,
    formatShape,
    setFormatShape,
    minified,
    setMinified,
    parsed,
    outputJson,
    handleCopy,
    handleDownload,
    handleReset,
  } = useCsvToJsonStudio(snapshot, store, notify);

  return (
    <div class={styles.container} data-csv-to-json-studio-layout="">
      <MobileViewSwitcher activeView={mobileView} onChange={setMobileView} />
      <div class={styles.work} data-mobile-view={mobileView}>
        <CsvInputPanel
          idPrefix={idPrefix}
          input={input}
          parsed={parsed}
          onReset={handleReset}
          onInput={handleInput}
        />
        <CsvOutputPanel
          idPrefix={idPrefix}
          outputJson={outputJson}
          formatShape={formatShape}
          minified={minified}
          rowsCount={parsed.rows.length}
          onMinified={setMinified}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
        <CsvSidePanel parsed={parsed} />
      </div>

      <CsvToJsonAuxCards
        delimiterChoice={delimiterChoice}
        onDelimiter={setDelimiterChoice}
        formatShape={formatShape}
        onFormatShape={setFormatShape}
      />

      <CsvStatusBar
        onCopy={handleCopy}
        onDownload={handleDownload}
        onReset={handleReset}
        notify={notify}
      />
    </div>
  );
}
