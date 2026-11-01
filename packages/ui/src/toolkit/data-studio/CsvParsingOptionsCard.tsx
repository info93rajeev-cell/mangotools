import { Icon } from '../../primitives/Icon.tsx';
import { type CsvDelimiterChoice, DELIMITER_LABEL } from './csvToJsonResult.ts';
import styles from './dataStudio.module.css';
import { ToggleSwitchRow } from './JsonFormatterAuxCards.tsx';
import csv from './studioParts.module.css';
import type { CsvStudio } from './useCsvToJsonStudio.ts';

const DELIMITERS: CsvDelimiterChoice[] = ['comma', 'semicolon', 'tab', 'pipe', 'auto'];

function ParsingOptions({ studio }: { studio: CsvStudio }) {
  const { options, setOption, result } = studio;
  return (
    <div class={csv.optionsCol}>
      <div class={styles.optTitle}>
        <span class={`${csv.tile} ${csv.tonePurple}`}>
          <Icon name="settings" class={csv.tileIco} />
        </span>
        <b>Parsing Options</b>
      </div>
      <div class={csv.parsingGrid}>
        <label class={styles.optField}>
          <span class={styles.optLabel}>Delimiter</span>
          <select
            class={styles.optSelect}
            value={options.delimiter}
            onChange={(e) => setOption('delimiter', (e.target as HTMLSelectElement).value)}
          >
            {DELIMITERS.map((d) => (
              <option key={d} value={d}>
                {d === 'auto' && options.delimiter === 'auto' && result
                  ? `Auto: ${DELIMITER_LABEL[result.delimiter]}`
                  : DELIMITER_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
        <div class={styles.switchList}>
          <ToggleSwitchRow
            label="First row as header"
            checked={options.header}
            onChange={(v) => setOption('header', v)}
          />
          <ToggleSwitchRow
            label="Auto detect data types"
            tooltip="Off: every value stays text. On: 30 → 30 and true → true. Codes like 00124 and 1.50 always stay text."
            checked={options.inferTypes}
            onChange={(v) => setOption('inferTypes', v)}
          />
          <ToggleSwitchRow
            label="Trim spaces"
            checked={options.trim}
            onChange={(v) => setOption('trim', v)}
          />
          <ToggleSwitchRow
            label="Skip empty rows"
            checked={options.skipEmptyRows}
            onChange={(v) => setOption('skipEmptyRows', v)}
          />
        </div>
      </div>
    </div>
  );
}

function AdvancedOptions({ studio }: { studio: CsvStudio }) {
  const { options, setOption } = studio;
  const customNulls = options.nullValues !== '';
  return (
    <div class={csv.optionsCol}>
      <div class={styles.optTitle}>
        <span class={`${csv.tile} ${csv.toneGreen}`}>
          <Icon name="sliders-horizontal" class={csv.tileIco} />
        </span>
        <b>Advanced Options</b>
      </div>
      <div class={styles.switchList}>
        <ToggleSwitchRow
          label="Ignore quoted commas"
          tooltip="Always on: a comma inside double quotes stays part of the value (RFC 4180)."
          checked
          disabled
          onChange={() => undefined}
        />
        <ToggleSwitchRow
          label="Handle special characters"
          tooltip="Always on: quotes, line breaks inside quotes, Unicode and a leading byte order mark are handled."
          checked
          disabled
          onChange={() => undefined}
        />
        <ToggleSwitchRow
          label="Custom null values"
          checked={customNulls}
          onChange={(v) => setOption('nullValues', v ? 'null, NA, N/A' : '')}
        />
      </div>
      <input
        class={`${styles.optSelect} ${csv.textInput}`}
        type="text"
        value={options.nullValues}
        disabled={!customNulls}
        placeholder="e.g. null, NA, N/A"
        aria-label="Custom null values, comma-separated"
        onChange={(e) => setOption('nullValues', (e.target as HTMLInputElement).value)}
      />
      <label class={csv.inlineField}>
        <span class={styles.optLabel}>Maximum rows (optional)</span>
        <input
          class={`${styles.optSelect} ${csv.textInput} ${csv.numberInput}`}
          type="text"
          inputMode="numeric"
          value={options.maxRows}
          placeholder="e.g. 1000"
          onChange={(e) => {
            const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 7);
            setOption('maxRows', digits);
          }}
        />
      </label>
    </div>
  );
}

export function CsvParsingOptionsCard({ studio }: { studio: CsvStudio }) {
  return (
    <section class={`${styles.panel} ${csv.card} ${csv.optionsCard}`}>
      <ParsingOptions studio={studio} />
      <AdvancedOptions studio={studio} />
    </section>
  );
}
