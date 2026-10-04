import { useState } from "react";
import {
  Check,
  Download,
  Eye,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Globe,
  Heart,
  Lock,
  Share2,
  User,
} from "lucide-react";
import { ST } from "../../../Components/T/ST";

function resolverIconoArchivo(nombre = "", mimeType = "") {
  const ext = (nombre.split(".").pop() || "").toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  if (ext === "pdf" || mime.includes("pdf")) {
    return { icon: FileText, colorClass: "icon--pdf", label: "PDF" };
  }
  if (["xls", "xlsx", "csv"].includes(ext) || mime.includes("sheet") || mime.includes("excel")) {
    return { icon: FileSpreadsheet, colorClass: "icon--excel", label: "Excel" };
  }
  if (["doc", "docx"].includes(ext) || mime.includes("word") || mime.includes("officedocument")) {
    return { icon: FileText, colorClass: "icon--word", label: "Word" };
  }
  if (["jpg", "jpeg", "png", "webp"].includes(ext) || mime.startsWith("image/")) {
    return { icon: FileImage, colorClass: "icon--image", label: "Imagen" };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext) || mime.includes("zip") || mime.includes("compressed")) {
    return { icon: FileArchive, colorClass: "icon--archive", label: "Comprimido" };
  }
  return { icon: FileCode, colorClass: "icon--default", label: ext.toUpperCase() || "Archivo" };
}

