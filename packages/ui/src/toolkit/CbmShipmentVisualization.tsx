import { useState } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import { fillText, cbmResultText as r } from './cbmResultStrings.ts';
import type { CbmPackage } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import s from './cbmVisual.module.css';
import {
  type Arrow,
  proportions,
  scene,
  type Tone,
  VIEW_BOX,
  VIEWS,
  type ViewKind,
} from './cbmVisualGeometry.ts';

const TONE: Record<Tone, string | undefined> = {
  top: s.top,
  right: s.right,
  left: s.left,
  face: s.face,
  palletTop: s.palletTop,
  palletSide: s.palletSide,
  palletGap: s.palletGap,
  tape: s.tape,
};
const LETTER = { length: 'L', width: 'W', height: 'H' } as const;

const packageName = (row: CbmPackage, index: number) =>
  row.description.replace(/\s+/g, ' ').trim() || `${t.package} ${index + 1}`;
const viewName = (view: ViewKind) => fillText(r.viewName, { view: t[view] });

function anchor(view: ViewKind, arrow: Arrow): 'start' | 'middle' | 'end' {
  if (Math.abs(arrow.x2 - arrow.x1) < 1) return 'start';
  if (view !== 'iso') return 'middle';
  return arrow.axis === 'length' ? 'end' : 'start';
}

function Dimension({ arrow, view, row }: { arrow: Arrow; view: ViewKind; row: CbmPackage }) {
  const value = row[arrow.axis].trim();
  return (
    <g class={s.dimension} data-axis={arrow.axis}>
      <line
        x1={arrow.x1}
        y1={arrow.y1}
        x2={arrow.x2}
        y2={arrow.y2}
        marker-start="url(#cbm-dimension-end)"
        marker-end="url(#cbm-dimension-end)"
      />
      <text x={arrow.labelX} y={arrow.labelY} text-anchor={anchor(view, arrow)}>
        {`${LETTER[arrow.axis]} ${value} ${row.unit}`}
      </text>
    </g>
  );
}

function Illustration({ row, name, view }: { row: CbmPackage; name: string; view: ViewKind }) {
  const shape = proportions(row.length, row.width, row.height);
  if (!shape) return <p class={s.placeholder}>{r.noDimensions}</p>;
  const drawn = scene(view, shape);
  const label = fillText(r.illustrationLabel, {
    name,
    length: row.length.trim(),
    width: row.width.trim(),
    height: row.height.trim(),
    unit: row.unit,
    view: viewName(view),
  });
  return (
    <svg
      class={s.drawing}
      viewBox={`0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
      role="img"
      aria-label={label}
      data-view={view}
    >
      <defs>
        <marker
          id="cbm-dimension-end"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0 10 5 0 10Z" class={s.arrowHead} />
        </marker>
      </defs>
      {drawn.polygons.map((polygon, index) =>
        polygon.tone === 'tape' ? (
          <polyline key={`t${index}`} class={s.tape} points={polygon.points} />
        ) : (
          <polygon key={`p${index}`} class={TONE[polygon.tone]} points={polygon.points} />
        ),
      )}
      {drawn.arrows.map((arrow) => (
        <Dimension key={arrow.axis} arrow={arrow} view={view} row={row} />
      ))}
    </svg>
  );
}

function ViewButtons({ view, onView }: { view: ViewKind; onView: (view: ViewKind) => void }) {
  return (
    <fieldset class={s.views} aria-label={t.view}>
      {VIEWS.map((value) => (
        <button
          key={value}
          type="button"
          class={s.viewButton}
          aria-pressed={view === value}
          aria-label={viewName(value)}
          onClick={() => onView(value)}
        >
          {t[value]}
          <span class={s.viewSuffix} aria-hidden="true">
            {r.viewSuffix}
          </span>
        </button>
      ))}
    </fieldset>
  );
}

/** Shipment visualization: one package type's proportions in a fixed, illustrative carton group. */
export function CbmVisualizationPanel({
  packages,
  className = '',
}: {
  packages: CbmPackage[];
  className?: string;
}) {
  const [selected, select] = useState(0);
  const [view, setView] = useState<ViewKind>('iso');
  const index = Math.min(selected, Math.max(0, packages.length - 1));
  const row = packages[index];
  const name = row ? packageName(row, index) : '';
  return (
    <section class={`${s.panel} ${className}`} aria-labelledby="cbm-visual-title">
      <div class={s.head}>
        <h2 id="cbm-visual-title" class={s.title}>
          {t.visualization} <span class={s.qualifier}>{r.visualizationQualifier}</span>
        </h2>
        <ViewButtons view={view} onView={setView} />
      </div>
      <div class={s.stage}>{row ? <Illustration row={row} name={name} view={view} /> : null}</div>
      <div class={s.footer}>
        <p class={s.caption}>
          <Icon name="info" />
          {t.illustrative}
        </p>
        {packages.length > 1 ? (
          <label class={s.picker}>
            <span>{r.packageToShow}</span>
            <select value={index} onChange={(e) => select(Number(e.currentTarget.value))}>
              {packages.map((item, position) => (
                <option key={item.id} value={position}>
                  {packageName(item, position)}
                </option>
              ))}
            </select>
          </label>
        ) : row ? (
          <p class={s.subject}>{fillText(r.dimensionsOf, { name })}</p>
        ) : null}
      </div>
    </section>
  );
}
