/**
 * Unified image file size formatting and dual-standard limit computation.
 * Ensures consistent display across all 11 Image & Media tools, and ensures
 * that target size limits satisfy BOTH the 1000-byte (decimal/SI) and
 * 1024-byte (binary) definitions so portals never reject files as over-limit.
 */

/**
 * Formats byte counts into human-friendly strings with clear units (B, KB, MB).
 * Uses binary calculation (1024 bytes per KB) with 1 decimal place below 10.
 */
export function formatImageBytes(bytes: number): string {
  if (bytes <= 0 || Number.isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) {
    const formatted = kb >= 10 ? `${Math.round(kb)}` : (Math.round(kb * 10) / 10).toFixed(1);
    return `${formatted} KB`;
  }

  const mb = bytes / (1024 * 1024);
  const formattedMb = mb >= 10 ? `${Math.round(mb)}` : (Math.round(mb * 10) / 10).toFixed(1);
  return `${formattedMb} MB`;
}

/**
 * Computes the maximum safe byte boundary for a target KB limit.
 * Uses 1000 bytes per KB so that the resulting file satisfies both decimal (1000)
 * and binary (1024) portal validators (always staying below the stricter limit).
 */
export function getStrictMaxFileSizeBytes(maxKB: number): number {
  if (maxKB <= 0) return 0;
  return Math.floor(maxKB * 1000);
}

/**
 * Computes the minimum safe byte boundary for a minimum KB target.
 * Uses 1024 bytes per KB so that the resulting file satisfies both decimal (1000)
 * and binary (1024) portal validators (never falling below the stricter threshold).
 */
export function getStrictMinFileSizeBytes(minKB: number): number {
  if (minKB <= 0) return 0;
  return Math.ceil(minKB * 1024);
}
