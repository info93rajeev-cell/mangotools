import styles from './constructionPlanner.module.css';

function BuildingGradients() {
  return (
    <defs>
      <linearGradient id="slabTopGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>
      <filter id="buildingShadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.12" />
      </filter>
    </defs>
  );
}

function BuildingPlinthBase() {
  return (
    <>
      <polygon
        points="80,110 148,76 80,48 12,76"
        fill="#f1f5f9"
        stroke="#94a3b8"
        stroke-width="1.2"
      />
      <polygon
        points="12,76 80,110 80,115 12,81"
        fill="#cbd5e1"
        stroke="#94a3b8"
        stroke-width="1.2"
      />
      <polygon
        points="80,110 148,76 148,81 80,115"
        fill="#94a3b8"
        stroke="#64748b"
        stroke-width="1.2"
      />
      <line
        x1="80"
        y1="52"
        x2="80"
        y2="68"
        stroke="#64748b"
        stroke-width="3"
        stroke-linecap="square"
      />
      <line
        x1="46"
        y1="64"
        x2="46"
        y2="80"
        stroke="#64748b"
        stroke-width="3"
        stroke-linecap="square"
      />
      <line
        x1="114"
        y1="64"
        x2="114"
        y2="80"
        stroke="#475569"
        stroke-width="3"
        stroke-linecap="square"
      />
    </>
  );
}

function BuildingLevel1Frame() {
  return (
    <>
      <g transform="translate(0, -6)">
        <polygon
          points="80,88 142,57 80,30 18,57"
          fill="url(#slabTopGrad)"
          stroke="#94a3b8"
          stroke-width="1"
        />
        <polygon
          points="18,57 80,88 80,91 18,60"
          fill="#cbd5e1"
          stroke="#94a3b8"
          stroke-width="1"
        />
        <polygon
          points="80,88 142,57 142,60 80,91"
          fill="#94a3b8"
          stroke="#64748b"
          stroke-width="1"
        />
      </g>
      <rect x="22" y="54" width="3" height="24" fill="#cbd5e1" />
      <rect x="25" y="54" width="2" height="24" fill="#64748b" />
      <rect x="50" y="68" width="3" height="24" fill="#cbd5e1" />
      <rect x="53" y="68" width="2" height="24" fill="#64748b" />
      <rect x="78" y="82" width="3" height="24" fill="#cbd5e1" />
      <rect x="81" y="82" width="2" height="24" fill="#64748b" />
      <rect x="106" y="68" width="3" height="24" fill="#cbd5e1" />
      <rect x="109" y="68" width="2" height="24" fill="#64748b" />
      <rect x="134" y="54" width="3" height="24" fill="#cbd5e1" />
      <rect x="137" y="54" width="2" height="24" fill="#64748b" />
    </>
  );
}

function BuildingLevel2Frame() {
  return (
    <>
      <g transform="translate(0, -28)">
        <polygon
          points="80,88 142,57 80,30 18,57"
          fill="url(#slabTopGrad)"
          stroke="#94a3b8"
          stroke-width="1"
        />
        <polygon
          points="18,57 80,88 80,91 18,60"
          fill="#cbd5e1"
          stroke="#94a3b8"
          stroke-width="1"
        />
        <polygon
          points="80,88 142,57 142,60 80,91"
          fill="#94a3b8"
          stroke="#64748b"
          stroke-width="1"
        />
      </g>
      <rect x="22" y="32" width="3" height="24" fill="#cbd5e1" />
      <rect x="25" y="32" width="2" height="24" fill="#64748b" />
      <rect x="50" y="46" width="3" height="24" fill="#cbd5e1" />
      <rect x="53" y="46" width="2" height="24" fill="#64748b" />
      <rect x="78" y="60" width="3" height="24" fill="#cbd5e1" />
      <rect x="81" y="60" width="2" height="24" fill="#64748b" />
      <rect x="106" y="46" width="3" height="24" fill="#cbd5e1" />
      <rect x="109" y="46" width="2" height="24" fill="#64748b" />
      <rect x="134" y="32" width="3" height="24" fill="#cbd5e1" />
      <rect x="137" y="32" width="2" height="24" fill="#64748b" />
    </>
  );
}

function BuildingRoofSlab() {
  return (
    <g transform="translate(0, -50)">
      <polygon
        points="80,88 142,57 80,30 18,57"
        fill="#f8fafc"
        stroke="#94a3b8"
        stroke-width="1.1"
      />
      <polygon points="18,57 80,88 80,92 18,61" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1" />
      <polygon
        points="80,88 142,57 142,61 80,92"
        fill="#94a3b8"
        stroke="#64748b"
        stroke-width="1"
      />
    </g>
  );
}

/**
 * 3D isometric concrete building frame structure with multi-storey slabs,
 * 3D concrete columns, perimeter beams, and realistic perspective shading.
 */
