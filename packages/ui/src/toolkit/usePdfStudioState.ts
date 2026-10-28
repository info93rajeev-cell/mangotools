import { useEffect, useRef, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { downloadBytes } from './actions.ts';
import { compileImagesToPdf } from './imagePdfExport.ts';
import { createScenicSampleImages } from './samplePdfImages.ts';
import type { UseImageFormatConverterReturn } from './useImageFormatConverter.ts';

export interface PdfImageItem {
  id: string;
  name: string;
  size: number;
  width: number;
  height: number;
  bytes: Uint8Array;
  blobUrl: string;
}

export type PageSizeOption = 'a4' | 'letter' | 'fit';
export type OrientationOption = 'portrait' | 'landscape' | 'auto';
export type FitModeOption = 'fit' | 'fill' | 'original';
export type MarginsOption = 'normal' | 'small' | 'none';

async function readFileAsItem(file: File, index: number): Promise<PdfImageItem | null> {
  const isImg = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|bmp)$/i);
  if (!isImg) return null;

  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: file.type || 'image/jpeg' }));
    let width = 800;
    let height = 600;
    if (typeof createImageBitmap !== 'undefined') {
      try {
        const bmp = await createImageBitmap(file);
        width = bmp.width;
        height = bmp.height;
      } catch {
        // fallback
      }
    }
    return {
      id: `${file.name}-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      width,
      height,
      bytes,
      blobUrl,
    };
  } catch {
    return null;
  }
}

async function executePdfDownload(
  images: PdfImageItem[],
  outputFileName: string,
  settings: {
    pageSize: PageSizeOption;
    orientation: OrientationOption;
    margins: MarginsOption;
    fitMode: FitModeOption;
  },
): Promise<Uint8Array | null> {
  const res = await compileImagesToPdf({
    images: images.map((img) => ({
      name: img.name,
      bytes: img.bytes,
      width: img.width,
      height: img.height,
    })),
    pageSize: settings.pageSize,
    orientation: settings.orientation,
    margins: settings.margins,
    fitMode: settings.fitMode,
  });

  if (!res.ok) return null;
  const base = outputFileName.trim();
  const cleanName = base.endsWith('.pdf') ? base : `${base || 'images'}.pdf`;
  downloadBytes(res.value.pdfBytes, cleanName, 'application/pdf');
  return res.value.pdfBytes;
}

function usePdfImages(
  converter?: UseImageFormatConverterReturn,
  notify?: (message: string) => void,
  onPhase?: (phase: FilePhase) => void,
) {
  const [images, setImages] = useState<PdfImageItem[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);

  useEffect(() => {
    if (converter?.file && images.length === 0) {
      const f = converter.file;
      setImages([
        {
          id: `seed-${Date.now()}`,
          name: f.name,
          size: f.size,
          width: converter.sourceDims.width || 800,
          height: converter.sourceDims.height || 600,
          bytes: f.bytes,
          blobUrl: URL.createObjectURL(new Blob([f.bytes as BlobPart])),
        },
      ]);
    }
  }, [converter?.file]);

  const processFiles = async (files: FileList | File[]) => {
    const promises: Promise<PdfImageItem | null>[] = [];
    for (let i = 0; i < files.length; i++) promises.push(readFileAsItem(files[i], i));
    const valid = (await Promise.all(promises)).filter(
      (item): item is PdfImageItem => item !== null,
    );
    if (valid.length > 0) {
      setImages((prev) => [...prev, ...valid]);
      onPhase?.('idle');
      notify?.(`Added ${valid.length} image${valid.length > 1 ? 's' : ''}`);
    }
  };

  const loadSamples = async () => {
    try {
      setIsCompiling(true);
      const samples = await createScenicSampleImages();
      setImages(
        samples.map((s, idx) => ({
          id: `sample-${idx}-${Date.now()}`,
          name: s.name,
          size: s.size,
          width: s.width,
          height: s.height,
          bytes: s.bytes,
          blobUrl: s.blobUrl,
        })),
      );
      onPhase?.('idle');
      notify?.('Loaded 5 sample images');
    } finally {
      setIsCompiling(false);
    }
  };

  const clearAll = () => {
    for (const img of images) {
      if (img.blobUrl.startsWith('blob:')) URL.revokeObjectURL(img.blobUrl);
    }
    setImages([]);
    onPhase?.('idle');
  };

  return { images, setImages, isCompiling, setIsCompiling, processFiles, loadSamples, clearAll };
}

function usePdfSettings() {
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<OrientationOption>('portrait');
  const [fitMode, setFitMode] = useState<FitModeOption>('fit');
  const [margins, setMargins] = useState<MarginsOption>('normal');
  const [outputFileName, setOutputFileName] = useState<string>('images.pdf');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return {
    pageSize,
    setPageSize,
    orientation,
    setOrientation,
    fitMode,
    setFitMode,
    margins,
    setMargins,
    outputFileName,
    setOutputFileName,
    isDragging,
    setIsDragging,
    fileInputRef,
  };
}

export function usePdfStudioState(
  converter?: UseImageFormatConverterReturn,
  notify?: (message: string) => void,
  onPhase?: (phase: FilePhase) => void,
) {
  const imgState = usePdfImages(converter, notify, onPhase);
  const cfgState = usePdfSettings();

  const downloadPdf = async () => {
    if (imgState.images.length === 0) return;
    try {
      imgState.setIsCompiling(true);
      onPhase?.('running');
      const pdfBytes = await executePdfDownload(imgState.images, cfgState.outputFileName, {
        pageSize: cfgState.pageSize,
        orientation: cfgState.orientation,
        margins: cfgState.margins,
        fitMode: cfgState.fitMode,
      });
      if (!pdfBytes) {
        notify?.('Failed to compile PDF.');
        onPhase?.('error');
        return;
      }
      onPhase?.('result');
      notify?.('Downloaded PDF');
    } catch {
      notify?.('Error generating PDF.');
      onPhase?.('error');
    } finally {
      imgState.setIsCompiling(false);
    }
  };

  return {
    ...imgState,
    ...cfgState,
    downloadPdf,
  };
}
