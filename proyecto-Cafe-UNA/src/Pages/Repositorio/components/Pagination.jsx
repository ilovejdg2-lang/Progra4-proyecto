import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTraducir } from "../../../hooks/useTraducir";
import { obtenerNumerosPagina } from "../repositorioLogic";

export function Pagination({ paginaActual = 1, totalPaginas = 1, onCambiarPagina }) {
  const tNav = useTraducir("Paginación de resultados");
  const tAnterior = useTraducir("Página anterior");
  const tSiguiente = useTraducir("Página siguiente");
  const tPagina = useTraducir("Página");

  if (totalPaginas <= 1) return null;

  return (
    <nav className="repo-pagination" aria-label={tNav}>
      <button
        type="button"
        className="repo-page-btn"
        disabled={paginaActual <= 1}
        onClick={() => onCambiarPagina(paginaActual - 1)}
        aria-label={tAnterior}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      <ul className="repo-pagination__pages">
        {obtenerNumerosPagina(paginaActual, totalPaginas).map((p, index) =>
          p === "..." ? (
            <li key={`gap-${index}`} className="repo-pagination__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={`repo-page-btn${p === paginaActual ? " repo-page-btn--active" : ""}`}
                onClick={() => onCambiarPagina(p)}
                aria-current={p === paginaActual ? "page" : undefined}
                aria-label={`${tPagina} ${p}`}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className="repo-page-btn"
        disabled={paginaActual >= totalPaginas}
        onClick={() => onCambiarPagina(paginaActual + 1)}
        aria-label={tSiguiente}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
