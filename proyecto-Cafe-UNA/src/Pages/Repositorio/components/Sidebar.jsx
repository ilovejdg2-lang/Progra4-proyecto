import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Tag,
  User,
  X,
} from "lucide-react";
import { IconoSitio } from "../../../Components/IconoSitio/IconoSitio";
import { NumericInput } from "../../../Components/NumericInput/NumericInput";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { CategoryTree } from "./CategoryTree";
import { FilterSection } from "./FilterSection";

function resolverIconoTipo(tipo = "") {
  const t = tipo.toLowerCase();
  if (t === "pdf") return { icon: FileText, colorClass: "icon--pdf" };
  if (t === "word" || t === "docx") return { icon: FileText, colorClass: "icon--word" };
  if (t === "excel" || t === "xlsx") return { icon: FileSpreadsheet, colorClass: "icon--excel" };
  if (t === "imagen") return { icon: FileImage, colorClass: "icon--image" };
  if (t === "comprimido") return { icon: FileArchive, colorClass: "icon--archive" };
  return { icon: FileCode, colorClass: "icon--default" };
}

export function Sidebar({
  // Estado de filtros
  filtros = {},
  facetas = {},
  estadisticas = {},
  usuario = null,
  esAdmin = false,
  totalResultados = 0,
  favoritosCount = 0,
  leerTardeCount = 0,
  historialCount = 0,

  // Callbacks para cambiar filtros
  onBuscar,
  onCambiarFiltro,
  onCambiarFiltros,
  onLimpiarFiltros,
  onAbrirSolicitarModal,

  // Control responsive
  mobileOpen = false,
  onCloseMobile,
  sidebarColapsado = false,
  onToggleColapso,
}) {
  const searchInputId = useId();
  const tBuscarPlaceholder = useTraducir("Buscar título, autor, tema...");
  const tBuscarAutor = useTraducir("Buscar autor...");
  const tExpandir = useTraducir("Expandir barra lateral");
  const tContraer = useTraducir("Contraer barra lateral");
  const searchInputRef = useRef(null);

  // Debounce para buscador local
  const [terminoLocal, setTerminoLocal] = useState(filtros.buscar || "");
  const [prevBuscar, setPrevBuscar] = useState(filtros.buscar || "");

  if ((filtros.buscar || "") !== prevBuscar) {
    setPrevBuscar(filtros.buscar || "");
    setTerminoLocal(filtros.buscar || "");
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (terminoLocal !== (filtros.buscar || "")) {
        onBuscar(terminoLocal);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [terminoLocal, onBuscar, filtros.buscar]);

  // Búsqueda interna de autores
  const [filtroAutorTexto, setFiltroAutorTexto] = useState("");
  const autoresFiltrados = useMemo(() => {
    const lista = facetas.autores || [];
    if (!filtroAutorTexto.trim()) return lista;
    const term = filtroAutorTexto.toLowerCase();
    return lista.filter((a) => (a.autor || "").toLowerCase().includes(term));
  }, [facetas.autores, filtroAutorTexto]);

  // Bloqueo de scroll del fondo cuando el drawer móvil está abierto
  useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  // Accesibilidad: focus trap y cierre con tecla Escape en móvil
  const sidebarRef = useRef(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCloseMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Preservar la posición de scroll del sidebar entre cambios de filtros sin interferir en el scroll manual
  const scrollContainerRef = useRef(null);
  const scrollPosRef = useRef(0);

  const handleScroll = (e) => {
    scrollPosRef.current = e.currentTarget.scrollTop;
  };

  const filtrosHash = useMemo(
    () =>
      `${filtros.categoria || ""}-${filtros.subcategoria || ""}-${filtros.accesoRapido || ""}-${filtros.tipoArchivo || ""}-${filtros.buscar || ""}`,
    [filtros.categoria, filtros.subcategoria, filtros.accesoRapido, filtros.tipoArchivo, filtros.buscar],
  );

  useLayoutEffect(() => {
    if (scrollContainerRef.current && scrollPosRef.current > 0) {
      scrollContainerRef.current.scrollTop = scrollPosRef.current;
    }
  }, [filtrosHash]);

  // Conteo de filtros activos para badges
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filtros.buscar) count++;
    if (filtros.categoria && filtros.categoria !== "todas") count++;
    if (filtros.subcategoria) count++;
    if (filtros.anioDesde || filtros.anioHasta) count++;
    if (filtros.autor) count++;
    if (filtros.tipoArchivo && filtros.tipoArchivo !== "todos") count++;
    if (filtros.idioma && filtros.idioma !== "todos") count++;
    if (filtros.etiquetas) count += filtros.etiquetas.split(",").filter(Boolean).length;
    if (filtros.accesoRapido && filtros.accesoRapido !== "todos") count++;
    return count;
  }, [filtros]);

  return (
    <>
      {/* Overlay para móvil */}
      {mobileOpen && (
        <div
          className="biblio-sidebar-overlay"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        id="biblio-sidebar"
        className={`biblio-sidebar ${mobileOpen ? "biblio-sidebar--mobile-open" : ""} ${
          sidebarColapsado ? "biblio-sidebar--collapsed" : ""
        }`}
        aria-label="Panel de navegación y filtros de biblioteca"
      >
        {/* Cabecera del Sidebar */}
        <div className="biblio-sidebar__header">
          <div className="biblio-sidebar__brand">
            <IconoSitio lugar="repo.biblioteca" size={20} className="biblio-sidebar__brand-icon" />
            <h2 className="biblio-sidebar__brand-title">
              <ST>Biblioteca</ST>
            </h2>
            {activeFiltersCount > 0 && (
              <span className="biblio-sidebar__active-badge" title="Filtros aplicados">
                {activeFiltersCount}
              </span>
            )}
          </div>

          <div className="biblio-sidebar__header-actions">
            {/* Botón para colapsar en escritorio */}
            <button
              type="button"
              className="biblio-sidebar__collapse-btn desktop-only"
              onClick={onToggleColapso}
              title={sidebarColapsado ? tExpandir : tContraer}
              aria-label={sidebarColapsado ? tExpandir : tContraer}
            >
              {sidebarColapsado ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            {/* Botón de cerrar en móvil */}
            <button
              type="button"
              className="biblio-sidebar__close-btn mobile-only"
              onClick={onCloseMobile}
              aria-label="Cerrar panel de filtros"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido con scroll interno */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="biblio-sidebar__scroll"
        >
          {/* 1. Buscador con debounce y sugerencias */}
          <div className="biblio-sidebar__search-box">
            <label htmlFor={searchInputId} className="sr-only">
              <ST>Buscar en la biblioteca</ST>
            </label>
            <div className="biblio-sidebar__search-input-wrap">
              <Search size={16} className="biblio-sidebar__search-icon" />
              <input
                id={searchInputId}
                ref={searchInputRef}
                type="text"
                className="biblio-sidebar__search-input"
                placeholder={tBuscarPlaceholder}
                value={terminoLocal}
                onChange={(e) => setTerminoLocal(e.target.value)}
                autoComplete="off"
              />
              {terminoLocal && (
                <button
                  type="button"
                  className="biblio-sidebar__search-clear"
                  onClick={() => {
                    setTerminoLocal("");
                    onBuscar("");
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Borrar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* 2. Accesos Rápidos */}
          <div className="biblio-sidebar__section">
            <h3 className="biblio-sidebar__section-label">
              <ST>Accesos Rápidos</ST>
            </h3>
            <div className="biblio-quick-links">
              <button
                type="button"
                className={`biblio-quick-link ${
                  !filtros.accesoRapido || filtros.accesoRapido === "todos"
                    ? "biblio-quick-link--active"
                    : ""
                }`}
                onClick={() => {
                  onCambiarFiltro("accesoRapido", "todos");
                  if (mobileOpen) onCloseMobile?.();
                }}
              >
                <IconoSitio lugar="repo.todos" size={15} />
                <span className="biblio-quick-link__text">
                  <ST>Todos</ST>
                </span>
                <span className="biblio-quick-link__count">
                  {facetas.accesosRapidos?.todos ?? estadisticas.totalDocumentos ?? 0}
                </span>
              </button>

              <button
                type="button"
                className={`biblio-quick-link ${
                  filtros.accesoRapido === "novedades" ? "biblio-quick-link--active" : ""
                }`}
                onClick={() => {
                  onCambiarFiltro("accesoRapido", "novedades");
                  if (mobileOpen) onCloseMobile?.();
                }}
              >
                <IconoSitio lugar="repo.novedades" size={15} className="text-amber-500" />
                <span className="biblio-quick-link__text">
                  <ST>Novedades</ST>
                </span>
                <span className="biblio-quick-link__count">
                  {facetas.accesosRapidos?.novedades ?? 0}
                </span>
              </button>

              <button
                type="button"
                className={`biblio-quick-link ${
                  filtros.accesoRapido === "populares" ? "biblio-quick-link--active" : ""
                }`}
                onClick={() => {
                  onCambiarFiltro("accesoRapido", "populares");
                  if (mobileOpen) onCloseMobile?.();
                }}
              >
                <IconoSitio lugar="repo.populares" size={15} className="text-orange-500" />
                <span className="biblio-quick-link__text">
                  <ST>Más descargados</ST>
                </span>
                <span className="biblio-quick-link__count">
                  {facetas.accesosRapidos?.populares ?? 0}
                </span>
              </button>

              <button
                type="button"
                className={`biblio-quick-link ${
                  filtros.accesoRapido === "destacados" ? "biblio-quick-link--active" : ""
                }`}
                onClick={() => {
                  onCambiarFiltro("accesoRapido", "destacados");
                  if (mobileOpen) onCloseMobile?.();
                }}
              >
                <IconoSitio lugar="repo.destacados" size={15} className="text-emerald-500" />
                <span className="biblio-quick-link__text">
                  <ST>Destacados</ST>
                </span>
                <span className="biblio-quick-link__count">
                  {facetas.accesosRapidos?.destacados ?? 0}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Navegación por Categorías en Árbol */}
          <div className="biblio-sidebar__section">
            <h3 className="biblio-sidebar__section-label">
              <ST>Categorías Temáticas</ST>
            </h3>
            <CategoryTree
              categorias={facetas.categorias || []}
              subcategorias={facetas.subcategorias || []}
              categoriaActiva={filtros.categoria || "todas"}
              subcategoriaActiva={filtros.subcategoria || ""}
              onSelectCategoria={(cat) => {
                if (onCambiarFiltros) {
                  onCambiarFiltros({ categoria: cat, subcategoria: "" });
                } else {
                  onCambiarFiltro("categoria", cat);
                  onCambiarFiltro("subcategoria", "");
                }
                if (mobileOpen) onCloseMobile?.();
              }}
              onSelectSubcategoria={(cat, sub) => {
                if (onCambiarFiltros) {
                  onCambiarFiltros({ categoria: cat, subcategoria: sub });
                } else {
                  onCambiarFiltro("categoria", cat);
                  onCambiarFiltro("subcategoria", sub);
                }
                if (mobileOpen) onCloseMobile?.();
              }}
              totalDocumentos={estadisticas.totalDocumentos || 0}
            />
          </div>

          {/* 4. Mi Biblioteca (Usuarios autenticados) */}
          {usuario && (
            <div className="biblio-sidebar__section">
              <h3 className="biblio-sidebar__section-label">
                <ST>Mi Biblioteca</ST>
              </h3>
              <div className="biblio-user-lib-links">
                <button
                  type="button"
                  className={`biblio-user-lib-link ${
                    filtros.miBiblioteca === "favoritos"
                      ? "biblio-user-lib-link--active"
                      : ""
                  }`}
                  onClick={() => {
                    onCambiarFiltro(
                      "miBiblioteca",
                      filtros.miBiblioteca === "favoritos" ? "" : "favoritos",
                    );
                    if (mobileOpen) onCloseMobile?.();
                  }}
                >
                  <IconoSitio lugar="repo.favoritos" size={15} className="text-rose-500" />
                  <span className="biblio-user-lib-link__text">
                    <ST>Mis Favoritos</ST>
                  </span>
                  <span className="biblio-user-lib-link__count">
                    {favoritosCount}
                  </span>
                </button>
                <button
                  type="button"
                  className={`biblio-user-lib-link ${
                    filtros.miBiblioteca === "leer_mas_tarde"
                      ? "biblio-user-lib-link--active"
                      : ""
                  }`}
                  onClick={() => {
                    onCambiarFiltro(
                      "miBiblioteca",
                      filtros.miBiblioteca === "leer_mas_tarde"
                        ? ""
                        : "leer_mas_tarde",
                    );
                    if (mobileOpen) onCloseMobile?.();
                  }}
                >
                  <IconoSitio lugar="repo.leer-tarde" size={15} className="text-blue-500" />
                  <span className="biblio-user-lib-link__text">
                    <ST>Leer más tarde</ST>
                  </span>
                  <span className="biblio-user-lib-link__count">
                    {leerTardeCount}
                  </span>
                </button>
                <button
                  type="button"
                  className={`biblio-user-lib-link ${
                    filtros.miBiblioteca === "historial"
                      ? "biblio-user-lib-link--active"
                      : ""
                  }`}
                  onClick={() => {
                    onCambiarFiltro(
                      "miBiblioteca",
                      filtros.miBiblioteca === "historial" ? "" : "historial",
                    );
                    if (mobileOpen) onCloseMobile?.();
                  }}
                >
                  <IconoSitio lugar="repo.historial" size={15} className="text-amber-500" />
                  <span className="biblio-user-lib-link__text">
                    <ST>Historial de vistos</ST>
                  </span>
                  <span className="biblio-user-lib-link__count">
                    {historialCount}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 5. Filtros Avanzados en Acordeón */}
          <div className="biblio-sidebar__section">
            <h3 className="biblio-sidebar__section-label">
              <ST>Filtros Avanzados</ST>
            </h3>

            {/* Año */}
            <FilterSection
              titulo="Año de Publicación"
              badge={filtros.anioDesde || filtros.anioHasta ? 1 : null}
              onClear={
                filtros.anioDesde || filtros.anioHasta
                  ? () => {
                      onCambiarFiltro("anioDesde", "");
                      onCambiarFiltro("anioHasta", "");
                    }
                  : null
              }
            >
              <div className="biblio-filter-year">
                <div className="biblio-filter-year__inputs">
                  <div className="biblio-filter-year__field">
                    <span className="biblio-filter-year__lbl">
                      <ST>Desde</ST>
                    </span>
                    <NumericInput
                      maxLength={4}
                      className="biblio-filter-year__input"
                      placeholder={String(facetas.minAnio || 2020)}
                      value={filtros.anioDesde || ""}
                      onChange={(e) => onCambiarFiltro("anioDesde", e.target.value)}
                    />
                  </div>
                  <span className="biblio-filter-year__sep">-</span>
                  <div className="biblio-filter-year__field">
                    <span className="biblio-filter-year__lbl">
                      <ST>Hasta</ST>
                    </span>
                    <NumericInput
                      maxLength={4}
                      className="biblio-filter-year__input"
                      placeholder={String(facetas.maxAnio || 2026)}
                      value={filtros.anioHasta || ""}
                      onChange={(e) => onCambiarFiltro("anioHasta", e.target.value)}
                    />
                  </div>
                </div>

                {/* Lista rápida de años */}
                <div className="biblio-filter-year__chips">
                  {(facetas.anios || []).slice(0, 5).map((a) => {
                    const esSeleccionado =
                      Number(filtros.anioDesde) === a.anio &&
                      Number(filtros.anioHasta) === a.anio;

                    return (
                      <button
                        key={a.anio}
                        type="button"
                        className={`biblio-tag-chip ${
                          esSeleccionado ? "biblio-tag-chip--active" : ""
                        }`}
                        onClick={() => {
                          if (esSeleccionado) {
                            onCambiarFiltro("anioDesde", "");
                            onCambiarFiltro("anioHasta", "");
                          } else {
                            onCambiarFiltro("anioDesde", a.anio);
                            onCambiarFiltro("anioHasta", a.anio);
                          }
                        }}
                      >
                        {a.anio}
                        <span className="biblio-tag-chip__count">{a.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </FilterSection>

            {/* Tipo de Archivo */}
            <FilterSection
              titulo="Tipo de Archivo"
              badge={filtros.tipoArchivo && filtros.tipoArchivo !== "todos" ? 1 : null}
              onClear={
                filtros.tipoArchivo && filtros.tipoArchivo !== "todos"
                  ? () => onCambiarFiltro("tipoArchivo", "todos")
                  : null
              }
            >
              <div className="biblio-filter-list">
                {(facetas.tiposArchivo || []).map((t) => {
                  if (t.count === 0 && filtros.tipoArchivo !== t.tipo) return null;
                  const { icon: TipoIcon, colorClass } = resolverIconoTipo(t.tipo);
                  const isChecked = filtros.tipoArchivo === t.tipo;

                  return (
                    <label
                      key={t.tipo}
                      className={`biblio-filter-option ${
                        isChecked ? "biblio-filter-option--checked" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoArchivo"
                        checked={isChecked}
                        onChange={() =>
                          onCambiarFiltro("tipoArchivo", isChecked ? "todos" : t.tipo)
                        }
                        className="sr-only"
                      />
                      <span className={`biblio-filter-option__icon ${colorClass}`}>
                        <TipoIcon size={14} />
                      </span>
                      <span className="biblio-filter-option__text"><ST>{t.label}</ST></span>
                      <span className="biblio-filter-option__count">{t.count}</span>
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            {/* Autor */}
            <FilterSection
              titulo="Autor"
              badge={filtros.autor ? 1 : null}
              onClear={filtros.autor ? () => onCambiarFiltro("autor", "") : null}
              initialOpen={false}
            >
              <div className="biblio-filter-author">
                <input
                  type="text"
                  className="biblio-filter-author__input"
                  placeholder={tBuscarAutor}
                  value={filtroAutorTexto}
                  onChange={(e) => setFiltroAutorTexto(e.target.value)}
                />
                <div className="biblio-filter-list biblio-filter-list--compact">
                  {autoresFiltrados.slice(0, 8).map((a) => {
                    const isChecked =
                      (filtros.autor || "").toLowerCase() === a.autor.toLowerCase();

                    return (
                      <label
                        key={a.autor}
                        className={`biblio-filter-option ${
                          isChecked ? "biblio-filter-option--checked" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="filtroAutor"
                          checked={isChecked}
                          onChange={() =>
                            onCambiarFiltro("autor", isChecked ? "" : a.autor)
                          }
                          className="sr-only"
                        />
                        <User size={13} className="biblio-filter-option__icon-muted" />
                        <span className="biblio-filter-option__text" title={a.autor}>
                          {a.autor}
                        </span>
                        <span className="biblio-filter-option__count">{a.count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </FilterSection>

            {/* Idioma */}
            <FilterSection
              titulo="Idioma"
              badge={filtros.idioma && filtros.idioma !== "todos" ? 1 : null}
              onClear={
                filtros.idioma && filtros.idioma !== "todos"
                  ? () => onCambiarFiltro("idioma", "todos")
                  : null
              }
              initialOpen={false}
            >
              <div className="biblio-filter-list">
                {(facetas.idiomas || []).map((lang) => {
                  const isChecked = filtros.idioma === lang.idioma;
                  return (
                    <label
                      key={lang.idioma}
                      className={`biblio-filter-option ${
                        isChecked ? "biblio-filter-option--checked" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="filtroIdioma"
                        checked={isChecked}
                        onChange={() =>
                          onCambiarFiltro("idioma", isChecked ? "todos" : lang.idioma)
                        }
                        className="sr-only"
                      />
                      <Globe size={14} className="biblio-filter-option__icon-muted" />
                      <span className="biblio-filter-option__text"><ST>{lang.label}</ST></span>
                      <span className="biblio-filter-option__count">{lang.count}</span>
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            {/* Etiquetas / Chips Populares */}
            {facetas.etiquetas && facetas.etiquetas.length > 0 && (
              <FilterSection
                titulo="Etiquetas"
                badge={
                  filtros.etiquetas ? filtros.etiquetas.split(",").filter(Boolean).length : null
                }
                onClear={
                  filtros.etiquetas ? () => onCambiarFiltro("etiquetas", "") : null
                }
              >
                <div className="biblio-tag-chips-wrap">
                  {facetas.etiquetas.slice(0, 12).map((et) => {
                    const tagList = (filtros.etiquetas || "")
                      .split(",")
                      .map((t) => t.trim().toLowerCase())
                      .filter(Boolean);
                    const isSelected = tagList.includes(et.etiqueta.toLowerCase());

                    return (
                      <button
                        key={et.etiqueta}
                        type="button"
                        className={`biblio-tag-chip ${
                          isSelected ? "biblio-tag-chip--active" : ""
                        }`}
                        onClick={() => {
                          let nuevos;
                          if (isSelected) {
                            nuevos = tagList.filter((t) => t !== et.etiqueta.toLowerCase());
                          } else {
                            nuevos = [...tagList, et.etiqueta.toLowerCase()];
                          }
                          onCambiarFiltro("etiquetas", nuevos.join(","));
                        }}
                      >
                        <Tag size={11} />
                        <span>{et.etiqueta}</span>
                        <span className="biblio-tag-chip__count">{et.count}</span>
                      </button>
                    );
                  })}
                </div>
              </FilterSection>
            )}
          </div>
        </div>

        {/* Pie fijo con acciones */}
        <div className="biblio-sidebar__footer">
          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="biblio-sidebar__clear-btn"
              onClick={onLimpiarFiltros}
            >
              <RotateCcw size={14} />
              <span>
                <ST>Limpiar todos los filtros</ST>
              </span>
            </button>
          )}

          <button
            type="button"
            className="biblio-sidebar__propose-btn"
            onClick={onAbrirSolicitarModal}
          >
            <IconoSitio lugar="repo.enviar" size={15} />
            <span>
              <ST>Enviar</ST>
            </span>
          </button>
        </div>

        {/* Barra inferior fija exclusiva de móvil */}
        <div className="biblio-sidebar__mobile-actions mobile-only">
          <button
            type="button"
            className="biblio-sidebar__mobile-clear-btn"
            onClick={onLimpiarFiltros}
          >
            <RotateCcw size={14} />
            <span>
              <ST>Limpiar</ST>
            </span>
          </button>
          <button
            type="button"
            className="biblio-sidebar__mobile-apply-btn"
            onClick={onCloseMobile}
          >
            <Check size={14} />
            <span>
              <ST>Aplicar ({totalResultados})</ST>
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
