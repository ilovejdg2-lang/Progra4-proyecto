import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { ST } from "../../../Components/T/ST";

export function FilterSection({
  titulo = "",
  initialOpen = true,
  badge = null,
  onClear = null,
  children,
}) {
  const [abierto, setAbierto] = useState(initialOpen);

  return (
    <div className={`biblio-filter-sec ${abierto ? "biblio-filter-sec--open" : ""}`}>
      <div className="biblio-filter-sec__header">
        <button
          type="button"
          className="biblio-filter-sec__toggle"
          onClick={() => setAbierto(!abierto)}
          aria-expanded={abierto}
        >
          <span className="biblio-filter-sec__title-group">
            <span className="biblio-filter-sec__title">
              <ST>{titulo}</ST>
            </span>
            {badge !== null && badge > 0 && (
              <span className="biblio-filter-sec__badge">{badge}</span>
            )}
          </span>

          <span className="biblio-filter-sec__arrow">
            <ChevronDown size={16} />
          </span>
        </button>

        {onClear && (
          <div className="biblio-filter-sec__actions">
            <button
              type="button"
              className="biblio-filter-sec__clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              title="Restablecer este filtro"
              aria-label={`Restablecer filtro ${titulo}`}
            >
              <RotateCcw size={12} />
            </button>
          </div>
        )}
      </div>

      {abierto && <div className="biblio-filter-sec__content">{children}</div>}
    </div>
  );
}
