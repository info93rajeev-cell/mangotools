import { useEffect, useRef, useState } from 'preact/hooks';
import styles from './universalUploadDropzone.module.css';

export interface UniversalUploadDropzoneProps {
  idPrefix: string;
  accept?: string;
  file?: { name: string; size?: number } | null;
  thumbnailUrl?: string | null;
  dimensions?: { width: number; height: number } | null;
  onSelectFile: (file: File) => void;
  onClear?: () => void;
  disabled?: boolean;
  primaryText?: string;
  browseText?: string;
  supportHint?: string;
  renderImgThumbnail?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function CloudUploadIcon() {
  return (
    <svg
      class={styles.cloudIcon}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Upload icon</title>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m8 16 4-4 4 4" />
    </svg>
  );
}

interface LoadedFileCardProps {
  file: { name: string; size?: number };
  fileInputId: string;
  thumbnailUrl?: string | null;
  dimensions?: { width: number; height: number } | null;
  disabled?: boolean;
  onClear?: () => void;
  renderImgThumbnail?: boolean;
}

function LoadedFileCard({
  file,
  fileInputId,
  thumbnailUrl,
  dimensions,
  disabled,
  onClear,
  renderImgThumbnail = false,
}: LoadedFileCardProps) {
  const metaText = [
    dimensions ? `${dimensions.width} × ${dimensions.height} px` : null,
    file.size ? formatBytes(file.size) : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <div class={styles.fileCard} data-file-card="">
      {thumbnailUrl ? (
        renderImgThumbnail ? (
          <img
            src={thumbnailUrl}
            alt={file.name}
            class={styles.fileThumbnail}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div
            class={styles.fileThumbnail}
            role="img"
            aria-label={file.name}
            style={{
              backgroundImage: `url(${thumbnailUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )
      ) : (
        <div
          class={styles.fileThumbnail}
          style={{ display: 'grid', placeItems: 'center', fontSize: '14px' }}
        >
          🖼️
        </div>
      )}
      <div class={styles.fileInfo}>
        <span class={styles.fileName} title={file.name}>
          {file.name}
        </span>
        <span class={styles.fileMeta}>{metaText}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <label
          for={fileInputId}
          class={styles.replaceFileBtn}
          title="Choose a different image"
          aria-label="Change image"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          <span>Change</span>
        </label>
        {onClear && (
          <button
            type="button"
            class={styles.removeBtn}
            onClick={onClear}
            disabled={disabled}
            aria-label="Remove image"
            title="Remove image"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function DropzonePrompt({
  primaryText,
  browseText,
  supportHint,
}: {
  primaryText: string;
  browseText: string;
  supportHint: string;
}) {
  const cleanBrowse =
    browseText.replace(/^or\s+/i, '').replace(/^click\s+to\s+/i, '') || 'Browse files';
  return (
    <>
      <CloudUploadIcon />
      <span class={styles.primaryText}>{primaryText}</span>
      <div class={styles.browseButtonRow}>
        <span class={styles.orText}>or</span>
        <span class={styles.uploadBrowseBtn}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>{cleanBrowse}</span>
        </span>
      </div>
      <span class={styles.supportHint}>{supportHint}</span>
    </>
  );
}

export function UniversalUploadDropzone({
  idPrefix,
  accept = 'image/*,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
  file,
  thumbnailUrl,
  dimensions,
  onSelectFile,
  onClear,
  disabled = false,
  primaryText = 'Drag and drop images here',
  browseText = 'click to browse files',
  supportHint = 'Supports JPG, PNG, WebP, BMP. You can upload multiple images at once.',
  renderImgThumbnail = false,
}: UniversalUploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = `${idPrefix}-universal-upload-input`;

  useEffect(() => {
    if (!file && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [file]);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) onSelectFile(droppedFile);
  };

  const handleClear = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear?.();
  };

  return (
    <div class={styles.dropzoneContainer} data-universal-upload-dropzone="">
      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        accept={accept}
        class={styles.visuallyHiddenInput}
        disabled={disabled}
        onClick={(e) => {
          (e.currentTarget as HTMLInputElement).value = '';
        }}
        onChange={(e) => {
          const selected = (e.currentTarget as HTMLInputElement).files?.[0];
          if (selected) onSelectFile(selected);
        }}
      />
      <label
        for={fileInputId}
        class={styles.dropzoneBox}
        data-dragover={String(isDragOver)}
        data-upload-button=""
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DropzonePrompt
          primaryText={primaryText}
          browseText={browseText}
          supportHint={supportHint}
        />
      </label>

      {file && (
        <LoadedFileCard
          file={file}
          fileInputId={fileInputId}
          thumbnailUrl={thumbnailUrl}
          dimensions={dimensions}
          disabled={disabled}
          onClear={handleClear}
          renderImgThumbnail={renderImgThumbnail}
        />
      )}
    </div>
  );
}
