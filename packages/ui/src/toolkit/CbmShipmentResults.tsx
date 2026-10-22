import type { ComponentChildren } from 'preact';
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
import { GLYPHS, type GlyphName } from './cbmVisualGeometry.ts';

const PALETTE_SIZE = 8;
const swatch = (number: number) => s[`c${(number - 1) % PALETTE_SIZE}`] ?? '';

function Glyph({ name }: { name: GlyphName }) {
  return (
    <svg class={s.glyph} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={GLYPHS[name]} />
    </svg>
  );
}

interface KpiProps {
  glyph: GlyphName;
  label: string;
  tone: string | undefined;
  children: ComponentChildren;
}

function Kpi({ glyph, label, tone, children }: KpiProps) {
  return (
    <div class={`${s.kpi} ${tone ?? ''}`} data-kpi={glyph}>
      <dt>
        <Glyph name={glyph} />
        <span>{label}</span>
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
        <Kpi glyph="pieces" label={t.pieces} tone={s.toneGreen}>
          <dd class={s.value}>
            <Value value={groupFigure(result.totalPieces)} />
          </dd>
        </Kpi>
        <Kpi glyph="volume" label={t.volume} tone={s.toneBlue}>
          <dd class={s.value} data-cbm-total="">
            <Value value={groupFigure(result.totalCbm)} unit={r.cbmUnit} />
          </dd>
          <dd class={s.secondary}>{`${groupFigure(result.totalCft)} ${r.cftUnit}`}</dd>
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
          <Kpi glyph="average" label={r.avgPerPiece} tone={s.toneRed}>
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
      <div class={s.compositionHead}>
        <h3 class={s.subTitle}>
          <span id="cbm-composition-title">{t.composition}</span>{' '}
          <span class={s.subUnit}>{r.compositionUnit}</span>
        </h3>
        <p class={s.note}>{r.sharesRounded}</p>
      </div>
      <div class={s.bar} aria-hidden="true">
        {items.map((item) => (
          <span
            key={item.key}
            class={`${s.segment} ${swatch(item.number)}`}
            style={{ flexGrow: Number(item.share) }}
          >
            {Number(item.share) >= 9 ? item.number : ''}
          </span>
        ))}
      </div>
      <ol class={s.legend}>
        {items.map((item) => (
          <li key={item.key}>
            <span class={`${s.swatch} ${swatch(item.number)}`} aria-hidden="true" />
            <span class={s.legendName}>{`${item.number}. ${item.name}`}</span>
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
