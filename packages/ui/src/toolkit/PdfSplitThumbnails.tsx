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
        minWidth: '58px',
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
        gap: '8px',
        overflowX: 'auto',
        padding: '4px 2px',
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
