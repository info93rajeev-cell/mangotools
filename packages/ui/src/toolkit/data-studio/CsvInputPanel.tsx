import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './dataStudio.module.css';
import csv from './studioParts.module.css';
import type { CsvInputTab, CsvStudio } from './useCsvToJsonStudio.ts';

const INPUT_TABS: { id: CsvInputTab; label: string; icon: string; tone: string }[] = [
  { id: 'text', label: 'Text', icon: 'type', tone: csv.toneGreen },
  { id: 'file', label: 'File', icon: 'file-text', tone: csv.toneBlue },
  { id: 'sheet', label: 'Google Sheet Style', icon: 'file-spreadsheet', tone: csv.toneAmber },
  { id: 'sample', label: 'Sample Data', icon: 'square-plus', tone: csv.tonePurple },
];

const SAMPLE_IDS = ['employees', 'sku-codes', 'semicolon', 'name-age'];

function CodeEditor({ idPrefix, studio }: { idPrefix: string; studio: CsvStudio }) {
  const [fullscreen, setFullscreen] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const lineCount = Math.max(1, studio.input.split('\n').length);
  return (
    <div
      class={`${styles.editorContainer} ${csv.inputEditor} ${fullscreen ? styles.panelFullscreen : ''}`}
    >
      <div ref={gutter} class={`${styles.editorGutter} ${csv.gutter}`} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
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
          value={studio.input}
          onInput={(e) => studio.setText((e.target as HTMLTextAreaElement).value)}
          onScroll={() => {
            if (gutter.current && area.current) gutter.current.scrollTop = area.current.scrollTop;
          }}
          placeholder={
            studio.inputTab === 'sheet'
              ? 'Select cells in Google Sheets or Excel, copy, and paste here…'
              : 'Paste CSV or TSV here…'
          }
          spellcheck={false}
          aria-label="CSV input"
        />
      </div>
      <button
        type="button"
        class={styles.expandEditorBtn}
        onClick={() => setFullscreen(!fullscreen)}
        title={fullscreen ? 'Exit full screen' : 'Expand editor'}
        aria-label={fullscreen ? 'Exit full screen' : 'Expand editor'}
      >
        <Icon name={fullscreen ? 'minimize-2' : 'maximize'} class={styles.ico} />
      </button>
    </div>
  );
}

function FileDrop({ studio }: { studio: CsvStudio }) {
  const [over, setOver] = useState(false);
  const take = (file: File | undefined) => {
    if (!file) return;
    studio.loadFile(file);
    studio.setInputTab('text');
  };
  return (
    <label
      class={`${csv.dropzone} ${over ? csv.dropzoneOver : ''}`}
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
        accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
        class={styles.hiddenFileInput}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          take(target.files?.[0]);
          target.value = '';
        }}
      />
      <span class={`${csv.tile} ${csv.toneBlue}`}>
        <Icon name="file-up" class={csv.tileIco} />
      </span>
      <strong>Drop a .csv or .tsv file here</strong>
      <small>The file is read on your device and never uploaded.</small>
      <span class={styles.btnPrimarySolid}>
        <Icon name="folder-open" class={styles.ico} /> Choose file
      </span>
    </label>
  );
}

function SampleList({ preset, studio }: { preset: ResolvedPreset; studio: CsvStudio }) {
  const ids = SAMPLE_IDS.filter((id) => preset.samples[id]);
  return (
    <ul class={csv.sampleList}>
      {ids.map((id) => (
        <li key={id} class={csv.sampleItem}>
          <span class={`${csv.tile} ${csv.tonePurple}`}>
            <Icon name="table-2" class={csv.tileIco} />
          </span>
          <span class={csv.sampleName}>{preset.strings[preset.samples[id].titleKey] ?? id}</span>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={() => {
              studio.loadSample(id);
              studio.setInputTab('text');
            }}
          >
            Use
          </button>
        </li>
      ))}
    </ul>
  );
}

function InputTabs({ studio }: { studio: CsvStudio }) {
  return (
    <div class={csv.inputTabs}>
      {INPUT_TABS.map((tab) => {
        const active = studio.inputTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            class={`${csv.inputTab} ${tab.tone} ${active ? csv.inputTabActive : ''}`}
            onClick={() => {
              studio.setInputTab(tab.id);
              if (tab.id === 'sheet') studio.setOption('delimiter', 'auto');
            }}
          >
            <Icon name={tab.icon} class={csv.inputTabIco} /> {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function CsvInputPanel({
  idPrefix,
  preset,
  studio,
}: {
  idPrefix: string;
  preset: ResolvedPreset;
  studio: CsvStudio;
}) {
  const rows = studio.result?.sourceRowCount ?? 0;
  const cols = studio.result?.columns.length ?? 0;
  return (
    <section class={`${styles.panel} ${styles.inputPanel} ${csv.card}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={`${csv.tile} ${csv.tonePurple}`}>
            <Icon name="file-text" class={csv.tileIco} />
          </span>
          <strong>Input CSV / TSV</strong>
        </div>
      </div>
      <InputTabs studio={studio} />
      {studio.inputTab === 'file' ? <FileDrop studio={studio} /> : null}
      {studio.inputTab === 'sample' ? <SampleList preset={preset} studio={studio} /> : null}
      {studio.inputTab === 'text' || studio.inputTab === 'sheet' ? (
        <CodeEditor idPrefix={idPrefix} studio={studio} />
      ) : null}
      <div class={csv.counts} aria-live="polite">
        <span>{rows} rows</span>
        <span>{cols} columns</span>
        <span>{studio.input.length.toLocaleString('en-US')} characters</span>
      </div>
    </section>
  );
}
