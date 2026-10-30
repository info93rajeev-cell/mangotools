import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { PdfCompressLeftCards } from './PdfCompressLeftCards.tsx';
import { PdfCompressRightCards } from './PdfCompressRightCards.tsx';
import { PdfMergeLeftCards } from './PdfMergeLeftCards.tsx';
import { PdfMergeRightCards } from './PdfMergeRightCards.tsx';
import { PdfSplitLeftCards } from './PdfSplitLeftCards.tsx';
import { PdfSplitRightCards } from './PdfSplitRightCards.tsx';
import {
  PdfCompressIcon,
  PdfMergeIcon,
  PdfSplitIcon,
  PdfToWordIcon,
  WordToPdfIcon,
} from './PdfToolIcons.tsx';
import { PdfToWordLeftCards, PdfToWordRightCards } from './PdfToWordCards.tsx';
import styles from './pdfStudio.module.css';
import { getPdfTourSteps, type PdfToolTab } from './pdfTourSteps.ts';
import { isTourCompleted, ToolOnboardingTour, TourLauncherButton } from './ToolOnboardingTour.tsx';
import { usePdfCompressStudio } from './usePdfCompressStudio.ts';
import { usePdfToWordStudio, useWordToPdfStudio } from './usePdfConvertStudio.ts';
import { usePdfMergeStudio } from './usePdfMergeStudio.ts';
import { usePdfSplitStudio } from './usePdfSplitStudio.ts';
import { WordToPdfLeftCards, WordToPdfRightCards } from './WordToPdfCards.tsx';

export type { PdfToolTab };

export interface PdfDocumentStudioProps {
  toolId?: string;
  notify?: (msg: string) => void;
}

function ToolHeaderBar({
  iconNode,
  title,
  subtitle,
  badge3,
  openLabel,
  onOpen,
  onLoadSample,
  onClear,
  onLaunchTour,
}: {
  iconNode: JSX.Element;
  title: string;
  subtitle: string;
  badge3: string;
  openLabel?: string;
  onOpen?: () => void;
  onLoadSample: () => void;
  onClear: () => void;
  onLaunchTour?: () => void;
}) {
  return (
    <div class={styles.topBar}>
      <div class={styles.toolHeading}>
        <div class={styles.toolIconBox}>{iconNode}</div>
        <div class={styles.titleMeta}>
          <div class={styles.titleRow}>
            <h2 class={styles.titleText}>{title}</h2>
            <div class={styles.badgePills}>
              <span class={`${styles.badgePill} ${styles.badgePillAmber}`}>
                ⚡ Instant In-Browser
              </span>
              <span class={styles.badgePill}>🔒 100% Private</span>
              <span class={`${styles.badgePill} ${styles.badgePillBlue}`}>{badge3}</span>
            </div>
          </div>
          <p class={styles.subtitleText}>{subtitle}</p>
        </div>
      </div>
      <div class={styles.topActions}>
        {onOpen && (
          <button type="button" class={styles.actionBtnGhost} onClick={onOpen}>
            📁 {openLabel ?? 'Open Files'}
          </button>
        )}
        <button type="button" class={styles.actionBtnGhost} onClick={onLoadSample}>
          📑 Load Sample
        </button>
        <button
          type="button"
          class={`${styles.actionBtnGhost} ${styles.actionBtnDanger}`}
          onClick={onClear}
        >
          🗑️ Clear All
        </button>
        {onLaunchTour && <TourLauncherButton onClick={onLaunchTour} />}
      </div>
    </div>
  );
}

function resolveInitialPdfTab(toolId?: string): PdfToolTab {
  if (toolId === 'pdf-split') return 'split';
  if (toolId === 'compress-pdf') return 'compress';
  if (toolId === 'pdf-to-word') return 'pdfToWord';
  if (toolId === 'word-to-pdf') return 'wordToPdf';
  return 'merge';
}

