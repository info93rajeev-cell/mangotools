import { Icon } from '../primitives/Icon.tsx';
import { RefBars, RefCardHead, RefPages, RefPrivacy, RefStatus, RefTile } from './PdfRefParts.tsx';
import { reductionPercent } from './pdfCompressor.ts';
import { firstPages, usePageThumbs } from './pdfPageThumbs.ts';
import styles from './pdfRef.module.css';
import type { usePdfCompressStudio } from './usePdfCompressStudio.ts';

type CompressStudioState = ReturnType<typeof usePdfCompressStudio>;

interface Figures {
  origMb: string;
  compMb: string;
  compPercent: number;
  reduction: string;
  imagesNote: string;
  status: string;
  done: boolean;
}

const MB = 1024 * 1024;

function figures(studio: CompressStudioState): Figures {
  const { result, fileSizeBytes, isProcessing } = studio;
  if (!result) {
    let status = 'Add a PDF';
    if (isProcessing) status = 'Compressing…';
    else if (fileSizeBytes > 0) status = 'Ready to compress';
    return {
      origMb: fileSizeBytes > 0 ? `${(fileSizeBytes / MB).toFixed(2)} MB` : '—',
      compMb: '—',
      compPercent: 0,
      reduction: '—',
      imagesNote: '—',
      status,
      done: fileSizeBytes > 0,
    };
  }
  return {
    origMb: `${(result.originalBytes / MB).toFixed(2)} MB`,
    compMb: `${(result.compressedBytes / MB).toFixed(2)} MB`,
    compPercent: Math.round((result.compressedBytes / result.originalBytes) * 100),
    reduction: `${reductionPercent(result.originalBytes, result.compressedBytes)}%`,
    imagesNote: `${result.imagesRecompressed} / ${result.imagesFound}`,
    status: result.noGain ? 'Already compact' : 'Compressed',
    done: true,
  };
}

function resultText(studio: CompressStudioState): string | null {
  const r = studio.result;
  if (!r) return null;
  let text = `${r.imagesRecompressed} of ${r.imagesFound} JPEG images were re-encoded; text, fonts and vector graphics are unchanged.`;
  if (r.imagesFound === 0) {
    text = 'No JPEG images were found, so only the file structure was compacted.';
  }
  if (r.noGain)
    text += ' The compressed copy was not smaller, so the download is your original file.';
  if (!r.targetMet && r.targetBytes) {
    text += ` The ${(r.targetBytes / MB).toFixed(1)} MB target was not reached after ${r.attempts} passes.`;
  }
  return text;
}

function SummaryCard({ f, pages }: { f: Figures; pages: number }) {
  return (
    <section class={styles.card} aria-label="Compression Summary">
      <RefCardHead
        icon="files"
        title="Compression Summary"
        aside={<RefStatus text={f.status} done={f.done} />}
      />
      <div class={styles.tiles}>
        <RefTile
          labelFirst
          tone="purple"
          icon="file-text"
          label="Original Size"
          value={f.origMb}
          sub={`${pages} pages`}
        />
        <RefTile
          labelFirst
          tone="blue"
          icon="file-check"
          label="New Size"
          value={f.compMb}
          sub="Compressed"
        />
        <RefTile
          labelFirst
          tone="green"
          icon="chart-pie"
          label="Reduction"
          value={f.reduction}
          sub="Smaller file"
        />
        <RefTile
          labelFirst
          tone="amber"
          icon="star"
          label="Images Done"
          value={f.imagesNote}
          sub="Re-encoded"
        />
      </div>
    </section>
  );
}

function ComparisonCard({
  f,
  pages,
  bytes,
}: {
  f: Figures;
  pages: number;
  bytes: Uint8Array | null;
}) {
  const thumbs = usePageThumbs(bytes, firstPages(pages, 5));
  return (
    <section class={`${styles.card} ${styles.subcard}`} aria-label="Before & After Comparison">
      <RefCardHead icon="chart-column" title="Before & After Comparison" />
      <RefBars
        rows={[
          {
            label: 'Original PDF',
            value: f.origMb,
            percent: f.origMb === '—' ? 0 : 100,
            tone: 'red',
          },
          { label: 'Compressed PDF', value: f.compMb, percent: f.compPercent, tone: 'green' },
        ]}
      />
      {pages > 0 ? (
        <div style={{ marginTop: '18px' }}>
          <RefCardHead icon="eye" title={`Preview (first ${Math.min(5, pages)} pages)`} />
          <RefPages count={pages} thumbs={thumbs} />
        </div>
      ) : null}
    </section>
  );
}

export function PdfCompressRightCards({ studio }: { studio: CompressStudioState }) {
  const { totalPages, isProcessing, executeCompress, downloadCompressed, copySummary, clearAll } =
    studio;
  const f = figures(studio);
  const note = resultText(studio);
  return (
    <div class={styles.column}>
      <SummaryCard f={f} pages={totalPages} />
      <ComparisonCard f={f} pages={totalPages} bytes={studio.fileBytes} />
      {note ? (
        <p class={styles.resultNote} role="status">
          {note}
        </p>
      ) : null}
      <RefPrivacy />
      <div class={styles.stack} data-tour="pdf-action">
        <button
          type="button"
          class={styles.cta}
          disabled={isProcessing || totalPages === 0}
          onClick={() => void executeCompress()}
        >
          <Icon name="file-archive" />
          {isProcessing ? 'Compressing PDF…' : 'Compress PDF'}
          {isProcessing ? null : <Icon name="arrow-right" />}
        </button>
        <div class={styles.actionRow}>
          <button
            type="button"
            class={styles.btn}
            onClick={() => void downloadCompressed()}
            disabled={totalPages === 0 || isProcessing}
          >
            <Icon name="download" />
            Download Compressed PDF
          </button>
          <button type="button" class={styles.btn} onClick={copySummary}>
            <Icon name="copy" />
            Copy Summary
          </button>
          <button type="button" class={styles.btn} onClick={clearAll}>
            <Icon name="rotate-ccw" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
