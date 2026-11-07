import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import { RefCardHead, RefCheck, RefDrop, RefFileItem } from './PdfRefParts.tsx';
import { HeavyBookBanner } from './PdfSplitThumbnails.tsx';
import c from './pdfConvertRef.module.css';
import { fileMeta } from './pdfFileMeta.ts';
import { firstPages, usePageThumbs } from './pdfPageThumbs.ts';
import styles from './pdfRef.module.css';
import { parseRangeList } from './pdfSplitPlan.ts';
import type { SplitMode, usePdfSplitStudio } from './usePdfSplitStudio.ts';

type SplitStudioState = ReturnType<typeof usePdfSplitStudio>;

function PageStrip({ studio }: { studio: SplitStudioState }) {
  const shown = Math.min(6, studio.totalPages);
  const thumbs = usePageThumbs(studio.fileBytes, firstPages(shown, 6), 120);
  return (
    <div class={styles.pageStrip}>
      {Array.from({ length: shown }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          class={`${styles.page} ${styles.pageBtn} ${studio.selectedPage === p ? styles.pageFirst : ''} ${thumbs[p - 1] ? styles.pageImg : ''}`}
          onClick={() => studio.onSelectPage(p)}
          aria-label={`Page ${p}`}
        >
          {thumbs[p - 1] ? (
            <img src={thumbs[p - 1] ?? undefined} alt="" />
          ) : (
            <>
              <span class={styles.pageHead} />
              <span class={styles.pageLine} />
              <span class={styles.pageLine} style={{ width: '80%' }} />
              <span class={styles.pageLine} style={{ width: '92%' }} />
            </>
          )}
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
        <>
          <div data-primary-result="" class="visually-hidden">
            <output>{fileName.replace(/\.pdf$/i, '')}-pages-1-1.pdf</output>
          </div>
          <RefFileItem
            name={fileName}
            meta={fileMeta(totalPages, fileSizeBytes)}
            actions={{ onRemove: clearAll }}
          />
        </>
      ) : (
        <RefDrop
          title="Drag & drop a PDF to split"
          sub="or click to browse · Max 25 MB · Files stay in your browser"
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

function RangeChip({
  studio,
  range,
}: {
  studio: SplitStudioState;
  range: SplitStudioState['ranges'][number];
}) {
  const [text, setText] = useState(`${range.start} - ${range.end}`);
  useEffect(() => setText(`${range.start} - ${range.end}`), [range.start, range.end]);
  const parsed = parseRangeList(text.replace(/\s/g, ''), studio.totalPages);
  const bad = parsed.ranges.length !== 1;
  return (
    <span class={`${c.chip} ${bad ? c.chipBad : ''}`}>
      <input
        aria-label={`Range ${range.start} to ${range.end}`}
        aria-invalid={bad}
        value={text}
        onInput={(e) => {
          const v = e.currentTarget.value;
          setText(v);
          const r = parseRangeList(v.replace(/\s/g, ''), studio.totalPages).ranges;
          if (r.length === 1 && r[0]) studio.updateRange(range.id, r[0].start, r[0].end);
        }}
      />
      <button
        type="button"
        aria-label={`Remove range ${range.start} to ${range.end}`}
        onClick={() => studio.removeRange(range.id)}
      >
        <Icon name="x" />
      </button>
    </span>
  );
}

/** One chip per output file, as in the reference; each chip is editable. */
function RangeEditor({ studio }: { studio: SplitStudioState }) {
  const covered = studio.parts.reduce((n, p) => n + p.pageCount, 0);
  return (
    <div>
      <div class={styles.fieldRow}>
        <span class={styles.fieldLabel}>Page ranges (e.g. 1-10, 11-20), one output file each</span>
        <span class={styles.listMeta}>
          {studio.ranges.length} range{studio.ranges.length === 1 ? '' : 's'} • {covered} pages
          selected
        </span>
      </div>
      <div class={c.chips}>
        {studio.ranges.map((r) => (
          <RangeChip key={r.id} studio={studio} range={r} />
        ))}
        <button type="button" class={c.addChip} onClick={studio.addRange}>
          <Icon name="plus" />
          Add range
        </button>
      </div>
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
          <span class={c.example}>Example: {studio.parts[0]?.name ?? 'Part_1.pdf'}</span>
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
