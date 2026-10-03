import {
  ArrowUpDown,
  Filter,
  Grid,
  List,
  PanelLeft,
  Printer,
} from "lucide-react";
import { ST } from "../../../Components/T/ST";
import { SelectFiltro } from "../../../Components/ui/SelectFiltro";

export function ResultsToolbar({
  totalResultados = 0,
  paginaActual = 1,
  limitePorPagina = 12,
  orden = "recientes",
  onCambiarOrden,
  vistaCuadricula = true,
  onToggleVista,
  onAbrirFiltrosMobile,
  filtrosActivosCount = 0,
  sidebarColapsado = false,
  onToggleColapso = null,
}) {
  const inicio = totalResultados === 0 ? 0 : (paginaActual - 1) * limitePorPagina + 1;
  const fin = Math.min(paginaActual * limitePorPagina, totalResultados);

  return (
    <div className="biblio-toolbar no-print">
      {/* Botón de Filtros para Móvil / Tablet y Toggle para Desktop */}
      <div className="biblio-toolbar__left">
        {onToggleColapso && (
          <button
            type="button"
            className="biblio-toolbar__sidebar-btn desktop-only"
            onClick={onToggleColapso}
            title={sidebarColapsado ? "Mostrar panel lateral de filtros" : "Ocultar panel lateral"}
            aria-label={sidebarColapsado ? "Mostrar panel lateral" : "Ocultar panel lateral"}
          >
            <PanelLeft size={16} />
            <span>
              <ST>{sidebarColapsado ? "Mostrar panel" : "Ocultar panel"}</ST>
            </span>
          </button>
        )}

        <button
          type="button"
          className="biblio-toolbar__filter-btn mobile-tablet-only"
          onClick={onAbrirFiltrosMobile}
          aria-label="Abrir filtros"
        >
          <Filter size={16} />
          <span>
            <ST>Filtros</ST>
          </span>
          {filtrosActivosCount > 0 && (
            <span className="biblio-toolbar__filter-badge">{filtrosActivosCount}</span>
          )}
        </button>

        {/* Contador de resultados */}
        <div className="biblio-toolbar__count" aria-live="polite">
          {totalResultados === 0 ? (
            <span className="text-slate-500">
              <ST>0 documentos encontrados</ST>
            </span>
          ) : (
            <span>
              <ST>Mostrando</ST> <strong>{inicio}</strong> - <strong>{fin}</strong>{" "}
              <ST>de</ST> <strong>{totalResultados}</strong> <ST>documentos</ST>
            </span>
          )}
        </div>
      </div>

      {/* Controles de la derecha */}
      <div className="biblio-toolbar__right">
        {/* Selector de orden */}
        <div className="biblio-toolbar__sort">
          <label htmlFor="biblio-sort-select" className="biblio-toolbar__sort-label">
            <ArrowUpDown size={14} />
            <span className="desktop-only">
              <ST>Ordenar por:</ST>
            </span>
          </label>
          <SelectFiltro
            id="biblio-sort-select"
            className="biblio-toolbar__select"
            value={orden}
            onChange={(e) => onCambiarOrden(e.target.value)}
          >
            <option value="recientes">Más recientes</option>
            <option value="descargas">Más descargados</option>
            <option value="vistas">Más vistos</option>
            <option value="az">Título (A - Z)</option>
            <option value="za">Título (Z - A)</option>
            <option value="anio_desc">Año (más reciente)</option>
            <option value="anio_asc">Año (más antiguo)</option>
            <option value="antiguos">Más antiguos</option>
          </SelectFiltro>
        </div>

        {/* Alternador de vista cuadrícula / lista */}
        <div className="biblio-toolbar__view-toggle" role="group" aria-label="Modo de vista">
          <button
            type="button"
            className={`biblio-toolbar__view-btn ${
              vistaCuadricula ? "biblio-toolbar__view-btn--active" : ""
            }`}
            onClick={() => onToggleVista(true)}
            title="Vista en cuadrícula"
            aria-label="Vista en cuadrícula"
            aria-pressed={vistaCuadricula}
          >
            <Grid size={16} />
          </button>
          <button
            type="button"
            className={`biblio-toolbar__view-btn ${
              !vistaCuadricula ? "biblio-toolbar__view-btn--active" : ""
            }`}
            onClick={() => onToggleVista(false)}
            title="Vista en lista"
            aria-label="Vista en lista"
            aria-pressed={!vistaCuadricula}
          >
            <List size={16} />
          </button>
        </div>

        {/* Imprimir */}
        <button
          type="button"
          className="biblio-toolbar__print-btn"
          onClick={() => window.print()}
          title="Imprimir catálogo visible"
          aria-label="Imprimir catálogo"
        >
          <Printer size={15} />
          <span className="desktop-only">
            <ST>Imprimir</ST>
          </span>
        </button>
      </div>
    </div>
  );
}
