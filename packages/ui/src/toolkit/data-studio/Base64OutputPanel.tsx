import { useEffect, useMemo, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { type Base64Mode, countLines, latin1ToBytes } from './base64Studio.ts';
import { formatBytes } from './csvToJsonResult.ts';
import styles from './dataStudio.module.css';
import { InfoTile, StatusTile } from './studioCards.tsx';
import parts from './studioParts.module.css';
import type { Base64Studio } from './useBase64Studio.ts';

const MODES: { id: Base64Mode; label: string; icon: string }[] = [
  { id: 'encode', label: 'Encode', icon: 'arrow-left-right' },
  { id: 'decode', label: 'Decode', icon: 'arrow-left-right' },
  { id: 'auto', label: 'Auto Detect', icon: 'refresh-ccw' },
];

/** Object URL for a decoded image, released when it changes. */
function useImageUrl(binary: string | undefined, mime: string | undefined): string | null {
  const url = useMemo(() => {
    if (!binary || !mime?.startsWith('image/')) return null;
    return URL.createObjectURL(new Blob([latin1ToBytes(binary)], { type: mime }));
  }, [binary, mime]);
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  return url;
}

function BinaryView({ studio }: { studio: Base64Studio }) {
  const r = studio.result;
  const image = useImageUrl(r?.binary, r?.mime);
  if (!r) return null;
  return (
    <div class={parts.binaryView}>
      {image ? <img class={parts.previewImg} src={image} alt="Decoded preview" /> : null}
      <strong>
        {r.mime ?? 'Binary data'} · {formatBytes(r.byteLength)}
      </strong>
      {r.hexPreview ? <code class={parts.hex}>{r.hexPreview}</code> : null}
      <button type="button" class={styles.btnPrimarySolid} onClick={studio.download}>
        <Icon name="download" class={styles.ico} /> Download as File
      </button>
    </div>
  );
}

function OutputBox({ idPrefix, studio }: { idPrefix: string; studio: Base64Studio }) {
  const [fullscreen, setFullscreen] = useState(false);
  if (studio.error) {
    return (
      <div class={`${styles.invalidNotice} ${parts.b64Notice}`} role="alert">
        <strong>Cannot convert:</strong>
        <p>{studio.error}</p>
      </div>
    );
  }
  if (studio.result && !studio.result.isUtf8 && studio.result.binary) {
    return <BinaryView studio={studio} />;
  }
  return (
    <div
      class={`${parts.b64Editor} ${parts.b64Output} ${fullscreen ? styles.panelFullscreen : ''}`}
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

function outputInfo(studio: Base64Studio) {
  const r = studio.result;
  const encoding = studio.options.direction === 'encode';
  const binary = r && !r.isUtf8;
  return {
    heading: encoding ? 'Base64 Encoded Output' : binary ? 'Decoded File' : 'Decoded Text',
    type: encoding ? 'Base64' : binary ? (r?.mime ?? 'Binary') : 'Text',
    size: encoding ? (r?.text.length ?? 0) : (r?.byteLength ?? 0),
    lines: binary ? 0 : countLines(studio.outputText),
    status: studio.error ? 'Invalid input' : encoding ? 'Valid Base64' : 'Decoded',
  };
}

export function Base64OutputPanel({
  idPrefix,
  studio,
}: {
  idPrefix: string;
  studio: Base64Studio;
}) {
  const info = outputInfo(studio);
  const ok = !studio.error;
  return (
    <section class={`${styles.panel} ${styles.outputPanel} ${parts.card}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={`${parts.tile} ${parts.toneBlue}`}>
            <Icon name="file-text" class={parts.tileIco} />
          </span>
          <strong>Output</strong>
        </div>
        <div class={styles.toolactions}>
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={studio.mode === m.id}
              class={`${styles.segChip} ${parts.modeChip} ${studio.mode === m.id ? styles.segChipActive : ''}`}
              onClick={() => studio.setMode(m.id)}
            >
              <Icon name={m.icon} class={styles.ico} /> {m.label}
            </button>
          ))}
        </div>
      </div>
      <div class={parts.outHead}>
        <strong>{info.heading}</strong>
        <div class={styles.toolactions}>
          <button type="button" class={styles.btnSecondary} onClick={studio.copy}>
            <Icon name="copy" class={styles.ico} /> Copy
          </button>
          <button type="button" class={styles.btnSecondary} onClick={studio.download}>
            <Icon name="download" class={styles.ico} /> Download
          </button>
        </div>
      </div>
      <OutputBox idPrefix={idPrefix} studio={studio} />
      <div class={parts.infoBox}>
        <div class={parts.infoTitle}>
          <span class={`${parts.dot} ${parts.toneAmber}`}>
            <Icon name="zap" class={parts.dotIco} />
          </span>
          Output Information
        </div>
        <div class={parts.infoGrid}>
          <InfoTile icon="file-text" tone={parts.tonePurple} label="Type" value={info.type} />
          <InfoTile
            icon="download"
            tone={parts.toneBlue}
            label="Size"
            value={formatBytes(info.size)}
          />
          <InfoTile icon="list" tone={parts.toneBlue} label="Lines" value={String(info.lines)} />
          <StatusTile ok={ok} label="Status" value={info.status} />
        </div>
      </div>
    </section>
  );
}
