import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import { fileMeta } from './pdfFileMeta.ts';
import styles from './pdfStudio.module.css';
import type { usePdfToWordStudio } from './usePdfToWordStudio.ts';

type PdfToWordState = ReturnType<typeof usePdfToWordStudio>;

function PdfPreviewStrip({ totalPages }: { totalPages: number }) {
  return (
    <div style={{ marginTop: '6px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--color-text-subtle)',
          marginBottom: '4px',
          fontWeight: 600,
        }}
      >
        <span>Pages</span>
        <span>{totalPages} pages total</span>
      </div>
      <div class={styles.thumbStrip}>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
          <div key={p} class={styles.thumbItemBtn} style={{ cursor: 'default' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ height: '3px', background: '#94a3b8', borderRadius: '1.5px' }} />
              <div
                style={{
                  height: '2px',
                  background: 'var(--color-track)',
                  borderRadius: '1.5px',
                  width: '80%',
                }}
              />
              <div
                style={{
                  height: '2px',
                  background: 'var(--color-track)',
                  borderRadius: '1.5px',
                  width: '60%',
                }}
              />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-muted)' }}>
              Page {p}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PdfToWordLoadedRow({
  fileName,
  totalPages,
  sizeBytes,
  onClear,
}: {
  fileName: string;
  totalPages: number;
  sizeBytes: number;
  onClear: () => void;
}) {
  return (
    <div
      class={styles.fileRow}
      style={{ background: 'var(--color-panel)', borderColor: '#bfdbfe', marginTop: '4px' }}
    >
      <div class={styles.fileIconBadge} style={{ backgroundColor: '#ef4444' }}>
        PDF
      </div>
      <div class={styles.fileDetails}>
        <span class={styles.fileName}>{fileName}</span>
        <span class={styles.fileMeta}>{fileMeta(totalPages, sizeBytes)}</span>
      </div>
      <button
        type="button"
        class={`${styles.iconBtn} ${styles.iconBtnDanger}`}
        onClick={onClear}
        title="Clear file"
      >
        ✕
      </button>
    </div>
  );
}

function PdfToWordFileCard({ studio }: { studio: PdfToWordState }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    fileName,
    totalPages,
    fileSizeBytes,
    clearAll,
    loadSamplePdfToWord,
    handleAddNativeFile,
  } = studio;

  function onFileInputChange(e: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const file = e.currentTarget.files?.[0];
    if (file) void handleAddNativeFile(file);
  }

  return (
    <div class={styles.card} data-tour="pdf-upload" style={{ padding: '8px 12px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={onFileInputChange}
      />
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>1</span> Upload PDF File
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => void loadSamplePdfToWord()}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              background: 'var(--color-tint-blue)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📄 Sample PDF
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              background: 'var(--color-tint-blue)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {fileName ? 'Change File' : 'Upload PDF'}
          </button>
        </div>
      </div>

      {!fileName ? (
        <button
          type="button"
          class={styles.dropZoneCompact}
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span class={styles.dropIcon} style={{ fontSize: '22px' }}>
              📄+
            </span>
            <div>
              <p class={styles.dropMainText} style={{ fontSize: '13px' }}>
                Drag & drop a PDF file here
              </p>
              <p class={styles.dropSubText} style={{ fontSize: '11px' }}>
                or click to browse • 100% in-browser processing
              </p>
            </div>
          </div>
          <span class={styles.chooseBtn} style={{ padding: '6px 14px', fontSize: '12px' }}>
            Choose PDF File
          </span>
        </button>
      ) : (
        <PdfToWordLoadedRow
          fileName={fileName}
          totalPages={totalPages}
          sizeBytes={fileSizeBytes}
          onClear={clearAll}
        />
      )}

      {fileName && <PdfPreviewStrip totalPages={totalPages} />}
    </div>
  );
}

function OptionCheck(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}

function PdfToWordOptionsCard({ studio }: { studio: PdfToWordState }) {
  return (
    <div class={styles.card} data-tour="pdf-upload" style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>2</span> Conversion Options
        </h2>
      </div>
      <div class={styles.settingsGrid}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            fontSize: '11.5px',
            fontWeight: 600,
          }}
        >
          <OptionCheck
            label="Keep headings (larger text)"
            checked={studio.keepHeadings}
            onChange={studio.setKeepHeadings}
          />
          <OptionCheck
            label="Page break between pages"
            checked={studio.pageBreaks}
            onChange={studio.setPageBreaks}
          />
        </div>
        <p
          style={{
            margin: 0,
            fontSize: '10.5px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.45,
          }}
        >
          The Word file gets the PDF's text as editable headings and paragraphs. Layout, columns,
          tables, images and fonts are not carried over. A scanned PDF is a picture of text and has
          no text to convert; this tool does not do OCR.
        </p>
      </div>
    </div>
  );
}

export function PdfToWordLeftCards({ studio }: { studio: PdfToWordState }) {
  return (
    <div class={styles.leftMergeCol}>
      <PdfToWordFileCard studio={studio} />
      <PdfToWordOptionsCard studio={studio} />
    </div>
  );
}
