import { type ComponentChildren, Fragment } from 'preact';
import { Icon } from '../primitives/Icon.tsx';
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
}) {
  return (
    <div class={`${styles.tile} ${TILE_TONE[props.tone]}`}>
      <span class={styles.tileIcon}>
        <Icon name={props.icon} />
      </span>
      <span class={styles.tileLabel}>{props.label}</span>
      <span class={styles.tileValue}>{props.value}</span>
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

/** Paper-style page placeholders (the studio does not render page images). */
export function RefPages(props: { count: number }) {
  const shown = Math.min(5, props.count);
  return (
    <div class={styles.pages}>
      {Array.from({ length: shown }, (_, i) => (
        <div key={i} class={`${styles.page} ${i === 0 ? styles.pageFirst : ''}`}>
          <span class={styles.pageHead} />
          {LINE_WIDTHS.map((w, n) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative lines
            <span key={n} class={styles.pageLine} style={{ width: w }} />
          ))}
          <span class={styles.pageNum}>{i + 1}</span>
        </div>
      ))}
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
