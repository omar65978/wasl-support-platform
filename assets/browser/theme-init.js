(() => {
  let saved = null;
  try {
    saved = localStorage.getItem('wasl:theme');
  } catch {
    saved = null;
  }
  const theme =
    saved === 'light' || saved === 'dark'
      ? saved
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  root.style.backgroundColor = theme === 'dark' ? '#111b29' : '#f2f5fa';
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', root.style.backgroundColor);
})();
