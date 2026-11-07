/** Short file descriptions for the PDF tool file rows. */
/** "1 page" / "3 pages" and a size in KB below 1 MB, MB above. */
export function fileMeta(pages: number, bytes: number): string {
  const size =
    bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${pages} page${pages === 1 ? '' : 's'} • ${size}`;
}
