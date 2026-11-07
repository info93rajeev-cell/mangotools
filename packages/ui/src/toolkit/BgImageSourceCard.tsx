/**
 * One place to bring a photo into the Background Remover (both modes):
 * - nothing loaded: a sample photo to try, plus Upload Image (or drop a photo here);
 * - the sample is loaded: it says so, with Upload Image;
 * - your photo is loaded: its name and size, with Replace Image (starts fresh with a new photo).
 */
import { useRef, useState } from 'preact/hooks';
import styles from './bgImageSourceCard.module.css';

export interface BgImageSourceCardProps {
  idPrefix: string;
  accept: string;
  /** Preview of the loaded photo, or null when nothing is loaded. */
  imageUrl: string | null;
  fileName: string;
  dims: { width: number; height: number } | null;
  isSample: boolean;
  sampleUrl: string;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
  disabled?: boolean;
}

function firstImage(list: FileList | null | undefined): File | null {
  const f = list?.[0];
  return f && (f.type.startsWith('image/') || f.type === '') ? f : null;
}

function LoadedRow(p: BgImageSourceCardProps & { pick: () => void }) {
  const meta = p.dims?.width ? `${p.dims.width} × ${p.dims.height} px` : '';
  return (
    <div class={styles.loaded} data-image-source="loaded" data-sample={String(p.isSample)}>
      <img src={p.imageUrl ?? ''} alt="" class={styles.thumb} />
      <div class={styles.info}>
        <span class={styles.name} title={p.fileName}>
          {p.isSample ? 'Sample photo' : p.fileName}
        </span>
        <span class={styles.meta}>
          {p.isSample ? 'Try the tool on it, or upload your own photo.' : meta}
        </span>
      </div>
      <button
        type="button"
        class={p.isSample ? styles.primaryBtn : styles.replaceBtn}
        onClick={p.pick}
        disabled={p.disabled}
        title={p.isSample ? 'Upload your photo' : 'Use a different photo (current work is cleared)'}
      >
        {p.isSample ? '📤 Upload Image' : '🔄 Replace Image'}
      </button>
    </div>
  );
}

function EmptyRow(p: BgImageSourceCardProps & { pick: () => void }) {
  return (
    <div class={styles.empty} data-image-source="empty">
      <button
        type="button"
        class={styles.sampleBtn}
        onClick={p.onTrySample}
        disabled={p.disabled}
        title="Load the sample photo"
      >
        <img src={p.sampleUrl} alt="" class={styles.sampleThumb} loading="lazy" />
        <span>Try sample</span>
      </button>
      <div class={styles.uploadSide}>
        <button type="button" class={styles.primaryBtn} onClick={p.pick} disabled={p.disabled}>
          📤 Upload Image
        </button>
        <span class={styles.meta}>or drop a photo here · JPG, PNG, WebP</span>
      </div>
    </div>
  );
}

export function BgImageSourceCard(props: BgImageSourceCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);
  const pick = () => inputRef.current?.click();
  const take = (f: File | null) => {
    if (f && !props.disabled) props.onSelectFile(f);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drop target; the buttons inside are the accessible controls
    <div
      class={styles.card}
      data-drag-over={String(over)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(firstImage(e.dataTransfer?.files));
      }}
    >
      <label for={`${props.idPrefix}-image-source`} class="visually-hidden">
        Choose an image
      </label>
      <input
        ref={inputRef}
        id={`${props.idPrefix}-image-source`}
        type="file"
        accept={props.accept}
        class="visually-hidden"
        tabIndex={-1}
        onChange={(e) => {
          const input = e.currentTarget as HTMLInputElement;
          take(firstImage(input.files));
          input.value = '';
        }}
      />
      {props.imageUrl ? <LoadedRow {...props} pick={pick} /> : <EmptyRow {...props} pick={pick} />}
    </div>
  );
}
