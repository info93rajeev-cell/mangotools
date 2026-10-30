import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef, useState } from 'preact/hooks';
import { DataStudioStatusBar } from './DataStudioStatusBar.tsx';
import styles from './dataStudio.module.css';
import { JsonAuxCards, SideMetricsPanel } from './JsonFormatterAuxCards.tsx';
import { JsonTreeView } from './JsonTreeView.tsx';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
import { DEFAULT_JSON, useJsonFormatterStudio } from './useJsonFormatterStudio.ts';

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
  onOpenFile,
  onPaste,
}: {
  idPrefix: string;
  input: string;
  action: 'format' | 'minify' | 'validate';
  onAction: (a: 'format' | 'minify' | 'validate') => void;
  onInput: (val: string) => void;
  onSample: () => void;
  onOpenFile: (e: Event) => void;
  onPaste: () => void;
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
            onClick={onSample}
            data-try-sample=""
            title="Load sample JSON"
          >
            ✨ Try sample
          </button>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={() => fileInputRef.current?.click()}
            title="Open JSON file from device"
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
        <span>Local parsing &middot; UTF-8 &middot; no server upload</span>
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

export function JsonFormatterStudioLayout({
  idPrefix,
  snapshot,
  store,
  notify,
}: JsonFormatterStudioLayoutProps) {
  const [mobileView, setMobileView] = useState<StudioMobileView>('split');
  const studio = useJsonFormatterStudio(snapshot, store, notify);

  return (
    <div class={styles.container} data-mobile-view={mobileView}>
      <MobileViewSwitcher activeView={mobileView} onViewChange={setMobileView} />

      <main class={styles.work}>
        <InputPanel
          idPrefix={idPrefix}
          input={studio.input}
          action={studio.action}
          onAction={studio.setAction}
          onInput={studio.handleInput}
          onSample={() => {
            studio.handleInput(DEFAULT_JSON);
            notify('Sample JSON loaded');
          }}
          onOpenFile={studio.handleOpenFile}
          onPaste={studio.handlePaste}
        />

        <OutputPanel
          idPrefix={idPrefix}
          outputFormatted={studio.outputFormatted}
          activeTab={studio.activeTab}
          onTab={studio.setActiveTab}
          onCopy={studio.handleCopy}
          onDownload={studio.handleDownload}
          parsedResult={studio.parsedResult}
          tableData={studio.tableData}
        />

        <SideMetricsPanel
          parsedResult={studio.parsedResult}
          inputLength={studio.input.length}
          inputLines={studio.input.split('\n').length}
          activeTab={studio.activeTab}
          onTab={studio.setActiveTab}
        />
      </main>

      <JsonAuxCards
        indent={studio.indent}
        onIndent={studio.setIndent}
        sortKeys={studio.sortKeys}
        onSortKeys={studio.setSortKeys}
        syntaxHighlight={studio.syntaxHighlight}
        onSyntaxHighlight={studio.setSyntaxHighlight}
        lineNumbers={studio.lineNumbers}
        onLineNumbers={studio.setLineNumbers}
        searchQuery={studio.searchQuery}
        onSearch={studio.setSearchQuery}
        searchMatches={studio.searchMatches}
        stats={studio.parsedResult.stats}
      />

      <DataStudioStatusBar
        primaryLabel="Format &amp; Validate JSON"
        onPrimary={() => studio.setAction('format')}
        onCopy={studio.handleCopy}
        onDownload={studio.handleDownload}
        onReset={studio.handleReset}
        notify={notify}
      />
    </div>
  );
}
