import { useRef, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import csv from './csvToJson.module.css';
import { countColumnTypes, previewTable } from './csvToJsonResult.ts';
import styles from './dataStudio.module.css';
import { highlightJson } from './jsonSyntaxHighlight.ts';
import type { CsvOutputTab, CsvStudio } from './useCsvToJsonStudio.ts';

/** Above this size the output is shown without colour, so typing stays fast. */
const HIGHLIGHT_LIMIT = 200_000;

const OUTPUT_TABS: { id: CsvOutputTab; label: string; icon: string; tone: string }[] = [
  { id: 'formatted', label: 'Formatted JSON', icon: 'braces', tone: csv.tonePink },
  { id: 'minified', label: 'Minified JSON', icon: 'file-text', tone: csv.toneAmber },
  { id: 'table', label: 'Preview Table', icon: 'table-2', tone: csv.toneGreen },
];

function CodeView({ idPrefix, text }: { idPrefix: string; text: string }) {
  const area = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const highlight = text.length <= HIGHLIGHT_LIMIT;
  const lineCount = Math.max(1, text.split('\n').length);
  const sync = () => {
    const el = area.current;
    if (!el) return;
    if (gutter.current) gutter.current.scrollTop = el.scrollTop;
    if (pre.current) {
      pre.current.scrollTop = el.scrollTop;
      pre.current.scrollLeft = el.scrollLeft;
    }
  };
  return (
    <div class={`${styles.editorContainer} ${csv.outputEditor}`}>
      <div ref={gutter} class={`${styles.editorGutter} ${csv.gutter}`} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={String(i)} class={styles.gutterLine}>
            {i + 1}
          </div>
        ))}
      </div>
      <div class={styles.codeArea}>
        {highlight ? (
          <pre
            ref={pre}
            class={styles.codeHighlight}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlightJson(text) }}
          />
        ) : null}
        <textarea
          ref={area}
          id={`${idPrefix}-output`}
          class={`${styles.codeTextarea} ${highlight ? styles.codeTextareaOverlay : ''}`}
          value={text}
          readOnly
          onScroll={sync}
          spellcheck={false}
          aria-label="JSON output"
        />
      </div>
    </div>
  );
}

