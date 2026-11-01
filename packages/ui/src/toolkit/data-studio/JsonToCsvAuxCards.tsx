import { Icon } from '../../primitives/Icon.tsx';
import styles from './dataStudio.module.css';
import j2c from './jsonToCsv.module.css';
import {
  DELIMITER_LABEL,
  type JsonToCsvDelimiter,
  type JsonToCsvNested,
  NESTED_LABEL,
  pathLabel,
} from './jsonToCsvStudio.ts';
import parts from './studioParts.module.css';
import type { JsonToCsvStudio } from './useJsonToCsvStudio.ts';

function Title({ icon, tone, text }: { icon: string; tone: string; text: string }) {
  return (
    <div class={styles.optTitle}>
      <span class={`${parts.tile} ${tone}`}>
        <Icon name={icon} class={parts.tileIco} />
      </span>
      <b>{text}</b>
    </div>
  );
}

function Check(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label class={styles.optCheckbox}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange((e.target as HTMLInputElement).checked)}
      />
      {props.label}
    </label>
  );
}

function RecordCard({ studio }: { studio: JsonToCsvStudio }) {
  const { options, setOption } = studio;
  const found = studio.result?.recordPaths ?? [];
  const paths = found.includes(options.recordPath) ? found : [options.recordPath, ...found];
  return (
    <section class={`${styles.optcard} ${j2c.optCard}`}>
      <Title icon="filter" tone={parts.toneBlue} text="Record & Columns" />
      <label class={styles.optField}>
        <span class={styles.optLabel}>Record path</span>
        <select
          class={styles.optSelect}
          value={options.recordPath}
          onChange={(e) => setOption('recordPath', (e.target as HTMLSelectElement).value)}
        >
          {paths.map((p) => (
            <option key={p} value={p}>
              {pathLabel(p, studio.kind === 'array')}
            </option>
          ))}
        </select>
      </label>
      <Check
        label="Union all keys"
        checked={options.unionKeys}
        onChange={(v) => setOption('keys', v ? 'union' : 'first')}
      />
    </section>
  );
}

function NestedCard({ studio }: { studio: JsonToCsvStudio }) {
  return (
    <section class={`${styles.optcard} ${j2c.optCard}`}>
      <Title icon="braces" tone={parts.toneGreen} text="Nested Data" />
      <label class={styles.optField}>
        <span class={styles.optLabel}>Object handling</span>
        <select
          class={styles.optSelect}
          value={studio.options.nested}
          onChange={(e) =>
            studio.setOption('nested', (e.target as HTMLSelectElement).value as JsonToCsvNested)
          }
        >
          {(Object.keys(NESTED_LABEL) as JsonToCsvNested[]).map((n) => (
            <option key={n} value={n}>
              {NESTED_LABEL[n]}
            </option>
          ))}
        </select>
      </label>
      <p class={styles.optHelptext}>
        {studio.options.nested === 'flatten'
          ? 'Arrays remain explicit JSON text.'
          : studio.options.nested === 'json'
            ? 'Objects and arrays are written as JSON text.'
            : 'A nested object or array stops the export with an error.'}
      </p>
    </section>
  );
}

function ExportCard({ studio }: { studio: JsonToCsvStudio }) {
  const { options, setOption } = studio;
  return (
    <section class={`${styles.optcard} ${j2c.optCard}`}>
      <Title icon="sliders-horizontal" tone={parts.tonePurple} text="CSV Export" />
      <label class={styles.optField}>
        <span class={styles.optLabel}>Delimiter</span>
        <select
          class={styles.optSelect}
          value={options.delimiter}
          onChange={(e) =>
            setOption('delimiter', (e.target as HTMLSelectElement).value as JsonToCsvDelimiter)
          }
        >
          {(Object.keys(DELIMITER_LABEL) as JsonToCsvDelimiter[]).map((d) => (
            <option key={d} value={d}>
              {DELIMITER_LABEL[d]}
            </option>
          ))}
        </select>
      </label>
      <div class={styles.optCheckboxRow}>
        <Check
          label="Include headers"
          checked={options.header}
          onChange={(v) => setOption('header', v)}
        />
        <Check label="UTF-8 BOM" checked={studio.bom} onChange={studio.setBom} />
      </div>
    </section>
  );
}

function SafetyCard({ studio }: { studio: JsonToCsvStudio }) {
  const count = studio.result?.formulaCount ?? 0;
  return (
    <section class={`${styles.optcard} ${j2c.optCard}`}>
      <Title icon="shield-check" tone={parts.toneAmber} text="Spreadsheet Safety" />
      <p class={j2c.safetyText}>
        Formula-like cells are flagged. Review export policy before opening untrusted values in
        spreadsheet software.
      </p>
      <Check
        label="Formula guard (=, +, -, @)"
        checked={studio.options.formulaGuard}
        onChange={(v) => studio.setOption('formulaGuard', v)}
      />
      <p class={styles.optHelptext}>
        {count === 0
          ? 'No formula-like cells found.'
          : `${count} formula-like cell${count === 1 ? '' : 's'} found.`}
      </p>
    </section>
  );
}

export function JsonToCsvAuxCards({ studio }: { studio: JsonToCsvStudio }) {
  return (
    <div class={`${styles.aux} ${j2c.aux}`}>
      <RecordCard studio={studio} />
      <NestedCard studio={studio} />
      <ExportCard studio={studio} />
      <SafetyCard studio={studio} />
    </div>
  );
}
