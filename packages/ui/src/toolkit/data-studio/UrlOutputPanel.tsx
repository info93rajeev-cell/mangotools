import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { countLines } from './base64Studio.ts';
import { formatBytes, utf8Bytes } from './csvToJsonResult.ts';
import styles from './dataStudio.module.css';
import { InfoTile, StatusTile } from './studioCards.tsx';
import parts from './studioParts.module.css';
import { urlParts } from './urlStudio.ts';
import type { UrlStudio } from './useUrlEncoderStudio.ts';

function OutputBox({ idPrefix, studio }: { idPrefix: string; studio: UrlStudio }) {
  const [fullscreen, setFullscreen] = useState(false);
  if (studio.error) {
    return (
      <div class={`${styles.invalidNotice} ${parts.urlNotice}`} role="alert">
        <strong>Cannot convert:</strong>
        <p>{studio.error}</p>
      </div>
    );
  }
  return (
    <div
      class={`${parts.b64Editor} ${parts.b64Output} ${parts.urlOut} ${fullscreen ? styles.panelFullscreen : ''}`}
    >
      <textarea
        id={`${idPrefix}-output`}
        class={parts.b64Textarea}
        value={studio.outputText}
        readOnly
        spellcheck={false}
        aria-label="Output"
      />
      <button
        type="button"
        class={styles.expandEditorBtn}
        onClick={() => setFullscreen(!fullscreen)}
        aria-label={fullscreen ? 'Exit full screen' : 'Expand output'}
        title={fullscreen ? 'Exit full screen' : 'Expand output'}
      >
        <Icon name={fullscreen ? 'minimize-2' : 'maximize'} class={styles.ico} />
      </button>
    </div>
  );
}

/** URL parts and query parameters: the inspector the earlier version had, kept on request. */
function Inspector({ studio }: { studio: UrlStudio }) {
  const params = studio.result?.params ?? [];
  const url = urlParts(studio.options.direction === 'encode' ? studio.draft : studio.outputText);
  if (!url && params.length === 0) return null;
  return (
    <details class={parts.inspector}>
      <summary>
        <Icon name="eye" class={styles.ico} /> URL Inspector · {params.length} query parameter
        {params.length === 1 ? '' : 's'}
      </summary>
      {url ? (
        <div class={parts.kvGrid}>
          <span>Scheme</span>
          <b>{url.scheme}</b>
          <span>Host</span>
          <b>{url.host}</b>
          <span>Path</span>
          <b>{url.path}</b>
          <span>Fragment</span>
          <b>{url.fragment || '—'}</b>
        </div>
      ) : null}
      {params.length > 0 ? (
        <table class={parts.mapTable}>
          <thead>
            <tr>
              <th>Key</th>
              <th>Value (decoded)</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p, i) => (
              <tr key={`${i}-${p.key}`}>
                <td class={parts.mono}>{p.key}</td>
                <td class={parts.mono}>{p.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </details>
  );
}

function info(studio: UrlStudio) {
  const encode = studio.options.direction === 'encode';
  const rows = studio.source === 'query' || studio.source === 'form';
  const heading = rows
    ? studio.source === 'form'
      ? 'Form Body'
      : 'Query String'
    : encode
      ? 'Encoded URL'
      : 'Decoded Text';
  return {
    heading,
    type: encode ? 'URL Encoded' : 'Decoded Text',
    status: studio.error ? 'Invalid input' : encode ? 'Valid Encoding' : 'Decoded',
  };
}

export function UrlOutputPanel({ idPrefix, studio }: { idPrefix: string; studio: UrlStudio }) {
  const i = info(studio);
  const encode = studio.options.direction === 'encode';
  const rows = studio.source === 'query' || studio.source === 'form';
  return (
    <section class={`${styles.panel} ${styles.outputPanel} ${parts.card}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={`${parts.tile} ${parts.toneGreen}`}>
            <Icon name="file-text" class={parts.tileIco} />
          </span>
          <strong>Output</strong>
        </div>
        <div class={parts.dirPair}>
          {(['encode', 'decode'] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={encode === (d === 'encode')}
              disabled={rows && d === 'decode'}
              class={`${parts.inputTab} ${parts.toneGreen} ${encode === (d === 'encode') ? parts.inputTabActive : ''}`}
              onClick={() => studio.setDirection(d)}
            >
              <Icon name="arrow-left-right" class={parts.inputTabIco} />
              {d === 'encode' ? 'Encode' : 'Decode'}
            </button>
          ))}
        </div>
      </div>
      <div class={parts.outHead}>
        <strong>{i.heading}</strong>
      </div>
      <OutputBox idPrefix={idPrefix} studio={studio} />
      <div class={parts.outActions}>
        <button type="button" class={styles.btnSecondary} onClick={studio.copy}>
          <Icon name="copy" class={styles.ico} /> Copy
        </button>
        <button type="button" class={styles.btnSecondary} onClick={studio.download}>
          <Icon name="download" class={styles.ico} /> Download
        </button>
        <button type="button" class={styles.btnSecondary} onClick={studio.openInNewTab}>
          <Icon name="external-link" class={styles.ico} /> Open in New Tab
        </button>
      </div>
      <div class={parts.infoBox}>
        <div class={parts.infoTitle}>
          <span class={`${parts.dot} ${parts.toneAmber}`}>i</span> Output Information
        </div>
        <div class={parts.infoGrid}>
          <InfoTile icon="file-text" tone={parts.tonePurple} label="Type" value={i.type} />
          <InfoTile
            icon="file-text"
            tone={parts.toneBlue}
            label="Size"
            value={formatBytes(utf8Bytes(studio.outputText))}
          />
          <InfoTile
            icon="list"
            tone={parts.tonePink}
            label="Lines"
            value={String(countLines(studio.outputText))}
          />
          <StatusTile ok={!studio.error} label="Status" value={i.status} />
        </div>
      </div>
      <Inspector studio={studio} />
    </section>
  );
}
