import { useState } from 'preact/hooks';
import styles from './dataStudio.module.css';
import { JsonStructureCards } from './JsonStructureCards.tsx';
import { JsonTreeView } from './JsonTreeView.tsx';
import type { ParseResult } from './useJsonFormatterStudio.ts';

interface JsonOutputPanelProps {
  idPrefix: string;
  outputFormatted: string;
  activeTab: 'tree' | 'table' | 'raw';
  onTab: (t: 'tree' | 'table' | 'raw') => void;
  onCopy: () => void;
  onDownload: () => void;
  parsedResult: ParseResult;
  tableData: { headers: string[]; rows: Record<string, unknown>[] } | null;
}

export function JsonOutputPanel(props: JsonOutputPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { activeTab, onTab, onCopy, onDownload, parsedResult } = props;

  const title = getOutputPanelTitle(activeTab);

  return (
    <section
      class={`${styles.panel} ${styles.outputPanel} ${isFullscreen ? styles.panelFullscreen : ''}`}
    >
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <strong>{title}</strong>
        </div>
        <div class={styles.toolactions}>
          <OutputTabPills
            activeTab={activeTab}
            onTab={onTab}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            hasTableData={!!props.tableData}
          />
          <button type="button" class={styles.btnSecondary} onClick={onCopy} title="Copy output">
            📋 Copy
          </button>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={onDownload}
            title="Download formatted JSON"
          >
            💾 Download
          </button>
        </div>
      </div>

      <div class={styles.outputSplitBody}>
        <div class={styles.outputViewArea}>
          <OutputContent {...props} />
        </div>
        <JsonStructureCards stats={parsedResult.stats} />
      </div>
    </section>
  );
}

function getOutputPanelTitle(tab: 'tree' | 'table' | 'raw'): string {
  if (tab === 'tree') return '🌳 JSON Tree View';
  if (tab === 'table') return '📊 JSON Table View';
  return '📄 Formatted JSON';
}

function OutputTabPills({
  activeTab,
  onTab,
  isFullscreen,
  onToggleFullscreen,
  hasTableData,
}: {
  activeTab: 'tree' | 'table' | 'raw';
  onTab: (t: 'tree' | 'table' | 'raw') => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  hasTableData: boolean;
}) {
  return (
    <div class={styles.tabPillGroup}>
      <button
        type="button"
        class={`${styles.tabPill} ${activeTab === 'tree' ? styles.tabPillActive : ''}`}
        onClick={() => onTab('tree')}
      >
        {'{ }'} Tree
      </button>
      <button
        type="button"
        class={`${styles.tabPill} ${activeTab === 'table' ? styles.tabPillActive : ''}`}
        onClick={() => onTab('table')}
        title={hasTableData ? 'View as tabular grid' : 'Arrays can be viewed as table'}
      >
        ⊞ Table
      </button>
      <button
        type="button"
        class={`${styles.tabPill} ${activeTab === 'raw' ? styles.tabPillActive : ''}`}
        onClick={() => onTab('raw')}
      >
        ⊟ Raw
      </button>
      <button
        type="button"
        class={styles.tabPill}
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
      >
        {isFullscreen ? '✕' : '⤢'}
      </button>
    </div>
  );
}

function OutputContent({
  idPrefix,
  outputFormatted,
  activeTab,
  parsedResult,
  tableData,
}: JsonOutputPanelProps) {
  if (activeTab === 'tree') {
    return (
      <div class={styles.treeScrollContainer}>
        {parsedResult.valid ? (
          <JsonTreeView data={parsedResult.data} />
        ) : (
          <div class={styles.invalidNotice}>
            <strong>Cannot build tree:</strong>
            <p>{parsedResult.error || 'Invalid JSON syntax'}</p>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'table') {
    return <JsonTableView tableData={tableData} />;
  }

  return (
    <div class={styles.editorContainer}>
      <textarea
        id={`${idPrefix}-output`}
        class={styles.codeTextarea}
        value={outputFormatted}
        readOnly
        spellcheck={false}
        aria-label="Formatted JSON output"
      />
    </div>
  );
}

function JsonTableView({
  tableData,
}: {
  tableData: { headers: string[]; rows: Record<string, unknown>[] } | null;
}) {
  if (!tableData) {
    return (
      <div class={styles.tableNotice}>
        <p>Table view is available when the root or selected node is an array of objects.</p>
      </div>
    );
  }

  return (
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
          {tableData.rows.map((row, idx) => (
            <tr key={String(idx)}>
              {tableData.headers.map((h) => (
                <td key={h}>{formatTableCell(row[h])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatTableCell(val: unknown): string {
  if (val === null) return 'null';
  if (typeof val === 'undefined') return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
