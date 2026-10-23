import type { ComponentChildren } from 'preact';
import { Icon } from '../primitives/Icon.tsx';
import s from './sharedBottom.module.css';
import { sharedBottomText as t } from './sharedBottomStrings.ts';
export interface SharedToolBottomProps {
  disclaimer: ComponentChildren;
  howTo: ComponentChildren;
  method: ComponentChildren;
  faq: ComponentChildren;
  related: ComponentChildren;
}
/** The same disclosure strip is reusable by CBM and every Logistics workspace. */
export function SharedToolBottom(props: SharedToolBottomProps) {
  const items = [
    ['disclaimer', t.disclaimer, 'info', '#0065ff'],
    ['howTo', t.howTo, 'book-open', '#0084ff'],
    ['method', t.method, 'settings', '#9664d4'],
    ['faq', t.faq, 'circle-help', '#ef2461'],
    ['related', t.related, 'link', '#a16bda'],
  ] as const;
  return (
    <section class={s.bottom} aria-label={t.sections} data-shared-tool-bottom="">
      <div class={s.strip}>
        {items.map(([key, label, icon, tone]) => (
          <details key={key} style={{ '--pill-tone': tone }}>
            <summary>
              <Icon name={icon} />
              <span>{label}</span>
              <b aria-hidden="true">+</b>
            </summary>
            <div class={s.disclosureBody}>{props[key]}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
