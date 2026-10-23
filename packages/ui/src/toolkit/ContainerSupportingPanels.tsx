import { Icon } from '../primitives/Icon.tsx';
import s from './containerSupporting.module.css';
import type { LoadSnapshot } from './containerWorkspaceModel.ts';
import { loadWarningText, containerText as t } from './containerWorkspaceStrings.ts';

function RelatedLinks() {
  return (
    <>
      <a href="/cbm-calculator">{t.relatedCbm}</a>
      <a href="/volumetric-weight-calculator">{t.relatedWeight}</a>
      <a href="/pallet-loading-calculator">{t.relatedPallet}</a>
    </>
  );
}
export function ContainerSupportingPanels({ state }: { state: LoadSnapshot }) {
  return (
    <div class={s.panels} data-container-supporting="">
      <details>
        <summary>
          <span class={s.warning}>
            <Icon name="triangle-alert" />
          </span>
          {t.notes}
          <Icon name="chevron-down" />
        </summary>
        {state.warnings.map((code, index) => (
          <p key={`${code}-${index}`}>{loadWarningText[code] ?? t.caveat}</p>
        ))}
      </details>
      <details>
        <summary>
          <span>
            <Icon name="arrow-right" />
          </span>
          {t.nextSteps}
          <Icon name="chevron-down" />
        </summary>
        <RelatedLinks />
      </details>
      <details>
        <summary>
          <span>
            <Icon name="circle-help" />
          </span>
          {t.faq}
          <Icon name="chevron-down" />
        </summary>
        <h3>{t.faqQuestion}</h3>
        <p>{t.caveat}</p>
      </details>
      <details>
        <summary>
          <span>
            <Icon name="container" />
          </span>
          {t.relatedTools}
          <Icon name="chevron-down" />
        </summary>
        <RelatedLinks />
      </details>
    </div>
  );
}