function RenderPdfMergeView({
  studio,
  onOpen,
  onLaunchTour,
}: {
  studio: ReturnType<typeof usePdfMergeStudio>;
  onOpen: () => void;
  onLaunchTour: () => void;
}) {
  return (
    <>
      <ToolHeaderBar
        iconNode={<PdfMergeIcon />}
        title="PDF Merge"
        subtitle="Combine multiple PDF files into one, in the order you choose. Fast, private and easy to use in your browser."
        badge3="🛡️ No Sign-up Needed"
        openLabel="Open Files"
        onOpen={onOpen}
        onLoadSample={studio.loadSampleFiles}
        onClear={studio.clearAll}
        onLaunchTour={onLaunchTour}
      />
      <div class={styles.studioLayout}>
        <PdfMergeLeftCards studio={studio} />
        <PdfMergeRightCards studio={studio} />
      </div>
    </>
  );
}

function RenderPdfSplitView({
  studio,
  onOpen,
  onLaunchTour,
}: {
  studio: ReturnType<typeof usePdfSplitStudio>;
  onOpen: () => void;
  onLaunchTour: () => void;
}) {
  return (
    <>
      <ToolHeaderBar
        iconNode={<PdfSplitIcon />}
        title="PDF Split"
        subtitle="Extract page ranges or split a PDF into multiple smaller files, right in your browser."
        badge3="🛡️ Zero Server Upload"
        openLabel="Open PDF"
        onOpen={onOpen}
        onLoadSample={studio.loadSampleSplit}
        onClear={studio.clearAll}
        onLaunchTour={onLaunchTour}
      />
      <div class={styles.studioLayout}>
        <PdfSplitLeftCards studio={studio} />
        <PdfSplitRightCards studio={studio} />
      </div>
    </>
  );
}

function RenderPdfCompressView({
  studio,
  onOpen,
  onLaunchTour,
}: {
  studio: ReturnType<typeof usePdfCompressStudio>;
  onOpen: () => void;
  onLaunchTour: () => void;
}) {
  return (
    <>
      <ToolHeaderBar
        iconNode={<PdfCompressIcon />}
        title="Compress PDF"
        subtitle="Reduce PDF file size for email, portal uploads, and records, while keeping document quality under control."
        badge3="🛡️ No Server Upload"
        openLabel="Open PDF"
        onOpen={onOpen}
        onLoadSample={studio.loadSampleCompress}
        onClear={studio.clearAll}
        onLaunchTour={onLaunchTour}
      />
      <div class={styles.studioLayout}>
        <PdfCompressLeftCards studio={studio} />
        <PdfCompressRightCards studio={studio} />
      </div>
    </>
  );
}

