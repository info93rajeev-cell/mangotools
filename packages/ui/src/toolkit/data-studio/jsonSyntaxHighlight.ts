/**
 * Colours JSON text for the editor overlay. Returns HTML with every character escaped, so user
 * input can never inject markup. Very large inputs are returned escaped but uncoloured to keep
 * typing responsive.
 */
const TOKEN =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

export const HIGHLIGHT_LIMIT = 200_000;

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tokenClass(m: RegExpExecArray): string {
  if (m[1] !== undefined) return m[2] !== undefined ? 'k' : 's';
  if (m[3] !== undefined) return 'b';
  if (m[4] !== undefined) return 'n';
  return 'd';
}

export function highlightJson(text: string): string {
  if (text.length > HIGHLIGHT_LIMIT) return escapeHtml(text);
  let out = '';
  let last = 0;
  TOKEN.lastIndex = 0;
  for (let m = TOKEN.exec(text); m !== null; m = TOKEN.exec(text)) {
    out += escapeHtml(text.slice(last, m.index));
    const cls = tokenClass(m);
    const word = cls === 'k' ? (m[1] ?? '') : m[0];
    out += `<span class="j${cls}">${escapeHtml(word)}</span>`;
    if (cls === 'k') out += escapeHtml(m[2] ?? '');
    last = m.index + m[0].length;
  }
  // A trailing newline needs a visible line so the overlay height matches the textarea.
  return `${out}${escapeHtml(text.slice(last))}\n`;
}
