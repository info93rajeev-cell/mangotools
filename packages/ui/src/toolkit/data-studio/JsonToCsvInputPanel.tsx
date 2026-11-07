import { useRef, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { countLines } from './base64Studio.ts';
import styles from './dataStudio.module.css';
import j2c from './jsonToCsv.module.css';
import { rootDescription } from './jsonToCsvStudio.ts';
import parts from './studioParts.module.css';
import type { JsonToCsvStudio } from './useJsonToCsvStudio.ts';

/** A code box with a line-number gutter that scrolls with the text. */
export function GutterEditor(props: {
  id: string;
  value: string;
  label: string;
  onInput?: (text: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  // A read-only box does not number the empty line after a final line break.
  const counted = props.onInput ? props.value : props.value.replace(/\n$/, '');
  const lines = Math.max(1, countLines(counted));
  return (
    <div
      class={`${styles.editorContainer} ${j2c.editor} ${props.className ?? ''} ${fullscreen ? styles.panelFullscreen : ''}`}
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
          id={props.id}
          class={`${styles.codeTextarea} ${j2c.code}`}
          value={props.value}
          readOnly={!props.onInput}
          onInput={(e) => props.onInput?.((e.target as HTMLTextAreaElement).value)}
          onScroll={() => {
            if (gutter.current && area.current) gutter.current.scrollTop = area.current.scrollTop;
          }}
          placeholder={props.placeholder}
          spellcheck={false}
          wrap="off"
          aria-label={props.label}
        />
      </div>
      <button
        type="button"
        class={styles.expandEditorBtn}
        onClick={() => setFullscreen(!fullscreen)}
        aria-label={fullscreen ? 'Exit full screen' : `Expand ${props.label.toLowerCase()}`}
        title={fullscreen ? 'Exit full screen' : 'Expand'}
      >
        <Icon name={fullscreen ? 'minimize-2' : 'maximize'} class={styles.ico} />
      </button>
    </div>
  );
}

export function JsonFilePicker({
  studio,
  label,
  className,
}: {
  studio: JsonToCsvStudio;
  label: string;
  className: string;
}) {
  return (
    <label class={className}>
      <input
        type="file"
        accept=".json,.txt,application/json,text/plain"
        class={styles.hiddenFileInput}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (file) studio.loadFile(file);
          target.value = '';
        }}
      />
      <Icon name="file-text" class={styles.ico} /> {label}
    </label>
  );
}

export function JsonToCsvInputPanel({
  idPrefix,
  studio,
}: {
  idPrefix: string;
  studio: JsonToCsvStudio;
}) {
  const records = studio.result?.rowCount ?? 0;
  return (
    <section class={`${styles.panel} ${styles.inputPanel} ${parts.card}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={`${parts.tile} ${parts.toneBlue}`}>
            <Icon name="braces" class={parts.tileIco} />
          </span>
          <strong>Input JSON</strong>
        </div>
        <div class={`${styles.toolactions} ${j2c.headActions}`}>
          <JsonFilePicker studio={studio} label="Open JSON" className={j2c.headBtn} />
          <button type="button" class={j2c.headBtn} onClick={() => studio.loadSample()}>
            <Icon name="box" class={styles.ico} /> Sample
          </button>
        </div>
      </div>
      <GutterEditor
        id={`${idPrefix}-input`}
        value={studio.draft}
        label="JSON input"
        onInput={studio.setText}
        placeholder='Paste a JSON array of objects, e.g. [{"name": "Raj", "age": "50"}]'
      />
      <div class={styles.noteLine}>
        <span>Root: {rootDescription(studio.kind, studio.options.recordPath)}</span>
        <span>
          {records} record{records === 1 ? '' : 's'}
        </span>
      </div>
    </section>
  );
}
