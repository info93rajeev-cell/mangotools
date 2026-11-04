import { type ComponentChildren, Fragment } from 'preact';
import { Icon } from '../primitives/Icon.tsx';
import { usePageThumbs } from './pdfPageThumbs.ts';
import styles from './pdfRef.module.css';

/** Shared pieces of the PDF studios in the approved reference look. */

export function RefTopBar(props: {
  badge3: string;
  openLabel: string;
  onOpen: () => void;
  onLoadSample: () => void;
  onClear: () => void;
  extra?: ComponentChildren;
}) {
  return (
    <div class={styles.topBar}>
      <div class={styles.badges}>
        <span class={`${styles.badge} ${styles.badgeAmber}`}>
          <Icon name="zap" />
          Instant In-Browser
        </span>
        <span class={`${styles.badge} ${styles.badgeGreen}`}>
          <Icon name="lock" />
          100% Private
        </span>
        <span class={`${styles.badge} ${styles.badgeBlue}`}>
          <Icon name="shield-check" />
          {props.badge3}
        </span>
      </div>
      <div class={styles.actions}>
        <button type="button" class={styles.btn} onClick={props.onOpen}>
          <Icon name="folder-open" />
          {props.openLabel}
        </button>
        <button type="button" class={styles.btn} onClick={props.onLoadSample}>
          <Icon name="file-text" />
          Load Sample
        </button>
        <button type="button" class={`${styles.btn} ${styles.btnDanger}`} onClick={props.onClear}>
          <Icon name="trash-2" />
          Clear All
        </button>
        {props.extra}
      </div>
    </div>
  );
}

export function RefCardHead(props: {
  step?: number;
  icon?: string;
  title: string;
  aside?: ComponentChildren;
}) {
  return (
    <div class={styles.cardHead}>
      <h2 class={styles.cardTitle}>
        {props.step ? <span class={styles.step}>{props.step}</span> : null}
        {props.icon ? <Icon name={props.icon} /> : null}
        {props.title}
      </h2>
      {props.aside}
    </div>
  );
}

export function RefStatus(props: { text: string; done?: boolean }) {
  return (
    <span class={styles.statusPill} role="status">
      <Icon name={props.done === false ? 'info' : 'circle-check'} />
      {props.text}
    </span>
  );
}

export type TileTone = 'purple' | 'blue' | 'green' | 'amber';
const TILE_TONE: Record<TileTone, string> = {
  purple: styles.tilePurple as string,
  blue: styles.tileBlue as string,
  green: styles.tileGreen as string,
  amber: styles.tileAmber as string,
};

export function RefTile(props: {
  tone: TileTone;
  icon: string;
  label: string;
  value: string;
  sub: string;
  /** The reference puts the value first; Compress PDF puts the label first. */
  labelFirst?: boolean;
}) {
  return (
    <div
      class={`${styles.tile} ${TILE_TONE[props.tone]} ${props.labelFirst ? styles.tileLabelFirst : ''}`}
    >
      <span class={styles.tileIcon}>
        <Icon name={props.icon} />
      </span>
      <span class={styles.tileValue}>{props.value}</span>
      <span class={styles.tileLabel}>{props.label}</span>
      <span class={styles.tileSub}>{props.sub}</span>
    </div>
  );
}

export function RefBars(props: {
  rows: { label: string; value: string; percent: number; tone: 'red' | 'green' }[];
}) {
  return (
    <div class={styles.bars}>
      {props.rows.map((row) => (
        <Fragment key={row.label}>
          <span>{row.label}</span>
          <span class={styles.barTrack}>
            <span
              class={row.tone === 'red' ? styles.barFillRed : styles.barFillGreen}
              style={{ width: `${Math.max(0, Math.min(100, row.percent))}%`, display: 'block' }}
            />
          </span>
          <span class={styles.barValue}>{row.value}</span>
        </Fragment>
      ))}
    </div>
  );
}

const LINE_WIDTHS = ['92%', '100%', '84%', '96%', '70%', '100%', '88%', '60%'];

