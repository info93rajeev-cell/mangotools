import { useState } from 'preact/hooks';
import { PdfCompressLeftCards } from './PdfCompressLeftCards.tsx';
import { PdfCompressRightCards } from './PdfCompressRightCards.tsx';
import { PdfMergeLeftCards } from './PdfMergeLeftCards.tsx';
import { PdfMergeRightCards } from './PdfMergeRightCards.tsx';
import { PdfSplitLeftCards } from './PdfSplitLeftCards.tsx';
import { PdfSplitRightCards } from './PdfSplitRightCards.tsx';
import { PdfToWordLeftCards, PdfToWordRightCards } from './PdfToWordCards.tsx';
import styles from './pdfStudio.module.css';
import { usePdfCompressStudio } from './usePdfCompressStudio.ts';
import { usePdfToWordStudio, useWordToPdfStudio } from './usePdfConvertStudio.ts';
import { usePdfMergeStudio } from './usePdfMergeStudio.ts';
import { usePdfSplitStudio } from './usePdfSplitStudio.ts';
import { WordToPdfLeftCards, WordToPdfRightCards } from './WordToPdfCards.tsx';

export type PdfToolTab = 'merge' | 'split' | 'compress' | 'pdfToWord' | 'wordToPdf';

export interface PdfDocumentStudioProps {
  toolId?: string;
  notify?: (msg: string) => void;
}

const TABS: { id: PdfToolTab; label: string }[] = [
  { id: 'merge', label: '📄 PDF Merge' },
  { id: 'split', label: '✂️ PDF Split' },
  { id: 'compress', label: '🗜️ Compress PDF' },
  { id: 'pdfToWord', label: '📝 PDF to Word' },
  { id: 'wordToPdf', label: '📘 Word to PDF' },
];

function ToolHeaderBar({
  icon,
  iconClass,
  title,
  subtitle,
  badge3,
  onLoadSample,
  onClear,
}: {
  icon: string;
  iconClass: string;
  title: string;
  subtitle: string;
  badge3: string;
  onLoadSample: () => void;
  onClear: () => void;
}) {
  return (
    <div class={styles.topBar}>
      <div class={styles.toolHeading}>
        <div class={`${styles.toolIconBox} ${iconClass}`}>{icon}</div>
        <div class={styles.titleMeta}>
          <div class={styles.titleRow}>
            <h1 class={styles.titleText}>{title}</h1>
            <div class={styles.badgePills}>
              <span class={styles.badgePill}>⚡ Instant In-Browser</span>
              <span class={styles.badgePill}>🔒 100% Private</span>
              <span class={styles.badgePill}>{badge3}</span>
            </div>
          </div>
          <p class={styles.subtitleText}>{subtitle}</p>
        </div>
      </div>
      <div class={styles.topActions}>
        <button type="button" class={styles.actionBtnGhost} onClick={onLoadSample}>
          📄 Load Sample
        </button>
        <button
          type="button"
          class={`${styles.actionBtnGhost} ${styles.actionBtnDanger}`}
          onClick={onClear}
        >
          🗑 Clear All
        </button>
      </div>
    </div>
  );
}

