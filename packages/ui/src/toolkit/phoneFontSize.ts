/**
 * Inline font size that grows on phones like the CSS modules do: below 15px it moves halfway
 * towards 15px when the --fs-lift token is 0.5 (set for screens up to 700px in tokens.css).
 */
export const fs = (px: number): string => `calc(${px}px + (15px - ${px}px) * var(--fs-lift, 0))`;
