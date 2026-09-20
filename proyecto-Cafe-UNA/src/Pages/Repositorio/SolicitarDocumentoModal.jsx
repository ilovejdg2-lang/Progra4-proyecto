import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  FileLock2,
  FileText,
  FolderOpen,
  Mail,
  Send,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import {
  obtenerCategoriasDocumentos,
  solicitarAccesoDocumento,
} from "../../services/documentosService";
import { getActiveSessionUser } from "../../services/sessionService";
import { useTraducir } from "../../hooks/useTraducir";
import { ST } from "../../Components/T/ST";
import "../Voluntariado/SolicitarVoluntariado.css";
import "./Repositorio.css";

function formatearTamano(bytes = 0) {
  const b = Number(bytes);
  if (!b || isNaN(b)) return "0 KB";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function SolicitarDocumentoModal({ documento = null, onClose, onSuccess }) {
  const user = getActiveSessionUser();
  const esDocumentoEspecifico = Boolean(documento && (documento.id || documento.titulo));
  const fileInputRef = useRef(null);

  const [categorias, setCategorias] = useState([]);
  const [titulo, setTitulo] = useState(documento?.titulo || "");
  const [categoria, setCategoria] = useState(documento?.categoria || "");
  const [autor, setAutor] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nombre, setNombre] = useState(user?.name || user?.username || "");
  const [correo, setCorreo] = useState(user?.email || user?.correo || "");
  const [institucion, setInstitucion] = useState("");
  const [archivo, setArchivo] = useState(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [completado, setCompletado] = useState(false);

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

  useEffect(() => {
    obtenerCategoriasDocumentos()
      .then((cats) => setCategorias(cats))
      .catch(() => setCategorias([]));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        setError("El archivo supera el tamaño máximo permitido (30 MB).");
        return;
      }
      setArchivo(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const tituloFinal = esDocumentoEspecifico
      ? (documento?.titulo || "Documento institucional")
      : titulo.trim();

    if (!tituloFinal) {
      setError("Por favor indique el título del documento.");
      return;
    }
    if (!nombre.trim()) {
      setError("Por favor ingrese su nombre completo.");
      return;
    }
    if (!correo.trim() || !correo.includes("@")) {
      setError("Por favor ingrese un correo electrónico válido.");
      return;
    }
    if (!descripcion.trim() && !archivo) {
      setError("Por favor detalle una descripción o adjunte un archivo.");
      return;
    }

    try {
      setEnviando(true);
      const fd = new FormData();
      if (documento?.id) fd.append("documentoId", documento.id);
      fd.append("documentoTitulo", tituloFinal);
      fd.append("nombre", nombre.trim());
      fd.append("correo", correo.trim().toLowerCase());
      fd.append("institucion", institucion.trim() || autor.trim());
      fd.append("motivo", descripcion.trim() || `Propuesta de documento: ${tituloFinal}`);
      fd.append("categoria", categoria.trim() || (documento?.categoria || "Investigaciones"));

      if (archivo) {
        fd.append("archivo", archivo);
      }

      await solicitarAccesoDocumento(fd);
      setCompletado(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error al enviar documento/solicitud:", err);
      setError(
        err?.message || "Ocurrió un error al enviar el archivo. Intente nuevamente.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div
      className="repositorio-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-solicitud-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className="repositorio-modal-container max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="repositorio-modal-header">
          <div className="repositorio-modal-header__title-group">
            <span className="badge--repositorio-modal">
              <UploadCloud size={15} />
              <ST>
                {esDocumentoEspecifico
                  ? "Solicitud de Documento"
                  : "Aporte al Repositorio Institucional"}
              </ST>
            </span>
            <h3 id="modal-solicitud-titulo">
              <ST>
                {esDocumentoEspecifico
                  ? "Solicitar Acceso al Documento"
                  : "Enviar y Proponer Archivo para Publicación"}
              </ST>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <ST>
                {esDocumentoEspecifico
                  ? "Complete sus datos para solicitar autorización de descarga a este documento."
                  : "Envíe su investigación, guía o informe. El equipo administrativo revisará su archivo para publicarlo en la página principal y el repositorio."}
              </ST>
            </p>
          </div>
          <button
            type="button"
            className="repositorio-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {completado ? (
          <div className="repositorio-modal-success p-6 text-center">
            <div className="repositorio-modal-success__icon mb-3">
              <CheckCircle2 size={56} className="text-emerald-500 mx-auto" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              <ST>¡Documento enviado con éxito!</ST>
            </h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              <ST>
                Su archivo y datos han sido registrados correctamente. El equipo de administración revisará la propuesta para aprobarla y hacerla visible en el catálogo principal de documentación.
              </ST>
            </p>
            <button
              type="button"
              className="btn-primario-admin mx-auto"
              onClick={onClose}
            >
              <ST>Entendido</ST>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="repositorio-modal-form">
            {/* Paso 1: Información del Documento */}
            <div className="section-card">
              <div className="section-card__header">
                <span className="section-card__paso" aria-hidden="true">1</span>
                <h4><ST>Detalles del Documento</ST></h4>
              </div>
              <div className="section-card__body grid-dos-columnas">
                <div className="campo-grupo columna-completa">
                  <label htmlFor="sol-doc-titulo">
                    <ST>Título o tema del documento</ST> <span className="campo-requerido">*</span>
                  </label>
                  <input
                    id="sol-doc-titulo"
                    type="text"
                    required
                    disabled={esDocumentoEspecifico}
                    placeholder="Ej. Estudio de Microcuencas y Rendimiento Cafetalero 2026"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>

                <div className="campo-grupo">
                  <label htmlFor="sol-doc-categoria">
                    <ST>Categoría sugerida</ST>
                  </label>
                  <select
                    id="sol-doc-categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    <option value="">Seleccione una categoría</option>
                    {categorias
                      .filter((c) => !(c.padre || c.Padre))
                      .map((c) => {
                        const nombre = c.nombre || c.Nombre || "";
                        return (
                          <option key={c.id || c.Id || nombre} value={nombre}>
                            {nombre}
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div className="campo-grupo">
                  <label htmlFor="sol-doc-autor">
                    <ST>Autor / Institución de origen</ST>
                  </label>
                  <input
                    id="sol-doc-autor"
                    type="text"
                    placeholder="Ej. Universidad Nacional / Investigador"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                  />
                </div>

                <div className="campo-grupo columna-completa">
                  <label htmlFor="sol-doc-desc">
                    <ST>Descripción o Justificación del aporte</ST>
                  </label>
                  <textarea
                    id="sol-doc-desc"
                    rows={3}
                    placeholder="Resuma brevemente los contenidos o motivos para incluir este material en el repositorio..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Paso 2: Archivo Digital Adjunto */}
            <div className="section-card">
              <div className="section-card__header">
                <span className="section-card__paso" aria-hidden="true">2</span>
                <h4><ST>Archivo Digital a Enviar</ST></h4>
              </div>
              <div className="section-card__body">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.jpg,.png"
                  onChange={handleFileChange}
                />

                <div
                  className="dropzone-doc cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={36} className="text-slate-400 mb-2" />
                  {archivo ? (
                    <div>
                      <span className="block font-semibold text-sm text-slate-900">
                        {archivo.name}
                      </span>
                      <span className="block text-xs text-emerald-600 mt-0.5">
                        {formatearTamano(archivo.size)} • Listo para subir y enviar
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="block font-semibold text-sm text-slate-800">
                        Haga clic aquí para seleccionar el archivo a proponer
                      </span>
                      <span className="block text-xs text-slate-400 mt-1">
                        Formatos recomendados: PDF, Word, Excel, ZIP, Imágenes (hasta 30 MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Paso 3: Contacto del Remitente */}
            <div className="section-card">
              <div className="section-card__header">
                <span className="section-card__paso" aria-hidden="true">3</span>
                <h4><ST>Datos de Contacto del Remitente</ST></h4>
              </div>
              <div className="section-card__body grid-dos-columnas">
                <div className="campo-grupo">
                  <label htmlFor="sol-remitente-nombre">
                    <ST>Nombre completo</ST> <span className="campo-requerido">*</span>
                  </label>
                  <input
                    id="sol-remitente-nombre"
                    type="text"
                    required
                    placeholder="Ej. Carlos Rodríguez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div className="campo-grupo">
                  <label htmlFor="sol-remitente-correo">
                    <ST>Correo electrónico</ST> <span className="campo-requerido">*</span>
                  </label>
                  <input
                    id="sol-remitente-correo"
                    type="email"
                    required
                    placeholder="carlos@ejemplo.com"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                </div>

                <div className="campo-grupo columna-completa">
                  <label htmlFor="sol-remitente-inst">
                    <ST>Organización o Afiliación (opcional)</ST>
                  </label>
                  <input
                    id="sol-remitente-inst"
                    type="text"
                    placeholder="Ej. Cooperativa de Caficultores / Estudiante UNA"
                    value={institucion}
                    onChange={(e) => setInstitucion(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error ? (
              <div className="aviso-error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="repositorio-modal-actions">
              <button
                type="button"
                className="btn-secundario-admin"
                onClick={onClose}
                disabled={enviando}
              >
                <ST>Cancelar</ST>
              </button>
              <button
                type="submit"
                className="btn-primario-admin"
                disabled={enviando}
              >
                {enviando ? (
                  <>
                    <span className="spinner-sm" aria-hidden="true" />
                    <ST>Enviando archivo...</ST>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <ST>Enviar archivo para revisión</ST>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
