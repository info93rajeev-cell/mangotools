import { RefCardHead, RefChoice, RefDrop, RefFileItem } from './PdfRefParts.tsx';
import { fileMeta } from './pdfFileMeta.ts';
import styles from './pdfRef.module.css';
import type { useWordToPdfStudio } from './useWordToPdfStudio.ts';

type WordToPdfState = ReturnType<typeof useWordToPdfStudio>;

const DOCX_ACCEPT = '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function WordFilesSection({ studio }: { studio: WordToPdfState }) {
  const { files, setFiles } = studio;
  const totalPages = files.reduce((acc, f) => acc + f.pages, 0);
  return (
    <section class={styles.card} data-tour="pdf-upload" aria-label="Add Word files">
      <RefCardHead
        step={1}
        title="Add Word files"
        aside={
          files.length > 0 ? (
            <span class={styles.listMeta}>
              {files.length} files • {totalPages} pages
            </span>
          ) : null
        }
      />
      <RefDrop
        title={files.length > 0 ? 'Add more Word files' : 'Drag & drop Word files (.docx) here'}
        sub="or click to browse and select multiple files · Files stay in your browser"
        button="Choose Word Files"
        accept={DOCX_ACCEPT}
        multiple
        onFiles={(list) => void studio.handleAddNativeFiles(list)}
      />
      {files.length > 0 ? (
        <div class={styles.fileList} style={{ marginTop: '12px' }}>
          {files.map((f, idx) => (
            <RefFileItem
              key={f.id}
              index={idx}
              name={f.name}
              meta={fileMeta(f.pages, f.sizeBytes)}
              color="#2563eb"
              badge="DOC"
              actions={{
                onUp:
                  idx === 0
                    ? undefined
                    : () =>
                        setFiles((p) => {
                          const n = [...p];
                          [n[idx - 1], n[idx]] = [
                            n[idx] as (typeof p)[number],
                            n[idx - 1] as (typeof p)[number],
                          ];
                          return n;
                        }),
                onDown:
                  idx === files.length - 1
                    ? undefined
                    : () =>
                        setFiles((p) => {
                          const n = [...p];
                          [n[idx + 1], n[idx]] = [
                            n[idx] as (typeof p)[number],
                            n[idx + 1] as (typeof p)[number],
                          ];
                          return n;
                        }),
                onRemove: () => setFiles((p) => p.filter((x) => x.id !== f.id)),
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function WordSettingsSection({ studio }: { studio: WordToPdfState }) {
  const { pageSize, setPageSize, margins, setMargins, exportMode, setExportMode } = studio;
  return (
    <section class={styles.card} data-tour="pdf-settings" aria-label="Conversion Settings">
      <RefCardHead step={2} title="Conversion Settings" />
      <div class={styles.settingsGrid}>
        <div>
          <label class={styles.fieldLabel} for="w2p-page-size">
            Page size
          </label>
          <select
            id="w2p-page-size"
            class={styles.input}
            value={pageSize}
            onChange={(e) => setPageSize(e.currentTarget.value as 'A4' | 'Letter')}
          >
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="Letter">Letter (8.5 × 11 in)</option>
          </select>
        </div>
        <div>
          <label class={styles.fieldLabel} for="w2p-margins">
            Margins
          </label>
          <select
            id="w2p-margins"
            class={styles.input}
            value={margins}
            onChange={(e) => setMargins(e.currentTarget.value as 'Standard' | 'Compact')}
          >
            <option value="Standard">Standard (Normal)</option>
            <option value="Compact">Compact (Reduced)</option>
          </select>
        </div>
        <div />
      </div>
      <span class={styles.fieldLabel} style={{ marginTop: '14px' }}>
        Output
      </span>
      <div class={styles.choices}>
        <RefChoice
          active={exportMode === 'single'}
          title="Single merged PDF"
          desc="Combine all Word files"
          onClick={() => setExportMode('single')}
        />
        <RefChoice
          active={exportMode === 'separate'}
          title="One PDF per file"
          desc="Keep files separate"
          onClick={() => setExportMode('separate')}
        />
      </div>
      <p class={styles.note} style={{ marginTop: '12px' }}>
        Text, headings, bold and italic, lists and table rows are laid out with standard PDF fonts.
        Images, text boxes, headers, footers and exact Word layout are not carried over. Characters
        outside Western European text (for example Hindi or ₹) show as “?”.
      </p>
    </section>
  );
}

export function WordToPdfLeftCards({ studio }: { studio: WordToPdfState }) {
  return (
    <div class={styles.column}>
      <WordFilesSection studio={studio} />
      <WordSettingsSection studio={studio} />
    </div>
  );
}
