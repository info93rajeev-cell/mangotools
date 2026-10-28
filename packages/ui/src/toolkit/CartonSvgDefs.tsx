export function CartonSvgDefs() {
  return (
    <defs>
      {/* Soft Ground Shadow Filter */}
      <filter id="cartonGroundBlur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" />
      </filter>

      <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#0065ff" />
      </marker>
      <marker id="arrowHeadStart" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
        <path d="M6,0 L6,6 L0,3 z" fill="#0065ff" />
      </marker>

      {/* Kraft Carton Lighting Gradients */}
      <linearGradient id="cartonTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fae4ca" />
        <stop offset="60%" stop-color="#eed3ae" />
        <stop offset="100%" stop-color="#e2bf94" />
      </linearGradient>
      <linearGradient id="cartonLeftGrad" x1="0%" y1="0%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="#dfa066" />
        <stop offset="100%" stop-color="#cb8a4c" />
      </linearGradient>
      <linearGradient id="cartonRightGrad" x1="0%" y1="0%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="#ba793e" />
        <stop offset="100%" stop-color="#a46328" />
      </linearGradient>

      {/* Packaging Tape Gradient */}
      <linearGradient id="cartonTapeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#cca06c" stop-opacity="0.92" />
        <stop offset="50%" stop-color="#e2ba89" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#c1935e" stop-opacity="0.92" />
      </linearGradient>
    </defs>
  );
}
