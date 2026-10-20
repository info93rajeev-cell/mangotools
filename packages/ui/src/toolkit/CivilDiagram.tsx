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
  { id: 'tile', name: '📐 Tile Flooring', url: '/tile-flooring-calculator' },
  { id: 'plaster', name: '🪵 Plastering', url: '/plaster-calculator' },
  { id: 'paint', name: '🎨 Paint Coverage', url: '/paint-calculator' },
];

const CIVIL_GRAPHICS: Record<string, { src: string; alt: string; title: string }> = {
  brickwork: {
    src: '/samples/brick_wall_3d.png',
    alt: '3D Isometric Brick Wall with Dimension Callouts',
    title: '3D Isometric Brick Wall Blueprint',
  },
  concrete: {
    src: '/samples/concrete_slab_3d.png',
    alt: '3D Concrete Member Geometry',
    title: '3D Concrete Member Geometry',
  },
  excavation: {
    src: '/samples/excavation_pit_3d.png',
    alt: '3D Excavation Pit & Trench Geometry',
    title: '3D Excavation Trench Geometry',
  },
  tile: {
    src: '/samples/tile_floor_3d.png',
    alt: '3D Floor Tile Layout',
    title: '3D Tile & Flooring Layout',
  },
  plaster: {
    src: '/samples/plaster_wall_3d.png',
    alt: '12mm Plaster Cross-Section over Brickwork',
    title: '12mm Plaster Cross-Section',
  },
  paint: {
    src: '/samples/paint_room_3d.png',
    alt: '3D Living Room Paint Surface',
    title: '3D Surface & Opening Deduction',
  },
};

function resolveActiveCivil(presetId: string): string {
  if (presetId.includes('brickwork')) return 'brickwork';
  if (presetId.includes('concrete')) return 'concrete';
  if (presetId.includes('excavation')) return 'excavation';
  if (presetId.includes('tile')) return 'tile';
  if (presetId.includes('plaster')) return 'plaster';
  if (presetId.includes('paint')) return 'paint';
  return '';
}

function CivilFooterPills({
  activeToolId,
  gross,
  deduct,
  net,
  member,
  vol,
}: {
  activeToolId: string;
  gross: string;
  deduct: string;
  net: string;
  member: string;
  vol: string;
}) {
  if (activeToolId === 'brickwork') {
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

export function CivilDiagram({ preset, values, result }: CivilDiagramProps) {
  const activeToolId = resolveActiveCivil(preset.id);
  const graphic = CIVIL_GRAPHICS[activeToolId] || CIVIL_GRAPHICS.brickwork;

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
          <span class={styles.diagramTitle}>{graphic.title}</span>
          <span class={styles.diagramBadge}>🔒 IS 1200 / SI Compliant</span>
        </div>

        <div class={styles.svgWrapper}>
          <img
            src={graphic.src}
            alt={graphic.alt}
            class={styles.realisticDiagramImg}
            loading="eager"
          />
        </div>

        <div class={styles.diagramFooter}>
          <CivilFooterPills
            activeToolId={activeToolId}
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
