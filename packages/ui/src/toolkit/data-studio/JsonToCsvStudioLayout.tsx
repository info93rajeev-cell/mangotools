import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './dataStudio.module.css';
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
}: {
  idPrefix: string;
  input: string;
  parsedData: unknown[] | null;
  rowsCount: number;
  onReset: () => void;
  onInput: (v: string) => void;
}) {
  return (
    <section class={styles.panel}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#123;&#125;</span>
          <strong>Input JSON</strong>
        </div>
        <div class={styles.toolactions}>
          <button type="button" class={styles.btnSecondary} onClick={onReset}>
            Sample
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
    <section class={styles.panel}>
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
  idPrefix,
  rowsCount,
  headersCount,
  delimiter,
  includeHeaders,
  error,
  rawCsv,
}: {
  idPrefix: string;
  rowsCount: number;
  headersCount: number;
  delimiter: string;
  includeHeaders: boolean;
  error: string | null;
  rawCsv: string;
}) {
  return (
    <div class={styles.side}>
      <section class={`${styles.panel} ${styles.sideTopCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128202;</span>Export Summary
        </div>
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Records</small>
            <b>{rowsCount}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniPurple}`}>
            <small>Columns</small>
            <b>{headersCount}</b>
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
        <div class={styles.editorWrapper} style={{ height: 110 }}>
          <textarea
            id={`${idPrefix}-output`}
            class={styles.editor}
            value={error ? `Error: ${error}` : rawCsv}
            readOnly
            spellcheck={false}
          />
        </div>
        <div class={styles.noteLine}>
          <span>
            Delimiter: {delimiter === ',' ? 'comma' : delimiter === '\t' ? 'tab' : 'semicolon'}
          </span>
          <span>Header: {includeHeaders ? 'yes' : 'no'}</span>
        </div>
      </section>
    </div>
  );
}

function JsonToCsvAuxCards({
  delimiter,
  onDelimiter,
  includeHeaders,
  onIncludeHeaders,
  useBom,
  onUseBom,
  formulaSafety,
  onFormulaSafety,
}: {
  delimiter: ',' | ';' | '\t';
  onDelimiter: (d: ',' | ';' | '\t') => void;
  includeHeaders: boolean;
  onIncludeHeaders: (h: boolean) => void;
  useBom: boolean;
  onUseBom: (b: boolean) => void;
  formulaSafety: boolean;
  onFormulaSafety: (f: boolean) => void;
}) {
  return (
    <div class={styles.aux}>
      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9881;</span>Record &amp; Columns
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Record path</span>
          <select class={styles.optSelect} disabled value="$[*]">
            <option value="$[*]">$[*] (Root Array)</option>
          </select>
        </label>
        <div class={styles.optCheckboxRow}>
          <span class={styles.chipGreen}>Union all keys</span>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128737;</span>Nested Data
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Object handling</span>
          <select class={styles.optSelect} disabled value="flatten">
            <option value="flatten">JSON stringify / Dot paths</option>
          </select>
        </label>
        <div class={styles.optHelptext}>Arrays remain explicit JSON text.</div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128229;</span>CSV Export
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Delimiter</span>
          <select
            class={styles.optSelect}
            value={delimiter}
            onChange={(e) => onDelimiter((e.target as HTMLSelectElement).value as ',' | ';' | '\t')}
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="&#9;">Tab (\t)</option>
          </select>
        </label>
        <div class={styles.optCheckboxRow}>
          <label class={styles.optCheckbox}>
            <input
              type="checkbox"
              checked={includeHeaders}
              onChange={(e) => onIncludeHeaders((e.target as HTMLInputElement).checked)}
            />
            Headers
          </label>
          <label class={styles.optCheckbox}>
            <input
              type="checkbox"
              checked={useBom}
              onChange={(e) => onUseBom((e.target as HTMLInputElement).checked)}
            />
            BOM
          </label>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128737;</span>Spreadsheet Safety
        </div>
        <div class={styles.optCheckboxRow}>
          <label class={styles.optCheckbox}>
            <input
              type="checkbox"
              checked={formulaSafety}
              onChange={(e) => onFormulaSafety((e.target as HTMLInputElement).checked)}
            />
            Formula guard (=, +, -, @)
          </label>
        </div>
        <div class={styles.optHelptext} style={{ marginTop: 2 }}>
          Prevents dangerous spreadsheet formula injection.
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
  const {
    input,
    handleInput,
    delimiter,
    setDelimiter,
    includeHeaders,
    setIncludeHeaders,
    useBom,
    setUseBom,
    formulaSafety,
    setFormulaSafety,
    parsedData,
    error,
    headers,
    rows,
    rawCsv,
    handleCopy,
    handleDownload,
    handleReset,
  } = useJsonToCsvStudio(snapshot, store, notify);

  return (
    <div class={styles.container} data-json-to-csv-studio-layout="">
      <div class={styles.work}>
        <JsonToCsvInputPanel
          idPrefix={idPrefix}
          input={input}
          parsedData={parsedData}
          rowsCount={rows.length}
          onReset={handleReset}
          onInput={handleInput}
        />
        <JsonToCsvTablePanel
          headers={headers}
          rows={rows}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
        <JsonToCsvSidePanel
          idPrefix={idPrefix}
          rowsCount={rows.length}
          headersCount={headers.length}
          delimiter={delimiter}
          includeHeaders={includeHeaders}
          error={error}
          rawCsv={rawCsv}
        />
      </div>

      <JsonToCsvAuxCards
        delimiter={delimiter}
        onDelimiter={setDelimiter}
        includeHeaders={includeHeaders}
        onIncludeHeaders={setIncludeHeaders}
        useBom={useBom}
        onUseBom={setUseBom}
        formulaSafety={formulaSafety}
        onFormulaSafety={setFormulaSafety}
      />

      <div class={styles.statusBar}>
        <button
          type="button"
          class={styles.btnSecondary}
          onClick={() => notify('Local browser-safe processing')}
        >
          &#9432; Runs on your device &middot; Browser-local
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" class={styles.btnGold} onClick={handleCopy}>
            Convert to CSV
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
