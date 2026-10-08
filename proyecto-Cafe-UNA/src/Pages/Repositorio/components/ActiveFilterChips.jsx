import { RotateCcw, X } from "lucide-react";
import { ST } from "../../../Components/T/ST";

export function ActiveFilterChips({
  filtros = {},
  onEliminarFiltro,
  onLimpiarTodos,
}) {
  const chips = [];

  // Búsqueda
  if (filtros.buscar) {
    chips.push({
      id: "buscar",
      label: `Búsqueda: "${filtros.buscar}"`,
      onRemove: () => onEliminarFiltro("buscar", ""),
    });
  }

  // Mi Biblioteca
  if (filtros.miBiblioteca) {
    const labels = {
      favoritos: "Mis Favoritos",
      leer_mas_tarde: "Leer más tarde",
      historial: "Historial de vistos",
    };
    chips.push({
      id: "miBiblioteca",
      label: `Biblioteca: ${labels[filtros.miBiblioteca] || filtros.miBiblioteca}`,
      onRemove: () => onEliminarFiltro("miBiblioteca", ""),
    });
  }

  // Acceso rápido
  if (filtros.accesoRapido && filtros.accesoRapido !== "todos") {
    const labels = {
      novedades: "Novedades",
      populares: "Más descargados",
      destacados: "Destacados",
    };
    chips.push({
      id: "accesoRapido",
      label: labels[filtros.accesoRapido] || filtros.accesoRapido,
      onRemove: () => onEliminarFiltro("accesoRapido", "todos"),
    });
  }

  // Categoría
  if (filtros.categoria && filtros.categoria !== "todas") {
    chips.push({
      id: "categoria",
      label: `Categoría: ${filtros.categoria}`,
      onRemove: () => {
        onEliminarFiltro("categoria", "todas");
        onEliminarFiltro("subcategoria", "");
      },
    });
  }

  // Subcategoría
  if (filtros.subcategoria) {
    chips.push({
      id: "subcategoria",
      label: `Subcategoría: ${filtros.subcategoria}`,
      onRemove: () => onEliminarFiltro("subcategoria", ""),
    });
  }

  // Años
  if (filtros.anioDesde || filtros.anioHasta) {
    const desde = filtros.anioDesde || "...";
    const hasta = filtros.anioHasta || "...";
    chips.push({
      id: "anio",
      label: `Año: ${desde} - ${hasta}`,
      onRemove: () => {
        onEliminarFiltro("anioDesde", "");
        onEliminarFiltro("anioHasta", "");
      },
    });
  }

  // Tipo de archivo
  if (filtros.tipoArchivo && filtros.tipoArchivo !== "todos") {
    chips.push({
      id: "tipoArchivo",
      label: `Tipo: ${filtros.tipoArchivo.toUpperCase()}`,
      onRemove: () => onEliminarFiltro("tipoArchivo", "todos"),
    });
  }

  // Autor
  if (filtros.autor) {
    chips.push({
      id: "autor",
      label: `Autor: ${filtros.autor}`,
      onRemove: () => onEliminarFiltro("autor", ""),
    });
  }

  // Idioma
  if (filtros.idioma && filtros.idioma !== "todos") {
    chips.push({
      id: "idioma",
      label: `Idioma: ${filtros.idioma === "es" ? "Español" : "English"}`,
      onRemove: () => onEliminarFiltro("idioma", "todos"),
    });
  }

  // Etiquetas individuales
  if (filtros.etiquetas) {
    const tags = filtros.etiquetas.split(",").map((t) => t.trim()).filter(Boolean);
    tags.forEach((tag) => {
      chips.push({
        id: `tag-${tag}`,
        label: `#${tag}`,
        onRemove: () => {
          const restantes = tags.filter((t) => t.toLowerCase() !== tag.toLowerCase());
          onEliminarFiltro("etiquetas", restantes.join(","));
        },
      });
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="biblio-active-chips" aria-label="Filtros aplicados">
      <div className="biblio-active-chips__list">
        {chips.map((chip) => (
          <span key={chip.id} className="biblio-active-chip">
            <span className="biblio-active-chip__label"><ST>{chip.label}</ST></span>
            <button
              type="button"
              className="biblio-active-chip__remove"
              onClick={chip.onRemove}
              aria-label={`Eliminar filtro ${chip.label}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {chips.length > 1 && (
          <button
            type="button"
            className="biblio-active-chips__clear-all"
            onClick={onLimpiarTodos}
          >
            <RotateCcw size={12} />
            <span>
              <ST>Limpiar todos</ST>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
