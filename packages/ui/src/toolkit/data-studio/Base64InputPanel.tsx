import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { type Base64Source, countLines } from './base64Studio.ts';
import { formatBytes } from './csvToJsonResult.ts';
import styles from './dataStudio.module.css';
import parts from './studioParts.module.css';
import type { Base64Studio } from './useBase64Studio.ts';

const SOURCES: { id: Base64Source; label: string; icon: string }[] = [
  { id: 'text', label: 'Text', icon: 'type' },
  { id: 'file', label: 'File', icon: 'file-text' },
  { id: 'image', label: 'Image', icon: 'image' },
  { id: 'base64', label: 'Base64 (Auto Detect)', icon: 'search' },
];

export function InfoTile(props: { icon: string; tone: string; label: string; value: string }) {
  return (
    <div class={parts.sumTile}>
      <span class={`${parts.tileSm} ${props.tone}`}>
        <Icon name={props.icon} class={parts.tileIcoSm} />
      </span>
      <span class={parts.sumText}>
        <small>{props.label}</small>
        <b>{props.value}</b>
      </span>
    </div>
  );
}

function Drop({ studio, image }: { studio: Base64Studio; image: boolean }) {
  const [over, setOver] = useState(false);
  const take = (file: File | undefined) => file && studio.loadFile(file, image);
  return (
    <label
      class={`${parts.dropzone} ${over ? parts.dropzoneOver : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer?.files[0]);
      }}
    >
      <input
        type="file"
        accept={image ? 'image/*' : undefined}
        class={styles.hiddenFileInput}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          take(target.files?.[0]);
          target.value = '';
        }}
      />
      {studio.file?.previewUrl && image ? (
        <img class={parts.previewImg} src={studio.file.previewUrl} alt={studio.file.name} />
      ) : (
        <span class={`${parts.tile} ${parts.toneBlue}`}>
          <Icon name={image ? 'image' : 'file-up'} class={parts.tileIco} />
        </span>
      )}
      <strong>
        {studio.file ? studio.file.name : image ? 'Drop an image here' : 'Drop any file here'}
      </strong>
      <small>
        {studio.file
          ? `${formatBytes(studio.file.size)} · ${studio.file.type}`
          : 'Read on your device and never uploaded.'}
      </small>
      <span class={styles.btnPrimarySolid}>
        <Icon name="folder-open" class={styles.ico} />{' '}
        {studio.file ? 'Choose another' : 'Choose file'}
      </span>
    </label>
  );
}

function TextBox({ idPrefix, studio }: { idPrefix: string; studio: Base64Studio }) {
  const [fullscreen, setFullscreen] = useState(false);
  return (
    <div class={`${parts.b64Editor} ${fullscreen ? styles.panelFullscreen : ''}`}>
      <textarea
        id={`${idPrefix}-input`}
        class={parts.b64Textarea}
        value={studio.draft}
        onInput={(e) => studio.setText((e.target as HTMLTextAreaElement).value)}
        placeholder={
          studio.source === 'base64'
            ? 'Paste Base64 or a data URI to decode…'
            : 'Enter text to encode or Base64 to decode…'
        }
        spellcheck={false}
        aria-label="Input text"
      />
      <button
        type="button"
        class={styles.expandEditorBtn}
        onClick={() => setFullscreen(!fullscreen)}
        aria-label={fullscreen ? 'Exit full screen' : 'Expand input'}
        title={fullscreen ? 'Exit full screen' : 'Expand input'}
      >
        <Icon name={fullscreen ? 'minimize-2' : 'maximize'} class={styles.ico} />
      </button>
    </div>
  );
}

function inputType(studio: Base64Studio, decoding: boolean): string {
  if (studio.file) return studio.file.previewUrl ? 'Image' : 'File';
  return decoding ? 'Base64' : 'Text';
}

function inputBytes(studio: Base64Studio, decoding: boolean): number {
  if (studio.file) return studio.file.size;
  if (decoding) return studio.draft.length;
  return studio.result?.inputByteLength ?? new TextEncoder().encode(studio.draft).length;
}

function inputEncoding(studio: Base64Studio, decoding: boolean): string {
  if (studio.file) return 'Binary';
  if (decoding) return 'ASCII';
  return studio.options.charset === 'latin1' ? 'ISO-8859-1' : 'UTF-8';
}

function inputInfo(studio: Base64Studio) {
  const decoding = studio.options.direction === 'decode';
  return {
    type: inputType(studio, decoding),
    bytes: inputBytes(studio, decoding),
    encoding: inputEncoding(studio, decoding),
    lines: studio.file ? 0 : countLines(studio.draft),
  };
}

export function Base64InputPanel({ idPrefix, studio }: { idPrefix: string; studio: Base64Studio }) {
  const info = inputInfo(studio);
  const pick = (id: Base64Source) => {
    studio.setSource(id);
    if (id === 'base64') studio.setMode('auto');
    if ((id === 'text' || id === 'base64') && studio.file) studio.setText('');
  };
  return (
    <section class={`${styles.panel} ${styles.inputPanel} ${parts.card}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={`${parts.tile} ${parts.toneBlue}`}>
            <Icon name="brackets" class={parts.tileIco} />
          </span>
          <strong>Input</strong>
        </div>
      </div>
      <div class={parts.inputTabs}>
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={studio.source === s.id}
            class={`${parts.inputTab} ${parts.toneBlue} ${studio.source === s.id ? parts.inputTabActive : ''}`}
            onClick={() => pick(s.id)}
          >
            <Icon name={s.icon} class={parts.inputTabIco} /> {s.label}
          </button>
        ))}
      </div>
      {studio.source === 'file' || studio.source === 'image' ? (
        <Drop studio={studio} image={studio.source === 'image'} />
      ) : (
        <TextBox idPrefix={idPrefix} studio={studio} />
      )}
      <div class={parts.counts}>
        <span>
          {studio.file ? formatBytes(studio.file.size) : `${studio.draft.length} characters`}
        </span>
      </div>
      <div class={parts.infoBox}>
        <div class={parts.infoTitle}>
          <span class={`${parts.dot} ${parts.toneBlue}`}>T</span> Input Information
        </div>
        <div class={parts.infoGrid}>
          <InfoTile icon="type" tone={parts.toneBlue} label="Type" value={info.type} />
          <InfoTile
            icon="file-text"
            tone={parts.toneGreen}
            label="Size"
            value={formatBytes(info.bytes)}
          />
          <InfoTile icon="image" tone={parts.toneBlue} label="Encoding" value={info.encoding} />
          <InfoTile icon="list" tone={parts.tonePurple} label="Lines" value={String(info.lines)} />
        </div>
      </div>
    </section>
  );
}
