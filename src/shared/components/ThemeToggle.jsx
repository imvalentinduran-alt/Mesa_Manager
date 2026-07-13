import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/shared/lib/ThemeContext'

export default function ThemeToggle() {
  const { darkMode, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={darkMode ? 'Modo claro' : 'Modo oscuro'}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors duration-200 hover:border-upel-gold hover:text-upel-gold"
    >
      {/* Sun — visible en modo oscuro (clic activa claro) */}
      <Sun
        size={16}
        strokeWidth={2}
        className={`absolute transition-all duration-300 ease-in-out ${
          darkMode
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-50 opacity-0'
        }`}
      />
      {/* Moon — visible en modo claro (clic activa oscuro) */}
      <Moon
        size={16}
        strokeWidth={2}
        className={`absolute transition-all duration-300 ease-in-out ${
          darkMode
            ? '-rotate-90 scale-50 opacity-0'
            : 'rotate-0 scale-100 opacity-100'
        }`}
      />
    </button>
  )
}
