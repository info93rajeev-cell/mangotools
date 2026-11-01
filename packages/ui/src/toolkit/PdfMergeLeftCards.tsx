import type { JSX } from 'preact';
import styles from './pdfStudio.module.css';
import type { usePdfMergeStudio } from './usePdfMergeStudio.ts';

type MergeStudioState = ReturnType<typeof usePdfMergeStudio>;

const ROW_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];

function PdfMergeDropCard({
  handleAddNativeFiles,
  loadSampleFiles,
}: {
  handleAddNativeFiles: MergeStudioState['handleAddNativeFiles'];
  loadSampleFiles: MergeStudioState['loadSampleFiles'];
}) {
  function onFileInputChange(e: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const list = e.currentTarget.files;
    if (list && list.length > 0) void handleAddNativeFiles(list);
  }

  return (
    <div class={styles.card} data-tour="pdf-upload" style={{ padding: '6px 10px', flexShrink: 0 }}>
      <div class={styles.cardHeader} style={{ marginBottom: '4px' }}>
        <h2 class={styles.cardTitle} style={{ fontSize: '13px' }}>
          <span class={styles.stepNum}>1</span> Add PDF files
        </h2>
        <button
          type="button"
          onClick={loadSampleFiles}
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid #bfdbfe',
            background: '#eff6ff',
            color: '#1d4ed8',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📄 Load 4 Sample Files
        </button>
      </div>
      <label
        class={styles.dropZoneCompact}
        style={{ padding: '4px 8px', minHeight: '38px', gap: '8px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span class={styles.dropIcon} style={{ fontSize: '18px' }}>
            📄+
          </span>
          <div>
            <p class={styles.dropMainText} style={{ fontSize: '12px', margin: 0 }}>
              Drag & drop PDF files here
            </p>
            <p class={styles.dropSubText} style={{ fontSize: '10.5px', margin: 0 }}>
              or click to browse • Max 100 MB per file
            </p>
          </div>
        </div>
        <span class={styles.chooseBtn} style={{ padding: '4px 10px', fontSize: '11px' }}>
          Choose PDF Files
        </span>
        <input
          type="file"
          accept="application/pdf"
          multiple
          style={{ display: 'none' }}
          onChange={onFileInputChange}
        />
      </label>
    </div>
  );
}

function PdfMergeListCard({ studio }: { studio: MergeStudioState }) {
  const { files, moveFile, rotateFile, removeFile } = studio;
  const totalMb = (files.reduce((acc, f) => acc + f.sizeBytes, 0) / (1024 * 1024)).toFixed(1);
  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);

  return (
    <div class={styles.mergeListCard} data-tour="pdf-arrange">
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>2</span> Arrange files in the order you want to merge
        </h2>
        <span class={styles.headerCounter}>
          {files.length} files • Total: {totalPages} pages • {totalMb} MB
        </span>
      </div>
      <div class={styles.mergeListScroll}>
        {files.map((file, idx) => (
          <div key={file.id} class={styles.fileRow}>
            <span class={styles.dragHandle} title="Drag to reorder">
              ⋮⋮
            </span>
            <span class={styles.fileIndex}>{idx + 1}</span>
            <div
              class={styles.fileIconBadge}
              style={{ backgroundColor: file.themeColor || ROW_COLORS[idx % ROW_COLORS.length] }}
            >
              PDF
            </div>
            <div class={styles.fileDetails}>
              <span class={styles.fileName}>{file.name}</span>
              <span class={styles.fileMeta}>
                {file.pageCount} pages • {(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                {file.rotation ? ` • ${file.rotation}°` : ''}
              </span>
            </div>
            <div class={styles.rowActions}>
              <button
                type="button"
                class={styles.iconBtn}
                disabled={idx === 0}
                onClick={() => moveFile(idx, idx - 1)}
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                class={styles.iconBtn}
                disabled={idx === files.length - 1}
                onClick={() => moveFile(idx, idx + 1)}
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                class={styles.iconBtn}
                onClick={() => rotateFile(idx)}
                title="Rotate 90°"
              >
                ↻
              </button>
              <button
                type="button"
                class={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                onClick={() => removeFile(idx)}
                title="Remove file"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PdfMergeSettingsCard({ studio }: { studio: MergeStudioState }) {
  const {
    mergeMethod,
    setMergeMethod,
    addBookmarks,
    setAddBookmarks,
    outputFileName,
    setOutputFileName,
  } = studio;

  return (
    <div
      class={styles.card}
      data-tour="pdf-settings"
      style={{ padding: '8px 12px', flexShrink: 0 }}
    >
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>3</span> Merge settings
        </h2>
      </div>
      <div class={styles.settingsGrid}>
        <div class={styles.radioRow}>
          <button
            type="button"
            class={`${styles.radioCard} ${mergeMethod === 'concatenate' ? styles.radioCardActive : ''}`}
            onClick={() => setMergeMethod('concatenate')}
            style={{ textAlign: 'left' }}
          >
            <span class={styles.radioTitle}>
              <span>{mergeMethod === 'concatenate' ? '●' : '○'}</span> Concatenate (normal order)
            </span>
            <span class={styles.radioDesc}>Append files one after another</span>
          </button>
          <button
            type="button"
            class={`${styles.radioCard} ${mergeMethod === 'interleave' ? styles.radioCardActive : ''}`}
            onClick={() => setMergeMethod('interleave')}
            style={{ textAlign: 'left' }}
          >
            <span class={styles.radioTitle}>
              <span>{mergeMethod === 'interleave' ? '●' : '○'}</span> Interleave pages
            </span>
            <span class={styles.radioDesc}>Take 1 page from each file in turn</span>
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
          }}
        >
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              fontSize: '12.5px',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={addBookmarks}
                onChange={(e) => setAddBookmarks(e.currentTarget.checked)}
              />
              <span>Add bookmarks for each file</span>
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', paddingLeft: '20px' }}>
              Add file names as bookmarks in the merged PDF
            </span>
          </label>
          <div class={styles.inputRow}>
            <label class={styles.inputLabel} for="merged-output-name">
              Output file name
            </label>
            <input
              id="merged-output-name"
              class={styles.textInput}
              value={outputFileName}
              onInput={(e) => setOutputFileName(e.currentTarget.value)}
              placeholder="Merged-Document.pdf"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PdfMergeLeftCards({ studio }: { studio: MergeStudioState }) {
  return (
    <div class={styles.leftMergeCol}>
      <PdfMergeDropCard
        handleAddNativeFiles={studio.handleAddNativeFiles}
        loadSampleFiles={studio.loadSampleFiles}
      />
      <PdfMergeListCard studio={studio} />
      <PdfMergeSettingsCard studio={studio} />
    </div>
  );
}
