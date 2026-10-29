import styles from './dataStudio.module.css';

export function JsonToCsvAuxCards({
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
