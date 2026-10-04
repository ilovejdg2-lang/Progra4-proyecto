import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Layers } from "lucide-react";
import { ST } from "../../../Components/T/ST";

function claveNormalizada(str = "") {
  return String(str || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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
    const map = {};
    if (categoriaActiva && categoriaActiva !== "todas") {
      map[claveNormalizada(categoriaActiva)] = true;
    }
    return map;
  });

  // Auto-expandir categoría cuando pasa a ser activa
  useEffect(() => {
    if (categoriaActiva && categoriaActiva !== "todas") {
      setExpandidas((prev) => ({
        ...prev,
        [claveNormalizada(categoriaActiva)]: true,
      }));
    }
  }, [categoriaActiva]);

  const toggleExpand = (catNombre, e) => {
    e.stopPropagation();
    const key = claveNormalizada(catNombre);
    setExpandidas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Agrupar subcategorías por categoría padre con clave normalizada
  const subcategoriasPorPadre = useMemo(() => {
    const map = new Map();
    (subcategorias || []).forEach((sub) => {
      const padreKey = claveNormalizada(sub.categoria || "");
      if (padreKey) {
        if (!map.has(padreKey)) map.set(padreKey, []);
        map.get(padreKey).push(sub);
      }
    });
    return map;
  }, [subcategorias]);

  const normCatActiva = claveNormalizada(categoriaActiva);
  const normSubActiva = claveNormalizada(subcategoriaActiva);

  return (
    <nav className="biblio-cat-tree" aria-label="Navegación por categorías">
      {/* Opción Todas */}
      <button
        type="button"
        className={`biblio-cat-tree__item ${
          normCatActiva === "todas" || !categoriaActiva ? "biblio-cat-tree__item--activo" : ""
        }`}
        onClick={(e) => {
          e.preventDefault();
          onSelectCategoria("todas");
        }}
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
          if (!catNombre) return null;
          const catKey = claveNormalizada(catNombre);
          const subs = subcategoriasPorPadre.get(catKey) || [];
          const tieneSubs = subs.length > 0;
          const estaExpandida = Boolean(expandidas[catKey]);
          const esActiva = normCatActiva === catKey && !normSubActiva;
          const docCount = Number(cat.count ?? cat.usos ?? cat.Usos ?? 0);

          return (
            <li key={catKey} className="biblio-cat-tree__node">
              <div
                className={`biblio-cat-tree__item ${
                  esActiva ? "biblio-cat-tree__item--activo" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectCategoria(catNombre);
                }}
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

                <span className="biblio-cat-tree__badge">{docCount}</span>
              </div>

              {/* Subcategorías desplegables */}
              {tieneSubs && estaExpandida && (
                <ul className="biblio-cat-tree__sublist">
                  {subs.map((sub) => {
                    const subNombre = sub.nombre || "";
                    if (!subNombre) return null;
                    const subKey = claveNormalizada(subNombre);
                    const subActiva = normSubActiva === subKey && normCatActiva === catKey;
                    const subDocCount = Number(sub.count ?? sub.usos ?? sub.Usos ?? 0);

                    return (
                      <li key={subKey}>
                        <button
                          type="button"
                          className={`biblio-cat-tree__subitem ${
                            subActiva ? "biblio-cat-tree__subitem--activo" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectSubcategoria(catNombre, subNombre);
                          }}
                        >
                          <span className="biblio-cat-tree__bullet">•</span>
                          <span className="biblio-cat-tree__subname" title={subNombre}>
                            <ST>{subNombre}</ST>
                          </span>
                          <span className="biblio-cat-tree__badge">{subDocCount}</span>
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
