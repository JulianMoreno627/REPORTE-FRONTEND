import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function ThemeToggle({ className = 'icon-button' }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  return (
    <button type="button" className={className} onClick={toggleTheme} aria-label={label} title={label} aria-pressed={isDark}>
      {isDark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