function formatearTamano(bytes = 0) {
  const b = Number(bytes);
  if (!b || isNaN(b)) return "0 KB";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function HighlightText({ text = "", highlight = "" }) {
  if (!highlight || !highlight.trim()) return text;
  const parts = String(text).split(new RegExp(`(${highlight.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="biblio-highlight">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function DocumentCard({
  documento,
  esLista = false,
  terminoBusqueda = "",
  esAdmin = false,
  usuario = null,
  esFavorito = false,
  onVisualizar,
  onDescargar,
  onVerDetalle,
  onToggleFavorito,
  onFiltrarEtiqueta,
}) {
  const [copiado, setCopiado] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const { icon: ArchivoIcon, colorClass, label: tipoLabel } = resolverIconoArchivo(
    documento.nombreOriginal || documento.NombreOriginal,
    documento.mimeType || documento.MimeType,
  );

  const handleDescargar = async (e) => {
    e.stopPropagation();
    try {
      setDescargando(true);
      await onDescargar?.(documento);
    } finally {
      setDescargando(false);
    }
  };

  const handleCompartir = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/repositorio?docId=${documento.id}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      });
    }
  };

  const anio = documento.anio || (documento.fechaPublicacion ? new Date(documento.fechaPublicacion).getFullYear() : 2026);
  const idiomaLabel = documento.idioma === "en" ? "EN" : "ES";

  return (
    <article
      className={`biblio-card ${esLista ? "biblio-card--list" : "biblio-card--grid"}`}
      tabIndex={0}
      onClick={() => onVerDetalle?.(documento)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onVerDetalle?.(documento);
      }}
      aria-label={`Documento ${documento.titulo}`}
    >
      {/* Zona Superior / Miniatura */}
      <div className="biblio-card__thumb-area">
        <div className={`biblio-card__thumb-placeholder ${colorClass}`}>
          <ArchivoIcon size={esLista ? 28 : 36} className="biblio-card__type-icon" />
          <span className="biblio-card__type-badge">{tipoLabel}</span>
        </div>

        {/* Badges superiores flotantes */}
        <div className="biblio-card__badges">
          {documento.categoria && (
            <span className="biblio-badge biblio-badge--cat">
              {documento.categoria}
            </span>
          )}
          {anio && (
            <span className="biblio-badge biblio-badge--year">{anio}</span>
          )}
          {esAdmin && documento.esPrivado && (
            <span className="biblio-badge biblio-badge--private" title="Solo visible para administradores">
              <Lock size={10} /> Privado
            </span>
          )}
        </div>

        {/* Botón de favorito flotante */}
        {usuario && onToggleFavorito && (
          <button
            type="button"
            className={`biblio-card__fav-btn ${esFavorito ? "biblio-card__fav-btn--active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorito(documento);
            }}
            title={esFavorito ? "Quitar de favoritos" : "Guardar en mis favoritos"}
            aria-label={esFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
          >
            <Heart size={16} fill={esFavorito ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      {/* Cuerpo del contenido */}
      <div className="biblio-card__body">
        {/* Metadatos secundarios */}
        <div className="biblio-card__meta-bar">
          <span className="biblio-card__meta-item" title="Idioma">
            <Globe size={12} />
            <span>{idiomaLabel}</span>
          </span>
          {documento.paginas ? (
            <>
              <span className="biblio-card__meta-sep">•</span>
              <span className="biblio-card__meta-item">
                <span>{documento.paginas} págs.</span>
              </span>
            </>
          ) : null}
        </div>

        {/* Título con resaltado */}
        <h3 className="biblio-card__title">
          <HighlightText text={documento.titulo} highlight={terminoBusqueda} />
        </h3>

        {/* Autor */}
        {documento.autor && (
          <div className="biblio-card__author" title={`Autor: ${documento.autor}`}>
            <User size={13} />
            <span>
              <HighlightText text={documento.autor} highlight={terminoBusqueda} />
            </span>
          </div>
        )}

        {/* Resumen / Descripción */}
        {documento.descripcion && (
          <p className="biblio-card__desc">
            <HighlightText
              text={documento.descripcion}
              highlight={terminoBusqueda}
            />
          </p>
        )}

        {/* Chips de Etiquetas */}
        {documento.etiquetas && documento.etiquetas.length > 0 && (
          <div className="biblio-card__tags">
            {documento.etiquetas.slice(0, 3).map((tag) => (
              <button
                key={tag}
                type="button"
                className="biblio-card__tag"
                onClick={(e) => {
                  e.stopPropagation();
                  onFiltrarEtiqueta?.(tag);
                }}
                title={`Filtrar por etiqueta ${tag}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Métricas y estadísticas del documento */}
        <div className="biblio-card__metrics-bar">
          <span
            className="biblio-card__stat-item"
            title={`${documento.descargasCount || 0} descargas`}
          >
            <Download size={13} />
            <span>{documento.descargasCount || 0} <ST>descargas</ST></span>
          </span>
          <span className="biblio-card__meta-sep">•</span>
          <span
            className="biblio-card__stat-item"
            title={`${documento.vistasCount || 0} visualizaciones`}
          >
            <Eye size={13} />
            <span>{documento.vistasCount || 0} <ST>vistas</ST></span>
          </span>
        </div>

        {/* Barra de Acciones Principales: Visibles a primera vista */}
        <div className="biblio-card__actions-row">
          {/* Visualizar */}
          <button
            type="button"
            className="biblio-card__btn-view"
            onClick={(e) => {
              e.stopPropagation();
              onVisualizar?.(documento);
            }}
            title="Visualizar documento en pantalla"
          >
            <Eye size={15} />
            <span>
              <ST>Visualizar</ST>
            </span>
          </button>

          {/* Descargar */}
          <button
            type="button"
            className="biblio-card__btn-download"
            onClick={handleDescargar}
            disabled={descargando}
            title="Descargar archivo en su dispositivo"
          >
            <Download size={15} />
            <span>
              <ST>Descargar</ST>
            </span>
          </button>

          {/* Copiar enlace / Compartir */}
          <button
            type="button"
            className={`biblio-card__btn-share ${
              copiado ? "biblio-card__btn-share--copied" : ""
            }`}
            onClick={handleCompartir}
            title={copiado ? "¡Enlace copiado al portapapeles!" : "Copiar enlace del documento"}
            aria-label="Copiar enlace del documento"
          >
            {copiado ? <Check size={15} /> : <Share2 size={15} />}
          </button>
        </div>
      </div>
    </article>
  );
}
