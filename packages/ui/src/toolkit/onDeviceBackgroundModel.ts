/**
 * The on-device background-removal model (BiRefNet-lite via @bg0/browser), shared by Quick Auto
 * Removal and the Advanced Pen studio's Auto Select.
 *
 * The model is served by this site itself, under /models/ (staged by
 * scripts/models/stage-background-remover-models.ts). Large .onnx files arrive in <25 MiB parts
 * and are joined in the browser, so nothing is fetched from another host and the photo never
 * leaves the device.
 */
import { installChunkedModelFetch } from './chunkedModelFetch.ts';

const MODEL_PATH_PREFIX = '/models/birefnet-lite-512/';

export interface ModelProgress {
  stage: string;
  progress: number;
  message: string;
}

export interface OnDeviceCutoutOptions {
  onProgress?: (info: ModelProgress) => void;
  signal?: AbortSignal;
}

/** Same-origin model host; tests may point it elsewhere via window.__MANGOTOOLS_MODELS_HOST__. */
function modelHost(): string {
  const raw = (window as unknown as { __MANGOTOOLS_MODELS_HOST__?: string })
    .__MANGOTOOLS_MODELS_HOST__;
  return raw && raw !== '/' ? raw : `${window.location.origin}/`;
}

async function configureOrtWasm(isolated: boolean): Promise<void> {
  try {
    const ort = await import('onnxruntime-web');
    if (ort?.env?.wasm) {
      ort.env.wasm.wasmPaths = '/wasm/';
      if (!isolated) ort.env.wasm.numThreads = 1;
    }
  } catch {
    // onnxruntime-web is optional here; transformers.js configures its own copy.
  }
}

export async function configureOnDeviceModel(): Promise<void> {
  const { env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  env.allowRemoteModels = true;
  env.remoteHost = modelHost();
  env.remotePathTemplate = 'models/birefnet-lite-512/{revision}/';
  installChunkedModelFetch([MODEL_PATH_PREFIX]);

  const isolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
  if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.wasmPaths = '/wasm/';
    if (!isolated) env.backends.onnx.wasm.numThreads = 1;
  }
  await configureOrtWasm(isolated);
}

/** Run the model on `input` and return a PNG whose alpha channel is the subject mask. */
export async function cutoutOnDevice(
  input: Blob,
  options: OnDeviceCutoutOptions = {},
): Promise<Blob> {
  await configureOnDeviceModel();
  const { removeBackground } = await import('@bg0/browser');
  const outcome = await removeBackground(input, {
    quality: 'quality',
    ...(options.onProgress ? { onProgress: options.onProgress } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  });
  return outcome.blob;
}
