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
import { usePhone } from './usePhone.ts';

const TONE: Record<Tone, string | undefined> = {
  top: s.top,
  right: s.right,
  left: s.left,
  face: s.face,
  palletTop: s.palletTop,
  palletSide: s.palletSide,
  palletGap: s.palletGap,
  tape: s.tape,
  label: s.label,
  mark: s.mark,
};
const LETTER = { length: 'L', width: 'W', height: 'H' } as const;

const packageName = (row: CbmPackage, index: number) =>
  row.description.replace(/\s+/g, ' ').trim() || `${w.carton} ${index + 1}`;
const viewName = (view: ViewKind) => fillText(r.viewName, { view: t[view] });

/** A two-line dimension label ("H" over "120 cm"), centred beside or below its arrow. */
function Dimension({ arrow, row }: { arrow: Arrow; row: CbmPackage }) {
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
      <text x={arrow.labelX} y={arrow.labelY} text-anchor="middle">
        <tspan dy="-0.25em">{LETTER[arrow.axis]}</tspan>
        <tspan x={arrow.labelX} dy="1.2em">{` ${value} ${row.unit}`}</tspan>
      </text>
    </g>
  );
}

function Defs() {
  return (
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
      {(
        [
          ['cbm-top', '#efcd98', '#e2b679'],
          ['cbm-left', '#ddb07a', '#c9935a'],
          ['cbm-right', '#c99558', '#b07a41'],
        ] as const
      ).map(([id, from, to]) => (
        <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color={from} />
          <stop offset="1" stop-color={to} />
        </linearGradient>
      ))}
    </defs>
  );
}

/** Phone labels are drawn this much larger than desktop ones (see `.dimension text`). */
const PHONE_LABELS = 1.45;

interface IllustrationProps {
  row: CbmPackage;
  name: string;
  view: ViewKind;
  phone: boolean;
}

function Illustration({ row, name, view, phone }: IllustrationProps) {
  const shape = proportions(row.length, row.width, row.height);
  if (!shape) return <p class={s.placeholder}>{r.noDimensions}</p>;
  const drawn = scene(view, shape, phone ? PHONE_LABELS : 1);
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
      <Defs />
      {drawn.polygons.map((polygon, index) =>
        polygon.tone === 'tape' ? (
          <polyline key={`t${index}`} class={s.tape} points={polygon.points} />
        ) : (
          <polygon key={`p${index}`} class={TONE[polygon.tone]} points={polygon.points} />
        ),
      )}
      {drawn.arrows.map((arrow) => (
        <Dimension key={arrow.axis} arrow={arrow} row={row} />
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
          <span class={s.long}>{fillText(w.viewSuffix, { view: t[value] })}</span>
          <span class={s.short}>{t[value]}</span>
        </button>
      ))}
    </fieldset>
  );
}

/** Shipment visualization: the active package drawn as an illustrative stack, never a loading plan. */
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
  const [open, setOpen] = useState(true);
  const phone = usePhone();
  const shown = !phone || open;
  return (
    <section class={`${s.panel} ${className}`} aria-labelledby="cbm-visual-title">
      <div class={s.head}>
        <h2 id="cbm-visual-title" class={s.title}>
          {t.visualization} <span class={s.qualifier}>{w.stackedView}</span>
        </h2>
        {phone ? (
          <button
            type="button"
            class={s.collapse}
            aria-expanded={open}
            aria-controls="cbm-visual-body"
            aria-label={fillText(w.toggleSection, { section: t.visualization })}
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? 'chevron-up' : 'chevron-down'} />
          </button>
        ) : null}
        {shown ? <ViewButtons view={view} onView={setView} /> : null}
      </div>
      {shown ? (
        <div id="cbm-visual-body" class={s.body}>
          <div class={s.stage}>
            <Illustration row={row} name={packageName(row, index)} view={view} phone={phone} />
          </div>
          <p class={s.caption}>
            <Icon name="info" />
            <span>{t.illustrative}</span>
          </p>
        </div>
      ) : null}
    </section>
  );
}
