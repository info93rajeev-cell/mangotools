import { Icon } from '../../primitives/Icon.tsx';
import styles from './dataStudio.module.css';
import { GutterEditor } from './JsonToCsvInputPanel.tsx';
import j2c from './jsonToCsv.module.css';
import { pathLabel, summaryNote } from './jsonToCsvStudio.ts';
import parts from './studioParts.module.css';
import type { JsonToCsvStudio } from './useJsonToCsvStudio.ts';

function PreviewTable({ studio }: { studio: JsonToCsvStudio }) {
  const result = studio.result;
  if (studio.error) {
    return (
      <div class={`${styles.invalidNotice} ${j2c.notice}`} role="alert">
        <strong>Cannot convert:</strong>
        <p>{studio.error}</p>
      </div>
    );
  }
  if (!result) return <p class={j2c.empty}>Paste JSON or load the sample to see the table.</p>;
  return (
    <div class={j2c.tableWrap}>
      <table class={styles.dataTable}>
        <thead>
          <tr>
            {result.headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.previewRows.map((row, r) => (
            <tr key={String(r)}>
              {row.map((cell, c) => (
                <td key={String(c)}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function JsonToCsvTablePanel({ studio }: { studio: JsonToCsvStudio }) {
  const result = studio.result;
  const shown = result?.previewRows.length ?? 0;
  return (
    <section class={`${styles.panel} ${styles.outputPanel} ${parts.card}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={`${parts.tile} ${parts.toneBlue}`}>
            <Icon name="table-2" class={parts.tileIco} />
          </span>
          <strong>CSV Table Preview</strong>
        </div>
        <div class={`${styles.toolactions} ${j2c.headActions}`}>
          <button type="button" class={j2c.headBtn} onClick={studio.copy}>
            <Icon name="copy" class={styles.ico} /> Copy
          </button>
          <button type="button" class={j2c.headBtn} onClick={studio.download}>
            <Icon name="download" class={styles.ico} /> Download .csv
          </button>
        </div>
      </div>
      <div class={styles.rowchips}>
        <span class={styles.chipBlue}>{result?.columnCount ?? 0} selected columns</span>
        <span class={styles.chipPurple}>
          Record path: {pathLabel(studio.options.recordPath, studio.kind === 'array')}
        </span>
      </div>
      <PreviewTable studio={studio} />
      <div class={styles.noteLine}>
        <span class={styles.noteLineGreen}>
          ✓ {studio.options.unionKeys ? 'Union of keys across all records' : "First record's keys"}
        </span>
        <span>
          Preview {shown} / {result?.rowCount ?? 0}
        </span>
      </div>
    </section>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div class={`${styles.mini} ${j2c.tile} ${tone}`}>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

export function JsonToCsvSidePanel({
  idPrefix,
  studio,
}: {
  idPrefix: string;
  studio: JsonToCsvStudio;
}) {
  const r = studio.result;
  const o = studio.options;
  return (
    <div class={`${styles.side} ${j2c.side}`}>
      <section class={`${styles.panel} ${parts.card} ${j2c.summary}`}>
        <div class={styles.tooltitle}>
          <span class={`${parts.tile} ${parts.toneBlue}`}>
            <Icon name="box" class={parts.tileIco} />
          </span>
          <strong>Export Summary</strong>
        </div>
        <div class={styles.miniGrid}>
          <Tile label="Records" value={String(r?.rowCount ?? 0)} tone={j2c.tileGreen} />
          <Tile label="Columns" value={String(r?.columnCount ?? 0)} tone={j2c.tilePurple} />
          <Tile label="Missing" value={String(r?.missingCount ?? 0)} tone={j2c.tileAmber} />
          <Tile label="Format" value={o.delimiter === 'tab' ? 'TSV' : 'CSV'} tone={j2c.tilePink} />
        </div>
        {r ? <div class={styles.callout}>{summaryNote(r, o.formulaGuard)}</div> : null}
      </section>
      <section class={`${styles.panel} ${parts.card} ${j2c.output}`}>
        <div class={styles.tooltitle}>
          <span class={`${parts.tile} ${parts.tonePurple}`}>
            <Icon name="file-text" class={parts.tileIco} />
          </span>
          <strong>CSV Output</strong>
        </div>
        <GutterEditor
          id={`${idPrefix}-output`}
          value={studio.csv}
          label="CSV output"
          className={j2c.outputEditor}
        />
        <div class={styles.noteLine}>
          <span>Delimiter: {o.delimiter}</span>
          <span>Header: {o.header ? 'yes' : 'no'}</span>
        </div>
      </section>
    </div>
  );
}
