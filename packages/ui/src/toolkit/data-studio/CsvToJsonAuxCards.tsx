import { Icon } from '../../primitives/Icon.tsx';
import csv from './csvToJson.module.css';
import {
  type CsvColumnType,
  type CsvShape,
  countColumnTypes,
  formatBytes,
  SHAPE_LABEL,
  toggleExcluded,
  utf8Bytes,
} from './csvToJsonResult.ts';
import styles from './dataStudio.module.css';
import { ToggleSwitchRow } from './JsonFormatterAuxCards.tsx';
import type { CsvStudio } from './useCsvToJsonStudio.ts';

const TYPE_BADGE: Readonly<Record<CsvColumnType, string>> = {
  string: csv.badgeString,
  number: csv.badgeNumber,
  boolean: csv.badgeBoolean,
  null: csv.badgeNull,
  mixed: csv.badgeMixed,
};

const TYPE_LABEL: Readonly<Record<CsvColumnType, string>> = {
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  null: 'Null',
  mixed: 'Mixed',
};

function CardTitle({ icon, tone, title }: { icon: string; tone: string; title: string }) {
  return (
    <div class={styles.optTitle}>
      <span class={`${csv.tile} ${tone}`}>
        <Icon name={icon} class={csv.tileIco} />
      </span>
      <b>{title}</b>
    </div>
  );
}

