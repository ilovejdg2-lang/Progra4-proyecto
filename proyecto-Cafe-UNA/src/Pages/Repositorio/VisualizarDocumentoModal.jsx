import { useState, useId } from "react";
import { createPortal } from "react-dom";
import { Download, ExternalLink, Lock, Maximize2, Minimize2, X } from "lucide-react";
import { descargarArchivo, obtenerUrlVisualizarDocumento } from "../../services/documentosService";
import { ModalDialog } from "../../Components/ui/ModalDialog";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useTraducir } from "../../hooks/useTraducir";
import { ST } from "../../Components/T/ST";
import { etiquetaTipoArchivo } from "./repositorioLogic";
import "./VisualizarDocumentoModal.css";

/**
 * Viewer shared by the public Repositorio and the admin document screens.
 * `onSolicitarAcceso` (public only): when the document is private, the primary action
 * asks for access instead of downloading.
 */
export function VisualizarDocumentoModal({ documento, onClose, onSolicitarAcceso }) {
  const modalTitleId = useId();
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState("");

  const tCerrar = useTraducir("Cerrar visor");
  const tCompleta = useTraducir("Pantalla completa");
  const tRestaurar = useTraducir("Restaurar tamaño");

  useBodyScrollLock(Boolean(documento));

  if (!documento) return null;

  const urlVisualizar = obtenerUrlVisualizarDocumento(documento.id);
  const ext = (documento.nombreOriginal?.split(".").pop() || "").toLowerCase();
  const mime = (documento.mimeType || "").toLowerCase();
  const esPdf = ext === "pdf" || mime.includes("pdf");
  const esImagen = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext) || mime.startsWith("image/");
  const etiquetaTipo = etiquetaTipoArchivo(documento);
  const requiereSolicitud = Boolean(documento.esPrivado && onSolicitarAcceso);

  const accionPrincipal = async () => {
    if (requiereSolicitud) {
      onSolicitarAcceso(documento);
      return;
    }
    try {
      setDescargando(true);
      setErrorDescarga("");
      await descargarArchivo(documento.id, documento.nombreOriginal || `${documento.titulo}.pdf`);
    } catch (err) {
      setErrorDescarga(err?.message || "No se pudo descargar el archivo.");
    } finally {
      setDescargando(false);
    }
  };

  const abrirNuevaPestana = () => window.open(urlVisualizar, "_blank", "noopener,noreferrer");

  const textoPrincipal = requiereSolicitud ? (
    <ST>Solicitar acceso</ST>
  ) : descargando ? (
    <ST>Descargando...</ST>
  ) : (
    <ST>Descargar</ST>
  );

  const acciones = (
    <>
      <button type="button" className="pub-btn pub-btn--secondary" onClick={abrirNuevaPestana}>
        <ExternalLink size={16} aria-hidden="true" />
        <ST>Abrir en pestaña nueva</ST>
      </button>
      <button type="button" className="pub-btn pub-btn--primary" onClick={accionPrincipal} disabled={descargando}>
        {requiereSolicitud ? <Lock size={16} aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
        {textoPrincipal}
      </button>
    </>
  );

  const sinVistaPrevia = (
    <div className="viewer-fallback">
      <span className="viewer-fallback__tile" aria-hidden="true">
        {etiquetaTipo}
      </span>
      <h3 className="viewer-fallback__name">{documento.nombreOriginal || documento.titulo}</h3>
      <p>
        <ST>
          {errorCarga
            ? "No se pudo cargar la vista previa del documento. Puedes descargarlo para verlo en tu equipo."
            : "Este formato no se puede previsualizar en el navegador. Puedes descargarlo para verlo en tu equipo."}
        </ST>
      </p>
    </div>
  );

  const meta = [documento.categoria, documento.version ? `v${documento.version}` : ""].filter(Boolean);

  return createPortal(
    <ModalDialog className="pub-dialog-overlay" labelledBy={modalTitleId} onClose={onClose}>
      <div
        className={`pub-dialog pub-dialog--wide${pantallaCompleta ? " pub-dialog--full" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pub-dialog__header viewer-header">
          <div className="viewer-header__text">
            <h2 id={modalTitleId} className="pub-serif-title pub-dialog__title viewer-header__title">
              {documento.titulo}
            </h2>
            <p className="pub-dialog__lead">
              {documento.esPrivado ? (
                <span className="viewer-private">
                  <Lock size={13} aria-hidden="true" />
                  <ST>Privado</ST>
                  {" · "}
                </span>
              ) : null}
              {meta.join(" · ")}
            </p>
          </div>
          <div className="viewer-header__actions">
            <span className="viewer-header__buttons">{acciones}</span>
            <button
              type="button"
              className="pub-dialog-close viewer-header__fullscreen"
              aria-label={pantallaCompleta ? tRestaurar : tCompleta}
              onClick={() => setPantallaCompleta((prev) => !prev)}
            >
              {pantallaCompleta ? <Minimize2 size={18} aria-hidden="true" /> : <Maximize2 size={18} aria-hidden="true" />}
            </button>
            <button type="button" className="pub-dialog-close" aria-label={tCerrar} onClick={onClose}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {errorDescarga ? (
          <div className="viewer-error">
            <div className="pub-alert" role="alert">
              <ST>{errorDescarga}</ST>
            </div>
          </div>
        ) : null}

        <div className="viewer-body">
          {errorCarga ? (
            sinVistaPrevia
          ) : esPdf ? (
            <iframe
              src={urlVisualizar}
              title={documento.titulo}
              className="viewer-frame"
              onError={() => setErrorCarga(true)}
            />
          ) : esImagen ? (
            <div className="viewer-image-wrap">
              <img
                src={urlVisualizar}
                alt={documento.titulo}
                className="viewer-image"
                onError={() => setErrorCarga(true)}
              />
            </div>
          ) : (
            sinVistaPrevia
          )}
        </div>
      </div>
    </ModalDialog>,
    document.body,
  );
}
