import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { InfoTile } from './Base64InputPanel.tsx';
import { countLines, EXAMPLE_GROUPS, sizeChange } from './base64Studio.ts';
import { formatBytes } from './csvToJsonResult.ts';
import styles from './dataStudio.module.css';
import { ToggleSwitchRow } from './JsonFormatterAuxCards.tsx';
import parts from './studioParts.module.css';
import type { Base64Studio } from './useBase64Studio.ts';

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

function OptionsCard({ studio }: { studio: Base64Studio }) {
  const { options, setOption } = studio;
  const dir = options.direction;
  return (
    <section class={`${styles.optcard} ${parts.auxCard} ${parts.areaOptions}`}>
      <Title icon="settings" tone={parts.toneBlue} text="Options" />
      <div class={parts.b64OptGrid}>
        <div class={parts.optionsCol}>
          <span class={styles.optLabel}>Encoding Mode</span>
          <div class={parts.modePair}>
            {(['encode', 'decode'] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={studio.mode !== 'auto' && dir === d}
                class={`${parts.inputTab} ${parts.toneBlue} ${studio.mode !== 'auto' && dir === d ? parts.inputTabActive : ''}`}
                onClick={() => studio.setMode(d)}
              >
                <Icon name="arrow-left-right" class={parts.inputTabIco} />
                {d === 'encode' ? 'Encode to Base64' : 'Decode from Base64'}
              </button>
            ))}
          </div>
          <label class={styles.optField}>
            <span class={styles.optLabel}>Character Encoding</span>
            <select
              class={styles.optSelect}
              value={options.charset}
              disabled={studio.file !== null}
              onChange={(e) => setOption('charset', (e.target as HTMLSelectElement).value)}
            >
              <option value="utf-8">UTF-8 (Unicode)</option>
              <option value="latin1">ISO-8859-1 (Latin-1)</option>
            </select>
          </label>
          <p class={parts.hint}>
            {studio.file
              ? 'Files are encoded byte for byte.'
              : 'UTF-8 supports all languages and special characters.'}{' '}
            Base64 is encoding, not encryption.
          </p>
        </div>
        <div class={styles.switchList}>
          <ToggleSwitchRow
            label="Remove line breaks (MIME)"
            tooltip="On: one line. Off: a line break every 76 characters, as in e-mail (MIME)."
            checked={options.oneLine}
            onChange={(v) => setOption('lineLength', v ? '0' : '76')}
          />
          <ToggleSwitchRow
            label="Add padding (=)"
            checked={options.padding}
            onChange={(v) => setOption('padding', v)}
          />
          <ToggleSwitchRow
            label="URL safe encoding (Base64URL)"
            tooltip="Uses - and _ instead of + and /. Decoding accepts both."
            checked={options.urlSafe}
            onChange={studio.setUrlSafe}
          />
          <ToggleSwitchRow
            label="Auto detect input type"
            tooltip="Decodes when the input looks like Base64, otherwise encodes."
            checked={studio.mode === 'auto'}
            onChange={(v) => studio.setMode(v ? 'auto' : dir)}
          />
        </div>
      </div>
    </section>
  );
}

function QuickActions({ studio }: { studio: Base64Studio }) {
  return (
    <section class={`${styles.optcard} ${parts.auxCard} ${parts.areaQuick}`}>
      <Title icon="zap" tone={parts.toneBlue} text="Quick Actions" />
      <div class={parts.quickList}>
        <button type="button" class={parts.quickBlue} onClick={studio.copy}>
          <Icon name="copy" class={styles.ico} /> Copy Output
        </button>
        <button type="button" class={parts.quickBlue} onClick={studio.download}>
          <Icon name="download" class={styles.ico} /> Download as File
        </button>
        <button type="button" class={parts.quickBlue} onClick={studio.swap}>
          <Icon name="arrow-left-right" class={styles.ico} /> Swap Input ↔ Output
        </button>
        <button type="button" class={parts.quickRed} onClick={studio.clearAll}>
          <Icon name="trash-2" class={styles.ico} /> Clear All
        </button>
      </div>
    </section>
  );
}

