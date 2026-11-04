import { RefCardHead, RefCheck, RefDrop, RefFileItem, RefPages } from './PdfRefParts.tsx';
import { fileMeta } from './pdfFileMeta.ts';
import styles from './pdfRef.module.css';
import type { usePdfToWordStudio } from './usePdfToWordStudio.ts';

type PdfToWordState = ReturnType<typeof usePdfToWordStudio>;

function PdfToWordFileSection({ studio }: { studio: PdfToWordState }) {
  const { fileName, totalPages, fileSizeBytes, clearAll } = studio;
  return (
    <section class={styles.card} data-tour="pdf-upload" aria-label="Upload PDF File">
      <RefCardHead
        step={1}
        title="Upload PDF File"
        aside={<span class={styles.listMeta}>Supports PDF files · Max 100 MB</span>}
      />
      <RefDrop
        title="Drag & drop a PDF file here"
        sub="or click to browse and select a file · Files stay in your browser"
        button="Choose PDF File"
        accept="application/pdf"
        onFiles={(list) => {
          const file = list[0];
          if (file) void studio.handleAddNativeFile(file);
        }}
      />
      {fileName ? (
        <div class={styles.fileList} style={{ marginTop: '12px' }}>
          <RefFileItem
            name={fileName}
            meta={fileMeta(totalPages, fileSizeBytes)}
            actions={{ onRemove: clearAll }}
          />
        </div>
      ) : null}
      {fileName && totalPages > 0 ? (
        <div style={{ marginTop: '14px' }}>
          <RefCardHead
            icon="eye"
            title={`Preview (first ${Math.min(5, totalPages)} pages)`}
            aside={<span class={styles.listMeta}>{totalPages} pages total</span>}
          />
          <RefPages count={totalPages} />
        </div>
      ) : null}
    </section>
  );
}

function PdfToWordOptionsSection({ studio }: { studio: PdfToWordState }) {
  return (
    <section class={styles.card} aria-label="Conversion Options">
      <RefCardHead step={2} title="Conversion Options" />
      <div class={styles.optionBoxes}>
        <div class={styles.optionBox}>
          <RefCheck
            label="Keep original headings"
            hint="Larger text becomes Word headings"
            checked={studio.keepHeadings}
            onChange={studio.setKeepHeadings}
          />
        </div>
        <div class={styles.optionBox}>
          <RefCheck
            label="Page break between pages"
            hint="Start each PDF page on a new Word page"
            checked={studio.pageBreaks}
            onChange={studio.setPageBreaks}
          />
        </div>
      </div>
      <p class={styles.note} style={{ marginTop: '12px' }}>
        The Word file gets the PDF's text as editable headings and paragraphs. Layout, columns,
        tables, images and fonts are not carried over. A scanned PDF is a picture of text and has no
        text to convert; this tool does not do OCR.
      </p>
    </section>
  );
}

export function PdfToWordLeftCards({ studio }: { studio: PdfToWordState }) {
  return (
    <div class={styles.column}>
      <PdfToWordFileSection studio={studio} />
      <PdfToWordOptionsSection studio={studio} />
    </div>
  );
}
