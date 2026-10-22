import type { RunFn } from '@mangotools/runtime';
import { useState } from 'preact/hooks';
import { copyText } from './actions.ts';
import {
  ContainerConstraints,
  ContainerCostInputs,
  ContainerSelection,
} from './ContainerLoadInputs.tsx';
import { ContainerFreightResult, ContainerLoadingResults } from './ContainerLoadingResults.tsx';
import { ContainerPackageWorksheet } from './ContainerPackageWorksheet.tsx';
import { ContainerPlacementView } from './ContainerPlacementView.tsx';
import s from './containerWorkspace.module.css';
import { loadSummary } from './containerWorkspacePresentation.ts';
import { loadWarningText, containerText as t } from './containerWorkspaceStrings.ts';
import { useContainerWorkspace } from './useContainerWorkspace.ts';
export function ContainerLoadingLayout({ run }: { run?: RunFn }) {
  const [state, controller] = useContainerWorkspace(run);
  const [selection, setSelection] = useState(0);
  const [feedback, setFeedback] = useState('');
  const selected = state.result?.containers.some((c) => c.index === selection) ? selection : 0;
  const summary = loadSummary(state);
  return (
    <div class={s.root} data-container-workspace="">
      <div class={s.workspace}>
        <div class={s.left}>
          <ContainerPackageWorksheet state={state} controller={controller} />
          <ContainerSelection state={state} controller={controller} />
          <ContainerConstraints state={state} controller={controller} />
          <ContainerCostInputs state={state} controller={controller} />
          <details class={`${s.card} ${s.notes}`}>
            <summary>⚠ {t.notes}</summary>
            {state.warnings.map((code, index) => (
              <p key={`${code}-${index}`}>{loadWarningText[code] ?? t.caveat}</p>
            ))}
          </details>
          <details class={`${s.card} ${s.faq}`}>
            <summary>？ {t.faq}</summary>
            <h3>{t.faqQuestion}</h3>
            <p>{t.caveat}</p>
          </details>
        </div>
        <div class={s.right}>
          <ContainerPlacementView state={state} selected={selected} onSelect={setSelection} />
          <ContainerLoadingResults state={state} selected={selected} />
          <ContainerFreightResult state={state} />
          <div class={s.actions}>
            <button
              type="button"
              class={s.print}
              disabled={!state.result}
              onClick={() => window.print()}
            >
              {t.print}
            </button>
            <button
              type="button"
              disabled={!state.result}
              onClick={async () => setFeedback((await copyText(summary)) ? t.copied : t.copyFailed)}
            >
              {t.copy}
            </button>
          </div>
          <p class={s.feedback} role="status">
            {feedback}
          </p>
        </div>
        {state.error ? (
          <p class={s.error} role="alert">
            {t.error} ({state.error.code}
            {state.error.path ? ` · ${state.error.path}` : ''})
          </p>
        ) : null}
      </div>
      <div class={s.printReport}>
        <h1>{t.title}</h1>
        <pre>{summary}</pre>
      </div>
    </div>
  );
}
