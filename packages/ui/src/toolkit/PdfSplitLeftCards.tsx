import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import { RefCardHead, RefCheck, RefDrop, RefFileItem } from './PdfRefParts.tsx';
import { HeavyBookBanner } from './PdfSplitThumbnails.tsx';
import styles from './pdfRef.module.css';
import { parseRangeList, rangesToText } from './pdfSplitPlan.ts';
import type { SplitMode, usePdfSplitStudio } from './usePdfSplitStudio.ts';

type SplitStudioState = ReturnType<typeof usePdfSplitStudio>;

function PageStrip({ studio }: { studio: SplitStudioState }) {
  const shown = Math.min(6, studio.totalPages);
  return (
    <div class={styles.pageStrip}>
      {Array.from({ length: shown }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          class={`${styles.page} ${styles.pageBtn} ${studio.selectedPage === p ? styles.pageFirst : ''}`}
          onClick={() => studio.onSelectPage(p)}
          aria-label={`Page ${p}`}
        >
          <span class={styles.pageHead} />
          <span class={styles.pageLine} />
          <span class={styles.pageLine} style={{ width: '80%' }} />
          <span class={styles.pageLine} style={{ width: '92%' }} />
          <span class={styles.pageNum}>{p}</span>
        </button>
      ))}
      {studio.totalPages > shown ? (
        <span class={styles.pageMore} aria-hidden="true">
          …
        </span>
      ) : null}
    </div>
  );
}

function PdfSplitFileSection({ studio }: { studio: SplitStudioState }) {
  const { fileName, totalPages, fileSizeBytes, clearAll } = studio;
  return (
    <section class={styles.card} data-tour="pdf-upload" aria-label="PDF File">
      <RefCardHead
        step={1}
        title="PDF File"
        aside={
          <button type="button" class={styles.btnSmall} onClick={studio.splitHeavyBookIntoChapters}>
            <Icon name="book-open" />
            1,600-page book sample
          </button>
        }
      />
      <HeavyBookBanner totalPages={totalPages} />
      {fileName ? (
        <RefFileItem
          name={fileName}
          meta={`${totalPages} pages • ${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`}
          actions={{ onRemove: clearAll }}
        />
      ) : (
        <RefDrop
          title="Drag & drop a PDF to split"
          sub="or click to browse · Max 100 MB · Files stay in your browser"
          button="Choose PDF File"
          accept="application/pdf"
          onFiles={(list) => {
            const file = list[0];
            if (file) void studio.handleAddNativeFile(file);
          }}
        />
      )}
      {totalPages > 0 ? <PageStrip studio={studio} /> : null}
    </section>
  );
}

const SPLIT_MODES: readonly { id: SplitMode; icon: string; title: string; sub: string }[] = [
  { id: 'ranges', icon: 'file-text', title: 'Page ranges', sub: 'Split by custom ranges' },
  { id: 'extract', icon: 'file-check', title: 'Extract pages', sub: 'Pick specific pages' },
  { id: 'every', icon: 'layers', title: 'Every page', sub: 'Split into single pages' },
  { id: 'chunks', icon: 'box', title: 'Fixed chunks', sub: 'Split by group size' },
];

function InvalidNote({ tokens, total }: { tokens: string[]; total: number }) {
  if (tokens.length === 0) return null;
  return (
    <p role="alert" class={styles.invalid}>
      Not used: {tokens.join(', ')} (pages run from 1 to {total}).
    </p>
  );
}

function RangeEditor({ studio }: { studio: SplitStudioState }) {
  const [text, setText] = useState(rangesToText(studio.ranges));
  const [invalid, setInvalid] = useState<string[]>([]);
  // Follow ranges set elsewhere (a new file, the sample), but not the user's own typing.
  useEffect(() => {
    const typed = rangesToText(parseRangeList(text, studio.totalPages).ranges);
    if (typed !== rangesToText(studio.ranges)) setText(rangesToText(studio.ranges));
  }, [studio.ranges]);
  const covered = studio.parts.reduce((n, p) => n + p.pageCount, 0);
  return (
    <div>
      <div class={styles.fieldRow}>
        <label class={styles.fieldLabel} for="split-ranges">
          Page ranges, one output file each (e.g. 1-12, 13-42)
        </label>
        <span class={styles.listMeta}>
          {studio.parts.length} file{studio.parts.length === 1 ? '' : 's'} • {covered} pages
        </span>
      </div>
      <input
        id="split-ranges"
        class={styles.input}
        value={text}
        onInput={(e) => {
          const value = e.currentTarget.value;
          const parsed = parseRangeList(value, studio.totalPages);
          setText(value);
          setInvalid(parsed.invalid);
          studio.setRanges(parsed.ranges);
        }}
        placeholder="e.g. 1-12, 13-42"
      />
      <InvalidNote tokens={invalid} total={studio.totalPages} />
    </div>
  );
}

function ModeInputs({ studio }: { studio: SplitStudioState }) {
  const { mode, totalPages } = studio;
  if (mode === 'ranges') return <RangeEditor studio={studio} />;
  if (mode === 'extract') {
    return (
      <div>
        <label class={styles.fieldLabel} for="split-extract-pages">
          Specific pages to extract
        </label>
        <input
          id="split-extract-pages"
          class={styles.input}
          value={studio.extractInput}
          onInput={(e) => studio.setExtractInput(e.currentTarget.value)}
          placeholder="e.g. 1, 3, 5-10"
        />
        <InvalidNote tokens={studio.invalidPages} total={totalPages} />
      </div>
    );
  }
  if (mode === 'chunks') {
    return (
      <div>
        <label class={styles.fieldLabel} for="split-chunk-size">
          Pages per split file
        </label>
        <input
          id="split-chunk-size"
          type="number"
          class={styles.input}
          value={studio.chunkSize}
          onInput={(e) => studio.setChunkSize(Number(e.currentTarget.value) || 1)}
          min={1}
          max={totalPages || 100}
        />
      </div>
    );
  }
  return (
    <p class={styles.note}>Every one of the {totalPages} pages becomes its own single-page PDF.</p>
  );
}

function PdfSplitConfigSection({ studio }: { studio: SplitStudioState }) {
  return (
    <section class={styles.card} data-tour="pdf-arrange" aria-label="Split Configuration">
      <RefCardHead step={2} title="Split Configuration" />
      <div class={styles.modes}>
        {SPLIT_MODES.map((m) => {
          const active = studio.mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={active}
              class={`${styles.mode} ${active ? styles.modeActive : ''}`}
              onClick={() => studio.setMode(m.id)}
            >
              <Icon name={m.icon} />
              <span>
                <span class={styles.modeTitle}>{m.title}</span>
                <span class={styles.modeSub}>{m.sub}</span>
              </span>
            </button>
          );
        })}
      </div>
      <ModeInputs studio={studio} />
      <div class={styles.splitOptions}>
        <RefCheck
          label="Download several files as one ZIP archive"
          checked={studio.downloadAsZip}
          onChange={studio.setDownloadAsZip}
        />
        <div>
          <label class={styles.fieldLabel} for="split-file-pattern">
            Output file name pattern
          </label>
          <input
            id="split-file-pattern"
            class={styles.input}
            value={studio.pattern}
            onInput={(e) => studio.setPattern(e.currentTarget.value)}
            placeholder="Part_{n}"
          />
        </div>
      </div>
    </section>
  );
}

export function PdfSplitLeftCards({ studio }: { studio: SplitStudioState }) {
  return (
    <div class={styles.column}>
      <PdfSplitFileSection studio={studio} />
      <PdfSplitConfigSection studio={studio} />
    </div>
  );
}
