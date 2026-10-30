import { useState } from 'preact/hooks';
import styles from './dataStudio.module.css';
import { COMMON_TIMEZONES } from './useTimestampStudio.ts';

export function TimestampAuxCards({
  customDate,
  onDateChange,
  timezone,
  onTimezoneChange,
  unit,
  onUnitChange,
}: {
  customDate: string;
  onDateChange: (d: string) => void;
  timezone: string;
  onTimezoneChange: (t: string) => void;
  unit: string;
  onUnitChange: (u: 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds') => void;
}) {
  const [batchOpen, setBatchOpen] = useState(false);

  return (
    <div class={styles.aux}>
      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#128197;</span>Date &rarr; Timestamp
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Date</span>
          <input
            type="date"
            class={styles.optSelect}
            value={customDate}
            onChange={(e) => onDateChange((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class={styles.optCheckboxRow}>
          <span class={styles.chipGreen}>00:00:00 UTC</span>
        </div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#127758;</span>Time Zone
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Display zone</span>
          <select
            class={styles.optSelect}
            value={timezone}
            onChange={(e) => onTimezoneChange((e.target as HTMLSelectElement).value)}
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.id} value={tz.id}>
                {tz.label}
              </option>
            ))}
          </select>
        </label>
        <div class={styles.optHelptext}>UTC always shown alongside selected zone</div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9881;</span>Precision
        </div>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Input unit</span>
          <select
            class={styles.optSelect}
            value={unit}
            onChange={(e) =>
              onUnitChange(
                (e.target as HTMLSelectElement).value as
                  | 'seconds'
                  | 'milliseconds'
                  | 'microseconds'
                  | 'nanoseconds',
              )
            }
          >
            <option value="seconds">Explicit seconds (10 digits)</option>
            <option value="milliseconds">Milliseconds (13 digits)</option>
            <option value="microseconds">Microseconds (16 digits)</option>
            <option value="nanoseconds">Nanoseconds (19 digits)</option>
          </select>
        </label>
        <div class={styles.optHelptext}>Integer-safe &micro;s/ns where supported</div>
      </section>

      <section class={styles.optcard}>
        <div class={styles.optTitle}>
          <span class={styles.optIcon}>&#9889;</span>Advanced
        </div>
        <button
          type="button"
          class={styles.optSelect}
          style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
          onClick={() => setBatchOpen(!batchOpen)}
        >
          <span>Batch conversion</span>
          <span>{batchOpen ? '▲' : '▼'}</span>
        </button>
        <div class={styles.optHelptext} style={{ marginTop: 2 }}>
          {batchOpen
            ? 'Paste comma or line-separated timestamps in the input panel to convert in bulk.'
            : 'Negative epochs &middot; DST warnings &middot; custom formats'}
        </div>
      </section>
    </div>
  );
}