export function BuildingIsoGraphic({ className }: { className?: string }) {
  return (
    <svg
      class={className || styles.buildingIsoSvg}
      viewBox="0 0 160 120"
      aria-label="3D isometric building concrete frame structure"
    >
      <BuildingGradients />
      <g filter="url(#buildingShadow)">
        <BuildingPlinthBase />
        <BuildingLevel1Frame />
        <BuildingLevel2Frame />
        <BuildingRoofSlab />
      </g>
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
      <polygon points="22,21 38,28 22,35 6,28" fill="#f1f5f9" stroke="#94a3b8" stroke-width="0.9" />
      <polygon points="6,28 22,35 22,39 6,32" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.9" />
      <polygon
        points="22,35 38,28 38,32 22,39"
        fill="#94a3b8"
        stroke="#64748b"
        stroke-width="0.9"
      />
      <polygon
        points="22,13 30,17 22,21 14,17"
        fill="#ffffff"
        stroke="#64748b"
        stroke-width="0.9"
      />
      <polygon
        points="14,17 22,21 22,26 14,22"
        fill="#cbd5e1"
        stroke="#64748b"
        stroke-width="0.9"
      />
      <polygon
        points="22,21 30,17 30,22 22,26"
        fill="#94a3b8"
        stroke="#64748b"
        stroke-width="0.9"
      />
      <line
        x1="18"
        y1="5"
        x2="18"
        y2="14"
        stroke="#334155"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <line
        x1="26"
        y1="5"
        x2="26"
        y2="14"
        stroke="#334155"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <line
        x1="22"
        y1="7"
        x2="22"
        y2="16"
        stroke="#334155"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <line
        x1="22"
        y1="3"
        x2="22"
        y2="12"
        stroke="#475569"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <path d="M 18,5 Q 16,4 16,6" fill="none" stroke="#334155" stroke-width="1.3" />
      <path d="M 26,5 Q 28,4 28,6" fill="none" stroke="#334155" stroke-width="1.3" />
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
      <polygon points="22,7 32,12 22,17 12,12" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.9" />
      {/* Left face */}
      <polygon
        points="12,12 22,17 22,40 12,35"
        fill="#cbd5e1"
        stroke="#94a3b8"
        stroke-width="0.9"
      />
      {/* Right face */}
      <polygon
        points="22,17 32,12 32,35 22,40"
        fill="#94a3b8"
        stroke="#64748b"
        stroke-width="0.9"
      />
      {/* Rebar dowels extending from top */}
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="10"
        stroke="#334155"
        stroke-width="1.2"
        stroke-linecap="round"
      />
      <line
        x1="22"
        y1="1"
        x2="22"
        y2="9"
        stroke="#334155"
        stroke-width="1.2"
        stroke-linecap="round"
      />
      <line
        x1="28"
        y1="2"
        x2="28"
        y2="10"
        stroke="#334155"
        stroke-width="1.2"
        stroke-linecap="round"
      />
      <line
        x1="22"
        y1="5"
        x2="22"
        y2="14"
        stroke="#475569"
        stroke-width="1.2"
        stroke-linecap="round"
      />
      {/* Tie bands */}
      <polyline points="12,20 22,25 32,20" fill="none" stroke="#2563eb" stroke-width="1.2" />
      <polyline points="12,28 22,33 32,28" fill="none" stroke="#2563eb" stroke-width="1.2" />
      <polyline points="12,36 22,41 32,36" fill="none" stroke="#2563eb" stroke-width="1.2" />
    </svg>
  );
}

/**
 * 3D isometric horizontal beam with longitudinal reinforcement and stirrup loops.
 */
export function BeamIsoGraphic({ className }: { className?: string }) {
  return (
    <svg class={className || styles.memberSvg} viewBox="0 0 44 44" aria-label="3D isometric beam">
      <polygon points="8,16 34,7 42,12 16,21" fill="#f8fafc" stroke="#94a3b8" stroke-width="1" />
      <polygon points="8,16 16,21 16,33 8,28" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1" />
      <polygon points="16,21 42,12 42,24 16,33" fill="#e2e8f0" stroke="#64748b" stroke-width="1" />
      <line
        x1="22"
        y1="19"
        x2="22"
        y2="31"
        stroke="#2563eb"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <line
        x1="28"
        y1="17"
        x2="28"
        y2="29"
        stroke="#2563eb"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <line
        x1="34"
        y1="15"
        x2="34"
        y2="27"
        stroke="#2563eb"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <circle cx="12" cy="20" r="1.2" fill="#ea580c" />
      <circle cx="12" cy="29" r="1.2" fill="#ea580c" />
      <circle cx="10" cy="24.5" r="1" fill="#ea580c" />
    </svg>
  );
}

/**
 * 3D isometric concrete slab panel with grid rebar mesh.
 */
export function SlabIsoGraphic({ className }: { className?: string }) {
  return (
    <svg class={className || styles.memberSvg} viewBox="0 0 44 44" aria-label="3D isometric slab">
      <polygon points="22,10 38,18 22,26 6,18" fill="#f8fafc" stroke="#94a3b8" stroke-width="1" />
      <polygon points="6,18 22,26 22,30 6,22" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1" />
      <polygon points="22,26 38,18 38,22 22,30" fill="#94a3b8" stroke="#64748b" stroke-width="1" />
      <line x1="14" y1="14" x2="30" y2="22" stroke="#2563eb" stroke-width="0.9" />
      <line x1="18" y1="12" x2="34" y2="20" stroke="#2563eb" stroke-width="0.9" />
      <line x1="10" y1="16" x2="26" y2="24" stroke="#2563eb" stroke-width="0.9" />
      <line x1="14" y1="22" x2="30" y2="14" stroke="#2563eb" stroke-width="0.9" />
      <line x1="18" y1="24" x2="34" y2="16" stroke="#2563eb" stroke-width="0.9" />
      <line x1="10" y1="20" x2="26" y2="12" stroke="#2563eb" stroke-width="0.9" />
    </svg>
  );
}
