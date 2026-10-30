import styles from './imageMobileActionBar.module.css';
import { formatImageBytes } from './imageSizeFormat.ts';

export interface ImageMobileActionBarProps {
  hasFile: boolean;
  phase: 'idle' | 'running' | 'result' | 'error';
  primaryLabel?: string;
  onPrimaryClick?: () => void;
  outputFileSize?: number | null;
  onDownload?: () => void;
  downloadLabel?: string;
  isDownloadDisabled?: boolean;
  onReset?: () => void;
}

export function ImageMobileActionBar({
  hasFile,
  phase,
  primaryLabel = 'Process Image',
  onPrimaryClick,
  outputFileSize,
  onDownload,
  downloadLabel,
  isDownloadDisabled = false,
  onReset,
}: ImageMobileActionBarProps) {
  const isRunning = phase === 'running';
  const hasResult = phase === 'result' && !isDownloadDisabled;
  const sizeSuffix = outputFileSize ? ` · ${formatImageBytes(outputFileSize)}` : '';
  const finalDownloadText = downloadLabel || `Download${sizeSuffix}`;

  return (
    <div class={`${styles.mobileBarWrap} no-print`} data-mobile-action-bar="">
      <div class={styles.mobileBarInner}>
        {hasResult && onDownload ? (
          <>
            <button
              type="button"
              class={styles.downloadBtn}
              onClick={onDownload}
              disabled={isDownloadDisabled || isRunning}
              aria-label={finalDownloadText}
            >
              <span>📥 {finalDownloadText}</span>
            </button>
            {onReset && (
              <button
                type="button"
                class={styles.resetBtn}
                onClick={onReset}
                title="Reset settings"
                aria-label="Reset settings"
              >
                <span>↺</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              class={styles.primaryBtn}
              onClick={onPrimaryClick}
              disabled={!hasFile || isRunning}
              aria-label={isRunning ? 'Processing image…' : primaryLabel}
            >
              <span>{isRunning ? '⏳ Processing…' : `⚡ ${primaryLabel}`}</span>
            </button>
            {onReset && hasFile && (
              <button
                type="button"
                class={styles.resetBtn}
                onClick={onReset}
                title="Reset image"
                aria-label="Reset image"
              >
                <span>↺</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
