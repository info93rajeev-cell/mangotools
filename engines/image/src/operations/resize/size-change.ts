export interface SizeChange {
  /** originalBytes - outputBytes: positive means the output is smaller (a reduction). */
  sizeDifferenceBytes: number;
  /** Percentage form of the same comparison, rounded to one decimal place. */
  sizeChangePercent: number;
}

/** Compares an output's byte size against its source's. Used by Image Resize and Image Compress alike. */
export function computeSizeChange(originalBytes: number, outputBytes: number): SizeChange {
  const sizeDifferenceBytes = originalBytes - outputBytes;
  const sizeChangePercent =
    originalBytes > 0 ? Math.round((sizeDifferenceBytes / originalBytes) * 1000) / 10 : 0;
  return { sizeDifferenceBytes, sizeChangePercent };
}
