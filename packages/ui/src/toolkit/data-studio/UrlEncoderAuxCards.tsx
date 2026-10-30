import styles from './dataStudio.module.css';

export function UrlEncoderAuxCards({
  mode,
  direction,
  onModeChange,
  queryParams,
}: {
  mode: 'component' | 'full-url' | 'form';
  direction: 'encode' | 'decode';
  onModeChange: (m: 'component' | 'full-url' | 'form', d?: 'encode' | 'decode') => void;
  queryParams: [string, string][];
}) {
  const opValue = `${direction}-${mode}`;

  return (
    <div class={styles.aux}>
      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9881;</span>Encoding Mode
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Operation</span>
          <select
            class={styles.optSelect}
            value={opValue}
            onChange={(e) => {
              const val = (e.target as HTMLSelectElement).value;
              if (val === 'encode-component') onModeChange('component', 'encode');
              else if (val === 'decode-component') onModeChange('component', 'decode');
              else if (val === 'encode-full-url') onModeChange('full-url', 'encode');
              else if (val === 'decode-full-url') onModeChange('full-url', 'decode');
              else if (val === 'encode-form') onModeChange('form', 'encode');
              else if (val === 'decode-form') onModeChange('form', 'decode');
            }}
          >
            <option value="encode-component">Encode component</option>
            <option value="decode-component">Decode component</option>
            <option value="encode-full-url">Encode full URL</option>
            <option value="decode-full-url">Decode full URL</option>
            <option value="encode-form">Form / Query (spaces as +)</option>
          </select>
        </label>
        <div class={styles.optCheckboxRow}>
          <span class={styles.chipGreen}>✓ UTF-8</span>
          <span class={styles.chipBlue}>Double-decode safe</span>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9776;</span>Query Parameters ({queryParams.length})
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 60 }}>
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
        <div class={styles.optHelptext} style={{ marginTop: 2 }}>
          Repeated keys and blank values retained
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9889;</span>Character Rules
        </div>
        <div class={styles.rowchips}>
          <span class={styles.chipBlue}>%20 &bull; space</span>
          <span class={styles.chipPurple}>%2B &bull; +</span>
          <span class={styles.chipAmber}>%26 &bull; &amp;</span>
          <span class={styles.chipGreen}>%2F &bull; /</span>
        </div>
        <div class={styles.optHelptext} style={{ marginTop: 4 }}>
          RFC 3986 standard URI percent escapes.
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128737;</span>Error Handling
        </div>
        <div class={styles.optHelptext}>
          Malformed % sequences and invalid UTF-8 show a clear error. No network fetch or silent
          repeated decoding.
        </div>
      </section>
    </div>
  );
}
