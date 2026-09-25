/** Browser actions used by tool islands. Each returns whether it succeeded. */

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function readClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

/** Saves text as a file using a temporary object URL (no network). */
export function downloadText(text: string, fileName: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

/** Reads a local text file (never uploaded). Null when it is too large. */
export async function readTextFile(file: File): Promise<string | null> {
  if (file.size > MAX_FILE_BYTES) return null;
  return file.text();
}
