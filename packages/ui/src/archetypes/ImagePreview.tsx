import styles from '../toolkit/fileTool.module.css';

export interface ImagePreviewProps {
  src: string;
  alt: string;
  onLoad: (width: number, height: number) => void;
}

/**
 * A capped-resolution preview of the selected image, from the local file only (an object URL,
 * never a network request). The browser decodes and displays it at a CSS-limited size regardless
 * of the source image's real dimensions, so a very large source does not also make the on-page
 * preview itself slow — the same safety property this platform's own image-tools planning
 * document called for (`tasks/TASK-005A-IMAGE-TOOLS-WAVE-PLANNER.md` §3 Q13).
 */
export function ImagePreview({ src, alt, onLoad }: ImagePreviewProps) {
  return (
    <img
      class={styles.preview}
      src={src}
      alt={alt}
      onLoad={(event) => {
        const img = event.currentTarget;
        onLoad(img.naturalWidth, img.naturalHeight);
      }}
    />
  );
}
