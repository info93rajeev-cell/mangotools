import { useRef, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { countLines } from './base64Studio.ts';
import { formatBytes, utf8Bytes } from './csvToJsonResult.ts';
import styles from './dataStudio.module.css';
import { InfoTile } from './studioCards.tsx';
import parts from './studioParts.module.css';
import { type Row, type UrlSource, urlParts } from './urlStudio.ts';
import type { UrlStudio } from './useUrlEncoderStudio.ts';

const SOURCES: { id: UrlSource; label: string; icon: string; tone: string }[] = [
  { id: 'text', label: 'Text', icon: 'type', tone: parts.toneBlue },
  { id: 'file', label: 'File', icon: 'file-text', tone: parts.toneGreen },
  { id: 'query', label: 'Query', icon: 'search', tone: parts.toneAmber },
  { id: 'form', label: 'Form Data', icon: 'file-braces', tone: parts.tonePurple },
];

function Editor({ idPrefix, studio }: { idPrefix: string; studio: UrlStudio }) {
  const [fullscreen, setFullscreen] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const lines = Math.max(1, countLines(studio.draft));
  return (
    <div
      class={`${styles.editorContainer} ${parts.urlEditor} ${fullscreen ? styles.panelFullscreen : ''}`}
    >
      <div ref={gutter} class={`${styles.editorGutter} ${parts.gutter}`} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <div key={String(i)} class={styles.gutterLine}>
            {i + 1}
          </div>
        ))}
      </div>
      <div class={styles.codeArea}>
        <textarea
          ref={area}
          id={`${idPrefix}-input`}
          class={styles.codeTextarea}
          value={studio.draft}
          onInput={(e) => studio.setText((e.target as HTMLTextAreaElement).value)}
          onScroll={() => {
            if (gutter.current && area.current) gutter.current.scrollTop = area.current.scrollTop;
          }}
          placeholder="Type or paste a URL, query or text…"
          spellcheck={false}
          aria-label="Input text or URL"
        />
      </div>
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

function FileDrop({ studio }: { studio: UrlStudio }) {
  const [over, setOver] = useState(false);
  const take = (file: File | undefined) => file && studio.loadFile(file);
  return (
    <label
      class={`${parts.dropzone} ${parts.urlDrop} ${over ? parts.dropzoneOver : ''}`}
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
        accept=".txt,.csv,.log,.url,text/plain"
        class={styles.hiddenFileInput}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          take(target.files?.[0]);
          target.value = '';
        }}
      />
      <span class={`${parts.tile} ${parts.toneGreen}`}>
        <Icon name="file-up" class={parts.tileIco} />
      </span>
      <strong>Drop a text file with URLs or text</strong>
      <small>Read on your device and never uploaded. Each line can be encoded on its own.</small>
      <span class={styles.btnPrimarySolid}>
        <Icon name="folder-open" class={styles.ico} /> Choose file
      </span>
    </label>
  );
}

function RowsEditor({ studio, query }: { studio: UrlStudio; query: boolean }) {
  const update = (i: number, col: 0 | 1, value: string) =>
    studio.setRows(
      studio.rows.map((r, j): Row => (j === i ? (col ? [r[0], value] : [value, r[1]]) : r)),
    );
  return (
    <div class={parts.rowsBox}>
      {query ? (
        <label class={styles.optField}>
          <span class={styles.optLabel}>Base URL (optional)</span>
          <input
            class={`${styles.optSelect} ${parts.textInput}`}
            type="text"
            value={studio.base}
            placeholder="https://beyandtheai.com/search"
            onInput={(e) => studio.setBase((e.target as HTMLInputElement).value)}
          />
        </label>
      ) : null}
      <div class={parts.rowsList}>
        {studio.rows.map(([k, v], i) => (
          <div key={String(i)} class={parts.rowLine}>
            <input
              class={`${styles.optSelect} ${parts.textInput}`}
              value={k}
              placeholder="key"
              aria-label={`Key ${i + 1}`}
              onInput={(e) => update(i, 0, (e.target as HTMLInputElement).value)}
            />
            <input
              class={`${styles.optSelect} ${parts.textInput}`}
              value={v}
              placeholder="value"
              aria-label={`Value ${i + 1}`}
              onInput={(e) => update(i, 1, (e.target as HTMLInputElement).value)}
            />
            <button
              type="button"
              class={styles.btnSecondary}
              aria-label={`Remove row ${i + 1}`}
              onClick={() => studio.setRows(studio.rows.filter((_, j) => j !== i))}
            >
              <Icon name="x" class={styles.ico} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        class={styles.btnSecondary}
        onClick={() => studio.setRows([...studio.rows, ['', '']])}
      >
        <Icon name="plus" class={styles.ico} /> Add {query ? 'parameter' : 'field'}
      </button>
    </div>
  );
}

function inputType(studio: UrlStudio): string {
  if (studio.source === 'query') return 'Query';
  if (studio.source === 'form') return 'Form Data';
  return urlParts(studio.draft) ? 'URL' : 'Text';
}

export function UrlInputPanel({ idPrefix, studio }: { idPrefix: string; studio: UrlStudio }) {
  const rowsTab = studio.source === 'query' || studio.source === 'form';
  const text = rowsTab ? studio.rows.map(([k, v]) => `${k}=${v}`).join('\n') : studio.draft;
  return (
    <section class={`${styles.panel} ${styles.inputPanel} ${parts.card}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={`${parts.tile} ${parts.tonePurple}`}>
            <Icon name="file-text" class={parts.tileIco} />
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
            class={`${parts.inputTab} ${s.tone} ${studio.source === s.id ? `${parts.inputTabActive} ${parts.activeBlue}` : ''}`}
            onClick={() => studio.setSource(s.id)}
          >
            <Icon name={s.icon} class={parts.inputTabIco} /> {s.label}
          </button>
        ))}
      </div>
      {studio.source === 'text' ? <Editor idPrefix={idPrefix} studio={studio} /> : null}
      {studio.source === 'file' ? <FileDrop studio={studio} /> : null}
      {rowsTab ? <RowsEditor studio={studio} query={studio.source === 'query'} /> : null}
      <div class={`${parts.counts} ${parts.monoCounts}`}>
        <span>{text.length} characters</span>
        <span>{countLines(text)} lines</span>
      </div>
      <div class={parts.infoBox}>
        <div class={parts.infoTitle}>
          <span class={`${parts.dot} ${parts.toneBlue}`}>i</span> Input Information
        </div>
        <div class={parts.infoGrid}>
          <InfoTile icon="type" tone={parts.tonePurple} label="Type" value={inputType(studio)} />
          <InfoTile
            icon="file-text"
            tone={parts.toneGreen}
            label="Size"
            value={formatBytes(utf8Bytes(text))}
          />
          <InfoTile icon="code-xml" tone={parts.tonePink} label="Encoding" value="UTF-8" />
          <InfoTile
            icon="list"
            tone={parts.toneBlue}
            label="Lines"
            value={String(countLines(text))}
          />
        </div>
      </div>
    </section>
  );
}