function RenderPdfConvertView({
  activeTab,
  onOpen,
  pdfToWordStudio,
  wordToPdfStudio,
  onLaunchTour,
}: {
  activeTab: PdfToolTab;
  onOpen: () => void;
  pdfToWordStudio: ReturnType<typeof usePdfToWordStudio>;
  wordToPdfStudio: ReturnType<typeof useWordToPdfStudio>;
  onLaunchTour: () => void;
}) {
  if (activeTab === 'pdfToWord') {
    return (
      <>
        <ToolHeaderBar
          iconNode={<PdfToWordIcon />}
          title="PDF to Word"
          subtitle="Convert PDF documents into editable Word files while preserving layout, tables, and readable text."
          badge3="🛡️ No Server Upload"
          openLabel="Open Files"
          onOpen={onOpen}
          onLoadSample={pdfToWordStudio.loadSamplePdfToWord}
          onClear={pdfToWordStudio.clearAll}
          onLaunchTour={onLaunchTour}
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
        iconNode={<WordToPdfIcon />}
        title="Word to PDF"
        subtitle="Turn DOCX and DOC files into clean PDFs for contracts, reports, and client-ready sharing."
        badge3="🛡️ No Server Upload"
        openLabel="Open Files"
        onOpen={onOpen}
        onLoadSample={wordToPdfStudio.loadSampleWordDocs}
        onClear={wordToPdfStudio.clearAll}
        onLaunchTour={onLaunchTour}
      />
      <div class={styles.studioLayout}>
        <WordToPdfLeftCards studio={wordToPdfStudio} />
        <WordToPdfRightCards studio={wordToPdfStudio} />
      </div>
    </>
  );
}

function handleNativeFileDispatch(
  activeTab: PdfToolTab,
  list: FileList,
  studios: {
    merge: ReturnType<typeof usePdfMergeStudio>;
    split: ReturnType<typeof usePdfSplitStudio>;
    compress: ReturnType<typeof usePdfCompressStudio>;
    pdfToWord: ReturnType<typeof usePdfToWordStudio>;
    wordToPdf: ReturnType<typeof useWordToPdfStudio>;
  },
) {
  if (activeTab === 'merge') void studios.merge.handleAddNativeFiles(list);
  else if (activeTab === 'split') void studios.split.handleAddNativeFile(list[0]);
  else if (activeTab === 'compress') void studios.compress.handleAddNativeFile(list[0]);
  else if (activeTab === 'pdfToWord') {
    studios.pdfToWord.setFileName(list[0].name);
    studios.pdfToWord.setFileSizeBytes(list[0].size);
  } else if (activeTab === 'wordToPdf') {
    const added = Array.from(list).map((f, i) => ({
      id: String(Date.now() + i),
      name: f.name,
      pages: 6,
      sizeBytes: f.size,
    }));
    studios.wordToPdf.setFiles((prev) => [...prev, ...added]);
  }
}

function PdfTabRenderer({
  activeTab,
  studios,
  onOpen,
  onLaunchTour,
}: {
  activeTab: PdfToolTab;
  studios: {
    merge: ReturnType<typeof usePdfMergeStudio>;
    split: ReturnType<typeof usePdfSplitStudio>;
    compress: ReturnType<typeof usePdfCompressStudio>;
    pdfToWord: ReturnType<typeof usePdfToWordStudio>;
    wordToPdf: ReturnType<typeof useWordToPdfStudio>;
  };
  onOpen: () => void;
  onLaunchTour: () => void;
}) {
  if (activeTab === 'merge') {
    return (
      <RenderPdfMergeView studio={studios.merge} onOpen={onOpen} onLaunchTour={onLaunchTour} />
    );
  }
  if (activeTab === 'split') {
    return (
      <RenderPdfSplitView studio={studios.split} onOpen={onOpen} onLaunchTour={onLaunchTour} />
    );
  }
  if (activeTab === 'compress') {
    return (
      <RenderPdfCompressView
        studio={studios.compress}
        onOpen={onOpen}
        onLaunchTour={onLaunchTour}
      />
    );
  }
  return (
    <RenderPdfConvertView
      activeTab={activeTab}
      onOpen={onOpen}
      pdfToWordStudio={studios.pdfToWord}
      wordToPdfStudio={studios.wordToPdf}
      onLaunchTour={onLaunchTour}
    />
  );
}

export function PdfDocumentStudioLayout({ toolId, notify }: PdfDocumentStudioProps) {
  const activeTab = resolveInitialPdfTab(toolId);
  const currentToolKey = toolId ?? activeTab;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (!isTourCompleted(currentToolKey)) {
      const timer = setTimeout(() => setIsTourOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [currentToolKey]);

  useEffect(() => {
    const handleOpen = () => setIsTourOpen(true);
    window.addEventListener('mangotools:open-tour', handleOpen);
    return () => window.removeEventListener('mangotools:open-tour', handleOpen);
  }, []);

  const studios = {
    merge: usePdfMergeStudio(notify),
    split: usePdfSplitStudio(notify),
    compress: usePdfCompressStudio(notify),
    pdfToWord: usePdfToWordStudio(notify),
    wordToPdf: useWordToPdfStudio(notify),
  };

  const handleFileChange = (e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const list = e.currentTarget.files;
    if (list && list.length > 0) handleNativeFileDispatch(activeTab, list, studios);
  };

  return (
    <div class={styles.studioContainer}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={activeTab === 'merge' || activeTab === 'wordToPdf'}
        accept={activeTab === 'wordToPdf' ? '.docx,.doc' : 'application/pdf'}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <PdfTabRenderer
        activeTab={activeTab}
        studios={studios}
        onOpen={() => fileInputRef.current?.click()}
        onLaunchTour={() => setIsTourOpen(true)}
      />
      <ToolOnboardingTour
        toolId={currentToolKey}
        steps={getPdfTourSteps(activeTab)}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