const RELATED = [
  {
    href: '/json-formatter',
    name: 'JSON Formatter & Validator',
    note: 'Format and validate JSON data.',
    icon: 'braces',
    tone: parts.toneAmber,
  },
  {
    href: '/url-encode-decode',
    name: 'URL Encode & Decode',
    note: 'Encode or decode URLs.',
    icon: 'link',
    tone: parts.tonePurple,
  },
  {
    href: '/csv-to-json',
    name: 'CSV to JSON',
    note: 'Convert CSV to JSON array.',
    icon: 'file-spreadsheet',
    tone: parts.toneGreen,
  },
  {
    href: '/json-to-csv',
    name: 'JSON to CSV',
    note: 'Convert JSON to CSV.',
    icon: 'table-2',
    tone: parts.toneBlue,
  },
  {
    href: '/timestamp-converter',
    name: 'Timestamp Converter',
    note: 'Convert timestamps to readable dates.',
    icon: 'clock',
    tone: parts.tonePurple,
  },
];

function RelatedTools() {
  return (
    <section class={`${styles.optcard} ${parts.auxCard} ${parts.areaRelated}`}>
      <Title icon="link" tone={parts.toneBlue} text="Related Tools" />
      <ul class={parts.relatedList}>
        {RELATED.map((r) => (
          <li key={r.href}>
            <a class={parts.relatedItem} href={r.href}>
              <span class={`${parts.tileSm} ${r.tone}`}>
                <Icon name={r.icon} class={parts.tileIcoSm} />
              </span>
              <span class={parts.sumText}>
                <b>{r.name}</b>
                <small>{r.note}</small>
              </span>
              <Icon name="chevron-right" class={styles.ico} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Examples({ studio }: { studio: Base64Studio }) {
  const groups = Object.keys(EXAMPLE_GROUPS);
  const [group, setGroup] = useState(groups[0]);
  return (
    <section class={`${styles.optcard} ${parts.auxCard} ${parts.areaExamples}`}>
      <div class={parts.exHead}>
        <Title icon="lightbulb" tone={parts.toneAmber} text="Examples" />
        <div class={parts.exTabs}>
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              class={`${styles.segChip} ${group === g ? styles.segChipActive : ''}`}
              onClick={() => setGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <ul class={parts.exList}>
        {EXAMPLE_GROUPS[group].map((text) => (
          <li key={text} class={parts.exItem}>
            <span class={parts.exText}>{text}</span>
            <button
              type="button"
              class={styles.btnSecondary}
              onClick={() => studio.applyExample(text, group === 'File')}
            >
              Use
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResultSummary({ studio }: { studio: Base64Studio }) {
  const r = studio.result;
  const encoding = studio.options.direction === 'encode';
  const inBytes = studio.file
    ? studio.file.size
    : encoding
      ? (r?.inputByteLength ?? 0)
      : studio.draft.length;
  const outBytes = r ? (encoding ? r.text.length : r.byteLength) : 0;
  const total = inBytes + outBytes || 1;
  const binary = r && !r.isUtf8;
  return (
    <section class={`${styles.optcard} ${parts.auxCard} ${parts.areaSummary}`}>
      <Title icon="chart-column" tone={parts.tonePurple} text="Result Summary" />
      <div class={parts.infoGrid}>
        <InfoTile
          icon="file-text"
          tone={parts.toneGreen}
          label="Input Size"
          value={formatBytes(inBytes)}
        />
        <InfoTile
          icon="file-text"
          tone={parts.toneBlue}
          label="Output Size"
          value={formatBytes(outBytes)}
        />
        <InfoTile
          icon="chart-column"
          tone={parts.tonePink}
          label="Size change"
          value={sizeChange(inBytes, outBytes)}
        />
        <InfoTile
          icon="list"
          tone={parts.tonePurple}
          label="Lines"
          value={String(binary ? 0 : countLines(studio.outputText))}
        />
      </div>
      <div class={parts.ratioBar} aria-hidden="true">
        <span style={{ width: `${(inBytes / total) * 100}%` }} />
        <span style={{ width: `${(outBytes / total) * 100}%` }} />
      </div>
      <div class={parts.ratioLegend}>
        <span>
          Input ({encoding ? 'Text' : 'Base64'}) · {formatBytes(inBytes)}
        </span>
        <span>
          Output ({encoding ? 'Base64' : binary ? 'File' : 'Text'}) · {formatBytes(outBytes)}
        </span>
      </div>
    </section>
  );
}

export function Base64AuxCards({ studio }: { studio: Base64Studio }) {
  return (
    <div class={`${styles.aux} ${parts.b64Aux}`}>
      <OptionsCard studio={studio} />
      <QuickActions studio={studio} />
      <RelatedTools />
      <Examples studio={studio} />
      <ResultSummary studio={studio} />
    </div>
  );
}
