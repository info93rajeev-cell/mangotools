import { RefListHead, RefOptionBox, RefPageStrip } from './PdfConvertParts.tsx';
import { RefCardHead, RefCheck, RefDrop, RefFileItem } from './PdfRefParts.tsx';
import c from './pdfConvertRef.module.css';
import { fileMeta } from './pdfFileMeta.ts';
import { firstPages, usePageThumbs } from './pdfPageThumbs.ts';
import styles from './pdfRef.module.css';
import { type PageMode, pickPages, type usePdfToWordStudio } from './usePdfToWordStudio.ts';

type PdfToWordState = ReturnType<typeof usePdfToWordStudio>;

function PdfToWordFileSection({ studio }: { studio: PdfToWordState }) {
  const { fileName, totalPages, fileSizeBytes, clearAll } = studio;
  return (
    <section class={styles.card} data-tour="pdf-upload" aria-label="Upload PDF File">
      <RefCardHead
        step={1}
        title="Upload PDF File"
        aside={<span class={styles.listMeta}>Supports PDF files · Max 200 MB</span>}
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
        <>
          <RefListHead title="Selected File (1)" onClear={clearAll} />
          <div class={styles.fileList}>
            <RefFileItem
              index={0}
              name={fileName}
              meta={fileMeta(totalPages, fileSizeBytes)}
              actions={{ onRemove: clearAll }}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

function PageRangeBox({ studio }: { studio: PdfToWordState }) {
  const custom = studio.pageMode === 'custom';
  const picked = studio.extraction
    ? pickPages(studio.extraction.pages, studio.pageMode, studio.pageRange)
    : null;
  return (
    <RefOptionBox icon="file-text" title="Page range" wide inline>
      <select
        class={styles.input}
        aria-label="Pages to convert"
        value={studio.pageMode}
        onChange={(e) => studio.setPageMode(e.currentTarget.value as PageMode)}
      >
        <option value="all">All pages</option>
        <option value="custom">Selected pages</option>
      </select>
      <input
        class={styles.input}
        aria-label="Page list"
        placeholder="e.g. 1-5, 8, 10-12"
        disabled={!custom}
        value={studio.pageRange}
        onInput={(e) => studio.setPageRange(e.currentTarget.value)}
      />
      {custom && picked && picked.invalid.length > 0 ? (
        <p class={c.invalidText}>Not in this file: {picked.invalid.join(', ')}</p>
      ) : null}
    </RefOptionBox>
  );
}

function PdfToWordOptionsSection({ studio }: { studio: PdfToWordState }) {
  return (
    <section class={styles.card} aria-label="Conversion Options">
      <RefCardHead step={2} title="Conversion Options" />
      <div class={c.grid2}>
        <RefOptionBox icon="file-check" title="Output format">
          <span class={c.boxValue}>DOCX (Word Document)</span>
        </RefOptionBox>
        <RefOptionBox icon="info" title="Scanned PDFs">
          <span class={c.boxHint}>
            Text inside images is not read: this tool does not do OCR. Use a PDF with selectable
            text.
          </span>
        </RefOptionBox>
        <PageRangeBox studio={studio} />
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
            label="Preserve tables"
            hint="Text in columns becomes a Word table"
            checked={studio.keepTables}
            onChange={studio.setKeepTables}
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
        The Word file gets the PDF's text as editable headings, paragraphs and tables. Images,
        colours, fonts and exact layout are not carried over. Tables are found from text that lines
        up in columns; merged cells and cells that wrap onto several lines may come out as separate
        rows.
      </p>
    </section>
  );
}

function PdfToWordPreviewSection({ studio }: { studio: PdfToWordState }) {
  const total = studio.totalPages;
  const thumbs = usePageThumbs(studio.fileBytes, firstPages(total, 5));
  if (!studio.fileName || total === 0) return null;
  return (
    <section class={styles.card} aria-label="Preview">
      <RefCardHead
        icon="eye"
        title={`Preview (first ${Math.min(5, total)} pages)`}
        aside={<span class={styles.listMeta}>{total} pages total</span>}
      />
      <div class={c.stripWrap}>
        <RefPageStrip count={total} max={5} thumbs={thumbs} />
      </div>
    </section>
  );
}

export function PdfToWordLeftCards({ studio }: { studio: PdfToWordState }) {
  return (
    <div class={styles.column}>
      <PdfToWordFileSection studio={studio} />
      <PdfToWordOptionsSection studio={studio} />
      <PdfToWordPreviewSection studio={studio} />
    </div>
  );
}
