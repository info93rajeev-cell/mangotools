import { Icon } from '../../primitives/Icon.tsx';
import { countLines, EXAMPLE_GROUPS, sizeChange } from './base64Studio.ts';
import { formatBytes } from './csvToJsonResult.ts';
import styles from './dataStudio.module.css';
import { ToggleSwitchRow } from './JsonFormatterAuxCards.tsx';
import { CardTitle, ExamplesCard, InfoTile, RelatedToolsCard } from './studioCards.tsx';
import parts from './studioParts.module.css';
import type { Base64Studio } from './useBase64Studio.ts';

function OptionsCard({ studio }: { studio: Base64Studio }) {
  const { options, setOption } = studio;
  const dir = options.direction;
  return (
    <section class={`${styles.optcard} ${parts.auxCard} ${parts.areaOptions}`}>
      <CardTitle icon="settings" tone={parts.toneBlue} text="Options" />
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
      <CardTitle icon="zap" tone={parts.toneBlue} text="Quick Actions" />
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
      <CardTitle icon="chart-column" tone={parts.tonePurple} text="Result Summary" />
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
      <RelatedToolsCard current="/base64-encode-decode" className={parts.areaRelated} />
      <ExamplesCard
        groups={EXAMPLE_GROUPS}
        className={parts.areaExamples}
        onUse={(text, group) => studio.applyExample(text, group === 'File')}
      />
      <ResultSummary studio={studio} />
    </div>
  );
}
