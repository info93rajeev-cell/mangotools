import { useRef, useState } from 'preact/hooks';
import styles from './dataStudio.module.css';

interface JsonInputPanelProps {
  idPrefix: string;
  input: string;
  action: 'format' | 'minify' | 'validate';
  onAction: (a: 'format' | 'minify' | 'validate') => void;
  onInput: (val: string) => void;
  onClear: () => void;
  lineNumbers: boolean;
}

export function JsonInputPanel({
  idPrefix,
  input,
  action,
  onAction,
  onInput,
  onClear,
  lineNumbers,
}: JsonInputPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = input.split('\n');
  const lineCount = lines.length;

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <section
      class={`${styles.panel} ${styles.inputPanel} ${isFullscreen ? styles.panelFullscreen : ''}`}
    >
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#123;&#125;</span>
          <strong>Input JSON</strong>
        </div>
        <div class={styles.toolactions}>
          <button
            type="button"
            class={action === 'format' ? styles.btnPrimarySolid : styles.btnSecondary}
            onClick={() => onAction('format')}
          >
            ⚡ Format
          </button>
          <button
            type="button"
            class={action === 'minify' ? styles.btnPrimarySolid : styles.btnSecondary}
            onClick={() => onAction('minify')}
          >
            &#123;&#125; Minify
          </button>
          <button
            type="button"
            class={action === 'validate' ? styles.btnPrimarySolid : styles.btnSecondary}
            onClick={() => onAction('validate')}
          >
            ✓ Validate
          </button>
          <button
            type="button"
            class={styles.btnDangerOutline}
            onClick={onClear}
            title="Clear input"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <div class={styles.editorContainer}>
        {lineNumbers && (
          <div ref={gutterRef} class={styles.editorGutter} aria-hidden="true">
            {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
              <div key={String(i + 1)} class={styles.gutterLine}>
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          id={`${idPrefix}-input`}
          class={styles.codeTextarea}
          value={input}
          onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
          onScroll={handleScroll}
          placeholder="Paste or type JSON here..."
          spellcheck={false}
          aria-label="Input JSON text"
        />
        <button
          type="button"
          class={styles.expandEditorBtn}
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
        >
          {isFullscreen ? '✕' : '⤢'}
        </button>
      </div>

      <div class={styles.noteLine}>
        <span class={styles.noteLeft}>
          ℹ Supports large JSON data up to 10 MB. Data stays in your browser and is not uploaded.
        </span>
        <span class={styles.noteRight}>
          Characters: <strong>{input.length}</strong> &nbsp; Lines: <strong>{lineCount}</strong>
        </span>
      </div>
    </section>
  );
}
