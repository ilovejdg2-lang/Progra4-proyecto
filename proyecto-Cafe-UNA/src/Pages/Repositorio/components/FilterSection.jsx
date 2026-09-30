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
      <button
        type="button"
        className="biblio-filter-sec__header"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
      >
        <span className="biblio-filter-sec__title-wrap">
          <span className="biblio-filter-sec__title">
            <ST>{titulo}</ST>
          </span>
          {badge !== null && badge > 0 && (
            <span className="biblio-filter-sec__badge">{badge}</span>
          )}
        </span>

        <span className="biblio-filter-sec__controls">
          {onClear && (
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
          )}
          <span className="biblio-filter-sec__arrow">
            <ChevronDown size={16} />
          </span>
        </span>
      </button>

      {abierto && <div className="biblio-filter-sec__content">{children}</div>}
    </div>
  );
}
