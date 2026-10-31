import styles from './pdfStudio.module.css';

export function HeavyBookBanner({ totalPages }: { totalPages: number }) {
  if (totalPages < 1500) return null;
  return (
    <div
      style={{
        background: '#f0f9ff',
        border: '1.5px solid #7dd3fc',
        borderRadius: '8px',
        padding: '6px 10px',
        marginBottom: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '14px' }}>📚</span>
        <strong style={{ fontSize: '12px', color: '#0369a1' }}>
          Heavy Book Engine ({totalPages.toLocaleString()} Pages Active)
        </strong>
      </div>
      <p style={{ fontSize: '11px', color: '#0c4a6e', margin: 0, lineHeight: 1.3 }}>
        Split into 16 chapters locally. Zero upload limits or tab freezing.
      </p>
    </div>
  );
}

export interface PdfMiniThumbnailsProps {
  totalPages?: number;
  selectedPage?: number;
  onSelectPage?: (page: number) => void;
}

function ThumbnailItem({
  pg,
  isSelected,
  onSelect,
}: {
  pg: number;
  isSelected: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={`Select Page ${pg}`}
      style={{
        flex: '1 1 0',
        minWidth: 0,
        maxWidth: '58px',
        height: '72px',
        border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
        borderRadius: '6px',
        background: isSelected ? '#eff6ff' : '#ffffff',
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: isSelected
          ? '0 0 0 1px #2563eb, 0 2px 4px rgba(37,99,235,0.15)'
          : '0 1px 2px rgba(0,0,0,0.03)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div
          style={{
            height: '4px',
            background: isSelected ? '#3b82f6' : '#cbd5e1',
            borderRadius: '2px',
          }}
        />
        <div
          style={{
            height: '3px',
            background: isSelected ? '#93c5fd' : '#e2e8f0',
            borderRadius: '2px',
            width: '85%',
          }}
        />
        <div
          style={{
            height: '3px',
            background: isSelected ? '#bfdbfe' : '#e2e8f0',
            borderRadius: '2px',
            width: '65%',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: isSelected ? '#2563eb' : '#475569',
        }}
      >
        Page {pg}
      </span>
    </button>
  );
}

export function PdfMiniThumbnails({
  totalPages = 5,
  selectedPage = 1,
  onSelectPage,
}: PdfMiniThumbnailsProps) {
  const count = Math.min(Math.max(totalPages, 1), 5);
  const pages = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        padding: '4px 0',
        marginTop: '6px',
      }}
    >
      {pages.map((pg) => (
        <ThumbnailItem
          key={pg}
          pg={pg}
          isSelected={pg === selectedPage}
          onSelect={() => onSelectPage?.(pg)}
        />
      ))}
    </div>
  );
}

export function PdfSplitLoadedRow({
  fileName,
  totalPages,
  mb,
  onClear,
}: {
  fileName: string;
  totalPages: number;
  mb: string;
  onClear: () => void;
}) {
  return (
    <div
      class={styles.fileRow}
      style={{ background: '#ffffff', borderColor: '#cbd5e1', marginTop: '4px' }}
    >
      <div class={styles.fileIconBadge} style={{ backgroundColor: '#ef4444' }}>
        PDF
      </div>
      <div class={styles.fileDetails}>
        <span class={styles.fileName}>{fileName}</span>
        <span class={styles.fileMeta}>
          {totalPages} pages • {mb} MB
        </span>
      </div>
      <button
        type="button"
        class={`${styles.iconBtn} ${styles.iconBtnDanger}`}
        onClick={onClear}
        title="Clear file"
      >
        ✕
      </button>
    </div>
  );
}

export function PdfSplitDropZone({ onChoose }: { onChoose: () => void }) {
  return (
    <button
      type="button"
      class={styles.dropZoneCompact}
      onClick={onChoose}
      style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span class={styles.dropIcon} style={{ fontSize: '22px' }}>
          📄+
        </span>
        <div>
          <p class={styles.dropMainText} style={{ fontSize: '13px' }}>
            Drag & drop PDF to split
          </p>
          <p class={styles.dropSubText} style={{ fontSize: '11px' }}>
            or click to browse • 100% in-browser processing
          </p>
        </div>
      </div>
      <span class={styles.chooseBtn} style={{ padding: '6px 14px', fontSize: '12px' }}>
        Choose PDF File
      </span>
    </button>
  );
}
