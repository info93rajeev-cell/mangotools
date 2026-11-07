import { useCallback, useState } from 'preact/hooks';
import { autoDetectForegroundPath } from './classicalAutoSelect.ts';
import { cutoutOnDevice } from './onDeviceBackgroundModel.ts';
import { refineCutoutCanvas } from './refineCutoutImage.ts';
import type { usePenSelectionHistory } from './usePenSelectionHistory.ts';

async function imageToBlob(img: HTMLImageElement): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext('2d')?.drawImage(img, 0, 0);
  return await new Promise<Blob>((resolve, reject) =>
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not read image'))),
      'image/jpeg',
      0.95,
    ),
  );
}

export interface AutoSelectStatus {
  busy: boolean;
  progress: number;
  message: string;
}

/** Auto Select: on-device AI mask; falls back to the classical outline if the model fails. */
export function useAutoSelect(
  image: HTMLImageElement | null,
  pathState: ReturnType<typeof usePenSelectionHistory>,
  notify: (msg: string) => void,
) {
  const [status, setStatus] = useState<AutoSelectStatus>({ busy: false, progress: 0, message: '' });
  const runAutoSelect = useCallback(async () => {
    if (!image || status.busy) return;
    setStatus({ busy: true, progress: 0, message: 'Preparing AI model…' });
    try {
      const cutout = await cutoutOnDevice(await imageToBlob(image), {
        onProgress: (p) => setStatus({ busy: true, progress: p.progress, message: p.message }),
      });
      const raw = await createImageBitmap(cutout);
      setStatus({ busy: true, progress: 0.97, message: 'Refining edges…' });
      const refined = refineCutoutCanvas(image, raw, raw.width, raw.height);
      pathState.setAiMask(refined ? await createImageBitmap(refined) : raw);
      notify('Subject selected by the on-device AI. Refine with Brush Add / Brush Remove.');
    } catch {
      pathState.pushHistory(autoDetectForegroundPath(image));
      notify('AI model unavailable — used basic edge detection instead.');
    } finally {
      setStatus({ busy: false, progress: 0, message: '' });
    }
  }, [image, status.busy, pathState.setAiMask, pathState.pushHistory, notify]);
  return { autoSelectStatus: status, runAutoSelect };
}
