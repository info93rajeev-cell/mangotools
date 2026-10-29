import { useState } from 'preact/hooks';
import styles from './dataStudio.module.css';

interface JsonTreeViewProps {
  data: unknown;
  depth?: number;
}

export function JsonTreeView({ data, depth = 0 }: JsonTreeViewProps) {
  if (depth > 12) {
    return <span style={{ color: '#91a5cc' }}>... (max depth)</span>;
  }

  if (data === null) {
    return <span class={styles.cb}>null</span>;
  }

  if (typeof data === 'boolean') {
    return <span class={styles.cb}>{data ? 'true' : 'false'}</span>;
  }

  if (typeof data === 'number' || typeof data === 'bigint') {
    return <span class={styles.cn}>{data.toString()}</span>;
  }

  if (typeof data === 'string') {
    return <span class={styles.cs}>"{data}"</span>;
  }

  if (Array.isArray(data)) {
    return <JsonArrayNode items={data} depth={depth} />;
  }

  if (typeof data === 'object') {
    return <JsonObjectNode obj={data as Record<string, unknown>} depth={depth} />;
  }

  return <span>{String(data)}</span>;
}

function JsonObjectNode({ obj, depth }: { obj: Record<string, unknown>; depth: number }) {
  const [open, setOpen] = useState(depth < 3);
  const keys = Object.keys(obj);

  if (keys.length === 0) return <span>{'{ }'}</span>;

  return (
    <div style={{ marginLeft: depth > 0 ? 14 : 0, fontFamily: 'monospace', fontSize: 11.5 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: '#1668f8',
          fontWeight: 700,
          fontFamily: 'inherit',
          fontSize: 'inherit',
        }}
      >
        {open ? '▼' : '▶'} {'{'}
        {!open && <span style={{ color: '#657b9b' }}> {keys.length} keys </span>}
      </button>
      {open ? (
        <div style={{ paddingLeft: 12, borderLeft: '1px dashed #d5e2f8' }}>
          {keys.map((k) => (
            <div key={k} style={{ lineHeight: 1.6 }}>
              <span class={styles.ck}>"{k}"</span>: <JsonTreeView data={obj[k]} depth={depth + 1} />
            </div>
          ))}
          <div>{'}'}</div>
        </div>
      ) : (
        <span>{'}'}</span>
      )}
    </div>
  );
}

function JsonArrayNode({ items, depth }: { items: unknown[]; depth: number }) {
  const [open, setOpen] = useState(depth < 2);

  if (items.length === 0) return <span>[ ]</span>;

  return (
    <div style={{ marginLeft: depth > 0 ? 14 : 0, fontFamily: 'monospace', fontSize: 11.5 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: '#09965c',
          fontWeight: 700,
          fontFamily: 'inherit',
          fontSize: 'inherit',
        }}
      >
        {open ? '▼' : '▶'} [
        {!open && <span style={{ color: '#657b9b' }}> {items.length} items </span>}
      </button>
      {open ? (
        <div style={{ paddingLeft: 12, borderLeft: '1px dashed #c9efdc' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ lineHeight: 1.6 }}>
              <span style={{ color: '#7895c0' }}>{idx}: </span>
              <JsonTreeView data={item} depth={depth + 1} />
            </div>
          ))}
          <div>]</div>
        </div>
      ) : (
        <span>]</span>
      )}
    </div>
  );
}
