import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef, useState } from 'preact/hooks';
import { DataStudioStatusBar } from './DataStudioStatusBar.tsx';
import styles from './dataStudio.module.css';
import { JsonToCsvAuxCards } from './JsonToCsvAuxCards.tsx';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
import { useJsonToCsvStudio } from './useJsonToCsvStudio.ts';

export interface JsonToCsvStudioLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

function JsonToCsvInputPanel({
  idPrefix,
  input,
  parsedData,
  rowsCount,
  onReset,
  onInput,
  onOpenFile,
  onPaste,
  onClear,
}: {
  idPrefix: string;
  input: string;
  parsedData: unknown[] | null;
  rowsCount: number;
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
        accept=".json,application/json,text/plain"
        class={styles.hiddenFileInput}
        onChange={onOpenFile}
        tabIndex={-1}
      />
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#123;&#125;</span>
          <strong>Input JSON</strong>
        </div>
        <div class={styles.toolactions}>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={onReset}
            data-try-sample=""
            title="Load sample JSON"
          >
            ✨ Try sample
          </button>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={() => fileInputRef.current?.click()}
            title="Open JSON file"
          >
            &#128194; Open JSON
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
            title="Clear JSON input"
          >
            Clear
          </button>
        </div>
      </div>
      <div class={styles.editorWrapper}>
        <textarea
          id={`${idPrefix}-input`}
          class={styles.editor}
          value={input}
          onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Paste JSON array or object here..."
          spellcheck={false}
        />
      </div>
      <div class={styles.noteLine}>
        <span>Root: {Array.isArray(parsedData) ? 'Array of objects' : 'Single object'}</span>
        <span>{rowsCount} records</span>
      </div>
    </section>
  );
}

function JsonToCsvTablePanel({
  headers,
  rows,
  onCopy,
  onDownload,
}: {
  headers: string[];
  rows: string[][];
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <section class={`${styles.panel} ${styles.outputPanel}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#8862;</span>
          <strong>CSV Table Preview</strong>
        </div>
        <div class={styles.toolactions}>
          <button type="button" class={styles.btnSecondary} onClick={onCopy}>
            Copy
          </button>
          <button type="button" class={styles.btnSecondary} onClick={onDownload}>
            Download .csv
          </button>
        </div>
      </div>
      <div class={styles.rowchips}>
        <span class={styles.chipBlue}>{headers.length} selected columns</span>
        <span class={styles.chipPurple}>Record path: $[*]</span>
      </div>
      <div class={styles.tablewrap}>
        <table class={styles.dataTable}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div class={styles.noteLine}>
        <span class={styles.noteLineGreen}>&#10003; Union of keys across all records</span>
        <span>
          Preview {rows.length} / {rows.length}
        </span>
      </div>
    </section>
  );
}

function JsonToCsvSidePanel({
  recordsCount,
  columnsCount,
  rawCsv,
  delimiter,
}: {
  recordsCount: number;
  columnsCount: number;
  rawCsv: string;
  delimiter: string;
}) {
  return (
    <div class={`${styles.side} ${styles.sidePanel}`}>
      <section class={`${styles.panel} ${styles.sideTopCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128202;</span>Export Summary
        </div>
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Records</small>
            <b>{recordsCount}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniPurple}`}>
            <small>Columns</small>
            <b>{columnsCount}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniGreen}`}>
            <small>Missing</small>
            <b>0</b>
          </div>
          <div class={`${styles.mini} ${styles.miniAmber}`}>
            <small>Format</small>
            <b>CSV</b>
          </div>
        </div>
        <div class={styles.callout}>
          SKU values with leading zeros remain <b>text</b>.
        </div>
      </section>

      <section class={`${styles.panel} ${styles.sideBottomCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128196;</span>CSV Output
        </div>
        <div class={styles.rawCsvPreview}>{rawCsv}</div>
        <div class={styles.noteLine} style={{ marginTop: 4 }}>
          <span>
            Delimiter: {delimiter === '\t' ? 'tab' : delimiter === ';' ? 'semicolon' : 'comma'}
          </span>
          <span>Header: yes</span>
        </div>
      </section>
    </div>
  );
}

export function JsonToCsvStudioLayout({
  idPrefix,
  snapshot,
  store,
  notify,
}: JsonToCsvStudioLayoutProps) {
  const [mobileView, setMobileView] = useState<StudioMobileView>('split');
  const studio = useJsonToCsvStudio(snapshot, store, notify);

  return (
    <div class={styles.container} data-mobile-view={mobileView}>
      <MobileViewSwitcher activeView={mobileView} onViewChange={setMobileView} />

      <main class={styles.work}>
        <JsonToCsvInputPanel
          idPrefix={idPrefix}
          input={studio.input}
          parsedData={studio.parsedData}
          rowsCount={studio.rows.length}
          onReset={() => {
            studio.handleReset();
            notify('Sample JSON loaded');
          }}
          onInput={studio.handleInput}
          onOpenFile={studio.handleOpenFile}
          onPaste={studio.handlePaste}
          onClear={studio.handleClear}
        />

        <JsonToCsvTablePanel
          headers={studio.headers}
          rows={studio.rows}
          onCopy={studio.handleCopy}
          onDownload={studio.handleDownload}
        />

        <JsonToCsvSidePanel
          recordsCount={studio.rows.length}
          columnsCount={studio.headers.length}
          rawCsv={studio.rawCsv}
          delimiter={studio.delimiter}
        />
      </main>

      <JsonToCsvAuxCards
        delimiter={studio.delimiter}
        onDelimiter={studio.setDelimiter}
        includeHeaders={studio.includeHeaders}
        onIncludeHeaders={studio.setIncludeHeaders}
        useBom={studio.useBom}
        onUseBom={studio.setUseBom}
        formulaSafety={studio.formulaSafety}
        onFormulaSafety={studio.setFormulaSafety}
      />

      <DataStudioStatusBar
        primaryLabel="Convert to CSV"
        onPrimary={() => {
          notify('JSON converted to CSV');
        }}
        onCopy={studio.handleCopy}
        onDownload={studio.handleDownload}
        onReset={studio.handleReset}
        notify={notify}
        downloadLabel="Download .csv"
      />
    </div>
  );
}
