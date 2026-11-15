import styles from './constructionPlanner.module.css';

function BuildingSlabsAndPads() {
  return (
    <>
      {/* Foundation Base Slab */}
      <polygon
        points="80,102 145,74 80,48 15,74"
        fill="#e2e8f0"
        stroke="#94a3b8"
        stroke-width="1.2"
      />
      <polygon
        points="15,74 80,102 80,108 15,80"
        fill="#cbd5e1"
        stroke="#94a3b8"
        stroke-width="1.2"
      />
      <polygon
        points="80,102 145,74 145,80 80,108"
        fill="#94a3b8"
        stroke="#64748b"
        stroke-width="1.2"
      />
      {/* Level 1 (Ground) Slab */}
      <polygon points="80,82 138,58 80,34 22,58" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" />
      {/* Level 2 (First Floor) Slab */}
      <polygon
        points="80,60 138,36 80,12 22,36"
        fill="#ffffff"
        stroke="#94a3b8"
        stroke-width="1.2"
      />
      {/* Roof Parapet / Frame */}
      <polygon
        points="80,40 132,18 80,0 28,18"
        fill="#e0f2fe"
        stroke="#38bdf8"
        stroke-width="1.2"
        opacity="0.85"
      />
    </>
  );
}

function BuildingColumnsAndBeams() {
  return (
    <>
      {/* Vertical Columns */}
      <line
        x1="22"
        y1="36"
        x2="22"
        y2="74"
        stroke="#1e40af"
        stroke-width="3"
        stroke-linecap="round"
      />
      <line
        x1="80"
        y1="40"
        x2="80"
        y2="102"
        stroke="#1d4ed8"
        stroke-width="3.5"
        stroke-linecap="round"
      />
      <line
        x1="138"
        y1="36"
        x2="138"
        y2="74"
        stroke="#1e40af"
        stroke-width="3"
        stroke-linecap="round"
      />
      <line
        x1="51"
        y1="47"
        x2="51"
        y2="88"
        stroke="#3b82f6"
        stroke-width="2.2"
        stroke-linecap="round"
      />
      <line
        x1="109"
        y1="47"
        x2="109"
        y2="88"
        stroke="#3b82f6"
        stroke-width="2.2"
        stroke-linecap="round"
      />
      {/* Beam tie lines */}
      <line x1="22" y1="58" x2="80" y2="82" stroke="#2563eb" stroke-width="1.5" />
      <line x1="80" y1="82" x2="138" y2="58" stroke="#2563eb" stroke-width="1.5" />
      <line x1="22" y1="36" x2="80" y2="60" stroke="#1d4ed8" stroke-width="1.8" />
      <line x1="80" y1="60" x2="138" y2="36" stroke="#1d4ed8" stroke-width="1.8" />
    </>
  );
}

/**
 * 3D isometric building frame structure with foundation, columns, beam levels, and roof frame.
 */
export function BuildingIsoGraphic({ className }: { className?: string }) {
  return (
    <svg
      class={className || styles.buildingIsoSvg}
      viewBox="0 0 160 120"
      aria-label="3D isometric building frame structure"
    >
      <BuildingSlabsAndPads />
      <BuildingColumnsAndBeams />
    </svg>
  );
}

/**
 * 3D isometric stepped footing with foundation pad and central column pedestal.
 */
export function FootingIsoGraphic({ className }: { className?: string }) {
  return (
    <svg
      class={className || styles.memberSvg}
      viewBox="0 0 44 44"
      aria-label="3D isometric footing"
    >
      {/* Lower pad top */}
      <polygon points="22,18 40,26 22,34 4,26" fill="#bfdbfe" stroke="#3b82f6" stroke-width="0.9" />
      {/* Lower pad left side */}
      <polygon points="4,26 22,34 22,39 4,31" fill="#93c5fd" stroke="#2563eb" stroke-width="0.9" />
      {/* Lower pad right side */}
      <polygon
        points="22,34 40,26 40,31 22,39"
        fill="#60a5fa"
        stroke="#2563eb"
        stroke-width="0.9"
      />

      {/* Pedestal top */}
      <polygon points="22,10 30,14 22,18 14,14" fill="#ffffff" stroke="#1d4ed8" stroke-width="1" />
      {/* Pedestal left side */}
      <polygon points="14,14 22,18 22,25 14,21" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1" />
      {/* Pedestal right side */}
      <polygon points="22,18 30,14 30,21 22,25" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="1" />

      {/* Starter dowel rebars */}
      <line
        x1="18"
        y1="5"
        x2="18"
        y2="12"
        stroke="#dc2626"
        stroke-width="1.2"
        stroke-linecap="round"
      />
      <line
        x1="26"
        y1="5"
        x2="26"
        y2="12"
        stroke="#dc2626"
        stroke-width="1.2"
        stroke-linecap="round"
      />
      <line
        x1="22"
        y1="7"
        x2="22"
        y2="14"
        stroke="#dc2626"
        stroke-width="1.2"
        stroke-linecap="round"
      />
    </svg>
  );
}

