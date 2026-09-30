import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Layers } from "lucide-react";
import { ST } from "../../../Components/T/ST";

export function CategoryTree({
  categorias = [],
  subcategorias = [],
  categoriaActiva = "todas",
  subcategoriaActiva = "",
  onSelectCategoria,
  onSelectSubcategoria,
  totalDocumentos = 0,
}) {
  const [expandidas, setExpandidas] = useState(() => {
    // Si hay una categoría activa, inicializarla expandida
    const map = {};
    if (categoriaActiva && categoriaActiva !== "todas") {
      map[categoriaActiva.toLowerCase()] = true;
    }
    return map;
  });

  const toggleExpand = (catNombre, e) => {
    e.stopPropagation();
    const key = catNombre.toLowerCase();
    setExpandidas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Agrupar subcategorías por categoría padre
  const subcategoriasPorPadre = useMemo(() => {
    const map = new Map();
    (subcategorias || []).forEach((sub) => {
      const padreKey = (sub.categoria || "").trim().toLowerCase();
      if (!map.has(padreKey)) map.set(padreKey, []);
      map.get(padreKey).push(sub);
    });
    return map;
  }, [subcategorias]);

  return (
    <nav className="biblio-cat-tree" aria-label="Navegación por categorías">
      {/* Opción Todas */}
      <button
        type="button"
        className={`biblio-cat-tree__item ${
          categoriaActiva === "todas" ? "biblio-cat-tree__item--activo" : ""
        }`}
        onClick={() => onSelectCategoria("todas")}
      >
        <span className="biblio-cat-tree__icon-wrap">
          <Layers size={16} />
        </span>
        <span className="biblio-cat-tree__name">
          <ST>Todas las categorías</ST>
        </span>
        <span className="biblio-cat-tree__badge">{totalDocumentos}</span>
      </button>

      {/* Lista de Categorías */}
      <ul className="biblio-cat-tree__list">
        {categorias.map((cat) => {
          const catNombre = cat.nombre || cat.Nombre || "";
          const catKey = catNombre.toLowerCase();
          const subs = subcategoriasPorPadre.get(catKey) || [];
          const tieneSubs = subs.length > 0;
          const estaExpandida = Boolean(expandidas[catKey]);
          const esActiva =
            categoriaActiva.toLowerCase() === catKey && !subcategoriaActiva;

          return (
            <li key={catKey} className="biblio-cat-tree__node">
              <div
                className={`biblio-cat-tree__item ${
                  esActiva ? "biblio-cat-tree__item--activo" : ""
                }`}
                onClick={() => onSelectCategoria(catNombre)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectCategoria(catNombre);
                  }
                }}
              >
                {tieneSubs ? (
                  <button
                    type="button"
                    className="biblio-cat-tree__toggle"
                    onClick={(e) => toggleExpand(catNombre, e)}
                    aria-label={estaExpandida ? "Contraer subcategorías" : "Expandir subcategorías"}
                    aria-expanded={estaExpandida}
                  >
                    {estaExpandida ? (
                      <ChevronDown size={15} />
                    ) : (
                      <ChevronRight size={15} />
                    )}
                  </button>
                ) : (
                  <span className="biblio-cat-tree__spacer" />
                )}

                <span className="biblio-cat-tree__icon-wrap">
                  {estaExpandida ? <FolderOpen size={16} /> : <Folder size={16} />}
                </span>

                <span className="biblio-cat-tree__name" title={catNombre}>
                  <ST>{catNombre}</ST>
                </span>

                <span className="biblio-cat-tree__badge">{cat.count || 0}</span>
              </div>

              {/* Subcategorías desplegables */}
              {tieneSubs && estaExpandida && (
                <ul className="biblio-cat-tree__sublist">
                  {subs.map((sub) => {
                    const subNombre = sub.nombre || "";
                    const subActiva =
                      subcategoriaActiva.toLowerCase() === subNombre.toLowerCase();

                    return (
                      <li key={subNombre}>
                        <button
                          type="button"
                          className={`biblio-cat-tree__subitem ${
                            subActiva ? "biblio-cat-tree__subitem--activo" : ""
                          }`}
                          onClick={() => onSelectSubcategoria(catNombre, subNombre)}
                        >
                          <span className="biblio-cat-tree__bullet">•</span>
                          <span className="biblio-cat-tree__subname" title={subNombre}>
                            <ST>{subNombre}</ST>
                          </span>
                          <span className="biblio-cat-tree__badge">{sub.count || 0}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
