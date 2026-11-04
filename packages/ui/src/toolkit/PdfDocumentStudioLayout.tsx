import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { PdfCompressLeftCards } from './PdfCompressLeftCards.tsx';
import { PdfCompressRightCards } from './PdfCompressRightCards.tsx';
import { PdfMergeLeftCards } from './PdfMergeLeftCards.tsx';
import { PdfMergeRightCards } from './PdfMergeRightCards.tsx';
import { RefTopBar } from './PdfRefParts.tsx';
import { PdfSplitLeftCards } from './PdfSplitLeftCards.tsx';
import { PdfSplitRightCards } from './PdfSplitRightCards.tsx';
import { PdfToWordLeftCards, PdfToWordRightCards } from './PdfToWordCards.tsx';
import refStyles from './pdfRef.module.css';
import styles from './pdfStudio.module.css';
import { getPdfTourSteps, type PdfToolTab } from './pdfTourSteps.ts';
import { ToolOnboardingTour } from './ToolOnboardingTour.tsx';
import { usePdfCompressStudio } from './usePdfCompressStudio.ts';
import { usePdfMergeStudio } from './usePdfMergeStudio.ts';
import { usePdfSplitStudio } from './usePdfSplitStudio.ts';
import { usePdfToWordStudio } from './usePdfToWordStudio.ts';
import { useWordToPdfStudio } from './useWordToPdfStudio.ts';
import { WordToPdfLeftCards, WordToPdfRightCards } from './WordToPdfCards.tsx';

export type { PdfToolTab };

export interface PdfDocumentStudioProps {
  toolId?: string;
  notify?: (msg: string) => void;
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
}: {
  studio: ReturnType<typeof usePdfMergeStudio>;
  onOpen: () => void;
  onLaunchTour: () => void;
}) {
  return (
    <>
      <RefTopBar
        badge3="No Sign-up Needed"
        openLabel="Open Files"
        onOpen={onOpen}
        onLoadSample={studio.loadSampleFiles}
        onClear={studio.clearAll}
      />
      <div class={refStyles.layout}>
        <PdfMergeLeftCards studio={studio} />
        <PdfMergeRightCards studio={studio} />
      </div>
    </>
  );
}

function RenderPdfSplitView({
  studio,
  onOpen,
}: {
  studio: ReturnType<typeof usePdfSplitStudio>;
  onOpen: () => void;
  onLaunchTour: () => void;
}) {
  return (
    <>
      <RefTopBar
        badge3="Zero Server Upload"
        openLabel="Open PDF"
        onOpen={onOpen}
        onLoadSample={studio.loadSampleSplit}
        onClear={studio.clearAll}
      />
      <div class={refStyles.layout}>
        <PdfSplitLeftCards studio={studio} />
        <PdfSplitRightCards studio={studio} />
      </div>
    </>
  );
}

function RenderPdfCompressView({
  studio,
  onOpen,
}: {
  studio: ReturnType<typeof usePdfCompressStudio>;
  onOpen: () => void;
  onLaunchTour: () => void;
}) {
  return (
    <>
      <RefTopBar
        badge3="No Server Upload"
        openLabel="Open PDF"
        onOpen={onOpen}
        onLoadSample={studio.loadSampleCompress}
        onClear={studio.clearAll}
      />
      <div class={refStyles.layout}>
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
        <RefTopBar
          badge3="No Server Upload"
          openLabel="Open Files"
          onOpen={onOpen}
          onLoadSample={pdfToWordStudio.loadSamplePdfToWord}
          onClear={pdfToWordStudio.clearAll}
        />
        <div class={refStyles.layout}>
          <PdfToWordLeftCards studio={pdfToWordStudio} />
          <PdfToWordRightCards studio={pdfToWordStudio} />
        </div>
      </>
    );
  }
  return (
    <>
      <RefTopBar
        badge3="No Server Upload"
        openLabel="Open Files"
        onOpen={onOpen}
        onLoadSample={wordToPdfStudio.loadSampleWordDocs}
        onClear={wordToPdfStudio.clearAll}
      />
      <div class={refStyles.layout}>
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
  else if (activeTab === 'pdfToWord') void studios.pdfToWord.handleAddNativeFile(list[0]);
  else if (activeTab === 'wordToPdf') void studios.wordToPdf.handleAddNativeFiles(list);
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
    // biome-ignore lint/a11y/noStaticElementInteractions: drop target for files; the Open buttons give keyboard access.
    <div
      class={styles.studioContainer}
      data-ref-look=""
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const list = e.dataTransfer?.files;
        if (list && list.length > 0) handleNativeFileDispatch(activeTab, list, studios);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={activeTab === 'merge' || activeTab === 'wordToPdf'}
        accept={activeTab === 'wordToPdf' ? '.docx' : 'application/pdf'}
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