/** Page previews: real page images when `thumbs` has them, paper placeholders until then. */
export function RefPages(props: { count: number; thumbs?: (string | null)[] }) {
  const shown = Math.min(5, props.count);
  return (
    <div class={styles.pages}>
      {Array.from({ length: shown }, (_, i) => {
        const src = props.thumbs?.[i];
        return (
          <div
            key={i}
            class={`${styles.page} ${i === 0 ? styles.pageFirst : ''} ${src ? styles.pageImg : ''}`}
          >
            {src ? (
              <img src={src} alt={`Page ${i + 1}`} />
            ) : (
              <>
                <span class={styles.pageHead} />
                {LINE_WIDTHS.map((w, n) => (
                  <span key={n} class={styles.pageLine} style={{ width: w }} />
                ))}
              </>
            )}
            <span class={styles.pageNum}>{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

export function RefPrivacy() {
  return (
    <div class={styles.privacy}>
      <Icon name="lock" />
      <span>
        <span class={styles.privacyTitle}>Your files stay in your browser</span>
        <span class={styles.privacyText}>
          All processing is done locally on your device. We do not upload, store or share your
          files.
        </span>
      </span>
    </div>
  );
}

/** Drop zone that opens the file picker (a label wraps the hidden input). */
export function RefDrop(props: {
  title: string;
  sub: string;
  button: string;
  accept: string;
  multiple?: boolean;
  onFiles: (files: FileList) => void;
}) {
  return (
    <label class={styles.drop}>
      <Icon name="file-plus" />
      <span class={styles.dropTitle}>{props.title}</span>
      <span class={styles.dropSub}>{props.sub}</span>
      <span class={styles.dropBtn}>{props.button}</span>
      <input
        type="file"
        accept={props.accept}
        multiple={props.multiple}
        hidden
        onChange={(e) => {
          const list = e.currentTarget.files;
          if (list && list.length > 0) props.onFiles(list);
          e.currentTarget.value = '';
        }}
      />
    </label>
  );
}

export interface RefRowActions {
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
  onRotate?: (() => void) | undefined;
  onRemove?: (() => void) | undefined;
}

/** A file in a list: number, coloured document badge, name, meta and row actions. */
export function RefFileItem(props: {
  index?: number;
  name: string;
  meta: string;
  color?: string;
  badge?: string;
  actions: RefRowActions;
}) {
  const a = props.actions;
  return (
    <div class={`${styles.fileRow} ${styles.fileItem}`}>
      {props.index === undefined ? null : (
        <>
          <span class={styles.grip} aria-hidden="true">
            <Icon name="grip-vertical" />
          </span>
          <span class={styles.fileIndex}>{props.index + 1}</span>
        </>
      )}
      <span class={styles.fileBadge} style={props.color ? { background: props.color } : undefined}>
        {props.badge ?? 'PDF'}
      </span>
      <span class={styles.fileText}>
        <span class={styles.fileName}>{props.name}</span>
        <span class={styles.fileMeta}>{props.meta}</span>
      </span>
      <span class={styles.rowActions}>
        {a.onUp === undefined && props.index === undefined ? null : (
          <button
            type="button"
            class={styles.iconBtnPlain}
            onClick={a.onUp}
            disabled={!a.onUp}
            aria-label="Move up"
          >
            <Icon name="chevron-up" />
          </button>
        )}
        {a.onDown === undefined && props.index === undefined ? null : (
          <button
            type="button"
            class={styles.iconBtnPlain}
            onClick={a.onDown}
            disabled={!a.onDown}
            aria-label="Move down"
          >
            <Icon name="chevron-down" />
          </button>
        )}
        {a.onRotate ? (
          <button
            type="button"
            class={styles.iconBtnPlain}
            onClick={a.onRotate}
            aria-label="Rotate 90°"
          >
            <Icon name="rotate-ccw" />
          </button>
        ) : null}
        {a.onRemove ? (
          <button type="button" class={styles.iconBtn} onClick={a.onRemove} aria-label="Remove">
            <Icon name="trash-2" />
          </button>
        ) : null}
      </span>
    </div>
  );
}

/** Small selectable card with a radio mark (for two or three settings choices). */
export function RefChoice(props: {
  active: boolean;
  title: string;
  desc?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.active}
      class={`${styles.choice} ${props.active ? styles.choiceActive : ''}`}
      onClick={props.onClick}
    >
      <span class={styles.radio} aria-hidden="true" />
      <span class={styles.choiceText}>
        <span class={styles.choiceTitle}>{props.title}</span>
        {props.desc ? <span class={styles.choiceDesc}>{props.desc}</span> : null}
      </span>
    </button>
  );
}

export function RefCheck(props: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label class={styles.check}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
      <span>
        <span class={styles.checkLabel}>{props.label}</span>
        {props.hint ? <span class={styles.checkHint}>{props.hint}</span> : null}
      </span>
    </label>
  );
}

/** The amber main action and the Download / Copy / Reset row under it. */
export function RefActions(props: {
  icon: string;
  label: string;
  busyLabel: string;
  busy: boolean;
  disabled: boolean;
  onRun: () => void;
  downloadLabel: string;
  downloadDisabled: boolean;
  onDownload: () => void;
  onCopy: () => void;
  onReset: () => void;
}) {
  return (
    <div class={styles.actionsBlock} data-tour="pdf-action">
      <button
        type="button"
        class={styles.cta}
        disabled={props.busy || props.disabled}
        onClick={props.onRun}
      >
        <Icon name={props.icon} />
        {props.busy ? props.busyLabel : props.label}
        {props.busy ? null : <Icon name="arrow-right" />}
      </button>
      <div class={styles.actionRow}>
        <button
          type="button"
          class={styles.btn}
          onClick={props.onDownload}
          disabled={props.downloadDisabled}
        >
          <Icon name="download" />
          {props.downloadLabel}
        </button>
        <button type="button" class={styles.btn} onClick={props.onCopy}>
          <Icon name="copy" />
          Copy Summary
        </button>
        <button type="button" class={styles.btn} onClick={props.onReset}>
          <Icon name="rotate-ccw" />
          Reset
        </button>
      </div>
    </div>
  );
}

/** One real page image inside a small paper frame (merge and split previews). */
export function RefPaperThumb(props: {
  bytes?: Uint8Array | null;
  page?: number;
  rotation?: number;
  children?: ComponentChildren;
}) {
  const [src] = usePageThumbs(props.bytes, [props.page ?? 1], 120);
  return (
    <span class={`${styles.flowPaper} ${src ? styles.pageImg : ''}`}>
      {src ? (
        <img
          src={src}
          alt={`Page ${props.page ?? 1}`}
          style={props.rotation ? { transform: `rotate(${props.rotation}deg)` } : undefined}
        />
      ) : (
        props.children
      )}
    </span>
  );
}
