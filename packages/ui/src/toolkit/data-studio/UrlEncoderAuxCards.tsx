import { Icon } from '../../primitives/Icon.tsx';
import { countLines, sizeChange } from './base64Studio.ts';
import { formatBytes, utf8Bytes } from './csvToJsonResult.ts';
import styles from './dataStudio.module.css';
import { ToggleSwitchRow } from './JsonFormatterAuxCards.tsx';
import { CardTitle, ExamplesCard, InfoTile, RelatedToolsCard } from './studioCards.tsx';
import parts from './studioParts.module.css';
import { MODE_LABEL, URL_EXAMPLES, type UrlMode } from './urlStudio.ts';
import type { UrlStudio } from './useUrlEncoderStudio.ts';

function EncodingOptions({ studio }: { studio: UrlStudio }) {
  const { options, setOption } = studio;
  const rows = studio.source === 'query' || studio.source === 'form';
  return (
    <section class={`${styles.optcard} ${parts.auxCard} ${parts.urlAreaOptions}`}>
      <CardTitle icon="settings" tone={parts.tonePurple} text="Encoding Options" />
      <div class={`${parts.b64OptGrid} ${parts.urlOptGrid}`}>
        <div class={parts.optionsCol}>
          <label class={styles.optField}>
            <span class={styles.optLabel}>Encode type</span>
            <select
              class={styles.optSelect}
              value={options.mode}
              disabled={rows}
              onChange={(e) => studio.setMode((e.target as HTMLSelectElement).value as UrlMode)}
            >
              {(Object.keys(MODE_LABEL) as UrlMode[]).map((m) => (
                <option key={m} value={m}>
                  {MODE_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
          <p class={parts.hint}>
            Supports all languages and special characters. Malformed % sequences show a clear error.
          </p>
        </div>
        <div class={styles.switchList}>
          <ToggleSwitchRow
            label="Encode spaces as %20"
            tooltip="Off writes a space as +, the form-data convention."
            checked={options.spacesAsPercent}
            onChange={(v) => setOption('space', v ? 'percent' : 'plus')}
          />
          <ToggleSwitchRow
            label="Encode special characters"
            tooltip="Encodes ! ' ( ) * too (RFC 3986). Off matches JavaScript's encodeURIComponent."
            checked={options.encodeSubDelims}
            onChange={(v) => setOption('encodeSubDelims', v)}
          />
          <ToggleSwitchRow
            label="Keep existing encoding"
            tooltip="Leaves %XX sequences as they are, so already-encoded text is not encoded twice."
            checked={options.keepEscapes}
            onChange={(v) => setOption('keepEscapes', v)}
          />
          <ToggleSwitchRow
            label="Convert line breaks (CRLF)"
            tooltip="Turns line breaks into CR LF before encoding, as HTML forms send them."
            checked={options.crlf}
            onChange={(v) => setOption('crlf', v)}
          />
          <ToggleSwitchRow
            label="Encode each line separately"
            tooltip="Keeps line breaks and encodes every line on its own."
            checked={options.perLine}
            onChange={(v) => setOption('perLine', v)}
          />
        </div>
      </div>
    </section>
  );
}

function QuickActions({ studio }: { studio: UrlStudio }) {
  return (
    <section class={`${styles.optcard} ${parts.auxCard} ${parts.urlAreaQuick}`}>
      <CardTitle icon="zap" tone={parts.toneAmber} text="Quick Actions" />
      <div class={parts.quickList}>
        <button type="button" class={parts.quickBlue} onClick={studio.swap}>
          <Icon name="arrow-left-right" class={styles.ico} /> Swap Input ⇄ Output
        </button>
        <button type="button" class={parts.quickGreen} onClick={studio.copy}>
          <Icon name="copy" class={styles.ico} /> Copy Output
        </button>
        <button type="button" class={parts.quickPurple} onClick={studio.download}>
          <Icon name="download" class={styles.ico} /> Download as File
        </button>
        <button type="button" class={parts.quickRed} onClick={studio.clearAll}>
          <Icon name="trash-2" class={styles.ico} /> Clear All
        </button>
      </div>
    </section>
  );
}

function ResultSummary({ studio }: { studio: UrlStudio }) {
  const rows = studio.source === 'query' || studio.source === 'form';
  const inText = rows ? studio.rows.map(([k, v]) => `${k}=${v}`).join('&') : studio.draft;
  const inBytes = utf8Bytes(inText);
  const outBytes = utf8Bytes(studio.outputText);
  return (
    <section class={`${styles.optcard} ${parts.auxCard} ${parts.urlAreaSummary}`}>
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
          label="Expansion"
          value={sizeChange(inBytes, outBytes)}
        />
        <InfoTile
          icon="list"
          tone={parts.tonePurple}
          label="Lines"
          value={String(countLines(studio.outputText))}
        />
      </div>
    </section>
  );
}

export function UrlEncoderAuxCards({ studio }: { studio: UrlStudio }) {
  return (
    <div class={`${styles.aux} ${parts.urlAux}`}>
      <EncodingOptions studio={studio} />
      <QuickActions studio={studio} />
      <ExamplesCard
        groups={URL_EXAMPLES}
        className={parts.urlAreaExamples}
        onUse={studio.applyExample}
        mono
      />
      <ResultSummary studio={studio} />
      <RelatedToolsCard
        current="/url-encode-decode"
        className={`${parts.urlAreaRelated} ${parts.relatedWide}`}
      />
    </div>
  );
}
