import { err, type OpWarning, ok, type Result, warning } from '@mangotools/core';
import { refineMatte, type TransparencyMode } from './edgeMatteRefinement.ts';
import { convertCutoutToPdf } from './personSegmentation.ts';
import { applyProductShadowAndBackground, type ShadowMode } from './productShadowEngine.ts';
import type {
  BgFile,
  BgOutputFormat,
  ImageBackgroundRemoverResultData,
} from './useImageBackgroundRemover.ts';

export interface UniversalCutoutInput {
  file: BgFile;
  imageSrc: string | null;
  outputFormat: BgOutputFormat;
  quality: number;
  tolerance?: number;
  feather?: number;
  transparencyMode?: TransparencyMode;
  shadowMode?: ShadowMode;
  shadowOpacity?: number;
  replacementBackground: string;
  customFileName: string;
  onProgress?: (info: { stage: string; progress: number; message: string }) => void;
  signal?: AbortSignal;
}

function evaluateAlphaCoverage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): { foregroundRatio: number; hasSubject: boolean } {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const total = width * height;
  if (total === 0) return { foregroundRatio: 0, hasSubject: false };

  let opaqueCount = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 25) {
      opaqueCount++;
    }
  }

  const ratio = opaqueCount / total;
  const hasSubject = ratio >= 0.015 && ratio <= 0.985;
  return { foregroundRatio: ratio, hasSubject };
}

function encodeCanvasBlob(
  canvas: HTMLCanvasElement,
  format: BgOutputFormat,
  quality: number,
): Promise<Blob> {
  const isJpg = format === 'jpg';
  const isWebp = format === 'webp';
  const mime = isJpg ? 'image/jpeg' : isWebp ? 'image/webp' : 'image/png';
  const q = isJpg || isWebp ? Math.max(0.1, Math.min(1.0, quality / 100)) : undefined;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode output canvas'))),
      mime,
      q,
    );
  });
}

function resolveMime(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function buildResultData(
  input: UniversalCutoutInput,
  bytes: Uint8Array,
  w: number,
  h: number,
  outExt: string,
  warnings: OpWarning[],
): ImageBackgroundRemoverResultData {
  const rawBase = input.customFileName.trim() || input.file.name.replace(/\.[^.]+$/, '');
  const outName = `${rawBase}-no-bg.${outExt}`;
  const origFormat = input.file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const outFormat = outExt.toLowerCase();
  const diff = bytes.byteLength - input.file.size;
  const pct = input.file.size > 0 ? (diff / input.file.size) * 100 : 0;

  return {
    fileName: outName,
    bytes,
    originalWidth: w,
    originalHeight: h,
    outputWidth: w,
    outputHeight: h,
    tolerance: input.tolerance ?? 0,
    feather: input.feather ?? 2,
    originalFileSize: input.file.size,
    outputFileSize: bytes.byteLength,
    sizeDifferenceBytes: diff,
    sizeChangePercent: Number(pct.toFixed(2)),
    originalFormat: origFormat,
    outputFormat: outFormat,
    warnings,
    mode: 'universal',
  };
}

interface RefinedCanvasBundle {
  canvas: HTMLCanvasElement;
  origCanvas: HTMLCanvasElement | null;
}

async function createRefinedCanvas(
  input: UniversalCutoutInput,
  cutoutBitmap: ImageBitmap,
): Promise<RefinedCanvasBundle> {
  const w = cutoutBitmap.width;
  const h = cutoutBitmap.height;

  // Ultra-high resolution guard (>16 MP): prevent browser tab OOM crashes
  if (w * h > 16_000_000) {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = w;
    fallbackCanvas.height = h;
    fallbackCanvas.getContext('2d')?.drawImage(cutoutBitmap, 0, 0);
    return { canvas: fallbackCanvas, origCanvas: null };
  }

  try {
    const origBuffer = input.file.bytes.buffer.slice(
      input.file.bytes.byteOffset,
      input.file.bytes.byteOffset + input.file.bytes.byteLength,
    ) as ArrayBuffer;
    const origBlob = new Blob([origBuffer], { type: resolveMime(input.file.name) });
    const origBitmap = await createImageBitmap(origBlob);

    const cOrig = document.createElement('canvas');
    cOrig.width = w;
    cOrig.height = h;
    const ctxOrig = cOrig.getContext('2d', { willReadFrequently: true });

    const cCut = document.createElement('canvas');
    cCut.width = w;
    cCut.height = h;
    const ctxCut = cCut.getContext('2d', { willReadFrequently: true });

    if (ctxOrig && ctxCut) {
      ctxOrig.drawImage(origBitmap, 0, 0, w, h);
      ctxCut.drawImage(cutoutBitmap, 0, 0, w, h);
      const refinedData = refineMatte(
        ctxOrig,
        ctxCut,
        w,
        h,
        input.feather ?? 2,
        input.transparencyMode ?? 'auto',
      );
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctxFinal = canvas.getContext('2d');
      if (ctxFinal) {
        ctxFinal.putImageData(refinedData, 0, 0);
        return { canvas, origCanvas: cOrig };
      }
    }
  } catch {
    // fallback to original cutout canvas if refined bitmap creation fails
  }

  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = w;
  fallbackCanvas.height = h;
  fallbackCanvas.getContext('2d')?.drawImage(cutoutBitmap, 0, 0);
  return { canvas: fallbackCanvas, origCanvas: null };
}

async function assembleCutoutResult(
  input: UniversalCutoutInput,
  blob: Blob,
): Promise<Result<ImageBackgroundRemoverResultData>> {
  const bitmap = await createImageBitmap(blob);
  const { canvas, origCanvas } = await createRefinedCanvas(input, bitmap);
  const ctx = canvas.getContext('2d');
  if (!ctx) return err('IMAGE_BACKGROUND_REMOVAL_FAILED');
  const coverage = evaluateAlphaCoverage(ctx, canvas.width, canvas.height);
  const warnings: OpWarning[] = [];
  if (!coverage.hasSubject) {
    warnings.push(
      warning('NO_CLEAR_FOREGROUND', {
        details: {
          info: 'No distinct foreground subject detected. Universal Background Remover works best on people, products, pets, vehicles, and objects.',
        },
      }),
    );
  }

  const targetBg =
    input.outputFormat === 'jpg' && input.replacementBackground === 'transparent'
      ? '#ffffff'
      : input.replacementBackground;
  const finalCanvas = applyProductShadowAndBackground(canvas, origCanvas, {
    mode: input.shadowMode ?? 'none',
    opacity: (input.shadowOpacity ?? 40) / 100,
    replacementBackground: targetBg,
  });

  const isPdf = input.outputFormat === 'pdf';
  const exportFormat = isPdf ? 'png' : input.outputFormat;
  const outBlob = await encodeCanvasBlob(finalCanvas, exportFormat, input.quality);
  const arrayBuf = await outBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);

  const rawBase = input.customFileName.trim() || input.file.name.replace(/\.[^.]+$/, '');
  const resultData = buildResultData(
    input,
    bytes,
    canvas.width,
    canvas.height,
    exportFormat,
    warnings,
  );

  if (isPdf) {
    return convertCutoutToPdf(input.file.size, rawBase, resultData);
  }

  return ok(resultData, warnings);
}

