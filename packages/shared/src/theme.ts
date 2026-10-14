export type Theme = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'wasl:theme';
const eventName = 'wasl:themechange';
let current: Theme | undefined;
let initialized = false;
let preference: Theme | null = null;
export function resolveTheme(saved: string | null, prefersDark: boolean): Theme {
  return saved === 'light' || saved === 'dark' ? saved : prefersDark ? 'dark' : 'light';
}
function readPreference(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}
function apply(theme: Theme) {
  current = theme;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.documentElement.style.backgroundColor = theme === 'dark' ? '#111b29' : '#f2f5fa';
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#111b29' : '#f2f5fa');
  window.dispatchEvent(new Event(eventName));
}
export function getTheme(): Theme {
  return (
    current ??
    resolveTheme(readPreference(), window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
}
export function subscribeTheme(listener: () => void) {
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
export function initializeTheme() {
  if (initialized) return;
  initialized = true;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  preference = readPreference();
  apply(resolveTheme(preference, media.matches));
  media.addEventListener('change', () => {
    if (preference === null) apply(resolveTheme(null, media.matches));
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    preference = readPreference();
    apply(resolveTheme(preference, media.matches));
  });
}
export function toggleTheme() {
  preference = getTheme() === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    preference = getTheme() === 'dark' ? 'light' : 'dark';
  }
  apply(preference);
}
