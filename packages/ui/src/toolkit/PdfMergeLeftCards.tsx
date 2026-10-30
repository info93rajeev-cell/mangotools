import type { JSX } from 'preact';
import styles from './pdfStudio.module.css';
import type { usePdfMergeStudio } from './usePdfMergeStudio.ts';

type MergeStudioState = ReturnType<typeof usePdfMergeStudio>;

function PdfMergeDropCard({
  handleAddNativeFiles,
}: {
  handleAddNativeFiles: MergeStudioState['handleAddNativeFiles'];
}) {
  function onFileInputChange(e: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const list = e.currentTarget.files;
    if (list && list.length > 0) void handleAddNativeFiles(list);
  }

  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>1</span> Add PDF files
        </h2>
        <span class={styles.headerCounter}>Max 100 MB per file</span>
      </div>
      <label class={styles.dropZone}>
        <span class={styles.dropIcon}>📄+</span>
        <p class={styles.dropMainText}>Drag & drop PDF files here</p>
        <p class={styles.dropSubText}>or click to browse and select multiple files</p>
        <span class={styles.chooseBtn}>Choose PDF Files</span>
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
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>2</span> Arrange files in the order you want to merge
        </h2>
        <span class={styles.headerCounter}>
          {files.length} files • {totalPages} pages • {totalMb} MB
        </span>
      </div>
      <div class={styles.fileList}>
        {files.map((file, idx) => (
          <div key={file.id} class={styles.fileRow}>
            <span class={styles.dragHandle} title="Drag to reorder">
              ⋮⋮
            </span>
            <span class={styles.fileIndex}>{idx + 1}</span>
            <div
              class={styles.fileIconBadge}
              style={{ backgroundColor: file.themeColor || '#ef4444' }}
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
              >
                ↑
              </button>
              <button
                type="button"
                class={styles.iconBtn}
                disabled={idx === files.length - 1}
                onClick={() => moveFile(idx, idx + 1)}
              >
                ↓
              </button>
              <button type="button" class={styles.iconBtn} onClick={() => rotateFile(idx)}>
                ↻
              </button>
              <button
                type="button"
                class={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                onClick={() => removeFile(idx)}
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
    <div class={styles.card}>
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
            <span class={styles.radioTitle}>Concatenate (normal order)</span>
            <span class={styles.radioDesc}>Append files one after another</span>
          </button>
          <button
            type="button"
            class={`${styles.radioCard} ${mergeMethod === 'interleave' ? styles.radioCardActive : ''}`}
            onClick={() => setMergeMethod('interleave')}
            style={{ textAlign: 'left' }}
          >
            <span class={styles.radioTitle}>Interleave pages</span>
            <span class={styles.radioDesc}>Take 1 page from each file in turn</span>
          </button>
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12.5px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={addBookmarks}
            onChange={(e) => setAddBookmarks(e.currentTarget.checked)}
          />
          <span>Add bookmarks for each file in merged PDF</span>
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
  );
}

export function PdfMergeLeftCards({ studio }: { studio: MergeStudioState }) {
  return (
    <div class={styles.scrollCol}>
      <PdfMergeDropCard handleAddNativeFiles={studio.handleAddNativeFiles} />
      <PdfMergeListCard studio={studio} />
      <PdfMergeSettingsCard studio={studio} />
    </div>
  );
}
