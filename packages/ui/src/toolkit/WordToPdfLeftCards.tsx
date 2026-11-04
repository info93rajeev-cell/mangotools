import { RefListHead, RefOptionBox, RefPageStrip } from './PdfConvertParts.tsx';
import { RefCardHead, RefChoice, RefDrop, RefFileItem } from './PdfRefParts.tsx';
import c from './pdfConvertRef.module.css';
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
        title={files.length > 0 ? 'Add more Word files' : 'Drag & drop Word files here'}
        sub="or click to browse and select files · Supports DOCX files · Files stay in your browser"
        button="Choose Word Files"
        accept={DOCX_ACCEPT}
        multiple
        onFiles={(list) => void studio.handleAddNativeFiles(list)}
      />
      {files.length > 0 ? (
        <RefListHead title={`Selected Files (${files.length})`} onClear={studio.clearAll} />
      ) : null}
      {files.length > 0 ? (
        <div class={styles.fileList}>
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
      <div class={c.grid3}>
        <RefOptionBox icon="file-text" title="Page size">
          <div class={c.compactChoices}>
            <RefChoice
              active={pageSize === 'A4'}
              title="A4"
              desc="210 × 297 mm"
              onClick={() => setPageSize('A4')}
            />
            <RefChoice
              active={pageSize === 'Letter'}
              title="Letter"
              desc="8.5 × 11 in"
              onClick={() => setPageSize('Letter')}
            />
          </div>
        </RefOptionBox>
        <RefOptionBox icon="maximize" title="Margins">
          <div class={c.compactChoices}>
            <RefChoice
              active={margins === 'Standard'}
              title="Standard"
              desc="Normal margins"
              onClick={() => setMargins('Standard')}
            />
            <RefChoice
              active={margins === 'Compact'}
              title="Compact"
              desc="Reduced margins"
              onClick={() => setMargins('Compact')}
            />
          </div>
        </RefOptionBox>
        <RefOptionBox icon="layers" title="Export mode">
          <div class={c.compactChoices}>
            <RefChoice
              active={exportMode === 'single'}
              title="Single merged PDF"
              desc="Combine all files"
              onClick={() => setExportMode('single')}
            />
            <RefChoice
              active={exportMode === 'separate'}
              title="One PDF per file"
              desc="Separate files"
              onClick={() => setExportMode('separate')}
            />
          </div>
        </RefOptionBox>
      </div>
      <p class={styles.note} style={{ marginTop: '12px' }}>
        Text, headings, bold and italic, lists and table rows are laid out with standard PDF fonts.
        Images, text boxes, headers, footers and exact Word layout are not carried over. Characters
        outside Western European text (for example Hindi or ₹) show as “?”.
      </p>
    </section>
  );
}

function SourcePreviewSection({ studio }: { studio: WordToPdfState }) {
  if (studio.files.length === 0) return null;
  return (
    <section class={styles.card} aria-label="Source Preview">
      <RefCardHead icon="eye" title="Source Preview (first few pages)" />
      {studio.files.map((f) => (
        <div key={f.id} class={c.sourceRow}>
          <span class={c.sourceName}>
            {f.name}
            <small>
              {f.pages} page{f.pages === 1 ? '' : 's'}
            </small>
          </span>
          <RefPageStrip count={f.pages} max={4} />
        </div>
      ))}
    </section>
  );
}

export function WordToPdfLeftCards({ studio }: { studio: WordToPdfState }) {
  return (
    <div class={styles.column}>
      <WordFilesSection studio={studio} />
      <WordSettingsSection studio={studio} />
      <SourcePreviewSection studio={studio} />
    </div>
  );
}
