import { Moon, Sun } from "lucide-react";

import { useAdminTheme } from "../../hooks/useAdminTheme";
import { useTraducir } from "../../hooks/useTraducir";

export function AdminThemeToggle() {
  const { isDark, toggleTheme } = useAdminTheme();
  const labelDark = useTraducir("Activar modo oscuro");
  const labelLight = useTraducir("Activar modo claro");

  return (
    <button
      type="button"
      className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
      aria-label={isDark ? labelLight : labelDark}
      title={isDark ? labelLight : labelDark}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
