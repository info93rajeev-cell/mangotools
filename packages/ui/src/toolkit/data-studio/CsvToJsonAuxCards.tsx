import styles from './dataStudio.module.css';

export function CsvToJsonAuxCards({
  delimiterChoice,
  onDelimiter,
  formatShape,
  onFormatShape,
  firstRowHeaders,
  onFirstRowHeaders,
}: {
  delimiterChoice: 'auto' | ',' | ';' | '\t' | '|';
  onDelimiter: (d: 'auto' | ',' | ';' | '\t' | '|') => void;
  formatShape: 'objects' | '2d-array' | 'ndjson';
  onFormatShape: (s: 'objects' | '2d-array' | 'ndjson') => void;
  firstRowHeaders?: boolean;
  onFirstRowHeaders?: (v: boolean) => void;
}) {
  return (
    <div class={styles.aux}>
      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9881;</span>Parsing Options
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Delimiter</span>
          <select
            class={styles.optSelect}
            value={delimiterChoice}
            onChange={(e) =>
              onDelimiter((e.target as HTMLSelectElement).value as 'auto' | ',' | ';' | '\t' | '|')
            }
          >
            <option value="auto">Auto detected: comma</option>
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="&#9;">Tab (\t)</option>
            <option value="|">Pipe (|)</option>
          </select>
        </label>
        <div class={styles.optCheckboxRow}>
          <label class={styles.optCheckbox}>
            <input
              type="checkbox"
              checked={firstRowHeaders ?? true}
              onChange={(e) => onFirstRowHeaders?.((e.target as HTMLInputElement).checked)}
            />
            First row headers
          </label>
          <span class={styles.chipGreen}>Trim whitespace</span>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128737;</span>Data Fidelity
        </div>
        <div class={styles.rowchips}>
          <span class={styles.chipGreen}>Strings first</span>
          <span class={styles.chipAmber}>Keep 00124</span>
        </div>
        <div class={styles.optHelptext} style={{ marginTop: 4 }}>
          No automatic numeric coercion. ID and SKU columns stay intact without truncation.
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#123;&#125;</span>Output Shape
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>JSON format</span>
          <select
            class={styles.optSelect}
            value={formatShape}
            onChange={(e) =>
              onFormatShape(
                (e.target as HTMLSelectElement).value as 'objects' | '2d-array' | 'ndjson',
              )
            }
          >
            <option value="objects">Array of objects</option>
            <option value="2d-array">Array of arrays (2D)</option>
            <option value="ndjson">JSON Lines (NDJSON)</option>
          </select>
        </label>
        <div class={styles.optCheckboxRow}>
          <label class={styles.optCheckbox}>
            <input
              type="checkbox"
              checked={formatShape === 'ndjson'}
              onChange={(e) =>
                onFormatShape((e.target as HTMLInputElement).checked ? 'ndjson' : 'objects')
              }
            />
            JSON Lines
          </label>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9889;</span>Advanced Parsing
        </div>
        <div class={styles.optHelptext}>
          Quotes &middot; multiline fields &middot; BOM &middot; blank/null policy &middot; ragged
          rows.
        </div>
      </section>
    </div>
  );
}
