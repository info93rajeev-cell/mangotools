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
import { cbmWorkbenchText as w } from './cbmWorkbenchStrings.ts';

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
  if (Math.abs(arrow.x2 - arrow.x1) < 1) return arrow.labelX < arrow.x1 ? 'end' : 'start';
  if (view !== 'iso') return 'middle';
  return arrow.axis === 'width' ? 'end' : 'start';
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
    <fieldset class={s.views} aria-label={t.view} data-cbm-views="">
      {VIEWS.map((value) => (
        <button
          key={value}
          type="button"
          class={s.viewButton}
          aria-pressed={view === value}
          onClick={() => onView(value)}
        >
          {fillText(w.viewSuffix, { view: t[value] })}
        </button>
      ))}
    </fieldset>
  );
}

/** Shipment visualization: the active package's proportions in a fixed, illustrative stack. */
export function CbmVisualizationPanel({
  row,
  index,
  className = '',
}: {
  row: CbmPackage;
  index: number;
  className?: string;
}) {
  const [view, setView] = useState<ViewKind>('iso');
  const name = packageName(row, index);
  return (
    <section class={`${s.panel} ${className}`} aria-labelledby="cbm-visual-title">
      <div class={s.head}>
        <h2 id="cbm-visual-title" class={s.title}>
          {t.visualization} <span class={s.qualifier}>{w.stackedView}</span>
        </h2>
        <ViewButtons view={view} onView={setView} />
      </div>
      <div class={s.stage}>
        <Illustration row={row} name={name} view={view} />
      </div>
      <p class={s.caption}>
        <Icon name="info" />
        <span>{t.illustrative}</span>
        <span class={s.subject}>{fillText(r.dimensionsOf, { name })}</span>
      </p>
    </section>
  );
}
