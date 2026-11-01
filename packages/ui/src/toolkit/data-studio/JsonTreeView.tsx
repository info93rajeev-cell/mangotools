import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './dataStudio.module.css';
import { useJsonSearch } from './JsonSearchContext.tsx';
import { displayValue, subtreeHasHit } from './jsonSearch.ts';

interface JsonTreeViewProps {
  data: unknown;
  depth?: number;
  rootName?: string;
}

export function JsonTreeView(props: JsonTreeViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { matcher, index } = useJsonSearch();
  // Highlight the current hit and bring it into view whenever the search moves.
  useEffect(() => {
    const hits = ref.current?.querySelectorAll('[data-search-hit]') ?? [];
    for (const hit of hits) hit.removeAttribute('data-search-active');
    const active = hits[index];
    if (!active) return;
    active.setAttribute('data-search-active', '');
    active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [matcher, index, props.data]);
  return (
    <div ref={ref}>
      <TreeRoot {...props} />
    </div>
  );
}

const hitProps = (hit: boolean | undefined) => (hit ? { 'data-search-hit': '' } : {});

function TreeRoot({ data, depth = 0, rootName = 'root' }: JsonTreeViewProps) {
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
  const [userOpen, setOpen] = useState(depth < 3);
  const { matcher } = useJsonSearch();
  const open = userOpen || subtreeHasHit(obj, matcher);
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
        <span class={styles.treeNodeIcon} data-kind={isRoot ? 'root' : 'object'}>
          <Icon name={isRoot ? 'braces' : 'box'} class={styles.ico} />
        </span>
        <span
          class={isRoot ? styles.treeRootBadge : `${styles.treeKeyName} ${styles.treeObjectKey}`}
        >
          {name}
        </span>
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
  // Arrays start collapsed (except a root array) so the tree stays compact, like the reference.
  const [userOpen, setOpen] = useState(depth === 0);
  const { matcher } = useJsonSearch();
  const open = userOpen || subtreeHasHit(items, matcher);

  return (
    <div class={styles.treeNodeGroup} style={{ paddingLeft: 16 }}>
      <button
        type="button"
        class={styles.treeNodeHeader}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span class={styles.treeChevron}>{open ? '▾' : '▸'}</span>
        <span class={styles.treeNodeIcon} data-kind="array">
          <Icon name="brackets" class={styles.ico} />
        </span>
        <span
          class={`${styles.treeKeyName} ${styles.treeArrayKey}`}
          {...hitProps(depth > 0 && matcher?.(name))}
        >
          {name}
        </span>
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
  const { matcher } = useJsonSearch();

  return (
    <div class={styles.treeLeafRow} data-type={type}>
      <span class={`${styles.treeKeyName} ${styles.treeKeyPill}`} {...hitProps(matcher?.(name))}>
        {name}
      </span>
      <TypeBadge type={type} />
      <span class={styles.treeValue} {...hitProps(matcher?.(displayValue(value)))}>
        {String(value)}
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
