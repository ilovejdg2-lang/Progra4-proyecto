import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  ExternalLink,
  Eye,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  Lock,
  Maximize2,
  Minimize2,
  Unlock,
  X,
} from "lucide-react";
import {
  descargarArchivo,
  obtenerUrlVisualizarDocumento,
} from "../../services/documentosService";
import { ST } from "../../Components/T/ST";
import "./Repositorio.css";

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

export function VisualizarDocumentoModal({ documento, onClose }) {
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  if (!documento) return null;

  const urlVisualizar = obtenerUrlVisualizarDocumento(documento.id);
  const ext = (documento.nombreOriginal?.split(".").pop() || "").toLowerCase();
  const mime = (documento.mimeType || "").toLowerCase();

  const esPdf = ext === "pdf" || mime.includes("pdf");
  const esImagen = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext) || mime.startsWith("image/");
  const iconInfo = resolverIconoArchivo(documento.nombreOriginal, documento.mimeType);
  const IconDoc = iconInfo.icon;

  const handleDescargar = async () => {
    try {
      setDescargando(true);
      await descargarArchivo(documento.id, documento.nombreOriginal || `${documento.titulo}.pdf`);
    } catch (err) {
      alert(err?.message || "No se pudo descargar el archivo.");
    } finally {
      setDescargando(false);
    }
  };

  const handleAbrirNuevaPestana = () => {
    window.open(urlVisualizar, "_blank", "noopener,noreferrer");
  };

  return createPortal(
    <div
      className="repositorio-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className={`repositorio-viewer-container ${pantallaCompleta ? "repositorio-viewer--fullscreen" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Visor */}
        <div className="repositorio-viewer-header">
          <div className="repositorio-viewer-header__info">
            <div className={`doc-cell-icon ${iconInfo.colorClass}`}>
              <IconDoc size={20} />
            </div>
            <div className="repositorio-viewer-header__texts">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge-categoria-cell">
                  {documento.categoria || "General"}
                  {documento.subcategoria ? ` / ${documento.subcategoria}` : ""}
                </span>
                {documento.esPrivado ? (
                  <span className="badge-priv-cell badge-priv-cell--priv">
                    <Lock size={12} />
                    <span>Privado</span>
                  </span>
                ) : (
                  <span className="badge-priv-cell badge-priv-cell--pub">
                    <Unlock size={12} />
                    <span>Público</span>
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {formatearTamano(documento.tamanoBytes)} • v{documento.version || "1.0"}
                </span>
              </div>
              <h3 className="repositorio-viewer-title" title={documento.titulo}>
                {documento.titulo}
              </h3>
            </div>
          </div>

          <div className="repositorio-viewer-actions">
            <button
              type="button"
              className="btn-visor-action"
              title="Abrir en pestaña nueva"
              onClick={handleAbrirNuevaPestana}
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline"><ST>Nueva pestaña</ST></span>
            </button>

            <button
              type="button"
              className="btn-visor-action btn-visor-action--primary"
              title="Descargar archivo"
              onClick={handleDescargar}
              disabled={descargando}
            >
              <Download size={16} />
              <span>{descargando ? <ST>Descargando...</ST> : <ST>Descargar</ST>}</span>
            </button>

            <button
              type="button"
              className="btn-visor-action btn-visor-action--icon-only"
              title={pantallaCompleta ? "Restaurar tamaño" : "Pantalla completa"}
              onClick={() => setPantallaCompleta((prev) => !prev)}
            >
              {pantallaCompleta ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              type="button"
              className="repositorio-modal-close"
              title="Cerrar visor"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Visor */}
        <div className="repositorio-viewer-body">
          {esPdf ? (
            <iframe
              src={urlVisualizar}
              title={documento.titulo}
              className="repositorio-viewer-iframe"
            />
          ) : esImagen ? (
            <div className="repositorio-viewer-image-wrap">
              <img
                src={urlVisualizar}
                alt={documento.titulo}
                className="repositorio-viewer-img"
              />
            </div>
          ) : (
            <div className="repositorio-viewer-fallback">
              <div className={`repositorio-viewer-fallback__icon ${iconInfo.colorClass}`}>
                <IconDoc size={56} />
              </div>
              <h4>{documento.nombreOriginal || documento.titulo}</h4>
              <p>
                <ST>
                  Este formato de archivo ({iconInfo.label}) no admite previsualización interactiva dentro del navegador. Puede descargarlo directamente en su equipo para examinarlo.
                </ST>
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  className="btn-primario-admin"
                  onClick={handleDescargar}
                  disabled={descargando}
                >
                  <Download size={16} />
                  <span><ST>Descargar archivo ahora</ST></span>
                </button>
                <button
                  type="button"
                  className="btn-secundario-admin"
                  onClick={handleAbrirNuevaPestana}
                >
                  <ExternalLink size={16} />
                  <span><ST>Intentar abrir externamente</ST></span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
