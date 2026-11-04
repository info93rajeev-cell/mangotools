import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyCalculationOutput, SurveyReducedRow } from './surveyLevelingTypes.ts';
import s from './surveyProfile.module.css';

export interface SurveyProfilePlaceholderProps {
  result: SurveyCalculationOutput | null;
  closingRL?: string;
}

interface ProfilePoint {
  x: number;
  y: number;
  station: string;
  distLabel?: string;
  isBM: boolean;
  isCP: boolean;
  rl: number;
}

function computeProfileGeometry(
  rows: SurveyReducedRow[],
  width: number,
  height: number,
  padding: { l: number; r: number; t: number; b: number },
  totalDistanceKm: string | null,
) {
  const ys = rows.map((r) => Number(r.rl));
  let mn = Math.min(...ys);
  let mx = Math.max(...ys);
  const pad = Math.max((mx - mn) * 0.25, 0.1);
  mn -= pad;
  mx += pad;

  const X = (t: number) => padding.l + t * (width - padding.l - padding.r);
  const Y = (v: number) => padding.t + ((mx - v) / (mx - mn)) * (height - padding.t - padding.b);

  const hasValidatedDist = totalDistanceKm !== null && Number(totalDistanceKm) > 0;
  let cum = 0;
  const cumDists: number[] = [];
  if (hasValidatedDist) {
    for (let i = 0; i < rows.length; i++) {
      if (i > 0 && rows[i].dist) {
        cum += Number(rows[i].dist);
      }
      cumDists.push(cum);
    }
  }
  const totalM = hasValidatedDist ? Number(totalDistanceKm) * 1000 : 0;

  const points: ProfilePoint[] = rows.map((r, i) => {
    const t =
      hasValidatedDist && totalM > 0
        ? cumDists[i] / totalM
        : rows.length > 1
          ? i / (rows.length - 1)
          : 0.5;
    return {
      x: X(t),
      y: Y(Number(r.rl)),
      station: r.station || `P-${i + 1}`,
      distLabel: hasValidatedDist ? `${cumDists[i]}m` : undefined,
      isBM: i === 0 || i === rows.length - 1,
      isCP: r.isChangePoint,
      rl: Number(r.rl),
    };
  });

  return { points, mn, mx, Y, hasValidatedDist };
}

function ProfileSvgChart({
  points,
  mn,
  mx,
  closingRL,
  Y,
}: {
  points: ProfilePoint[];
  mn: number;
  mx: number;
  closingRL?: string;
  Y: (v: number) => number;
}) {
  const W = 640;
  const H = 210;
  const p = { l: 46, r: 16, t: 22, b: 40 };

  const gridLevels = [0, 1, 2, 3].map((k) => {
    const val = mn + ((mx - mn) * k) / 3;
    return { val: val.toFixed(2), y: Y(val) };
  });

  const polylinePts = points.map((pt) => `${pt.x},${pt.y}`).join(' ');
  const polygonPts = `${points[0].x},${H - p.b} ${polylinePts} ${points[points.length - 1].x},${H - p.b}`;
  const knownBMVal = closingRL ? Number(closingRL) : null;
  const knownBMY = knownBMVal !== null && !Number.isNaN(knownBMVal) ? Y(knownBMVal) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} class={s.profileSvg} aria-label="Level profile chart">
      {gridLevels.map((g, i) => (
        <g key={i}>
          <line x1={p.l} x2={W - p.r} y1={g.y} y2={g.y} stroke="#eef2f7" stroke-width="1" />
          <text x={p.l - 6} y={g.y + 3} font-size="10" fill="#94a3b8" text-anchor="end">
            {g.val}
          </text>
        </g>
      ))}

      <polygon points={polygonPts} fill="#eaf1fe" />
      <polyline
        points={polylinePts}
        fill="none"
        stroke="#1a6ef5"
        stroke-width="2.5"
        stroke-linejoin="round"
      />

      {knownBMY !== null && (
        <g>
          <line
            x1={p.l}
            x2={W - p.r}
            y1={knownBMY}
            y2={knownBMY}
            stroke="#16a34a"
            stroke-dasharray="4 4"
            stroke-width="1.5"
          />
          <text x={W - p.r} y={knownBMY - 5} font-size="10" fill="#15803d" text-anchor="end">
            Closing BM {closingRL}
          </text>
        </g>
      )}

      {points.map((pt, i) => {
        const dotFill = pt.isBM ? '#16a34a' : pt.isCP ? '#1a6ef5' : '#ffffff';
        const dotStroke = pt.isBM ? '#16a34a' : '#1a6ef5';
        return (
          <g key={i}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={pt.isBM || pt.isCP ? 5 : 4}
              fill={dotFill}
              stroke={dotStroke}
              stroke-width="2"
            />
            <text
              x={pt.x}
              y={pt.distLabel ? H - p.b + 14 : H - p.b + 18}
              font-size="10.5"
              fill="#334155"
              text-anchor="middle"
              font-weight="600"
            >
              {pt.station}
            </text>
            {pt.distLabel ? (
              <text x={pt.x} y={H - p.b + 26} font-size="9" fill="#64748b" text-anchor="middle">
                {pt.distLabel}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function SurveyProfilePlaceholder({ result, closingRL }: SurveyProfilePlaceholderProps) {
  const rows = result?.rows ?? [];
  const totalDist = result?.totalDistanceKm ?? null;
  const geo =
    rows.length > 0
      ? computeProfileGeometry(rows, 640, 210, { l: 46, r: 16, t: 22, b: 40 }, totalDist)
      : null;

  const highest = geo ? `${Math.max(...rows.map((r) => Number(r.rl))).toFixed(3)} m` : '—';
  const lowest = geo ? `${Math.min(...rows.map((r) => Number(r.rl))).toFixed(3)} m` : '—';
  const lineLength = totalDist
    ? `${Math.round(Number(totalDist) * 1000)} m (${totalDist} km)`
    : '—';

  return (
    <div class={s.card} data-profile-card="">
      <div class={s.cardHead}>
        <div class={s.iconWrap}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17l5-5 4 3 8-8" />
            <path d="M3 21h18" />
          </svg>
        </div>
        <h2 class={s.cardTitle}>{surveyStrings.profileTitle}</h2>
        <span class={s.cardHeadRight}>
          {geo?.hasValidatedDist ? 'Proportional distance profile' : 'Illustrative, not to scale'}
        </span>
      </div>
      <div class={s.cardBody}>
        {geo ? (
          <div class={s.profileWrap}>
            <ProfileSvgChart
              points={geo.points}
              mn={geo.mn}
              mx={geo.mx}
              closingRL={closingRL}
              Y={geo.Y}
            />
          </div>
        ) : (
          <div class={s.notice}>{surveyStrings.profileNotice}</div>
        )}

        <div class={s.chipsGrid}>
          <div class={s.chip}>
            <span class={s.chipLabel}>{surveyStrings.profileHighestRL}</span>
            <b class={s.chipValue}>{highest}</b>
          </div>
          <div class={s.chip}>
            <span class={s.chipLabel}>{surveyStrings.profileLowestRL}</span>
            <b class={s.chipValue}>{lowest}</b>
          </div>
          <div class={s.chip}>
            <span class={s.chipLabel}>{surveyStrings.profileLineLength}</span>
            <b
              class={s.chipValue}
              data-line-length-value=""
              style={totalDist ? undefined : { color: 'var(--color-text-muted, #64748b)' }}
            >
              {lineLength}
            </b>
          </div>
        </div>
      </div>
    </div>
  );
}
