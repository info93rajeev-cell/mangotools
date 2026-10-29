import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './dataStudio.module.css';
import { JsonTreeView } from './JsonTreeView.tsx';
import { type JsonStats, useJsonFormatterStudio } from './useJsonFormatterStudio.ts';

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
}: {
  idPrefix: string;
  input: string;
  action: 'format' | 'minify' | 'validate';
  onAction: (a: 'format' | 'minify' | 'validate') => void;
  onInput: (val: string) => void;
}) {
  return (
    <section class={styles.panel}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#123;&#125;</span>
          <strong>Input JSON</strong>
        </div>
        <div class={styles.toolactions}>
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
    <section class={styles.panel}>
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

function SideMetricsPanel({
  parsedResult,
  inputLength,
  inputLines,
}: {
  parsedResult: { valid: boolean; error: string | null; stats: JsonStats | null };
  inputLength: number;
  inputLines: number;
}) {
  return (
    <div class={styles.side}>
      <section class={`${styles.panel} ${styles.sideTopCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#10003;</span>Validation &amp; Info
        </div>
        {parsedResult.valid ? (
          <div class={styles.badgeOk}>
            <span>&#10004;</span>
            <div>
              <strong>Valid JSON</strong>
              <div style={{ fontSize: 10.5, color: '#098650' }}>RFC 8259 compliant</div>
            </div>
          </div>
        ) : (
          <div class={styles.badgeErr}>
            <span>&#9888;</span>
            <div>
              <strong>Invalid JSON</strong>
              <div style={{ fontSize: 10, color: '#a81c34' }}>{parsedResult.error}</div>
            </div>
          </div>
        )}
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Characters</small>
            <b>{parsedResult.stats?.chars ?? inputLength}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniGreen}`}>
            <small>Lines</small>
            <b>{parsedResult.stats?.lines ?? inputLines}</b>
          </div>
        </div>
      </section>

      <section class={`${styles.panel} ${styles.sideBottomCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#9881;</span>Data Structure
        </div>
        <div class={styles.kv}>
          <span>Root Type</span>
          <b>{parsedResult.stats?.rootType ?? 'Unknown'}</b>
        </div>
        <div class={styles.kv}>
          <span>Objects Count</span>
          <b>{parsedResult.stats?.objects ?? 0}</b>
        </div>
        <div class={styles.kv}>
          <span>Arrays Count</span>
          <b>{parsedResult.stats?.arrays ?? 0}</b>
        </div>
        <div class={styles.kv}>
          <span>Max Depth</span>
          <b>{parsedResult.stats?.maxDepth ?? 0} levels</b>
        </div>
      </section>
    </div>
  );
}

function AuxCards({
  indent,
  onIndent,
  sortKeys,
  onSortKeys,
  searchQuery,
  onSearch,
  searchMatches,
  stats,
}: {
  indent: '2' | '4' | 'tab';
  onIndent: (v: '2' | '4' | 'tab') => void;
  sortKeys: boolean;
  onSortKeys: (v: boolean) => void;
  searchQuery: string;
  onSearch: (v: string) => void;
  searchMatches: number;
  stats: JsonStats | null;
}) {
  return (
    <div class={styles.aux}>
      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9881;</span>Formatting
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Indentation</span>
          <select
            class={styles.optSelect}
            value={indent}
            onChange={(e) => onIndent((e.target as HTMLSelectElement).value as '2' | '4' | 'tab')}
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>
        <div class={styles.optCheckboxRow}>
          <label class={styles.optCheckbox}>
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => onSortKeys((e.target as HTMLInputElement).checked)}
            />
            Sort keys (A-Z)
          </label>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9889;</span>Advanced
        </div>
        <div class={styles.rowchips}>
          <span class={styles.chipPurple}>Duplicate check</span>
          <span class={styles.chipBlue}>BigInt safe</span>
        </div>
        <div class={styles.optHelptext} style={{ marginTop: 4 }}>
          Numeric fidelity &middot; Schema validation &middot; Error path &middot; Key sorting
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128269;</span>Search in JSON
        </div>
        <input
          type="text"
          class={styles.optSelect}
          placeholder="Search keys or values..."
          value={searchQuery}
          aria-label="Search keys or values"
          onInput={(e) => onSearch((e.target as HTMLInputElement).value)}
        />
        <div class={styles.optHelptext}>
          {searchQuery
            ? `${searchMatches} match${searchMatches === 1 ? '' : 'es'} found`
            : 'Find in formatted JSON'}
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128065;</span>Inspection Tools
        </div>
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Objects</small>
            <b>{stats?.objects ?? 0}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniPurple}`}>
            <small>Arrays</small>
            <b>{stats?.arrays ?? 0}</b>
          </div>
        </div>
      </section>
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

  return (
    <div class={styles.container} data-json-formatter-layout="">
      <div class={styles.work}>
        <InputPanel
          idPrefix={idPrefix}
          input={input}
          action={action}
          onAction={setAction}
          onInput={handleInput}
        />
        <OutputPanel
          idPrefix={idPrefix}
          outputFormatted={outputFormatted}
          activeTab={activeTab}
          onTab={setActiveTab}
          onCopy={handleCopy}
          onDownload={handleDownload}
          parsedResult={parsedResult}
          tableData={tableData}
        />
        <SideMetricsPanel
          parsedResult={parsedResult}
          inputLength={input.length}
          inputLines={input.split('\n').length}
        />
      </div>

      <AuxCards
        indent={indent}
        onIndent={setIndent}
        sortKeys={sortKeys}
        onSortKeys={setSortKeys}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        searchMatches={searchMatches}
        stats={parsedResult.stats}
      />

      <div class={styles.statusBar}>
        <button
          type="button"
          class={styles.btnSecondary}
          onClick={() => notify('Local browser-safe processing')}
        >
          &#9432; Runs 100% on device
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" class={styles.btnGold} onClick={() => setAction('format')}>
            Format &amp; Validate JSON
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
