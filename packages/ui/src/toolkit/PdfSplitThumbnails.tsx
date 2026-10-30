export function HeavyBookBanner({ totalPages }: { totalPages: number }) {
  if (totalPages < 1500) return null;
  return (
    <div
      style={{
        background: '#f0f9ff',
        border: '1.5px solid #7dd3fc',
        borderRadius: '8px',
        padding: '10px 12px',
        marginBottom: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>📚</span>
        <strong style={{ fontSize: '13px', color: '#0369a1' }}>
          Heavy Book Engine (1,600 Pages Active)
        </strong>
      </div>
      <p style={{ fontSize: '12px', color: '#0c4a6e', margin: 0, lineHeight: 1.4 }}>
        Split into 16 chapters (100 pages each) locally. No Adobe sign-in, upload limits, or tab
        freezing.
      </p>
    </div>
  );
}

export function PdfMiniThumbnails() {
  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 2px' }}>
      {[1, 2, 3, 4, 5].map((pg) => (
        <div
          key={pg}
          style={{
            minWidth: '60px',
            height: '78px',
            border: pg === 1 ? '2px solid #2563eb' : '1px solid #cbd5e1',
            borderRadius: '6px',
            background: '#ffffff',
            padding: '5px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div
              style={{
                height: '4px',
                background: pg === 1 ? '#bfdbfe' : '#e2e8f0',
                borderRadius: '2px',
              }}
            />
            <div
              style={{ height: '3px', background: '#e2e8f0', borderRadius: '2px', width: '85%' }}
            />
            <div
              style={{ height: '3px', background: '#e2e8f0', borderRadius: '2px', width: '65%' }}
            />
          </div>
          <span
            style={{ fontSize: '11px', fontWeight: 700, color: pg === 1 ? '#2563eb' : '#475569' }}
          >
            {pg}
          </span>
        </div>
      ))}
    </div>
  );
}
