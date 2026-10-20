import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './civilDiagram.module.css';

export interface CivilDiagramProps {
  preset: ResolvedPreset;
  values: Record<string, unknown>;
  result?: Record<string, unknown> | undefined;
}

const CIVIL_NAV = [
  { id: 'brickwork', name: '🧱 Brick Wall', url: '/brickwork-calculator' },
  { id: 'concrete', name: '🏗️ Concrete Slab', url: '/concrete-quantity-calculator' },
  { id: 'excavation', name: '⛏️ Excavation Pit', url: '/excavation-calculator' },
  { id: 'tile', name: '🔲 Tile Flooring', url: '/tile-flooring-calculator' },
  { id: 'plaster', name: '🪵 Plastering', url: '/plaster-calculator' },
  { id: 'paint', name: '🎨 Paint Coverage', url: '/paint-calculator' },
];

function BrickWallSvg({ wallL, wallH, unit }: { wallL: string; wallH: string; unit: string }) {
  return (
    <svg viewBox="0 0 450 160" class={styles.svgGraphic} aria-label="3D Brick Wall Diagram">
      <polygon
        points="40,50 360,50 410,20 90,20"
        fill="#f87171"
        stroke="#b91c1c"
        stroke-width="1.5"
      />
      <polygon
        points="40,50 360,50 360,130 40,130"
        fill="#ef4444"
        stroke="#b91c1c"
        stroke-width="1.5"
      />
      <polygon
        points="360,50 410,20 410,100 360,130"
        fill="#b91c1c"
        stroke="#7f1d1d"
        stroke-width="1.5"
      />

      <line
        x1="40"
        y1="70"
        x2="360"
        y2="70"
        stroke="#fecaca"
        stroke-width="1.5"
        stroke-dasharray="8,8"
      />
      <line
        x1="40"
        y1="90"
        x2="360"
        y2="90"
        stroke="#fecaca"
        stroke-width="1.5"
        stroke-dasharray="8,8"
      />
      <line
        x1="40"
        y1="110"
        x2="360"
        y2="110"
        stroke="#fecaca"
        stroke-width="1.5"
        stroke-dasharray="8,8"
      />

      <rect
        x="80"
        y="65"
        width="45"
        height="65"
        fill="rgba(14, 165, 233, 0.3)"
        stroke="#0284c7"
        stroke-width="1.5"
        stroke-dasharray="3,3"
      />
      <text x="102" y="100" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="bold">
        Door 1
      </text>

      <rect
        x="180"
        y="65"
        width="55"
        height="45"
        fill="rgba(14, 165, 233, 0.3)"
        stroke="#0284c7"
        stroke-width="1.5"
        stroke-dasharray="3,3"
      />
      <text x="207" y="90" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="bold">
        Window 1 & 2
      </text>

      <text x="200" y="148" text-anchor="middle" fill="#f59e0b" font-weight="bold" font-size="11">
        ↔ Length ({wallL} {unit})
      </text>
      <text x="25" y="92" text-anchor="end" fill="#f59e0b" font-weight="bold" font-size="11">
        ↕ Height ({wallH} {unit})
      </text>
      <text x="375" y="32" fill="#f59e0b" font-weight="bold" font-size="10">
        ↗ Thickness (200 mm)
      </text>
    </svg>
  );
}

function ConcreteSvg({ slabL, slabW, slabD }: { slabL: string; slabW: string; slabD: string }) {
  return (
    <svg viewBox="0 0 450 160" class={styles.svgGraphic} aria-label="3D Concrete Member Diagram">
      <polygon
        points="40,50 350,50 400,20 90,20"
        fill="#94a3b8"
        stroke="#475569"
        stroke-width="1.5"
      />
      <polygon
        points="40,50 350,50 350,110 40,110"
        fill="#64748b"
        stroke="#475569"
        stroke-width="1.5"
      />
      <polygon
        points="350,50 400,20 400,80 350,110"
        fill="#475569"
        stroke="#334155"
        stroke-width="1.5"
      />

      <circle cx="120" cy="75" r="4" fill="#cbd5e1" opacity="0.6" />
      <circle cx="200" cy="85" r="5" fill="#cbd5e1" opacity="0.6" />
      <circle cx="280" cy="70" r="4" fill="#cbd5e1" opacity="0.6" />

      <text x="195" y="130" text-anchor="middle" fill="#0284c7" font-weight="bold" font-size="11">
        Length ({slabL} m)
      </text>
      <text x="385" y="45" fill="#0284c7" font-weight="bold" font-size="11">
        Width ({slabW} m)
      </text>
      <text x="25" y="80" text-anchor="end" fill="#0284c7" font-weight="bold" font-size="11">
        Depth ({slabD} m)
      </text>
    </svg>
  );
}

