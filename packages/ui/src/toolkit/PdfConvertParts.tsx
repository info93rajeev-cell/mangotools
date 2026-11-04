import type { ComponentChildren } from 'preact';
import { Icon } from '../primitives/Icon.tsx';
import { RefCardHead } from './PdfRefParts.tsx';
import c from './pdfConvertRef.module.css';
import styles from './pdfRef.module.css';

/** Pieces shared by the PDF to Word and Word to PDF studios (reference layout). */

/** "Selected File(s) (n)" heading with the small red Clear All button. */
export function RefListHead(props: { title: string; onClear: () => void }) {
  return (
    <div class={c.listHead}>
      <RefCardHead
        icon="eye"
        title={props.title}
        aside={
          <button type="button" class={c.clearSmall} onClick={props.onClear}>
            <Icon name="trash-2" />
            Clear All
          </button>
        }
      />
    </div>
  );
}

/** A bordered option box with an icon and a title, as in the reference settings grid. */
export function RefOptionBox(props: {
  icon: string;
  title: string;
  wide?: boolean;
  inline?: boolean;
  children: ComponentChildren;
}) {
  const cls = [c.box, props.wide ? c.boxWide : '', props.inline ? c.boxInline : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div class={cls}>
      <span class={c.boxHead}>
        <Icon name={props.icon} />
        {props.title}
      </span>
      <div class={c.boxBody}>{props.children}</div>
    </div>
  );
}

const LINES = ['92%', '100%', '84%', '96%', '70%', '88%'];

/** Numbered page thumbnails (real images when given); a "…" tile stands for the pages not shown. */
export function RefPageStrip(props: {
  count: number;
  max: number;
  thumbs?: (string | null)[];
  /** Number shown on the first thumbnail (for strips that continue a document). */
  start?: number;
}) {
  const shown = Math.min(props.max, props.count);
  const start = props.start ?? 1;
  return (
    <div class={c.strip} style={{ '--strip-cols': String(props.max + 1) }}>
      {Array.from({ length: shown }, (_, i) => {
        const src = props.thumbs?.[i];
        return (
          <div key={i} class={`${c.thumb} ${i === 0 ? c.thumbFirst : ''} ${src ? c.thumbImg : ''}`}>
            {src ? (
              <img src={src} alt={`Page ${start + i}`} />
            ) : (
              LINES.map((w, n) => <span key={n} class={c.thumbLine} style={{ width: w }} />)
            )}
            <span class={c.thumbNum}>{start + i}</span>
          </div>
        );
      })}
      {props.count > shown ? (
        <span class={c.thumbMore} title={`${props.count - shown} more pages`}>
          <Icon name="ellipsis" />
        </span>
      ) : null}
    </div>
  );
}

/** Label / value pairs in two columns (PDF information). */
export function RefInfoTable(props: { rows: Array<[string, string]> }) {
  return (
    <dl class={c.info}>
      {props.rows.map(([k, v]) => (
        <div key={k} class={c.infoRow}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A small paper card with a file-type badge, used by the visual previews. */
export function RefPaper(props: {
  badge: 'PDF' | 'W';
  title: string;
  /** A real page image to show instead of placeholder lines. */
  image?: string | null;
  children?: ComponentChildren;
}) {
  if (props.image) {
    return (
      <div class={`${c.paper} ${c.paperImage}`}>
        <img src={props.image} alt={`First page of ${props.title}`} />
      </div>
    );
  }
  return (
    <div class={c.paper}>
      <span class={c.paperHead}>
        <span class={props.badge === 'PDF' ? c.badgePdf : c.badgeWord}>{props.badge}</span>
        <span class={c.paperTitle}>{props.title}</span>
      </span>
      {props.children ?? (
        <span class={c.paperLines}>
          {LINES.concat(LINES).map((w, n) => (
            <span key={n} class={styles.pageLine} style={{ width: w }} />
          ))}
        </span>
      )}
    </div>
  );
}
