import styles from './dataStudio.module.css';

export function Base64AuxCards({
  variant,
  onVariant,
  padding,
  onPadding,
  lineWrap,
  onLineWrap,
}: {
  variant: 'standard' | 'url-safe';
  onVariant: (v: 'standard' | 'url-safe') => void;
  padding: boolean;
  onPadding: (p: boolean) => void;
  lineWrap: 'none' | '76';
  onLineWrap: (w: 'none' | '76') => void;
}) {
  return (
    <div class={styles.aux}>
      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9881;</span>Base64 Variant
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Alphabet</span>
          <select
            class={styles.optSelect}
            value={variant}
            onChange={(e) =>
              onVariant((e.target as HTMLSelectElement).value as 'standard' | 'url-safe')
            }
          >
            <option value="standard">Standard (RFC 4648)</option>
            <option value="url-safe">URL-safe (RFC 4648 §5)</option>
          </select>
        </label>
        <div class={styles.optCheckboxRow}>
          <label class={styles.optCheckbox}>
            <input
              type="checkbox"
              checked={padding}
              onChange={(e) => onPadding((e.target as HTMLInputElement).checked)}
            />
            Keep padding (=)
          </label>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128196;</span>Text &amp; Encoding
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Character set</span>
          <select class={styles.optSelect} disabled value="utf8">
            <option value="utf8">UTF-8 Unicode</option>
          </select>
        </label>
        <div class={styles.optHelptext}>
          Emoji and international scripts preserved without loss.
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9889;</span>Line Formatting
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Line wrapping</span>
          <select
            class={styles.optSelect}
            value={lineWrap}
            onChange={(e) => onLineWrap((e.target as HTMLSelectElement).value as 'none' | '76')}
          >
            <option value="none">None (Single line)</option>
            <option value="76">76 characters (MIME)</option>
          </select>
        </label>
        <div class={styles.optHelptext}>MIME &middot; Data URI &middot; Whitespace policy</div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128737;</span>Safety &amp; Diagnostics
        </div>
        <div class={styles.optHelptext}>
          Invalid alphabet, padding and UTF-8 decoding errors are reported distinctly. No network
          upload.
        </div>
      </section>
    </div>
  );
}
