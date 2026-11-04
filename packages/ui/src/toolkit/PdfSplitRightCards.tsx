import {
  RefActions,
  RefCardHead,
  RefPaperThumb,
  RefPrivacy,
  RefStatus,
  RefTile,
} from './PdfRefParts.tsx';
import styles from './pdfRef.module.css';
import { pagesLabel } from './pdfSplitPlan.ts';
import type { SplitPartInfo, usePdfSplitStudio } from './usePdfSplitStudio.ts';

type SplitStudioState = ReturnType<typeof usePdfSplitStudio>;

const PART_TONES = [styles.rangeRed, styles.rangeBlue, styles.rangeGreen, styles.rangePurple];

function OutputPreview({
  parts,
  totalPages,
  bytes,
}: {
  parts: SplitPartInfo[];
  totalPages: number;
  bytes: Uint8Array | null;
}) {
  return (
    <section class={`${styles.card} ${styles.subcard}`} aria-label="Output Preview">
      <RefCardHead
        icon="eye"
        title="Output Preview"
        aside={
          <span class={styles.listMeta}>
            {parts.length} files • {totalPages} pages total
          </span>
        }
      />
      <div class={styles.parts}>
        {parts.slice(0, 4).map((part, idx) => (
          <div key={part.name} class={styles.part}>
            <span class={`${styles.partHead} ${PART_TONES[idx % PART_TONES.length]}`}>
              <span>Pages {pagesLabel(part.pages)}</span>
              <small>
                {part.pageCount} {part.pageCount === 1 ? 'page' : 'pages'}
              </small>
            </span>
            <RefPaperThumb bytes={bytes} page={part.pages[0]}>
              <span class={styles.pageHead} />
              <span class={styles.pageLine} />
              <span class={styles.pageLine} style={{ width: '84%' }} />
              <span class={styles.pageLine} style={{ width: '92%' }} />
            </RefPaperThumb>
            <span class={styles.partName} title={part.name}>
              {part.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function downloadLabelFor(count: number, zip: boolean): string {
  if (count <= 1) return 'Download PDF';
  return zip ? 'Download ZIP' : `Download ${count} PDFs`;
}

export function PdfSplitRightCards({ studio }: { studio: SplitStudioState }) {
  const { totalPages, parts, fileSizeBytes, isProcessing, downloadAsZip } = studio;
  const estimate = parts.reduce((n, p) => n + p.sizeBytes, 0) || fileSizeBytes;
  const totalMb = (estimate / (1024 * 1024)).toFixed(1);
  const zip = parts.length > 1 && downloadAsZip;
  return (
    <div class={styles.column}>
      <section class={styles.card} aria-label="Split Summary">
        <RefCardHead
          icon="files"
          title="Split Summary"
          aside={
            <RefStatus
              text={parts.length === 0 ? 'Nothing to split' : 'Ready to split'}
              done={parts.length > 0}
            />
          }
        />
        <div class={styles.tiles}>
          <RefTile
            tone="purple"
            icon="file-text"
            label="Total pages"
            value={String(totalPages)}
            sub="Input file"
          />
          <RefTile
            tone="blue"
            icon="layers"
            label="Split files"
            value={String(parts.length)}
            sub="Will be created"
          />
          <RefTile
            tone="green"
            icon="database"
            label="Est. size"
            value={`~${totalMb} MB`}
            sub="After split"
          />
          <RefTile
            tone="amber"
            icon="package"
            label={zip ? 'ZIP Ready' : 'Format'}
            value={zip ? 'ZIP' : 'PDF'}
            sub={zip ? 'All in one file' : parts.length > 1 ? 'Separate PDFs' : 'One PDF'}
          />
        </div>
      </section>
      {parts.length > 0 ? (
        <OutputPreview parts={parts} totalPages={totalPages} bytes={studio.fileBytes} />
      ) : null}
      <RefPrivacy />
      <RefActions
        icon="file-minus"
        label="Split PDF"
        busyLabel="Splitting PDF…"
        busy={isProcessing}
        disabled={totalPages === 0 || parts.length === 0}
        onRun={() => void studio.executeSplit()}
        downloadLabel={downloadLabelFor(parts.length, downloadAsZip)}
        downloadDisabled={totalPages === 0 || parts.length === 0 || isProcessing}
        onDownload={() => void studio.downloadResult()}
        onCopy={studio.copySummary}
        onReset={studio.clearAll}
      />
    </div>
  );
}
