// Applies the visitor's saved theme before first paint (an external file, so no inline script).
try {
  const theme = localStorage.getItem('mt.theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
  // Storage blocked: the system theme applies.
}
