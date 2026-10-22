import { useState } from 'preact/hooks';
import {
  boxFaces,
  containerLines,
  type LoadView,
  packageColors,
  projector,
  visiblePieces,
} from './containerPlacementGeometry.ts';
import s from './containerResults.module.css';
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
  const result = state.result;
  const blocks = (result?.blocks ?? []).filter((b) => b.container === selected);
  const project = result ? projector(result, view) : null;
  return (
    <details open class={`${s.card} ${s.visual}`} data-selected-container={selected}>
      <summary>{t.visual}</summary>
      <div class={s.visualHead}>
        <div class={s.views}>
          {(['iso', 'top', 'front', 'side'] as const).map((v) => (
            <button type="button" key={v} aria-pressed={view === v} onClick={() => setView(v)}>
              {t[v]}
            </button>
          ))}
        </div>
      </div>
      {result && project ? (
        <svg viewBox="0 0 800 300" role="img" aria-label={t.actual} data-placement-view={view}>
          <polygon
            points={[
              project([0, 0, 0]),
              project([Number(result.containerLength), 0, 0]),
              project([Number(result.containerLength), Number(result.containerWidth), 0]),
              project([0, Number(result.containerWidth), 0]),
            ].join(' ')}
            fill="#dce8f4"
          />
          {visiblePieces(blocks)
            .sort((a, b) => Number(b.y) - Number(a.y) || Number(a.z) - Number(b.z))
            .map((b, index) => (
              <g key={index} data-placement-block={b.package}>
                {boxFaces(b, project).map((face, i) => (
                  <polygon
                    key={i}
                    points={face}
                    fill={packageColors[b.package % packageColors.length]}
                    opacity={[0.85, 0.65, 1][i]}
                    stroke="#31445a"
                    stroke-width="0.7"
                  />
                ))}
              </g>
            ))}
          {containerLines(result, project).map((line, index) => (
            <polyline key={index} points={line} fill="none" stroke="#174b81" stroke-width="2" />
          ))}
        </svg>
      ) : (
        <p>{state.pending ? t.pending : t.noData}</p>
      )}
      <div class={s.visualCaption}>
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
      {blocks.reduce((sum, b) => sum + b.count, 0) > 250 ? <p>{t.visualLimit}</p> : null}
    </details>
  );
}
