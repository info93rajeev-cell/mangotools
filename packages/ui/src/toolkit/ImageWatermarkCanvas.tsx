import styles from './imageWatermark.module.css';
import { UniversalUploadDropzone } from './UniversalUploadDropzone.tsx';
import type { UseImageWatermarkReturn, WatermarkPosition } from './useImageWatermark.ts';

export interface ImageWatermarkCanvasProps {
  idPrefix: string;
  watermark: UseImageWatermarkReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

function getWatermarkOverlayStyle(
  pos: WatermarkPosition,
  opacity: number,
  fontSize: number,
  color: string,
) {
  const base: Record<string, string | number> = {
    position: 'absolute',
    opacity: opacity / 100,
    color,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: '800',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    lineHeight: 1,
    letterSpacing: '0.02em',
  };

  switch (pos) {
    case 'top-left':
      return { ...base, top: '20px', left: '20px', fontSize: `${Math.max(16, fontSize)}px` };
    case 'top-right':
      return { ...base, top: '20px', right: '20px', fontSize: `${Math.max(16, fontSize)}px` };
    case 'center':
      return {
        ...base,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-25deg)',
        fontSize: `${Math.max(22, Math.round(fontSize * 1.3))}px`,
      };
    case 'bottom-left':
      return { ...base, bottom: '20px', left: '20px', fontSize: `${Math.max(16, fontSize)}px` };
    default:
      return { ...base, bottom: '20px', right: '20px', fontSize: `${Math.max(16, fontSize)}px` };
  }
}

export function ImageWatermarkCanvas({
  idPrefix,
  watermark,
  onSelectFile,
  onTrySample,
}: ImageWatermarkCanvasProps) {
  const isExecuting = watermark.phase === 'running';
  const hasFile = !!watermark.file;
  const overlayText = watermark.text.trim() || 'BeyondTheAI';

  const patternW = Math.max(160, Math.round(overlayText.length * watermark.fontSize * 0.65 + 70));
  const patternH = Math.max(80, Math.round(watermark.fontSize * 3.2));

  return (
    <div class={styles.studioCard}>
      <div class={styles.cardHeader}>
        <span class={styles.cardTitle}>1. Upload images</span>
        <div class={styles.headerActions}>
          <button
            type="button"
            class={styles.sampleMiniBtn}
            onClick={onTrySample}
            disabled={isExecuting}
            title="Load sample photo"
          >
            ✨ Try Sample
          </button>
        </div>
      </div>

      <UniversalUploadDropzone
        idPrefix={idPrefix}
        accept="image/jpeg,image/png,image/webp"
        file={watermark.file}
        thumbnailUrl={watermark.imageSrc}
        dimensions={watermark.sourceDims.width > 0 ? watermark.sourceDims : null}
        onSelectFile={onSelectFile}
        onClear={watermark.clearAll}
        disabled={isExecuting}
        browseText="Upload Image"
      />

      {hasFile && watermark.imageSrc && (
        <div class={styles.canvasBody}>
          <div class={styles.imageStageBox}>
            <img src={watermark.imageSrc} alt="Uploaded display" class={styles.stageImg} />
            {watermark.position === 'tiled' ? (
              <svg class={styles.tiledSvgOverlay} aria-hidden="true">
                <defs>
                  <pattern
                    id={`${idPrefix}-wm-tile`}
                    width={patternW}
                    height={patternH}
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-28)"
                  >
                    <text
                      x={patternW / 2}
                      y={patternH / 2}
                      fill={watermark.color}
                      opacity={watermark.opacity / 100}
                      fontSize={watermark.fontSize}
                      fontFamily="Inter, system-ui, -apple-system, sans-serif"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {overlayText}
                    </text>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#${idPrefix}-wm-tile)`} />
              </svg>
            ) : (
              <div
                class={styles.watermarkOverlay}
                style={getWatermarkOverlayStyle(
                  watermark.position,
                  watermark.opacity,
                  watermark.fontSize,
                  watermark.color,
                )}
              >
                {overlayText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
