import type { RunFn } from '@mangotools/runtime';
import { useState } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import { copyText } from './actions.ts';
import {
  ContainerConstraints,
  ContainerCostInputs,
  ContainerSelection,
} from './ContainerLoadInputs.tsx';
import { ContainerFreightResult, ContainerLoadingResults } from './ContainerLoadingResults.tsx';
import { ContainerPackageWorksheet } from './ContainerPackageWorksheet.tsx';
import { ContainerPlacementView } from './ContainerPlacementView.tsx';
import { ContainerSupportingPanels } from './ContainerSupportingPanels.tsx';
import { ContainerToolBottom } from './ContainerToolBottom.tsx';
import controls from './containerControls.module.css';
import stack from './containerCostStack.module.css';
import output from './containerOutput.module.css';
import reference from './containerReferenceLayout.module.css';
import s from './containerWorkspace.module.css';
import { loadSummary } from './containerWorkspacePresentation.ts';
import { containerText as t } from './containerWorkspaceStrings.ts';
import { useContainerWorkspace } from './useContainerWorkspace.ts';
export function ContainerLoadingLayout({ run }: { run?: RunFn }) {
  const [state, controller] = useContainerWorkspace(run);
  const [selection, setSelection] = useState(0);
  const [feedback, setFeedback] = useState('');
  const selected = state.result?.containers.some((c) => c.index === selection) ? selection : 0;
  const summary = loadSummary(state);
  return (
    <div class={`${s.root} ${controls.controls} ${reference.layout}`} data-container-workspace="">
      <nav class={reference.utilities} aria-label={t.utilities}>
        <a href="#container-load-visual">
          <Icon name="container" />
          {t.utility3d}
        </a>
        <a href="#load-selection-title">
          <Icon name="rotate-ccw" />
          {t.utilityContainers}
        </a>
        <button type="button" aria-label={t.utilityPrint} onClick={() => window.print()}>
          <Icon name="file-text" />
          {t.print}
        </button>
      </nav>
      <div class={`${s.workspace} ${stack.stack}`}>
        <div class={s.left}>
          <ContainerPackageWorksheet state={state} controller={controller} />
          <ContainerSelection state={state} controller={controller} />
          <ContainerConstraints state={state} controller={controller} />
          <ContainerCostInputs state={state} controller={controller} />
        </div>
        <div class={s.right}>
          <ContainerPlacementView state={state} selected={selected} onSelect={setSelection} />
          <ContainerLoadingResults state={state} selected={selected} />
          <ContainerFreightResult state={state} />
          <div class={`${s.actions} ${output.actions}`}>
            <button
              type="button"
              class={s.print}
              disabled={!state.result}
              onClick={() => window.print()}
            >
              <Icon name="file-text" /> {t.print}
            </button>
            <button
              type="button"
              disabled={!state.result}
              onClick={async () => setFeedback((await copyText(summary)) ? t.copied : t.copyFailed)}
            >
              <Icon name="copy" /> {t.copy}
            </button>
          </div>
          {feedback ? <p role="status">{feedback}</p> : null}
        </div>
        {state.error ? (
          <p class={s.error} role="alert">
            {t.error} ({state.error.code}
            {state.error.path ? ` · ${state.error.path}` : ''})
          </p>
        ) : null}
      </div>
      <ContainerSupportingPanels state={state} />
      <ContainerToolBottom state={state} />
      <div class={output.printReport}>
        <h1>{t.title}</h1>
        <pre>{summary}</pre>
      </div>
    </div>
  );
}
