import styles from './dataStudio.module.css';

export function UrlEncoderAuxCards({
  mode,
  onMode,
  queryParams,
}: {
  mode: 'component' | 'full-url' | 'form';
  onMode: (m: 'component' | 'full-url' | 'form') => void;
  queryParams: [string, string][];
}) {
  return (
    <div class={styles.aux}>
      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9881;</span>Mode
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Operation Mode</span>
          <select
            class={styles.optSelect}
            value={mode}
            onChange={(e) =>
              onMode((e.target as HTMLSelectElement).value as 'component' | 'full-url' | 'form')
            }
          >
            <option value="component">Component (encodeURIComponent)</option>
            <option value="full-url">Full URL (encodeURI)</option>
            <option value="form">Form Data (spaces as +)</option>
          </select>
        </label>
        <div class={styles.optCheckboxRow}>
          <span class={styles.chipGreen}>UTF-8 Safe</span>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9776;</span>Query Params ({queryParams.length})
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 85 }}>
          {queryParams.length > 0 ? (
            queryParams.map(([k, v]) => (
              <div key={k} class={styles.kv}>
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))
          ) : (
            <div class={styles.optHelptext}>No ?key=val parameters detected in text.</div>
          )}
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9889;</span>Rules
        </div>
        <div class={styles.rowchips}>
          <span class={styles.chipBlue}>%20 &bull; space</span>
          <span class={styles.chipPurple}>%2B &bull; +</span>
          <span class={styles.chipAmber}>%26 &bull; &amp;</span>
        </div>
        <div class={styles.optHelptext} style={{ marginTop: 4 }}>
          RFC 3986 standard escapes.
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128737;</span>Diagnostics
        </div>
        <div class={styles.optHelptext}>
          Malformed % sequences and invalid UTF-8 report clear errors.
        </div>
      </section>
    </div>
  );
}