async function configureTransformersEnv(customHost?: string): Promise<void> {
  const { env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  env.allowRemoteModels = true;
  if (customHost) {
    env.remoteHost = customHost;
    env.remotePathTemplate = 'birefnet-lite-512/{revision}/';
  } else {
    env.remoteHost = 'https://huggingface.co/';
    env.remotePathTemplate = '{model}/resolve/{revision}/';
  }

  const isIsolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
  if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.wasmPaths = '/wasm/';
    if (!isIsolated) {
      env.backends.onnx.wasm.numThreads = 1;
    }
  }

  try {
    const ort = await import('onnxruntime-web');
    if (ort?.env?.wasm) {
      ort.env.wasm.wasmPaths = '/wasm/';
      if (!isIsolated) {
        ort.env.wasm.numThreads = 1;
      }
    }
  } catch {
    // ignore
  }
}

export async function executeUniversalCutout(
  input: UniversalCutoutInput,
): Promise<Result<ImageBackgroundRemoverResultData>> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return err('IMAGE_BACKGROUND_REMOVAL_FAILED');
  }

  const mime = resolveMime(input.file.name);
  const safeBuffer = input.file.bytes.buffer.slice(
    input.file.bytes.byteOffset,
    input.file.bytes.byteOffset + input.file.bytes.byteLength,
  ) as ArrayBuffer;
  const inputBlob = new Blob([safeBuffer], { type: mime });

  try {
    const customHost =
      typeof window !== 'undefined'
        ? (window as unknown as { __MANGOTOOLS_MODELS_HOST__?: string }).__MANGOTOOLS_MODELS_HOST__
        : undefined;

    await configureTransformersEnv(customHost);

    const { removeBackground } = await import('@bg0/browser');
    const outcome = await removeBackground(inputBlob, {
      quality: 'quality',
      onProgress: input.onProgress,
      signal: input.signal,
    });
    input.onProgress?.({
      stage: 'finishing',
      progress: 0.96,
      message: 'Compositing shadow & canvas…',
    });
    return await assembleCutoutResult(input, outcome.blob);
  } catch (e) {
    console.error('Universal cutout execution error:', e);
    return err('IMAGE_BACKGROUND_REMOVAL_FAILED', {
      details: { message: e instanceof Error ? e.message : String(e) },
    });
  }
}
