import { Fragment } from 'preact';
import { RefActions, RefCardHead, RefPrivacy, RefStatus, RefTile } from './PdfRefParts.tsx';
import styles from './pdfRef.module.css';
import type { usePdfMergeStudio } from './usePdfMergeStudio.ts';

type MergeStudioState = ReturnType<typeof usePdfMergeStudio>;

const RANGE_TONES = [styles.rangeRed, styles.rangeBlue, styles.rangeGreen, styles.rangePurple];

function MergePreview({
  ranges,
  total,
}: {
  ranges: MergeStudioState['summary']['ranges'];
  total: number;
}) {
  return (
    <section class={`${styles.card} ${styles.subcard}`} aria-label="Merged Document Preview">
      <RefCardHead
        icon="eye"
        title="Merged Document Preview"
        aside={<span class={styles.listMeta}>Total pages: {total}</span>}
      />
      <div class={styles.flow}>
        {ranges.map((r, i) => (
          <Fragment key={r.name}>
            <div class={styles.flowItem}>
              <span class={styles.flowPaper}>
                <span class={styles.flowName}>{r.name.replace(/\.pdf$/i, '')}</span>
                <span class={styles.pageLine} />
                <span class={styles.pageLine} style={{ width: '85%' }} />
                <span class={styles.pageLine} style={{ width: '92%' }} />
                <span class={styles.pageLine} style={{ width: '70%' }} />
              </span>
              <span class={`${styles.flowRange} ${RANGE_TONES[i % RANGE_TONES.length]}`}>
                {r.start} – {r.end}
              </span>
            </div>
            {i < ranges.length - 1 ? (
              <span class={styles.flowPlus} aria-hidden="true">
                +
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export function PdfMergeRightCards({ studio }: { studio: MergeStudioState }) {
  const { files, summary, isProcessing } = studio;
  const totalMb = (summary.totalSizeBytes / (1024 * 1024)).toFixed(1);
  const ready = files.length > 1;
  return (
    <div class={styles.column}>
      <section class={styles.card} aria-label="Merge Summary">
        <RefCardHead
          icon="files"
          title="Merge Summary"
          aside={<RefStatus text={ready ? 'Ready to merge' : 'Add at least 2 PDFs'} done={ready} />}
        />
        <div class={styles.tiles}>
          <RefTile
            tone="blue"
            icon="file-text"
            label="PDF files"
            value={String(summary.fileCount)}
            sub="Selected"
          />
          <RefTile
            tone="purple"
            icon="files"
            label="Total pages"
            value={String(summary.totalPageCount)}
            sub="All files"
          />
          <RefTile
            tone="green"
            icon="database"
            label="Est. size"
            value={`${totalMb} MB`}
            sub="After merge"
          />
          <RefTile
            tone="amber"
            icon="star"
            label="Bookmarks"
            value={summary.hasBookmarks ? 'Yes' : 'No'}
            sub="File names"
          />
        </div>
      </section>
      {summary.ranges.length > 0 ? (
        <MergePreview ranges={summary.ranges} total={summary.totalPageCount} />
      ) : null}
      <RefPrivacy />
      <RefActions
        icon="files"
        label="Merge PDFs"
        busyLabel="Merging PDFs…"
        busy={isProcessing}
        disabled={files.length === 0}
        onRun={() => void studio.executeMerge()}
        downloadLabel="Download Merged PDF"
        downloadDisabled={files.length === 0}
        onDownload={() => void studio.downloadMerged()}
        onCopy={studio.copySummary}
        onReset={studio.clearAll}
      />
    </div>
  );
}
