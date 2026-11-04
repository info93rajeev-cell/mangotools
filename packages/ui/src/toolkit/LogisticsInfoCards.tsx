import { Icon } from '../primitives/Icon.tsx';
import s from './containerSupporting.module.css';

/**
 * The four information cards of the Logistics reference (Container Loading, CBM): Important Notes /
 * Warnings, Next Steps in Logistics, FAQ and Related tools, each folded with a count.
 */
export interface LogisticsInfo {
  notes: string[];
  nextSteps: { href: string; label: string }[];
  faq: { q: string; a: string }[];
  related: { href: string; label: string }[];
}

function Card(props: {
  icon: string;
  title: string;
  count: number;
  warning?: boolean;
  children: preact.ComponentChildren;
}) {
  return (
    <details>
      <summary>
        <span class={props.warning ? s.warning : undefined}>
          <Icon name={props.icon} />
        </span>
        {props.title} ({props.count})
        <Icon name="chevron-down" />
      </summary>
      {props.children}
    </details>
  );
}

export function LogisticsInfoCards({ info }: { info: LogisticsInfo }) {
  return (
    <div class={`${s.panels} ${s.always}`} data-logistics-info="">
      <Card
        icon="triangle-alert"
        title="Important Notes / Warnings"
        count={info.notes.length}
        warning
      >
        {info.notes.map((n) => (
          <p key={n}>{n}</p>
        ))}
      </Card>
      <Card icon="route" title="Next Steps in Logistics" count={info.nextSteps.length}>
        {info.nextSteps.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </Card>
      <Card icon="circle-help" title="FAQ" count={info.faq.length}>
        {info.faq.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </Card>
      <Card icon="layout-grid" title="Related tools" count={info.related.length}>
        {info.related.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </Card>
    </div>
  );
}