function RenderActiveTool({
  tab,
  mergeStudio,
  splitStudio,
  compressStudio,
  pdfToWordStudio,
  wordToPdfStudio,
}: {
  tab: PdfToolTab;
  mergeStudio: ReturnType<typeof usePdfMergeStudio>;
  splitStudio: ReturnType<typeof usePdfSplitStudio>;
  compressStudio: ReturnType<typeof usePdfCompressStudio>;
  pdfToWordStudio: ReturnType<typeof usePdfToWordStudio>;
  wordToPdfStudio: ReturnType<typeof useWordToPdfStudio>;
}) {
  if (tab === 'merge') {
    return (
      <>
        <ToolHeaderBar
          icon="📄"
          iconClass={styles.toolIconMerge}
          title="PDF Merge"
          subtitle="Combine multiple PDF files into one, in the order you choose. Fast, private and easy in your browser."
          badge3="🛡️ No Sign-up Needed"
          onLoadSample={mergeStudio.loadSampleFiles}
          onClear={mergeStudio.clearAll}
        />
        <div class={styles.studioLayout}>
          <PdfMergeLeftCards studio={mergeStudio} />
          <PdfMergeRightCards studio={mergeStudio} />
        </div>
      </>
    );
  }
  if (tab === 'split') {
    return (
      <>
        <ToolHeaderBar
          icon="✂️"
          iconClass={styles.toolIconSplit}
          title="PDF Split"
          subtitle="Extract page ranges or split a PDF into multiple smaller files, right in your browser."
          badge3="🛡️ Zero Server Upload"
          onLoadSample={splitStudio.loadSampleSplit}
          onClear={splitStudio.clearAll}
        />
        <div class={styles.studioLayout}>
          <PdfSplitLeftCards studio={splitStudio} />
          <PdfSplitRightCards studio={splitStudio} />
        </div>
      </>
    );
  }
  if (tab === 'compress') {
    return (
      <>
        <ToolHeaderBar
          icon="🗜️"
          iconClass={styles.toolIconCompress}
          title="Compress PDF"
          subtitle="Reduce PDF file size for email, portal uploads, and records, while keeping quality under control."
          badge3="🛡️ No Server Upload"
          onLoadSample={compressStudio.loadSampleCompress}
          onClear={compressStudio.clearAll}
        />
        <div class={styles.studioLayout}>
          <PdfCompressLeftCards studio={compressStudio} />
          <PdfCompressRightCards studio={compressStudio} />
        </div>
      </>
    );
  }
  if (tab === 'pdfToWord') {
    return (
      <>
        <ToolHeaderBar
          icon="📝"
          iconClass={styles.toolIconWord}
          title="PDF to Word"
          subtitle="Convert PDF documents into editable Word files while preserving layout, tables, and readable text."
          badge3="🛡️ No Server Upload"
          onLoadSample={pdfToWordStudio.loadSamplePdfToWord}
          onClear={pdfToWordStudio.clearAll}
        />
        <div class={styles.studioLayout}>
          <PdfToWordLeftCards studio={pdfToWordStudio} />
          <PdfToWordRightCards studio={pdfToWordStudio} />
        </div>
      </>
    );
  }
  return (
    <>
      <ToolHeaderBar
        icon="📘"
        iconClass={styles.toolIconWord}
        title="Word to PDF"
        subtitle="Turn DOCX and DOC files into clean PDFs for contracts, reports, and client-ready sharing."
        badge3="🛡️ No Server Upload"
        onLoadSample={wordToPdfStudio.loadSampleWordDocs}
        onClear={wordToPdfStudio.clearAll}
      />
      <div class={styles.studioLayout}>
        <WordToPdfLeftCards studio={wordToPdfStudio} />
        <WordToPdfRightCards studio={wordToPdfStudio} />
      </div>
    </>
  );
}

export function PdfDocumentStudioLayout({ toolId, notify }: PdfDocumentStudioProps) {
  const initialTab: PdfToolTab = toolId === 'pdf-split' ? 'split' : 'merge';
  const [activeTab, setActiveTab] = useState<PdfToolTab>(initialTab);

  const mergeStudio = usePdfMergeStudio(notify);
  const splitStudio = usePdfSplitStudio(notify);
  const compressStudio = usePdfCompressStudio(notify);
  const pdfToWordStudio = usePdfToWordStudio(notify);
  const wordToPdfStudio = useWordToPdfStudio(notify);

  return (
    <div class={styles.studioContainer}>
      <nav class={styles.toolTabsBar} aria-label="PDF and Document Tools">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            class={`${styles.toolTabBtn} ${activeTab === t.id ? styles.toolTabBtnActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <RenderActiveTool
        tab={activeTab}
        mergeStudio={mergeStudio}
        splitStudio={splitStudio}
        compressStudio={compressStudio}
        pdfToWordStudio={pdfToWordStudio}
        wordToPdfStudio={wordToPdfStudio}
      />
    </div>
  );
}