/**
 * 3D isometric vertical column with main rebar lines and horizontal tie wraps.
 */
export function ColumnIsoGraphic({ className }: { className?: string }) {
  return (
    <svg class={className || styles.memberSvg} viewBox="0 0 44 44" aria-label="3D isometric column">
      {/* Top face */}
      <polygon points="22,4 32,9 22,14 12,9" fill="#ffffff" stroke="#1d4ed8" stroke-width="1" />
      {/* Left face */}
      <polygon points="12,9 22,14 22,38 12,33" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1" />
      {/* Right face */}
      <polygon points="22,14 32,9 32,33 22,38" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="1" />

      {/* Lateral tie rings (stirrup bands) */}
      <polyline points="12,17 22,22 32,17" fill="none" stroke="#2563eb" stroke-width="1.2" />
      <polyline points="12,24 22,29 32,24" fill="none" stroke="#2563eb" stroke-width="1.2" />
      <polyline points="12,31 22,36 32,31" fill="none" stroke="#2563eb" stroke-width="1.2" />

      {/* Main rebar tops */}
      <circle cx="22" cy="7" r="1.2" fill="#dc2626" />
      <circle cx="17" cy="11.5" r="1.2" fill="#dc2626" />
      <circle cx="27" cy="11.5" r="1.2" fill="#dc2626" />
      <circle cx="22" cy="11.5" r="1.2" fill="#dc2626" />
    </svg>
  );
}

/**
 * 3D isometric horizontal beam with longitudinal reinforcement and stirrup loops.
 */
export function BeamIsoGraphic({ className }: { className?: string }) {
  return (
    <svg class={className || styles.memberSvg} viewBox="0 0 44 44" aria-label="3D isometric beam">
      {/* Top face */}
      <polygon points="8,16 34,7 42,12 16,21" fill="#ffffff" stroke="#1d4ed8" stroke-width="1" />
      {/* Left side face */}
      <polygon points="8,16 16,21 16,33 8,28" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="1" />
      {/* Long front face */}
      <polygon points="16,21 42,12 42,24 16,33" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1" />

      {/* Stirrup ring lines along span */}
      <line x1="22" y1="19" x2="22" y2="31" stroke="#2563eb" stroke-width="1.2" />
      <line x1="28" y1="17" x2="28" y2="29" stroke="#2563eb" stroke-width="1.2" />
      <line x1="34" y1="15" x2="34" y2="27" stroke="#2563eb" stroke-width="1.2" />

      {/* Longitudinal rebar dots on beam end */}
      <circle cx="12" cy="20" r="1.2" fill="#dc2626" />
      <circle cx="12" cy="29" r="1.2" fill="#dc2626" />
      <circle cx="10" cy="25" r="1" fill="#2563eb" />
    </svg>
  );
}

/**
 * 3D isometric concrete slab panel with grid rebar mesh.
 */
export function SlabIsoGraphic({ className }: { className?: string }) {
  return (
    <svg class={className || styles.memberSvg} viewBox="0 0 44 44" aria-label="3D isometric slab">
      {/* Top slab surface */}
      <polygon points="22,8 40,18 22,28 4,18" fill="#eff6ff" stroke="#1d4ed8" stroke-width="1" />
      {/* Left thickness */}
      <polygon points="4,18 22,28 22,33 4,23" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="1" />
      {/* Right thickness */}
      <polygon points="22,28 40,18 40,23 22,33" fill="#93c5fd" stroke="#1d4ed8" stroke-width="1" />

      {/* Rebar mesh lines on top */}
      {/* Direction 1 */}
      <line x1="13" y1="13" x2="31" y2="23" stroke="#3b82f6" stroke-width="0.8" />
      <line x1="22" y1="8" x2="22" y2="28" stroke="#3b82f6" stroke-width="0.8" />
      <line x1="31" y1="13" x2="13" y2="23" stroke="#3b82f6" stroke-width="0.8" />
      {/* Direction 2 */}
      <line x1="8" y1="16" x2="26" y2="26" stroke="#2563eb" stroke-width="0.8" />
      <line x1="18" y1="10" x2="36" y2="20" stroke="#2563eb" stroke-width="0.8" />
    </svg>
  );
}
