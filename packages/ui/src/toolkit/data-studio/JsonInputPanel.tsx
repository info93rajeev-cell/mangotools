import { useRef, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './dataStudio.module.css';
import { highlightJson } from './jsonSyntaxHighlight.ts';

interface JsonInputPanelProps {
  idPrefix: string;
  input: string;
  action: 'format' | 'minify' | 'validate';
  onAction: (a: 'format' | 'minify' | 'validate') => void;
  onInput: (val: string) => void;
  onClear: () => void;
  lineNumbers: boolean;
  syntaxHighlight?: boolean;
}

export function JsonInputPanel({
  idPrefix,
  input,
  action,
  onAction,
  onInput,
  onClear,
  lineNumbers,
  syntaxHighlight = true,
}: JsonInputPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const lines = input.split('\n');
  const lineCount = lines.length;

  const handleScroll = () => {
    const area = textareaRef.current;
    if (!area) return;
    if (gutterRef.current) gutterRef.current.scrollTop = area.scrollTop;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = area.scrollTop;
      highlightRef.current.scrollLeft = area.scrollLeft;
    }
  };

  return (
    <section
      class={`${styles.panel} ${styles.inputPanel} ${isFullscreen ? styles.panelFullscreen : ''}`}
    >
      <InputToolbar action={action} onAction={onAction} onClear={onClear} />

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
        <div class={styles.codeArea}>
          {syntaxHighlight && (
            <pre
              ref={highlightRef}
              class={styles.codeHighlight}
              aria-hidden="true"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: highlightJson escapes all user text.
              dangerouslySetInnerHTML={{ __html: highlightJson(input) }}
            />
          )}
          <textarea
            ref={textareaRef}
            id={`${idPrefix}-input`}
            class={`${styles.codeTextarea} ${syntaxHighlight ? styles.codeTextareaOverlay : ''}`}
            value={input}
            onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
            onScroll={handleScroll}
            placeholder="Paste or type JSON here..."
            spellcheck={false}
            aria-label="Input JSON text"
          />
        </div>
        <button
          type="button"
          class={styles.expandEditorBtn}
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
        >
          <Icon name={isFullscreen ? 'minimize-2' : 'maximize'} class={styles.ico} />
        </button>
      </div>

      <div class={styles.noteLine}>
        <span class={styles.noteLeft}>
          <Icon name="info" class={styles.ico} /> Supports large JSON data up to 10 MB. Data stays
          in your browser and is not uploaded.
        </span>
        <span class={styles.noteRight}>
          Characters: <strong>{input.length}</strong> &nbsp; Lines: <strong>{lineCount}</strong>
        </span>
      </div>
    </section>
  );
}

function InputToolbar({
  action,
  onAction,
  onClear,
}: Pick<JsonInputPanelProps, 'action' | 'onAction' | 'onClear'>) {
  return (
    <div class={styles.toolbar}>
      <div class={styles.tooltitle}>
        <span class={styles.toolIcon}>
          <Icon name="brackets" class={styles.toolIco} />
        </span>
        <strong>Input JSON</strong>
      </div>
      <div class={styles.toolactions}>
        <button
          type="button"
          class={action === 'format' ? styles.btnPrimarySolid : styles.btnSecondary}
          onClick={() => onAction('format')}
        >
          <Icon name="sparkles" class={styles.ico} /> Format
        </button>
        <button
          type="button"
          class={action === 'minify' ? styles.btnPrimarySolid : styles.btnSecondary}
          onClick={() => onAction('minify')}
        >
          <Icon name="braces" class={styles.ico} /> Minify
        </button>
        <button
          type="button"
          class={action === 'validate' ? styles.btnPrimarySolid : styles.btnSecondary}
          onClick={() => onAction('validate')}
        >
          <Icon name="circle-check" class={styles.ico} /> Validate
        </button>
        <button type="button" class={styles.btnDangerOutline} onClick={onClear} title="Clear input">
          <Icon name="trash-2" class={styles.ico} /> Clear
        </button>
      </div>
    </div>
  );
}
