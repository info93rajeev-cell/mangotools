import { RefCardHead, RefCheck, RefChoice, RefDrop, RefFileItem } from './PdfRefParts.tsx';
import styles from './pdfRef.module.css';
import type { usePdfMergeStudio } from './usePdfMergeStudio.ts';

type MergeStudioState = ReturnType<typeof usePdfMergeStudio>;

const ROW_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];
const MB = 1024 * 1024;

function PdfMergeListSection({ studio }: { studio: MergeStudioState }) {
  const { files, moveFile, rotateFile, removeFile } = studio;
  const totalMb = (files.reduce((acc, f) => acc + f.sizeBytes, 0) / MB).toFixed(1);
  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);
  return (
    <section class={styles.card} data-tour="pdf-arrange" aria-label="Arrange files">
      <RefCardHead
        step={2}
        title="Arrange files in the order you want to merge"
        aside={
          <span class={styles.listMeta}>
            <span>{files.length} files</span>
            <span>Total: {totalPages} pages</span>
            <span>{totalMb} MB</span>
          </span>
        }
      />
      <div class={styles.fileList}>
        {files.map((file, idx) => (
          <RefFileItem
            key={file.id}
            index={idx}
            name={file.name}
            meta={`${file.pageCount} pages • ${(file.sizeBytes / MB).toFixed(1)} MB${file.rotation ? ` • ${file.rotation}°` : ''}`}
            color={file.themeColor || ROW_COLORS[idx % ROW_COLORS.length]}
            actions={{
              onUp: idx === 0 ? undefined : () => moveFile(idx, idx - 1),
              onDown: idx === files.length - 1 ? undefined : () => moveFile(idx, idx + 1),
              onRotate: () => rotateFile(idx),
              onRemove: () => removeFile(idx),
            }}
          />
        ))}
      </div>
    </section>
  );
}

function PdfMergeSettingsSection({ studio }: { studio: MergeStudioState }) {
  const { mergeMethod, setMergeMethod, addBookmarks, setAddBookmarks } = studio;
  return (
    <section class={styles.card} data-tour="pdf-settings" aria-label="Merge settings">
      <RefCardHead step={3} title="Merge settings" />
      <div class={styles.settingsGrid}>
        <div>
          <span class={styles.fieldLabel}>Merge method</span>
          <div class={styles.choices}>
            <RefChoice
              active={mergeMethod === 'concatenate'}
              title="Concatenate (normal order)"
              desc="Append files one after another"
              onClick={() => setMergeMethod('concatenate')}
            />
            <RefChoice
              active={mergeMethod === 'interleave'}
              title="Interleave pages"
              desc="Take 1 page from each file in turn"
              onClick={() => setMergeMethod('interleave')}
            />
          </div>
        </div>
        <div>
          <span class={styles.fieldLabel}>Other options</span>
          <RefCheck
            label="Add bookmarks for each file"
            hint="Add file names as bookmarks in the merged PDF"
            checked={addBookmarks}
            onChange={setAddBookmarks}
          />
        </div>
        <div>
          <label class={styles.fieldLabel} for="merged-output-name">
            Output file name
          </label>
          <input
            id="merged-output-name"
            class={styles.input}
            value={studio.outputFileName}
            onInput={(e) => studio.setOutputFileName(e.currentTarget.value)}
            placeholder="Merged-Document.pdf"
          />
        </div>
      </div>
    </section>
  );
}

export function PdfMergeLeftCards({ studio }: { studio: MergeStudioState }) {
  return (
    <div class={styles.column}>
      <section class={styles.card} data-tour="pdf-upload" aria-label="Add PDF files">
        <RefCardHead step={1} title="Add PDF files" />
        <RefDrop
          title="Drag & drop PDF files here"
          sub="or click to browse and select multiple files · Files stay in your browser · Max 25 MB per file, 20 files"
          button="Choose PDF Files"
          accept="application/pdf"
          multiple
          onFiles={(list) => void studio.handleAddNativeFiles(list)}
        />
      </section>
      {studio.files.length > 0 ? <PdfMergeListSection studio={studio} /> : null}
      <PdfMergeSettingsSection studio={studio} />
    </div>
  );
}
