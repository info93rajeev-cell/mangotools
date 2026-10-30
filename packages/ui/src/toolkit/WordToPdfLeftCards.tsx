import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import styles from './pdfStudio.module.css';
import type { useWordToPdfStudio } from './usePdfConvertStudio.ts';

type WordToPdfState = ReturnType<typeof useWordToPdfStudio>;

function WordToPdfItemRow({
  file,
  onRemove,
}: {
  file: { id: string; name: string; pages: number; sizeBytes: number };
  onRemove: () => void;
}) {
  return (
    <div
      class={styles.fileRow}
      style={{ background: '#ffffff', borderColor: '#bfdbfe', padding: '6px 10px' }}
    >
      <div class={styles.fileIconBadge} style={{ backgroundColor: '#2563eb' }}>
        DOC
      </div>
      <div class={styles.fileDetails}>
        <span class={styles.fileName}>{file.name}</span>
        <span class={styles.fileMeta}>
          {file.pages} pages • {(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB
        </span>
      </div>
      <button
        type="button"
        class={`${styles.iconBtn} ${styles.iconBtnDanger}`}
        onClick={onRemove}
        title="Remove file"
      >
        ✕
      </button>
    </div>
  );
}

function WordToPdfFileListCard({ studio }: { studio: WordToPdfState }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files, loadSampleWordDocs, handleAddNativeFiles, setFiles } = studio;
  const totalPages = files.reduce((acc, f) => acc + f.pages, 0);

  function onFileInputChange(e: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const list = e.currentTarget.files;
    if (list && list.length > 0) void handleAddNativeFiles(list);
  }

  return (
    <div class={styles.card} data-tour="pdf-upload" style={{ padding: '8px 12px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
        multiple
        style={{ display: 'none' }}
        onChange={onFileInputChange}
      />
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>1</span> Add Word files
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span class={styles.headerCounter}>
            {files.length} files • {totalPages} pages
          </span>
          <button
            type="button"
            onClick={loadSampleWordDocs}
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
            📘 Sample DOCX
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
            {files.length > 0 ? '+ Add More' : 'Upload Files'}
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <button
          type="button"
          class={styles.dropZoneCompact}
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span class={styles.dropIcon} style={{ fontSize: '22px' }}>
              📘+
            </span>
            <div>
              <p class={styles.dropMainText} style={{ fontSize: '13px' }}>
                Drag & drop Word files (.docx, .doc)
              </p>
              <p class={styles.dropSubText} style={{ fontSize: '11px' }}>
                or click to browse multiple files • 100% in-browser
              </p>
            </div>
          </div>
          <span class={styles.chooseBtn} style={{ padding: '6px 14px', fontSize: '12px' }}>
            Choose Word Files
          </span>
        </button>
      ) : (
        <div class={styles.fileList} style={{ maxHeight: '110px', marginTop: '4px' }}>
          {files.map((f) => (
            <WordToPdfItemRow
              key={f.id}
              file={f}
              onRemove={() => setFiles((p) => p.filter((x) => x.id !== f.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WordToPdfSettingsCard({ studio }: { studio: WordToPdfState }) {
  const {
    pageSize,
    setPageSize,
    margins,
    setMargins,
    exportMode,
    setExportMode,
    preserveLinks,
    setPreserveLinks,
    includeBookmarks,
    setIncludeBookmarks,
    compressOutput,
    setCompressOutput,
  } = studio;

  return (
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>2</span> Conversion Settings
        </h2>
      </div>
      <div class={styles.settingsGrid}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div class={styles.radioCard} style={{ padding: '6px 10px' }}>
            <span class={styles.radioTitle} style={{ fontSize: '11.5px' }}>
              Page size
            </span>
            <select
              class={styles.textInput}
              value={pageSize}
              onChange={(e) => setPageSize(e.currentTarget.value as 'A4' | 'Letter')}
              style={{ padding: '5px 8px', fontSize: '11.5px' }}
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
            </select>
          </div>
          <div class={styles.radioCard} style={{ padding: '6px 10px' }}>
            <span class={styles.radioTitle} style={{ fontSize: '11.5px' }}>
              Margins
            </span>
            <select
              class={styles.textInput}
              value={margins}
              onChange={(e) => setMargins(e.currentTarget.value as 'Standard' | 'Compact')}
              style={{ padding: '5px 8px', fontSize: '11.5px' }}
            >
              <option value="Standard">Standard (Normal)</option>
              <option value="Compact">Compact (Reduced)</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            class={`${styles.radioCard} ${exportMode === 'single' ? styles.radioCardActive : ''}`}
            onClick={() => setExportMode('single')}
            style={{ flex: 1, textAlign: 'left', padding: '6px 10px' }}
          >
            <span class={styles.radioTitle} style={{ fontSize: '11.5px' }}>
              <span>{exportMode === 'single' ? '●' : '○'}</span> Single merged PDF
            </span>
            <span class={styles.radioDesc} style={{ fontSize: '10px' }}>
              Combine all Word files
            </span>
          </button>
          <button
            type="button"
            class={`${styles.radioCard} ${exportMode === 'separate' ? styles.radioCardActive : ''}`}
            onClick={() => setExportMode('separate')}
            style={{ flex: 1, textAlign: 'left', padding: '6px 10px' }}
          >
            <span class={styles.radioTitle} style={{ fontSize: '11.5px' }}>
              <span>{exportMode === 'separate' ? '●' : '○'}</span> One PDF per file
            </span>
            <span class={styles.radioDesc} style={{ fontSize: '10px' }}>
              Keep files separate
            </span>
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeBookmarks}
              onChange={(e) => setIncludeBookmarks(e.currentTarget.checked)}
            />
            <span>Include bookmarks</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preserveLinks}
              onChange={(e) => setPreserveLinks(e.currentTarget.checked)}
            />
            <span>Preserve hyperlinks</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={compressOutput}
              onChange={(e) => setCompressOutput(e.currentTarget.checked)}
            />
            <span>Compress output</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export function WordToPdfLeftCards({ studio }: { studio: WordToPdfState }) {
  return (
    <div class={styles.leftMergeCol}>
      <WordToPdfFileListCard studio={studio} />
      <WordToPdfSettingsCard studio={studio} />
    </div>
  );
}
