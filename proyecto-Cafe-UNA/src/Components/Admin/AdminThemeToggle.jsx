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
      className="inline-flex size-9 items-center justify-center rounded-[var(--admin-control-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)] shadow-sm transition hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)]"
      aria-label={isDark ? labelLight : labelDark}
      title={isDark ? labelLight : labelDark}
      aria-pressed={isDark}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        toggleTheme({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
