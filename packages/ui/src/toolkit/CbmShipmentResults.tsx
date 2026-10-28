import type { ComponentChildren } from 'preact';
import { Icon } from '../primitives/Icon.tsx';
import type { GlyphName } from './cbmGlyphs.ts';
import {
  averagePerPiece,
  type CompositionItem,
  compositionItems,
  groupFigure,
  weightView,
} from './cbmResultFormat.ts';
import { fillText, cbmResultText as r } from './cbmResultStrings.ts';
import s from './cbmResults.module.css';
import type { CbmResult, CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import { cbmWorkbenchText as w } from './cbmWorkbenchStrings.ts';

const PALETTE_SIZE = 8;
const swatch = (number: number) => s[`c${(number - 1) % PALETTE_SIZE}`] ?? '';

const KPI_ICONS: Record<GlyphName, 'box' | 'weight' | 'rotate-ccw'> = {
  pieces: 'box',
  volume: 'box',
  weight: 'weight',
  average: 'rotate-ccw',
};

interface KpiProps {
  glyph: GlyphName;
  label: string;
  /** The reference's shorter phone label, when it has one. */
  short?: string;
  tone: string | undefined;
  children: ComponentChildren;
}

function Kpi({ glyph, label, short, tone, children }: KpiProps) {
  return (
    <div class={`${s.kpi} ${tone ?? ''}`} data-kpi={glyph}>
      <Icon name={KPI_ICONS[glyph] ?? 'box'} />
      <dt>
        {short ? (
          <>
            <span class={s.longLabel}>{label}</span>
            <span class={s.shortLabel}>{short}</span>
          </>
        ) : (
          label
        )}
      </dt>
      {children}
    </div>
  );
}

function Value({ value, unit }: { value: string; unit?: string }) {
  return (
    <>
      <span class={s.number}>{value}</span>
      {unit ? <span class={s.unit}>{` ${unit}`}</span> : null}
    </>
  );
}

function Kpis({ result, precision }: { result: CbmResult; precision: string }) {
  const weight = weightView(result);
  const average = averagePerPiece(result.totalCbmExact, result.totalPieces, Number(precision));
  return (
    <>
      <dl class={s.kpis}>
        <Kpi glyph="pieces" label={w.totalCartons} short={w.cartonsKpiShort} tone={s.toneGreen}>
          <dd class={s.value}>
            <Value value={groupFigure(result.totalPieces)} />
          </dd>
        </Kpi>
        <Kpi glyph="volume" label={t.volume} tone={s.toneBlue}>
          <dd
            class={s.value}
            data-cbm-total=""
            title={`${groupFigure(result.totalCft)} ${r.cftUnit}`}
          >
            <Value value={groupFigure(result.totalCbm)} unit={r.cbmUnit} />
          </dd>
          <dd class="visually-hidden">
            {fillText(w.cftNote, { cft: `${groupFigure(result.totalCft)} ${r.cftUnit}` })}
          </dd>
        </Kpi>
        <Kpi glyph="weight" label={weight.label} tone={s.toneAmber}>
          <dd
            class={weight.value === null ? s.missing : s.value}
            data-weight={result.weightCoverage}
          >
            {weight.value === null ? t.unknown : <Value value={weight.value} unit={r.kgUnit} />}
          </dd>
          {weight.note ? <dd class={s.badge}>{r.partialBadge}</dd> : null}
        </Kpi>
        {average === null ? null : (
          <Kpi glyph="average" label={w.avgPerCarton} short={w.avgKpiShort} tone={s.toneRed}>
            <dd class={s.value}>
              <Value value={groupFigure(average)} unit={r.cbmUnit} />
            </dd>
          </Kpi>
        )}
      </dl>
      {weight.note ? <p class={s.coverageNote}>{weight.note}</p> : null}
    </>
  );
}

function Composition({ items }: { items: CompositionItem[] }) {
  return (
    <section class={s.composition} aria-labelledby="cbm-composition-title">
      <h3 class={s.subTitle}>
        <span id="cbm-composition-title">{w.compositionTitle}</span> {w.compositionUnit}
      </h3>
      <div class={s.bar} aria-hidden="true">
        {items.map((item) => (
          <span
            key={item.key}
            class={`${s.segment} ${swatch(item.number)}`}
            style={{ flexGrow: Number(item.share) }}
            title={item.name}
          />
        ))}
      </div>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable content must be keyboard-focusable (WCAG 2.1.1). */}
      <ol class={s.legend} tabIndex={0} aria-labelledby="cbm-composition-title">
        {items.map((item) => (
          <li key={item.key}>
            <span class={`${s.swatch} ${swatch(item.number)}`} aria-hidden="true" />
            <span class={s.legendName}>{item.name}</span>
            <span class={s.legendValue}>
              {fillText(r.compositionShare, { cbm: item.cbm, share: item.share })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Results summary: KPI cards and load composition, shown only for the current validated result. */
export function CbmShipmentResults({
  state,
  className = '',
}: {
  state: CbmSnapshot;
  className?: string;
}) {
  const result = state.shipment;
  const announcement = result
    ? fillText(r.announce, { cbm: groupFigure(result.totalCbm), pieces: result.totalPieces })
    : '';
  return (
    <section
      class={`${s.card} ${s.summary} ${className}`}
      aria-labelledby="cbm-summary-title"
      aria-busy={state.pending}
    >
      <h2 id="cbm-summary-title" class={s.title}>
        {t.summary}
      </h2>
      {result ? (
        <Kpis result={result} precision={state.precision} />
      ) : (
        <p class={s.empty}>{state.pending ? t.pending : t.empty}</p>
      )}
      {result ? <Composition items={compositionItems(state)} /> : null}
      <p class="visually-hidden" role="status">
        {announcement}
      </p>
    </section>
  );
}
