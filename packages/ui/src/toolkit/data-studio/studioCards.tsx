import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './dataStudio.module.css';
import parts from './studioParts.module.css';

/** Shared cards of the reference data studios: info tiles, titles, examples, related tools. */

export function InfoTile(props: { icon: string; tone: string; label: string; value: string }) {
  return (
    <div class={parts.sumTile}>
      <span class={`${parts.tileSm} ${props.tone}`}>
        <Icon name={props.icon} class={parts.tileIcoSm} />
      </span>
      <span class={parts.sumText}>
        <small>{props.label}</small>
        <b>{props.value}</b>
      </span>
    </div>
  );
}

export function StatusTile({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div class={`${parts.sumTile} ${ok ? parts.sumOk : parts.sumBad}`}>
      <span class={parts.validDot}>
        <Icon name={ok ? 'check' : 'x'} class={parts.tileIcoSm} />
      </span>
      <span class={parts.sumText}>
        <small>{label}</small>
        <b>{value}</b>
      </span>
    </div>
  );
}

export function CardTitle({ icon, tone, text }: { icon: string; tone: string; text: string }) {
  return (
    <div class={styles.optTitle}>
      <span class={`${parts.tile} ${tone}`}>
        <Icon name={icon} class={parts.tileIco} />
      </span>
      <b>{text}</b>
    </div>
  );
}

export interface RelatedTool {
  href: string;
  name: string;
  note: string;
  icon: string;
  tone: string;
}

const ALL_RELATED: RelatedTool[] = [
  {
    href: '/json-formatter',
    name: 'JSON Formatter & Validator',
    note: 'Format and validate JSON data.',
    icon: 'braces',
    tone: parts.toneAmber,
  },
  {
    href: '/base64-encode-decode',
    name: 'Base64 Encode & Decode',
    note: 'Encode or decode text, files and images.',
    icon: 'binary',
    tone: parts.tonePurple,
  },
  {
    href: '/url-encode-decode',
    name: 'URL Encode & Decode',
    note: 'Encode or decode URLs.',
    icon: 'link',
    tone: parts.tonePurple,
  },
  {
    href: '/csv-to-json',
    name: 'CSV to JSON',
    note: 'Convert CSV to JSON array.',
    icon: 'file-spreadsheet',
    tone: parts.toneGreen,
  },
  {
    href: '/json-to-csv',
    name: 'JSON to CSV',
    note: 'Convert JSON to CSV.',
    icon: 'table-2',
    tone: parts.tonePink,
  },
  {
    href: '/timestamp-converter',
    name: 'Timestamp Converter',
    note: 'Convert timestamps to readable dates.',
    icon: 'clock',
    tone: parts.toneBlue,
  },
];

export function RelatedToolsCard({ current, className }: { current: string; className: string }) {
  return (
    <section class={`${styles.optcard} ${parts.auxCard} ${className}`}>
      <CardTitle icon="link" tone={parts.toneBlue} text="Related Tools" />
      <ul class={parts.relatedList}>
        {ALL_RELATED.filter((r) => r.href !== current).map((r) => (
          <li key={r.href}>
            <a class={parts.relatedItem} href={r.href}>
              <span class={`${parts.tileSm} ${r.tone}`}>
                <Icon name={r.icon} class={parts.tileIcoSm} />
              </span>
              <span class={parts.sumText}>
                <b>{r.name}</b>
                <small>{r.note}</small>
              </span>
              <Icon name="chevron-right" class={styles.ico} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ExamplesCard({
  groups,
  onUse,
  className,
  mono = false,
}: {
  groups: Readonly<Record<string, readonly string[]>>;
  onUse: (text: string, group: string) => void;
  className: string;
  mono?: boolean;
}) {
  const names = Object.keys(groups);
  const [group, setGroup] = useState(names[0] ?? '');
  return (
    <section class={`${styles.optcard} ${parts.auxCard} ${className}`}>
      <div class={parts.exHead}>
        <CardTitle icon="lightbulb" tone={parts.toneAmber} text="Examples" />
        <div class={parts.exTabs}>
          {names.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              class={`${styles.segChip} ${group === g ? styles.segChipActive : ''}`}
              onClick={() => setGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <ul class={parts.exList}>
        {(groups[group] ?? []).map((text) => (
          <li key={text} class={parts.exItem}>
            <span class={`${parts.exText} ${mono ? parts.exMono : ''}`}>{text}</span>
            <button type="button" class={styles.btnSecondary} onClick={() => onUse(text, group)}>
              Use
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
