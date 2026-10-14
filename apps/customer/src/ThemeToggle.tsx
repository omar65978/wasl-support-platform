import { Moon, Sun } from 'lucide-react';
import { useApp } from './context';
export function ThemeToggle() {
  const { theme, toggleTheme, t } = useApp();
  const label = t(theme === 'dark' ? 'switchToLight' : 'switchToDark');
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
