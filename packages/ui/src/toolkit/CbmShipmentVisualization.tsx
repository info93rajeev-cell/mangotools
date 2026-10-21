import { useState } from 'preact/hooks';
import s from './cbmShipment.module.css';
import type { CbmPackage } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';

function drawing(row: CbmPackage | undefined) {
  const values = [row?.length, row?.width, row?.height].map((value) => Number(value));
  const maximum = Math.max(...values.filter(Number.isFinite), 1);
  const [l, w, h] = values.map((value) =>
    Number.isFinite(value) && value > 0 ? Math.max(12, (value / maximum) * 70) : 35,
  );
  return {
    top: `M180 15 ${180 + l} ${15 + l / 3} ${180 + l - w} ${15 + (l + w) / 3} ${180 - w} ${15 + w / 3}Z`,
    left: `M${180 - w} ${15 + w / 3} ${180 + l - w} ${15 + (l + w) / 3} ${180 + l - w} ${15 + (l + w) / 3 + h} ${180 - w} ${15 + w / 3 + h}Z`,
    right: `M${180 + l - w} ${15 + (l + w) / 3} ${180 + l} ${15 + l / 3} ${180 + l} ${15 + l / 3 + h} ${180 + l - w} ${15 + (l + w) / 3 + h}Z`,
    l,
    w,
    h,
  };
}
const views = ['iso', 'top', 'front', 'side'] as const;
export function CbmShipmentVisualization({ row }: { row: CbmPackage | undefined }) {
  const [view, setView] = useState<(typeof views)[number]>('iso');
  const shape = drawing(row);
  return (
    <section class={`${s.panel} ${s.visual}`} aria-labelledby="cbm-visual-title">
      <div class={s.heading}>
        <h2 id="cbm-visual-title">{t.visualization}</h2>
        <fieldset aria-label={t.view}>
          {views.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              {t[value]}
            </button>
          ))}
        </fieldset>
      </div>
      <svg
        viewBox="0 0 360 130"
        role="img"
        aria-label={`${t.measurement}: ${row?.length ?? '—'} × ${row?.width ?? '—'} × ${row?.height ?? '—'} ${row?.unit ?? ''}`}
      >
        <title>{t.measurement}</title>
        {view === 'iso' ? (
          <g stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
            <path d={shape.top} fill="var(--color-accent)" />
            <path d={shape.left} fill="var(--color-surface-subtle)" />
            <path d={shape.right} fill="var(--color-border)" />
          </g>
        ) : (
          <rect
            x="110"
            y="25"
            width={(view === 'side' ? shape.w : shape.l) * 1.5}
            height={view === 'top' ? shape.w : shape.h}
            rx="3"
            fill="var(--color-accent)"
            stroke="currentColor"
          />
        )}
        <text x="275" y="60">
          H {row?.height ?? '—'}
        </text>
        <text x="175" y="128">
          L {row?.length ?? '—'}
        </text>
        <text x="35" y="95">
          W {row?.width ?? '—'}
        </text>
      </svg>
      <p>{t.illustrative}</p>
    </section>
  );
}
