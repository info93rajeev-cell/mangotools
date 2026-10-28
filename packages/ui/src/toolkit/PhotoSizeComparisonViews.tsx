import styles from './photoSizeReducer.module.css';

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export interface StageSplitViewProps {
  originalSrc: string;
  reducedSrc: string;
  fileName: string;
  origSize: number;
  reducedSize: number;
  reductionPercent: number;
  splitPos: number;
  containerRef: { current: HTMLDivElement | null };
}

export function StageSplitView({
  originalSrc,
  reducedSrc,
  fileName,
  origSize,
  reducedSize,
  reductionPercent,
  splitPos,
  containerRef,
}: StageSplitViewProps) {
  return (
    <div ref={containerRef} class={styles.stageSplitContainer}>
      {/* Reduced Image (Bottom Layer) */}
      <img
        src={reducedSrc}
        alt={`Reduced: ${fileName}`}
        class={styles.stageImage}
        draggable={false}
      />

      {/* Original Image (Clipped Overlay Layer) */}
      <div class={styles.splitClipLayer} style={{ width: `${splitPos}%` }}>
        <img
          src={originalSrc}
          alt={`Original: ${fileName}`}
          class={styles.stageImage}
          style={{ maxWidth: 'none', height: '100%' }}
          draggable={false}
        />
      </div>

      {/* Draggable Split Divider Line & Handle */}
      <div class={styles.splitBar} style={{ left: `${splitPos}%` }}>
        <div class={styles.splitHandle} title="Drag left or right to compare quality">
          ↔
        </div>
      </div>

      {/* Floating Badges */}
      <div class={styles.beforeBadge} style={{ opacity: splitPos > 12 ? 1 : 0 }}>
        Before ({formatBytes(origSize)})
      </div>
      <div class={styles.afterBadge} style={{ opacity: splitPos < 88 ? 1 : 0 }}>
        After ({formatBytes(reducedSize)} • -{reductionPercent}%)
      </div>
    </div>
  );
}

export interface StageSideViewProps {
  originalSrc: string;
  reducedSrc: string;
  origSize: number;
  reducedSize: number;
  origDims: { width: number; height: number };
  reducedDims: { width: number; height: number };
}

export function StageSideView({
  originalSrc,
  reducedSrc,
  origSize,
  reducedSize,
  origDims,
  reducedDims,
}: StageSideViewProps) {
  return (
    <div class={styles.sideBySideGrid}>
      <div class={styles.sideItem}>
        <div class={styles.sideItemHeader}>
          <span class={styles.sideBadgeBefore}>BEFORE (ORIGINAL)</span>
          <span class={styles.sideMetaText}>
            {formatBytes(origSize)} • {origDims.width}×{origDims.height} px
          </span>
        </div>
        <div class={styles.sideImgBox}>
          <img src={originalSrc} alt="Original" class={styles.stageImage} />
        </div>
      </div>

      <div class={styles.sideItem}>
        <div class={styles.sideItemHeader}>
          <span class={styles.sideBadgeAfter}>AFTER (REDUCED OUTPUT)</span>
          <span class={styles.sideMetaText}>
            {formatBytes(reducedSize)} • {reducedDims.width}×{reducedDims.height} px
          </span>
        </div>
        <div class={styles.sideImgBox}>
          <img src={reducedSrc} alt="Reduced" class={styles.stageImage} />
        </div>
      </div>
    </div>
  );
}