function ColumnMappings({ studio }: { studio: CsvStudio }) {
  const columns = studio.result?.columns ?? [];
  return (
    <section class={`${styles.optcard} ${csv.auxCard}`}>
      <CardTitle icon="table-2" tone={csv.tonePink} title="Column Mappings" />
      <div class={csv.mapWrap}>
        <table class={csv.mapTable}>
          <thead>
            <tr>
              <th>Column</th>
              <th>Sample Value</th>
              <th>Detected Type</th>
              <th>Include</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((column, i) => (
              <tr key={`${i}-${column.name}`} class={column.included ? '' : csv.mapExcluded}>
                <td class={csv.mono}>{column.name}</td>
                <td class={csv.mono}>{column.sample}</td>
                <td>
                  <span class={`${csv.badge} ${TYPE_BADGE[column.type]}`}>
                    {TYPE_LABEL[column.type]}
                  </span>
                </td>
                <td>
                  <label class={styles.toggleWrap}>
                    <input
                      type="checkbox"
                      class={styles.toggleInput}
                      checked={column.included}
                      aria-label={`Include column ${column.name}`}
                      onChange={(e) =>
                        studio.setOption(
                          'excludeColumns',
                          toggleExcluded(
                            studio.options.excludeColumns,
                            i,
                            (e.target as HTMLInputElement).checked,
                          ),
                        )
                      }
                    />
                    <span class={styles.toggleSlider} />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OutputOptions({ studio }: { studio: CsvStudio }) {
  const { options, setOption } = studio;
  return (
    <section class={`${styles.optcard} ${csv.auxCard}`}>
      <CardTitle icon="settings-2" tone={csv.toneGreen} title="Output Options" />
      <div class={styles.optFieldsRow}>
        <label class={styles.optField}>
          <span class={styles.optLabel}>JSON Format</span>
          <select
            class={styles.optSelect}
            value={options.shape}
            onChange={(e) => setOption('shape', (e.target as HTMLSelectElement).value)}
          >
            {(Object.keys(SHAPE_LABEL) as CsvShape[]).map((shape) => (
              <option key={shape} value={shape}>
                {SHAPE_LABEL[shape]}
              </option>
            ))}
          </select>
        </label>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Indentation</span>
          <select
            class={styles.optSelect}
            value={options.pretty ? '2' : 'min'}
            disabled={options.shape === 'ndjson'}
            onChange={(e) => setOption('pretty', (e.target as HTMLSelectElement).value === '2')}
          >
            <option value="2">2 spaces</option>
            <option value="min">Minified</option>
          </select>
        </label>
      </div>
      <div class={styles.switchList}>
        <ToggleSwitchRow
          label="Convert empty values to null"
          checked={options.emptyAsNull}
          onChange={(v) => setOption('emptyAsNull', v)}
        />
        <ToggleSwitchRow
          label="Add metadata (rows, columns)"
          tooltip="Wraps the result as { meta, data }. Not used for JSON Lines."
          checked={options.metadata}
          onChange={(v) => setOption('metadata', v)}
        />
      </div>
    </section>
  );
}

function SummaryTile(props: { icon: string; tone: string; label: string; value: string }) {
  return (
    <div class={csv.sumTile}>
      <span class={`${csv.tileSm} ${props.tone}`}>
        <Icon name={props.icon} class={csv.tileIcoSm} />
      </span>
      <span class={csv.sumText}>
        <small>{props.label}</small>
        <b>{props.value}</b>
      </span>
    </div>
  );
}

function ResultSummary({ studio }: { studio: CsvStudio }) {
  const result = studio.result;
  const counts = countColumnTypes(result?.columns ?? []);
  const kinds = Object.values(counts).filter((n) => n > 0).length;
  const valid = Boolean(result) && !studio.error;
  return (
    <section class={`${styles.optcard} ${csv.auxCard}`}>
      <CardTitle icon="chart-column" tone={csv.toneAmber} title="Result Summary" />
      <div class={csv.sumGrid}>
        <SummaryTile
          icon="file-text"
          tone={csv.toneGreen}
          label="Rows"
          value={String(result?.rowCount ?? 0)}
        />
        <SummaryTile
          icon="list"
          tone={csv.tonePurple}
          label="Columns"
          value={String(result?.columnCount ?? 0)}
        />
        <SummaryTile
          icon="code-xml"
          tone={csv.tonePink}
          label="JSON Size"
          value={formatBytes(result ? utf8Bytes(result.text) : 0)}
        />
        <SummaryTile icon="table-2" tone={csv.toneBlue} label="Data Types" value={String(kinds)} />
        <SummaryTile
          icon="file-braces"
          tone={csv.toneBlue}
          label="Output Format"
          value={SHAPE_LABEL[studio.options.shape]}
        />
        <div class={`${csv.sumTile} ${valid ? csv.sumOk : csv.sumBad}`}>
          <span class={csv.validDot}>
            <Icon name={valid ? 'check' : 'x'} class={csv.tileIcoSm} />
          </span>
          <span class={csv.sumText}>
            <small>Valid JSON</small>
            <b>{valid ? 'Yes' : 'No'}</b>
          </span>
        </div>
      </div>
    </section>
  );
}

function QuickActions({ studio }: { studio: CsvStudio }) {
  return (
    <section class={`${styles.optcard} ${csv.auxCard}`}>
      <CardTitle icon="zap" tone={csv.toneAmber} title="Quick Actions" />
      <div class={csv.quickList}>
        <button type="button" class={csv.quickGold} onClick={studio.convert}>
          <Icon name="refresh-ccw" class={styles.ico} /> Convert to JSON
        </button>
        <button type="button" class={csv.quickBlue} onClick={studio.copy}>
          <Icon name="copy" class={styles.ico} /> Copy Output
        </button>
        <button type="button" class={csv.quickBlue} onClick={studio.download}>
          <Icon name="download" class={styles.ico} /> Download JSON
        </button>
        <button type="button" class={csv.quickRed} onClick={studio.clearAll}>
          <Icon name="trash-2" class={styles.ico} /> Clear All
        </button>
      </div>
    </section>
  );
}

export function CsvToJsonAuxCards({ studio }: { studio: CsvStudio }) {
  return (
    <div class={`${styles.aux} ${csv.aux}`}>
      <ColumnMappings studio={studio} />
      <OutputOptions studio={studio} />
      <ResultSummary studio={studio} />
      <QuickActions studio={studio} />
    </div>
  );
}
