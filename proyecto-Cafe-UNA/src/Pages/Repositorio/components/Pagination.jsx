import { ChevronLeft, ChevronRight } from "lucide-react";
import { ST } from "../../../Components/T/ST";

export function Pagination({
  paginaActual = 1,
  totalPaginas = 1,
  onCambiarPagina,
}) {
  if (totalPaginas <= 1) return null;

  // Generar lista de números de páginas con elipsis
  const obtenerNumeros = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, paginaActual - delta);
      i <= Math.min(totalPaginas - 1, paginaActual + delta);
      i++
    ) {
      range.push(i);
    }

    if (paginaActual - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (paginaActual + delta < totalPaginas - 1) {
      rangeWithDots.push("...", totalPaginas);
    } else if (totalPaginas > 1) {
      rangeWithDots.push(totalPaginas);
    }

    return rangeWithDots;
  };

  const paginas = obtenerNumeros();

  return (
    <nav className="biblio-pagination no-print" aria-label="Paginación de resultados">
      {/* Botón Anterior */}
      <button
        type="button"
        className="biblio-pagination__btn"
        disabled={paginaActual <= 1}
        onClick={() => onCambiarPagina(paginaActual - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
        <span className="desktop-only">
          <ST>Anterior</ST>
        </span>
      </button>

      {/* Números de página */}
      <div className="biblio-pagination__pages">
        {paginas.map((p, index) => {
          if (p === "...") {
            return (
              <span key={`dots-${index}`} className="biblio-pagination__dots">
                ...
              </span>
            );
          }

          const esActiva = p === paginaActual;
          return (
            <button
              key={p}
              type="button"
              className={`biblio-pagination__num ${
                esActiva ? "biblio-pagination__num--active" : ""
              }`}
              onClick={() => onCambiarPagina(p)}
              aria-current={esActiva ? "page" : undefined}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Botón Siguiente */}
      <button
        type="button"
        className="biblio-pagination__btn"
        disabled={paginaActual >= totalPaginas}
        onClick={() => onCambiarPagina(paginaActual + 1)}
        aria-label="Página siguiente"
      >
        <span className="desktop-only">
          <ST>Siguiente</ST>
        </span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
