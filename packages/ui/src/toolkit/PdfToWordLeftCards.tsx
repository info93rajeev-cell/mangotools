import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import styles from './pdfStudio.module.css';
import type { usePdfToWordStudio } from './usePdfConvertStudio.ts';

type PdfToWordState = ReturnType<typeof usePdfToWordStudio>;

function PdfPreviewStrip({ totalPages }: { totalPages: number }) {
  return (
    <div style={{ marginTop: '6px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748b',
          marginBottom: '4px',
          fontWeight: 600,
        }}
      >
        <span>Preview (first 5 pages)</span>
        <span>{totalPages} pages total</span>
      </div>
      <div class={styles.thumbStrip}>
        {[1, 2, 3, 4, 5].map((p) => (
          <div key={p} class={styles.thumbItemBtn} style={{ cursor: 'default' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ height: '3px', background: '#94a3b8', borderRadius: '1.5px' }} />
              <div
                style={{
                  height: '2px',
                  background: '#e2e8f0',
                  borderRadius: '1.5px',
                  width: '80%',
                }}
              />
              <div
                style={{
                  height: '2px',
                  background: '#e2e8f0',
                  borderRadius: '1.5px',
                  width: '60%',
                }}
              />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#334155' }}>Page {p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PdfToWordLoadedRow({
  fileName,
  totalPages,
  mb,
  onClear,
}: {
  fileName: string;
  totalPages: number;
  mb: string;
  onClear: () => void;
}) {
  return (
    <div
      class={styles.fileRow}
      style={{ background: '#ffffff', borderColor: '#bfdbfe', marginTop: '4px' }}
    >
      <div class={styles.fileIconBadge} style={{ backgroundColor: '#ef4444' }}>
        PDF
      </div>
      <div class={styles.fileDetails}>
        <span class={styles.fileName}>{fileName}</span>
        <span class={styles.fileMeta}>
          {totalPages} pages • {mb} MB
        </span>
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
  const mb = (fileSizeBytes / (1024 * 1024)).toFixed(1);

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
            onClick={loadSamplePdfToWord}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              background: '#eff6ff',
              color: '#1d4ed8',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📄 Sample Contract
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              background: '#eff6ff',
              color: '#1d4ed8',
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
          mb={mb}
          onClear={clearAll}
        />
      )}

      {fileName && <PdfPreviewStrip totalPages={totalPages} />}
    </div>
  );
}

function PdfToWordOptionsCard({ studio }: { studio: PdfToWordState }) {
  const {
    enableOcr,
    setEnableOcr,
    keepHeadings,
    setKeepHeadings,
    preserveTables,
    setPreserveTables,
    language,
    setLanguage,
  } = studio;

  return (
    <div class={styles.card} data-tour="pdf-upload" style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>2</span> Conversion Options
        </h2>
      </div>
      <div class={styles.settingsGrid}>
        <div class={styles.inputRow}>
          <label class={styles.inputLabel} for="p2w-output-format" style={{ fontSize: '11px' }}>
            Output format
          </label>
          <input
            id="p2w-output-format"
            class={styles.textInput}
            value="DOCX (Word Document)"
            readOnly
            style={{ padding: '6px 10px', fontSize: '12px' }}
          />
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>
              OCR for scanned PDFs
            </span>
            <p style={{ margin: 0, fontSize: '10.5px', color: '#64748b' }}>
              Extract text from scanned PDFs and images
            </p>
          </div>
          <input
            type="checkbox"
            checked={enableOcr}
            onChange={(e) => setEnableOcr(e.currentTarget.checked)}
          />
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            fontSize: '11.5px',
            fontWeight: 600,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={keepHeadings}
              onChange={(e) => setKeepHeadings(e.currentTarget.checked)}
            />
            <span>Keep original headings</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preserveTables}
              onChange={(e) => setPreserveTables(e.currentTarget.checked)}
            />
            <span>Preserve tables & layout</span>
          </label>
        </div>
        <div class={styles.inputRow}>
          <label class={styles.inputLabel} for="p2w-lang-select" style={{ fontSize: '11px' }}>
            Language (OCR)
          </label>
          <select
            id="p2w-lang-select"
            class={styles.textInput}
            value={language}
            onChange={(e) => setLanguage(e.currentTarget.value)}
            style={{ padding: '6px 10px', fontSize: '12px' }}
          >
            <option value="English (Auto-detect)">English (Auto-detect)</option>
            <option value="Hindi / Bilingual">Hindi / Bilingual</option>
            <option value="European Languages">European Languages</option>
          </select>
        </div>
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
