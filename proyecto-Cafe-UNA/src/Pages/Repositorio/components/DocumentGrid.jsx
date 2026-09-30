import { FolderSearch, RotateCcw } from "lucide-react";
import { ST } from "../../../Components/T/ST";
import { DocumentCard } from "./DocumentCard";

export function DocumentGrid({
  documentos = [],
  cargando = false,
  terminoBusqueda = "",
  esAdmin = false,
  usuario = null,
  favoritosIds = new Set(),
  onVisualizar,
  onDescargar,
  onVerDetalle,
  onToggleFavorito,
  onFiltrarEtiqueta,
  onLimpiarFiltros,
}) {
  if (cargando) {
    return (
      <div className="biblio-grid" aria-busy="true" aria-label="Cargando documentos">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="biblio-card-skeleton">
            <div className="biblio-card-skeleton__thumb skeleton-shimmer" />
            <div className="biblio-card-skeleton__body">
              <div className="biblio-card-skeleton__line biblio-card-skeleton__line--sm skeleton-shimmer" />
              <div className="biblio-card-skeleton__line biblio-card-skeleton__line--lg skeleton-shimmer" />
              <div className="biblio-card-skeleton__line biblio-card-skeleton__line--md skeleton-shimmer" />
              <div className="biblio-card-skeleton__footer skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (documentos.length === 0) {
    return (
      <div className="biblio-empty-state" role="status">
        <div className="biblio-empty-state__icon">
          <FolderSearch size={48} />
        </div>
        <h3 className="biblio-empty-state__title">
          <ST>No se encontraron documentos</ST>
        </h3>
        <p className="biblio-empty-state__desc">
          <ST>
            Intenta ajustar los filtros aplicados o realiza una búsqueda con otros términos.
          </ST>
        </p>
        {onLimpiarFiltros && (
          <button
            type="button"
            className="biblio-btn biblio-btn--primary"
            onClick={onLimpiarFiltros}
          >
            <RotateCcw size={15} />
            <span>
              <ST>Restablecer todos los filtros</ST>
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="biblio-grid" role="region" aria-label="Catálogo de documentos en cuadrícula">
      {documentos.map((doc) => (
        <DocumentCard
          key={doc.id}
          documento={doc}
          esLista={false}
          terminoBusqueda={terminoBusqueda}
          esAdmin={esAdmin}
          usuario={usuario}
          esFavorito={favoritosIds.has(String(doc.id))}
          onVisualizar={onVisualizar}
          onDescargar={onDescargar}
          onVerDetalle={onVerDetalle}
          onToggleFavorito={onToggleFavorito}
          onFiltrarEtiqueta={onFiltrarEtiqueta}
        />
      ))}
    </div>
  );
}