function TableView({ studio }: { studio: CsvStudio }) {
  if (!studio.result) return null;
  const table = previewTable(studio.result, studio.options.shape);
  return (
    <div class={`${styles.tablewrap} ${csv.previewTable}`}>
      <table class={styles.dataTable}>
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={String(i)}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={String(r)}>
              {row.map((value, c) => (
                <td key={String(c)}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OutputBody({ idPrefix, studio }: { idPrefix: string; studio: CsvStudio }) {
  if (studio.error) {
    return (
      <div class={styles.invalidNotice} role="alert">
        <strong>Cannot convert:</strong>
        <p>{studio.error}</p>
      </div>
    );
  }
  if (!studio.result) {
    return <div class={styles.tableNotice}>Paste CSV on the left to see JSON here.</div>;
  }
  if (studio.outputTab === 'table') return <TableView studio={studio} />;
  return <CodeView idPrefix={idPrefix} text={studio.result.text} />;
}

const TYPE_ROWS = [
  { key: 'string', label: 'String', icon: 'share-2', track: styles.trackGreen },
  { key: 'number', label: 'Number', icon: 'hexagon', track: styles.trackBlue },
  { key: 'boolean', label: 'Boolean', icon: 'shield-check', track: styles.trackRed },
  { key: 'null', label: 'Null', icon: 'clock', track: styles.trackGray },
  { key: 'mixed', label: 'Mixed', icon: 'layers', track: styles.trackPurple },
] as const;

function SummaryColumn({ studio }: { studio: CsvStudio }) {
  const result = studio.result;
  const counts = countColumnTypes(result?.columns ?? []);
  const total = result?.columnCount ?? 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);
  return (
    <div class={`${styles.sideSummaryCol} ${csv.sideCol}`}>
      <section class={styles.structureCard}>
        <div class={styles.sideCardHeader}>
          <span class={`${csv.tileSm} ${csv.tonePurple}`}>
            <Icon name="layers" class={csv.tileIcoSm} />
          </span>
          <span class={styles.sideCardTitle}>Structure Summary</span>
        </div>
        <div class={csv.metricPair}>
          <div class={`${styles.structureMetric} ${styles.metricGreen}`}>
            <span class={styles.metricIcon}>
              <Icon name="file-text" class={styles.metricIco} />
            </span>
            <div class={styles.metricText}>
              <small>Total Rows</small>
              <b>{result?.rowCount ?? 0}</b>
            </div>
          </div>
          <div class={`${styles.structureMetric} ${styles.metricPurple}`}>
            <span class={styles.metricIcon}>
              <Icon name="list" class={styles.metricIco} />
            </span>
            <div class={styles.metricText}>
              <small>Total Columns</small>
              <b>{total}</b>
            </div>
          </div>
        </div>
      </section>
      <section class={styles.dataTypesCard}>
        <div class={styles.sideCardHeader}>
          <span class={styles.sideCardTitle}>Data Types Detected</span>
        </div>
        <div class={styles.dataTypesList}>
          {TYPE_ROWS.filter((row) => row.key !== 'mixed' || counts.mixed > 0).map((row) => (
            <div key={row.key} class={styles.dataTypeRow}>
              <div class={styles.dataTypeMeta}>
                <span class={styles.dataTypeIcon}>
                  <Icon name={row.icon} class={styles.ico} />
                </span>
                <span class={styles.dataTypeLabel}>{row.label}</span>
              </div>
              <strong class={styles.dataTypeCount}>{counts[row.key]}</strong>
              <div class={styles.dataTypeTrackWrapper}>
                <span class={styles.dataTypePct}>{pct(counts[row.key]).toFixed(1)}%</span>
                <div class={styles.dataTypeTrack}>
                  <div
                    class={`${styles.dataTypeBar} ${row.track}`}
                    style={{ width: `${pct(counts[row.key])}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {studio.options.inferTypes ? null : (
          <p class={csv.hint}>Values stay text. Turn on “Auto detect data types” for numbers.</p>
        )}
      </section>
    </div>
  );
}

function OutputToolbar({ studio, onFullscreen }: { studio: CsvStudio; onFullscreen: () => void }) {
  return (
    <div class={styles.toolbar}>
      <div class={styles.tooltitle}>
        <span class={`${csv.tile} ${csv.tonePink}`}>
          <Icon name="file-braces" class={csv.tileIco} />
        </span>
        <strong>JSON Output</strong>
      </div>
      <div class={styles.toolactions}>
        <button type="button" class={styles.btnSecondary} onClick={studio.copy}>
          <Icon name="copy" class={styles.ico} /> Copy
        </button>
        <button type="button" class={styles.btnSecondary} onClick={studio.download}>
          <Icon name="download" class={styles.ico} /> Download
        </button>
        <button type="button" class={styles.btnSecondary} onClick={studio.openInNewTab}>
          <Icon name="external-link" class={styles.ico} /> Open in New Tab
        </button>
        <button
          type="button"
          class={styles.btnSecondary}
          onClick={onFullscreen}
          aria-label="Expand output"
          title="Expand output"
        >
          <Icon name="maximize" class={styles.ico} />
        </button>
      </div>
    </div>
  );
}

export function CsvOutputPanel({ idPrefix, studio }: { idPrefix: string; studio: CsvStudio }) {
  const [fullscreen, setFullscreen] = useState(false);
  return (
    <section
      class={`${styles.panel} ${styles.outputPanel} ${csv.card} ${csv.outputCard} ${fullscreen ? styles.panelFullscreen : ''}`}
    >
      <OutputToolbar studio={studio} onFullscreen={() => setFullscreen(!fullscreen)} />
      <div class={csv.outputTabs}>
        {OUTPUT_TABS.map((tab) => {
          const active = studio.outputTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              class={`${csv.inputTab} ${tab.tone} ${active ? csv.inputTabActive : ''}`}
              onClick={() => studio.setOutputTab(tab.id)}
            >
              <Icon name={tab.icon} class={csv.inputTabIco} /> {tab.label}
            </button>
          );
        })}
        <button type="button" class={`${csv.inputTab} ${csv.toneBlue}`} onClick={studio.download}>
          <Icon name="download" class={csv.inputTabIco} /> Download
        </button>
      </div>
      <div class={`${styles.outputSplitBody} ${csv.outputBody}`}>
        <div class={`${styles.outputViewArea} ${csv.outputView}`}>
          <OutputBody idPrefix={idPrefix} studio={studio} />
        </div>
        <SummaryColumn studio={studio} />
      </div>
      {studio.warnings.map((message) => (
        <p key={message} class={csv.warnLine} role="status">
          <Icon name="info" class={styles.ico} /> {message}
        </p>
      ))}
    </section>
  );
}
