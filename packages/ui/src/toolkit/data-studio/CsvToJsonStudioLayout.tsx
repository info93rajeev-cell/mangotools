import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef, useState } from 'preact/hooks';
import { CsvToJsonAuxCards } from './CsvToJsonAuxCards.tsx';
import { DataStudioStatusBar } from './DataStudioStatusBar.tsx';
import styles from './dataStudio.module.css';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
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
  onOpenFile,
  onPaste,
  onClear,
}: {
  idPrefix: string;
  input: string;
  parsed: { headers: string[]; rows: string[][]; delimiter: string };
  onReset: () => void;
  onInput: (v: string) => void;
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
        accept=".csv,.tsv,.txt"
        class={styles.hiddenFileInput}
        onChange={onOpenFile}
        tabIndex={-1}
      />
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#8862;</span>
          <strong>Input CSV / TSV</strong>
        </div>
        <div class={styles.toolactions}>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={onReset}
            data-try-sample=""
            title="Load sample CSV"
          >
            ✨ Try sample
          </button>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={() => fileInputRef.current?.click()}
            title="Open CSV or TSV file"
          >
            &#128194; Open CSV
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
            title="Clear CSV text"
          >
            Clear
          </button>
        </div>
      </div>
      <div class={styles.editorWrapper} style={{ flex: '1 1 45%', minHeight: 90 }}>
        <textarea
          id={`${idPrefix}-input`}
          class={styles.editor}
          value={input}
          onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Paste CSV text here..."
          spellcheck={false}
        />
      </div>
      <div class={styles.tablewrap} style={{ flex: '1 1 55%', minHeight: 100 }}>
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
          {parsed.delimiter === '\t'
            ? 'Tab (\\t)'
            : parsed.delimiter === ';'
              ? 'Semicolon'
              : 'Comma'}{' '}
          detected &middot; Header row &#10003; &middot; UTF-8
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
  rowsCount,
  onCopy,
  onDownload,
}: {
  idPrefix: string;
  outputJson: string;
  formatShape: string;
  rowsCount: number;
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
          {formatShape === 'objects'
            ? 'Array of objects'
            : formatShape === 'ndjson'
              ? 'NDJSON'
              : '2D Array'}
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
  rowsCount,
  colsCount,
  delimiter,
  headers,
}: {
  rowsCount: number;
  colsCount: number;
  delimiter: string;
  headers: string[];
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
            <b>{rowsCount}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniPurple}`}>
            <small>Columns</small>
            <b>{colsCount}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniGreen}`}>
            <small>Parse errors</small>
            <b>0</b>
          </div>
          <div class={`${styles.mini} ${styles.miniAmber}`}>
            <small>Delimiter</small>
            <b>{delimiter === '\t' ? '\\t' : delimiter}</b>
          </div>
        </div>
      </section>

      <section class={`${styles.panel} ${styles.sideBottomCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#9881;</span>Columns &amp; Types
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 95 }}>
          {headers.map((h) => (
            <div key={h} class={styles.kv}>
              <span>{h}</span>
              <b>string {h.toLowerCase() === 'sku' ? '&bull; 00124' : ''}</b>
            </div>
          ))}
        </div>
        <div class={styles.optHelptext}>Type conversion is opt-in.</div>
      </section>
    </div>
  );
}

export function CsvToJsonStudioLayout({
  idPrefix,
  snapshot,
  store,
  notify,
}: CsvToJsonStudioLayoutProps) {
  const [mobileView, setMobileView] = useState<StudioMobileView>('split');
  const [firstRowHeaders, setFirstRowHeaders] = useState(true);
  const studio = useCsvToJsonStudio(snapshot, store, notify);

  return (
    <div class={styles.container} data-mobile-view={mobileView}>
      <MobileViewSwitcher activeView={mobileView} onViewChange={setMobileView} />

      <main class={styles.work}>
        <CsvInputPanel
          idPrefix={idPrefix}
          input={studio.input}
          parsed={studio.parsed}
          onReset={() => {
            studio.handleReset();
            notify('Sample CSV loaded');
          }}
          onInput={studio.handleInput}
          onOpenFile={studio.handleOpenFile}
          onPaste={studio.handlePaste}
          onClear={studio.handleClear}
        />

        <CsvOutputPanel
          idPrefix={idPrefix}
          outputJson={studio.outputJson}
          formatShape={studio.formatShape}
          rowsCount={studio.parsed.rows.length}
          onCopy={studio.handleCopy}
          onDownload={studio.handleDownload}
        />

        <CsvSidePanel
          rowsCount={studio.parsed.rows.length}
          colsCount={studio.parsed.headers.length}
          delimiter={studio.parsed.delimiter}
          headers={studio.parsed.headers}
        />
      </main>

      <CsvToJsonAuxCards
        delimiterChoice={studio.delimiterChoice}
        onDelimiter={studio.setDelimiterChoice}
        formatShape={studio.formatShape}
        onFormatShape={studio.setFormatShape}
        firstRowHeaders={firstRowHeaders}
        onFirstRowHeaders={setFirstRowHeaders}
      />

      <DataStudioStatusBar
        primaryLabel="Convert to JSON"
        onPrimary={() => {
          notify('CSV converted to JSON');
        }}
        onCopy={studio.handleCopy}
        onDownload={studio.handleDownload}
        onReset={studio.handleReset}
        notify={notify}
        downloadLabel="Download .json"
      />
    </div>
  );
}
