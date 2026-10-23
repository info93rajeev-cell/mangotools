import { useState } from 'preact/hooks';
import { ContainerCalculatedView } from './ContainerCalculatedView.tsx';
import type { LoadView } from './containerPlacementGeometry.ts';
import { containerReferenceImage, matchesContainerReference } from './containerReferenceSample.ts';
import s from './containerResults.module.css';
import scene from './containerScene.module.css';
import type { LoadSnapshot } from './containerWorkspaceModel.ts';
import { containerChoices, containerText as t } from './containerWorkspaceStrings.ts';
export function ContainerPlacementView({
  state,
  selected,
  onSelect,
}: {
  state: LoadSnapshot;
  selected: number;
  onSelect: (value: number) => void;
}) {
  const [view, setView] = useState<LoadView>('iso');
  const [calculated, setCalculated] = useState(false);
  const referenceAvailable = matchesContainerReference(state) && selected === 0 && view === 'iso';
  const showReference = referenceAvailable && !calculated;
  const result = state.result;
  return (
    <details
      open
      id="container-load-visual"
      class={`${s.card} ${s.visual} ${scene.visual}`}
      data-selected-container={selected}
    >
      <summary>{t.visual}</summary>
      <div class={`${s.visualHead} ${scene.visualHead}`}>
        <div class={scene.views}>
          {(['iso', 'top', 'front', 'side'] as const).map((v) => (
            <button type="button" key={v} aria-pressed={view === v} onClick={() => setView(v)}>
              {t[v]}
            </button>
          ))}
        </div>
      </div>
      {showReference && result ? (
        <figure class={scene.reference} data-reference-artwork="">
          <img src={containerReferenceImage} alt={t.referenceArtAlt} width="518" height="207" />
          <figcaption>
            {t.referenceArtNote}
            <button type="button" class={scene.artMode} onClick={() => setCalculated(true)}>
              {t.calculatedArt}
            </button>
          </figcaption>
        </figure>
      ) : result ? (
        <ContainerCalculatedView result={result} selected={selected} view={view} />
      ) : (
        <p>{state.pending ? t.pending : t.noData}</p>
      )}
      <ContainerViewCaption state={state} selected={selected} onSelect={onSelect} />
      {referenceAvailable && calculated ? (
        <button type="button" class={scene.artMode} onClick={() => setCalculated(!calculated)}>
          {t.sampleArt}
        </button>
      ) : null}
    </details>
  );
}

function ContainerViewCaption({
  state,
  selected,
  onSelect,
}: {
  state: LoadSnapshot;
  selected: number;
  onSelect: (n: number) => void;
}) {
  const result = state.result;
  return (
    <div class={`${s.visualCaption} ${scene.visualCaption}`}>
      {result && result.containers.length > 1 ? (
        <label>
          {t.container}
          <select
            aria-label={t.container}
            value={String(selected)}
            onInput={(e) => onSelect(Number(e.currentTarget.value))}
          >
            {result.containers.map((c) => (
              <option key={c.index} value={String(c.index)}>
                {c.index + 1}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <strong>{containerChoices.find((c) => c.id === state.settings.containerType)?.name}</strong>
      {result ? (
        <span>
          {result.containerLength} × {result.containerWidth} × {result.containerHeight} cm
        </span>
      ) : null}
    </div>
  );
}
