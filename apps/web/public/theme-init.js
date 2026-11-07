// Applies the theme before first paint (an external file, so no inline script).
// The site is light unless the visitor chose dark with the toggle. An explicit
// data-theme keeps every tool on one palette, even when the phone itself is in dark mode.
let theme = 'light';
try {
  if (localStorage.getItem('mt.theme') === 'dark') theme = 'dark';
} catch {
  // Storage blocked: stay light.
}
document.documentElement.dataset.theme = theme;
const bar = theme === 'dark' ? '#0c0a09' : '#ffffff';
for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.content = bar;
const scheme = document.querySelector('meta[name="color-scheme"]');
if (scheme) scheme.content = theme;
