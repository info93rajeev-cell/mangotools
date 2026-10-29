import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import styles from './dataStudio.module.css';
import { JsonAuxCards, SideMetricsPanel } from './JsonFormatterAuxCards.tsx';
import { JsonTreeView } from './JsonTreeView.tsx';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
import { type ParseResult, useJsonFormatterStudio } from './useJsonFormatterStudio.ts';

export interface JsonFormatterStudioLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

function InputPanel({
  idPrefix,
  input,
  action,
  onAction,
  onInput,
  onSample,
}: {
  idPrefix: string;
  input: string;
  action: 'format' | 'minify' | 'validate';
  onAction: (a: 'format' | 'minify' | 'validate') => void;
  onInput: (val: string) => void;
  onSample?: () => void;
}) {
  return (
    <section class={`${styles.panel} ${styles.inputPanel}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#123;&#125;</span>
          <strong>Input JSON</strong>
        </div>
        <div class={styles.toolactions}>
          {onSample && (
            <button
              type="button"
              class={styles.btnSecondary}
              onClick={onSample}
              data-try-sample=""
              title="Load sample JSON"
            >
              ✨ Try sample
            </button>
          )}
          <button
            type="button"
            class={action === 'format' ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => onAction('format')}
          >
            Format
          </button>
          <button
            type="button"
            class={action === 'minify' ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => onAction('minify')}
          >
            Minify
          </button>
          <button
            type="button"
            class={action === 'validate' ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => onAction('validate')}
          >
            Validate
          </button>
        </div>
      </div>
      <div class={styles.editorWrapper}>
        <textarea
          id={`${idPrefix}-input`}
          class={styles.editor}
          value={input}
          onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Paste or type JSON here..."
          spellcheck={false}
        />
      </div>
      <div class={styles.noteLine}>
        <span>Local parsing &middot; UTF-8 &middot; No upload</span>
        <span>
          {input.split('\n').length} lines &middot; {input.length} chars
        </span>
      </div>
    </section>
  );
}

function OutputPanel({
  idPrefix,
  outputFormatted,
  activeTab,
  onTab,
  onCopy,
  onDownload,
  parsedResult,
  tableData,
}: {
  idPrefix: string;
  outputFormatted: string;
  activeTab: 'raw' | 'tree' | 'table';
  onTab: (t: 'raw' | 'tree' | 'table') => void;
  onCopy: () => void;
  onDownload: () => void;
  parsedResult: { valid: boolean; error: string | null; data: unknown };
  tableData: { headers: string[]; rows: Record<string, unknown>[] } | null;
}) {
  return (
    <section class={`${styles.panel} ${styles.outputPanel}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#9776;</span>
          <strong>Formatted JSON</strong>
        </div>
        <div class={styles.toolactions}>
          <div class={styles.rowchips}>
            <button
              type="button"
              class={`${styles.chip} ${activeTab === 'raw' ? styles.chipBlue : styles.chipAmber}`}
              onClick={() => onTab('raw')}
            >
              Raw
            </button>
            <button
              type="button"
              class={`${styles.chip} ${activeTab === 'tree' ? styles.chipPurple : styles.chipAmber}`}
              onClick={() => onTab('tree')}
            >
              Tree
            </button>
            {tableData && (
              <button
                type="button"
                class={`${styles.chip} ${activeTab === 'table' ? styles.chipGreen : styles.chipAmber}`}
                onClick={() => onTab('table')}
              >
                Table
              </button>
            )}
          </div>
          <button type="button" class={styles.btnSecondary} onClick={onCopy}>
            Copy
          </button>
          <button type="button" class={styles.btnSecondary} onClick={onDownload}>
            Download
          </button>
        </div>
      </div>
      <div class={styles.editorWrapper}>
        {activeTab === 'raw' && (
          <textarea
            id={`${idPrefix}-output`}
            class={styles.editor}
            value={outputFormatted}
            readOnly
            spellcheck={false}
          />
        )}
        {activeTab === 'tree' && (
          <div class={styles.editor}>
            {parsedResult.valid ? (
              <JsonTreeView data={parsedResult.data} />
            ) : (
              <div style={{ color: '#cf223e', padding: 8 }}>Cannot build tree: JSON is invalid</div>
            )}
          </div>
        )}
        {activeTab === 'table' && tableData && (
          <div class={styles.tablewrap}>
            <table class={styles.dataTable}>
              <thead>
                <tr>
                  {tableData.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, i) => (
                  <tr key={i}>
                    {tableData.headers.map((h) => (
                      <td key={h}>{String(row[h] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div class={styles.noteLine}>
        {parsedResult.valid ? (
          <span class={styles.noteLineGreen}>&#10003; JSON valid &middot; No syntax errors</span>
        ) : (
          <span style={{ color: '#cf223e', fontWeight: 700 }}>
            &#9888; Syntax Error: {parsedResult.error}
          </span>
        )}
        <span>
          {outputFormatted.split('\n').length} lines &middot; {outputFormatted.length} chars
        </span>
      </div>
    </section>
  );
}

interface JsonStatusBarProps {
  onNotify: (msg: string) => void;
  onFormat: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onReset: () => void;
}

function JsonStatusBar({ onNotify, onFormat, onCopy, onDownload, onReset }: JsonStatusBarProps) {
  return (
    <div class={styles.statusBar}>
      <button
        type="button"
        class={styles.btnSecondary}
        onClick={() => onNotify('Local browser-safe processing')}
      >
        &#9432; Runs 100% on device
      </button>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" class={styles.btnGold} onClick={onFormat}>
          Format &amp; Validate JSON
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

interface JsonWorkGridProps {
  idPrefix: string;
  input: string;
  action: 'format' | 'minify' | 'validate';
  onAction: (a: 'format' | 'minify' | 'validate') => void;
  onInput: (val: string) => void;
  onSample: () => void;
  outputFormatted: string;
  activeTab: 'raw' | 'tree' | 'table';
  onTab: (t: 'raw' | 'tree' | 'table') => void;
  onCopy: () => void;
  onDownload: () => void;
  parsedResult: ParseResult;
  tableData: { headers: string[]; rows: Record<string, unknown>[] } | null;
}

function JsonWorkGrid(props: JsonWorkGridProps) {
  return (
    <div class={styles.work}>
      <InputPanel
        idPrefix={props.idPrefix}
        input={props.input}
        action={props.action}
        onAction={props.onAction}
        onInput={props.onInput}
        onSample={props.onSample}
      />
      <OutputPanel
        idPrefix={props.idPrefix}
        outputFormatted={props.outputFormatted}
        activeTab={props.activeTab}
        onTab={props.onTab}
        onCopy={props.onCopy}
        onDownload={props.onDownload}
        parsedResult={props.parsedResult}
        tableData={props.tableData}
      />
      <SideMetricsPanel
        parsedResult={props.parsedResult}
        inputLength={props.input.length}
        inputLines={props.input.split('\n').length}
      />
    </div>
  );
}

export function JsonFormatterStudioLayout({
  idPrefix,
  snapshot,
  store,
  notify,
}: JsonFormatterStudioLayoutProps) {
  const {
    input,
    handleInput,
    indent,
    setIndent,
    action,
    setAction,
    sortKeys,
    setSortKeys,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    parsedResult,
    outputFormatted,
    searchMatches,
    tableData,
    handleCopy,
    handleDownload,
    handleReset,
  } = useJsonFormatterStudio(snapshot, store, notify);

  const [mobileView, setMobileView] = useState<StudioMobileView>('split');

  return (
    <div class={styles.container} data-json-formatter-layout="" data-mobile-view={mobileView}>
      <MobileViewSwitcher
        view={mobileView}
        onChange={setMobileView}
        inputTitle="JSON Input"
        outputTitle="Formatted JSON"
      />
      <JsonWorkGrid
        idPrefix={idPrefix}
        input={input}
        action={action}
        onAction={setAction}
        onInput={handleInput}
        onSample={handleReset}
        outputFormatted={outputFormatted}
        activeTab={activeTab}
        onTab={setActiveTab}
        onCopy={handleCopy}
        onDownload={handleDownload}
        parsedResult={parsedResult}
        tableData={tableData}
      />

      <JsonAuxCards
        indent={indent}
        onIndent={setIndent}
        sortKeys={sortKeys}
        onSortKeys={setSortKeys}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        searchMatches={searchMatches}
        stats={parsedResult.stats}
      />

      <JsonStatusBar
        onNotify={notify}
        onFormat={() => setAction('format')}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onReset={handleReset}
      />
    </div>
  );
}
