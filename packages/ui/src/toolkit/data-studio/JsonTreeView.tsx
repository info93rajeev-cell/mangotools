import { useState } from 'preact/hooks';
import styles from './dataStudio.module.css';

interface JsonTreeViewProps {
  data: unknown;
  depth?: number;
  rootName?: string;
}

export function JsonTreeView({ data, depth = 0, rootName = 'root' }: JsonTreeViewProps) {
  if (data === null || typeof data !== 'object') {
    return <LeafProperty name={rootName} value={data} />;
  }

  if (Array.isArray(data)) {
    return <ArrayNode name={rootName} items={data} depth={depth} />;
  }

  return (
    <ObjectNode
      name={rootName}
      obj={data as Record<string, unknown>}
      depth={depth}
      isRoot={depth === 0}
    />
  );
}

function ObjectNode({
  name,
  obj,
  depth,
  isRoot,
}: {
  name: string;
  obj: Record<string, unknown>;
  depth: number;
  isRoot?: boolean;
}) {
  const [open, setOpen] = useState(depth < 3);
  const keys = Object.keys(obj);

  return (
    <div class={styles.treeNodeGroup} style={{ paddingLeft: isRoot ? 0 : 16 }}>
      <button
        type="button"
        class={styles.treeNodeHeader}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span class={styles.treeChevron}>{open ? '▾' : '▸'}</span>
        <span class={isRoot ? styles.treeRootBadge : styles.treeKeyName}>{name}</span>
        <span class={styles.badgeObject}>{'{ }'} object</span>
        <span class={styles.treeCountBadge}>{keys.length} keys</span>
      </button>

      {open && (
        <div class={styles.treeChildren}>
          {keys.map((k) => (
            <JsonPropertyRow key={k} name={k} value={obj[k]} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArrayNode({ name, items, depth }: { name: string; items: unknown[]; depth: number }) {
  const [open, setOpen] = useState(depth < 3);

  return (
    <div class={styles.treeNodeGroup} style={{ paddingLeft: 16 }}>
      <button
        type="button"
        class={styles.treeNodeHeader}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span class={styles.treeChevron}>{open ? '▾' : '▸'}</span>
        <span class={styles.treeKeyName}>{name}</span>
        <span class={styles.badgeArray}>[ ] array</span>
        <span class={styles.treeCountBadge}>{items.length} items</span>
      </button>

      {open && (
        <div class={styles.treeChildren}>
          {items.map((item, idx) => (
            <JsonPropertyRow key={String(idx)} name={String(idx)} value={item} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function JsonPropertyRow({ name, value, depth }: { name: string; value: unknown; depth: number }) {
  if (value !== null && typeof value === 'object') {
    if (Array.isArray(value)) {
      return <ArrayNode name={name} items={value} depth={depth} />;
    }
    return <ObjectNode name={name} obj={value as Record<string, unknown>} depth={depth} />;
  }

  return <LeafProperty name={name} value={value} />;
}

function LeafProperty({ name, value }: { name: string; value: unknown }) {
  const type = value === null ? 'null' : typeof value;

  return (
    <div class={styles.treeLeafRow}>
      <span class={styles.treeKeyName}>{name}</span>
      <TypeBadge type={type} />
      <span class={styles.treeValue}>
        {type === 'string' ? `"${String(value)}"` : String(value)}
      </span>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  switch (type) {
    case 'string':
      return <span class={styles.badgeString}>string</span>;
    case 'number':
    case 'bigint':
      return <span class={styles.badgeNumber}>number</span>;
    case 'boolean':
      return <span class={styles.badgeBoolean}>boolean</span>;
    case 'null':
      return <span class={styles.badgeNull}>null</span>;
    default:
      return <span class={styles.badgeGeneric}>{type}</span>;
  }
}
