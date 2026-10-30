import type { TourStep } from './ToolOnboardingTour.tsx';

export type PdfToolTab = 'merge' | 'split' | 'compress' | 'pdfToWord' | 'wordToPdf';

export function getPdfTourSteps(tab: PdfToolTab): TourStep[] {
  if (tab === 'split') {
    return [
      {
        id: 'split-step-1',
        targetSelector: '[data-tour="pdf-upload"]',
        stepNumber: 1,
        title: '1. Select PDF File',
        description: 'Upload your document or click "Load Sample" to begin splitting.',
      },
      {
        id: 'split-step-2',
        targetSelector: '[data-tour="pdf-arrange"]',
        stepNumber: 2,
        title: '2. Select Page Ranges',
        description: 'Choose which pages to extract or split every page into separate files.',
      },
      {
        id: 'split-step-3',
        targetSelector: '[data-tour="pdf-action"]',
        stepNumber: 3,
        title: '3. Download Split Pages',
        description: 'Click "Split PDF" to generate and download your selected pages.',
      },
    ];
  }
  if (tab === 'compress') {
    return [
      {
        id: 'compress-step-1',
        targetSelector: '[data-tour="pdf-upload"]',
        stepNumber: 1,
        title: '1. Select PDF to Compress',
        description: 'Upload the document you want to optimize in file size.',
      },
      {
        id: 'compress-step-2',
        targetSelector: '[data-tour="pdf-arrange"]',
        stepNumber: 2,
        title: '2. Choose Compression Level',
        description: 'Select between Recommended, Extreme, or Light compression.',
      },
      {
        id: 'compress-step-3',
        targetSelector: '[data-tour="pdf-action"]',
        stepNumber: 3,
        title: '3. Optimize & Download',
        description: 'Review the file size savings and download your optimized PDF.',
      },
    ];
  }
  return [
    {
      id: 'merge-step-1',
      targetSelector: '[data-tour="pdf-upload"]',
      stepNumber: 1,
      title: '1. Upload PDF Files',
      description: 'Add 2 or more PDF documents by dragging them in or clicking "Open Files".',
      hint: 'Processed 100% in your browser — zero files sent to any server.',
    },
    {
      id: 'merge-step-2',
      targetSelector: '[data-tour="pdf-arrange"]',
      stepNumber: 2,
      title: '2. Reorder Files & Settings',
      description: 'Use the drag handles or up/down arrows to set the merge order.',
    },
    {
      id: 'merge-step-3',
      targetSelector: '[data-tour="pdf-action"]',
      stepNumber: 3,
      title: '3. Merge & Download',
      description:
        'Inspect the merged page range timeline and click the golden "Merge PDFs" button.',
    },
  ];
}
