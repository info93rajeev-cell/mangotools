import { SharedToolBottom } from '../layout/SharedToolBottom.tsx';
import { t as shared } from '../strings/en.ts';
import type { LoadSnapshot } from './containerWorkspaceModel.ts';
import { loadWarningText, containerText as t } from './containerWorkspaceStrings.ts';
export function ContainerToolBottom({ state }: { state: LoadSnapshot }) {
  return (
    <SharedToolBottom
      disclaimer={
        <>
          <p>{shared('disclaimer.professional')}</p>
          {state.warnings.map((code, index) => (
            <p key={`${code}-${index}`}>{loadWarningText[code] ?? t.caveat}</p>
          ))}
        </>
      }
      howTo={<p>{t.howTo}</p>}
      method={
        <>
          <p>{t.method}</p>
          <p>{t.caveat}</p>
        </>
      }
      faq={
        <>
          <strong>{t.faqQuestion}</strong>
          <p>{t.caveat}</p>
        </>
      }
      related={
        <>
          <a href="/cbm-calculator">{t.relatedCbm}</a>
          <a href="/volumetric-weight-calculator">{t.relatedWeight}</a>
          <a href="/pallet-loading-calculator">{t.relatedPallet}</a>
        </>
      }
    />
  );
}