function CivilFooterPills({
  isBrickwork,
  gross,
  deduct,
  net,
  member,
  vol,
}: {
  isBrickwork: boolean;
  gross: string;
  deduct: string;
  net: string;
  member: string;
  vol: string;
}) {
  if (isBrickwork) {
    return (
      <div class={styles.areaPills}>
        <span class={styles.areaPill}>Gross: {gross}</span>
        <span class={styles.areaPillDeduct}>Deductions: -{deduct}</span>
        <span class={styles.areaPillNet}>Net Wall: {net}</span>
      </div>
    );
  }
  return (
    <div class={styles.areaPills}>
      <span class={styles.areaPill}>Member: {member.toUpperCase()}</span>
      <span class={styles.areaPillNet}>Order Volume: {vol}</span>
    </div>
  );
}

function resolveActiveCivil(presetId: string): 'brickwork' | 'concrete' | '' {
  if (presetId.includes('brickwork')) return 'brickwork';
  if (presetId.includes('concrete')) return 'concrete';
  return '';
}

function DiagramSvgBody({
  isBrickwork,
  values,
}: {
  isBrickwork: boolean;
  values: Record<string, unknown>;
}) {
  if (isBrickwork) {
    return (
      <BrickWallSvg
        wallL={String(values.wallLength || '5')}
        wallH={String(values.wallHeight || '3')}
        unit={String(values.unit || 'm')}
      />
    );
  }
  return (
    <ConcreteSvg
      slabL={String(values.length || '5')}
      slabW={String(values.width || '4')}
      slabD={String(values.depth || '0.15')}
    />
  );
}

export function CivilDiagram({ preset, values, result }: CivilDiagramProps) {
  const activeToolId = resolveActiveCivil(preset.id);
  const isBrickwork = activeToolId === 'brickwork';

  return (
    <div class={styles.civilDiagramContainer} data-civil-diagram="">
      <div class={styles.memberNav}>
        {CIVIL_NAV.map((nav) => (
          <a
            key={nav.id}
            href={nav.url}
            class={styles.memberChip}
            data-active={String(activeToolId === nav.id)}
            aria-current={activeToolId === nav.id ? 'page' : undefined}
          >
            {nav.name}
          </a>
        ))}
      </div>

      <div class={styles.diagramCard}>
        <div class={styles.diagramHeader}>
          <span class={styles.diagramTitle}>
            {isBrickwork ? '3D Isometric Brick Wall Blueprint' : '3D Concrete Member Geometry'}
          </span>
          <span class={styles.diagramBadge}>🔒 IS 1200 / SI Compliant</span>
        </div>

        <div class={styles.svgWrapper}>
          <DiagramSvgBody isBrickwork={isBrickwork} values={values} />
        </div>

        <div class={styles.diagramFooter}>
          <CivilFooterPills
            isBrickwork={isBrickwork}
            gross={result?.grossWallAreaM2 ? `${result.grossWallAreaM2} m²` : '15.00 m²'}
            deduct={result?.openingAreaM2 ? `${result.openingAreaM2} m²` : '4.77 m²'}
            net={result?.netWallAreaM2 ? `${result.netWallAreaM2} m²` : '10.23 m²'}
            member={String(values.memberType || 'slab')}
            vol={result?.orderVolumeM3 ? `${result.orderVolumeM3} m³` : '3.150 m³'}
          />
        </div>
      </div>
    </div>
  );
}
