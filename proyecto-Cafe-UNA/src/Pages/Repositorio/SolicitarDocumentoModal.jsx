import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Lock,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import {
  obtenerCategoriasDocumentos,
  solicitarAccesoDocumento,
} from "../../services/documentosService";
import { getActiveSessionUser } from "../../services/sessionService";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { esCorreoValido, limpiarCorreo, MENSAJE_CORREO_INVALIDO } from "../../lib/correo";
import { ST } from "../../Components/T/ST";
import { useTraducir } from "../../hooks/useTraducir";
import { SelectFiltro } from "../../Components/ui/SelectFiltro";
import "../Admin/Documentacion/Documentos.css";
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

  const tPhTitulo = useTraducir("Ej. Estudio de Microcuencas y Rendimiento Cafetalero 2026");
  const tPhAutor = useTraducir("Ej. Universidad Nacional / Investigador");
  const tPhDescripcion = useTraducir("Resuma brevemente los contenidos o motivos para incluir este material en el repositorio...");
  const tPhPalabras = useTraducir("investigación, caficultura, calidad, suelo");
  const tPhNombre = useTraducir("Ej. Carlos Rodríguez");
  const tPhInstitucion = useTraducir("Ej. Cooperativa de Caficultores / Estudiante UNA");

  // Lista de categorías obtenidas del backend
  const [categorias, setCategorias] = useState([]);

  // Campos principales del documento (espejo del formulario administrativo)
  const [titulo, setTitulo] = useState(documento?.titulo || "");
  const [autor, setAutor] = useState(
    user?.name || user?.username || "Proyecto Café-UNA",
  );
  const [version, setVersion] = useState("1.0");
  const [categoria, setCategoria] = useState(documento?.categoria || "");
  const [subcategoria, setSubcategoria] = useState(documento?.subcategoria || "");
  const [descripcion, setDescripcion] = useState(documento?.descripcion || "");
  const [palabrasClave, setPalabrasClave] = useState("");

  // Datos del remitente
  const [nombre, setNombre] = useState(user?.name || user?.username || "");
  const [correo, setCorreo] = useState(user?.email || user?.correo || "");
  const [institucion, setInstitucion] = useState("");

  // Archivo adjunto
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);

  // Estados de control
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [completado, setCompletado] = useState(false);

  useBodyScrollLock(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose && !enviando) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, enviando]);

  useEffect(() => {
    obtenerCategoriasDocumentos()
      .then((cats) => {
        setCategorias(Array.isArray(cats) ? cats : []);
        if (!categoria && Array.isArray(cats) && cats.length > 0) {
          const primerRaiz = cats.find((c) => !(c.padre || c.Padre));
          if (primerRaiz) {
            setCategoria(primerRaiz.nombre || primerRaiz.Nombre || "");
          }
        }
      })
      .catch(() => setCategorias([]));
  }, []);

  // Subcategorías dinámicas filtradas por la categoría elegida
  const subcategoriasDisponibles = useMemo(() => {
    if (!categoria) return [];
    const catNorm = categoria.trim().toLowerCase();
    return categorias.filter((c) => {
      const padre = String(c.padre || c.Padre || "").trim().toLowerCase();
      return padre === catNorm;
    });
  }, [categoria, categorias]);

  const procesarArchivo = (file) => {
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      setError("El archivo supera el tamaño máximo permitido (30 MB).");
      return;
    }
    setArchivo(file);
    setError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    procesarArchivo(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);
    const file = e.dataTransfer.files?.[0];
    procesarArchivo(file);
  };

  const handleRemoverArchivo = (e) => {
    e.stopPropagation();
    setArchivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
    if (!esCorreoValido(correo)) {
      setError(MENSAJE_CORREO_INVALIDO);
      return;
    }
    if (!descripcion.trim() && !archivo) {
      setError("Por favor detalle una descripción o adjunte un archivo para continuar.");
      return;
    }

    try {
      setEnviando(true);
      const fd = new FormData();

      if (documento?.id) {
        fd.append("documentoId", String(documento.id));
      }
      fd.append("documentoTitulo", tituloFinal);
      fd.append("nombre", nombre.trim());
      fd.append("correo", correo.trim().toLowerCase());
      fd.append("institucion", institucion.trim());
      fd.append("autor", autor.trim() || nombre.trim());
      fd.append("version", version.trim() || "1.0");
      fd.append("categoria", categoria.trim() || "Investigaciones");
      fd.append("subcategoria", subcategoria.trim());
      fd.append("palabrasClave", palabrasClave.trim());
      fd.append("motivo", descripcion.trim() || `Envío de documento: ${tituloFinal}`);
      // Regla estricta: los archivos aportados se suben por defecto en privado
      fd.append("esPrivado", "true");

      if (archivo) {
        fd.append("archivo", archivo);
      }

      await solicitarAccesoDocumento(fd);
      setCompletado(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error al enviar documento:", err);
      const msg = err?.message || "";
      if (msg.includes("violates not-null constraint") || msg.includes("DocumentoId")) {
        setError("Error en los datos de la solicitud. Por favor verifique el formulario e intente nuevamente.");
      } else {
        setError(msg || "Ocurrió un error al enviar el archivo. Por favor intente nuevamente.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-solicitud-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose && !enviando) onClose();
      }}
    >
      <div
        className="admin-form-modal-container max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        {/* Cabecera del Modal */}
        <div className="admin-form-modal-header" style={{ flexShrink: 0 }}>
          <div className="admin-form-modal-header__title">
            <span className="badge--admin-docs">
              <UploadCloud size={14} className="mr-1" />
              <ST>
                {esDocumentoEspecifico
                  ? "Solicitud de Acceso"
                  : "Envío al Repositorio Institucional"}
              </ST>
            </span>
            <h3 id="modal-solicitud-titulo">
              <ST>
                {esDocumentoEspecifico
                  ? "Solicitar Acceso al Documento"
                  : "Enviar Documento para Publicación"}
              </ST>
            </h3>
            <p className="admin-form-helper text-slate-500 mt-1">
              <ST>
                {esDocumentoEspecifico
                  ? "Complete sus datos para solicitar autorización de consulta a este documento privado."
                  : "Complete los detalles del material para la revisión y custodia administrativa en el repositorio de Café-UNA."}
              </ST>
            </p>
          </div>
          <button
            type="button"
            className="admin-form-modal-close"
            onClick={onClose}
            disabled={enviando}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        {completado ? (
          <div
            className="admin-form-modal-body p-8 text-center"
            style={{ overflowY: "auto", flex: "1 1 auto", minHeight: 0 }}
          >
            <div className="mb-4">
              <CheckCircle2 size={58} className="text-emerald-500 mx-auto" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">
              <ST>¡Documento enviado con éxito!</ST>
            </h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-2 leading-relaxed">
              <ST>
                Su archivo y datos se han registrado de manera segura. El documento ingresa en estado{" "}
                <strong className="text-slate-900">Privado</strong> para control y revisión del equipo administrativo.
              </ST>
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              <ST>
                No será visible en la página principal ni en el catálogo público hasta contar con la debida aprobación institucional.
              </ST>
            </p>
            <button
              type="button"
              className="btn-primario-admin mx-auto"
              onClick={onClose}
            >
              <ST>Aceptar y Cerrar</ST>
            </button>
          </div>
        ) : (
          <form
            id="form-solicitar-documento"
            onSubmit={handleSubmit}
            className="admin-form-modal-form"
            style={{
              display: "flex",
              flexDirection: "column",
              flex: "1 1 auto",
              minHeight: 0,
              overflow: "hidden",
              margin: 0,
            }}
          >
            <div
              className="admin-form-modal-body admin-form-grid"
              style={{
                overflowY: "auto",
                flex: "1 1 auto",
                minHeight: 0,
                padding: "20px 24px",
              }}
            >
              {/* Pregunta 1: Título del documento */}
              <div className="admin-form-group">
                <label htmlFor="sol-doc-titulo" className="admin-form-label">
                  <ST>¿Cuál es el título o tema del documento?</ST>{" "}
                  <span className="campo-requerido">*</span>
                </label>
                <p className="admin-form-helper">
                  <ST>Indique un título descriptivo y claro para el repositorio.</ST>
                </p>
                <input
                  id="sol-doc-titulo"
                  type="text"
                  required
                  disabled={esDocumentoEspecifico}
                  className="admin-form-input"
                  placeholder={tPhTitulo}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              {/* Pregunta 2: Autor y Versión */}
              <div className="admin-form-row-2">
                <div className="admin-form-group">
                  <label htmlFor="sol-doc-autor" className="admin-form-label">
                    <ST>¿Quién es el autor o entidad responsable?</ST>
                  </label>
                  <p className="admin-form-helper">
                    <ST>Autor, grupo de investigación o institución emisora.</ST>
                  </p>
                  <input
                    id="sol-doc-autor"
                    type="text"
                    className="admin-form-input"
                    placeholder={tPhAutor}
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="sol-doc-version" className="admin-form-label">
                    <ST>¿Qué versión del documento corresponde?</ST>
                  </label>
                  <p className="admin-form-helper">
                    <ST>Versión de publicación (ej. 1.0, 2.0).</ST>
                  </p>
                  <input
                    id="sol-doc-version"
                    type="text"
                    className="admin-form-input"
                    placeholder="1.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>
              </div>

              {/* Pregunta 3: Categoría y Subcategoría dinámica */}
              <div className="admin-form-row-2">
                <div className="admin-form-group">
                  <label htmlFor="sol-doc-cat" className="admin-form-label">
                    <ST>¿Cuál es la categoría temática principal?</ST>{" "}
                    <span className="campo-requerido">*</span>
                  </label>
                  <p className="admin-form-helper">
                    <ST>Seleccione la categoría raíz en el repositorio.</ST>
                  </p>
                  <SelectFiltro
                    traducirOpciones
                    id="sol-doc-cat"
                    required
                    className="admin-form-select"
                    value={categoria}
                    onChange={(e) => {
                      setCategoria(e.target.value);
                      setSubcategoria("");
                    }}
                  >
                    <option value="">Seleccione una categoría</option>
                    {categorias
                      .filter((c) => !(c.padre || c.Padre))
                      .map((c) => {
                        const nombre = c.nombre || c.Nombre || "";
                        const id = c.id || c.Id || nombre;
                        return (
                          <option key={id} value={nombre}>
                            {nombre}
                          </option>
                        );
                      })}
                  </SelectFiltro>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="sol-doc-subcat" className="admin-form-label">
                    <ST>¿Pertenece a una subcategoría específica?</ST>
                  </label>
                  <p className="admin-form-helper">
                    <ST>Subclasificación opcional vinculada a la categoría principal.</ST>
                  </p>
                  <SelectFiltro
                    traducirOpciones
                    id="sol-doc-subcat"
                    className="admin-form-select"
                    value={subcategoria}
                    disabled={!subcategoriasDisponibles.length}
                    onChange={(e) => setSubcategoria(e.target.value)}
                  >
                    <option value="">Ninguna o raíz</option>
                    {subcategoriasDisponibles.map((sc) => {
                      const nombre = sc.nombre || sc.Nombre || "";
                      const id = sc.id || sc.Id || nombre;
                      return (
                        <option key={id} value={nombre}>
                          {nombre}
                        </option>
                      );
                    })}
                  </SelectFiltro>
                </div>
              </div>

              {/* Pregunta 4: Descripción / Justificación */}
              <div className="admin-form-group">
                <label htmlFor="sol-doc-desc" className="admin-form-label">
                  <ST>¿Cuál es la descripción o justificación del documento?</ST>
                </label>
                <p className="admin-form-helper">
                  <ST>Breve resumen de contenidos, objetivos o motivos de incorporación.</ST>
                </p>
                <textarea
                  id="sol-doc-desc"
                  rows={3}
                  className="admin-form-textarea"
                  placeholder={tPhDescripcion}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              {/* Pregunta 5: Palabras clave */}
              <div className="admin-form-group">
                <label htmlFor="sol-doc-tags" className="admin-form-label">
                  <ST>¿Cuáles son las palabras clave para búsqueda rápida?</ST>
                </label>
                <p className="admin-form-helper">
                  <ST>Términos separados por comas (ej. cosecha, beneficio, catación).</ST>
                </p>
                <input
                  id="sol-doc-tags"
                  type="text"
                  className="admin-form-input"
                  placeholder={tPhPalabras}
                  value={palabrasClave}
                  onChange={(e) => setPalabrasClave(e.target.value)}
                />
              </div>

              {/* Pregunta 6: Visibilidad y Acceso (Por defecto Privado) */}
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <ST>Nivel de Visibilidad y Custodia Institucional</ST>
                </label>
                <p className="admin-form-helper">
                  <ST>Control de publicación y seguridad de la información.</ST>
                </p>
                <div className="admin-form-privacy-options">
                  <div className="admin-form-radio-card is-selected cursor-default">
                    <input
                      type="radio"
                      name="privacidadDoc"
                      checked={true}
                      readOnly
                    />
                    <div className="radio-content">
                      <span className="radio-title text-amber-800">
                        <Lock size={14} className="text-amber-600 inline mr-1.5" />
                        <ST>Documento Privado / Bajo Revisión (Por Defecto)</ST>
                      </span>
                      <span className="radio-desc text-slate-600">
                        <ST>
                          Por políticas del repositorio, los archivos se resguardan de forma privada por defecto y NO aparecen en la página principal hasta su validación y autorización administrativa.
                        </ST>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pregunta 7: Archivo Digital a Enviar */}
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <ST>¿Qué archivo digital desea enviar?</ST>{" "}
                  {!esDocumentoEspecifico ? <span className="campo-requerido">*</span> : null}
                </label>
                <p className="admin-form-helper">
                  <ST>Formatos: PDF, Word, Excel, ZIP, Imágenes (hasta 30 MB).</ST>
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.jpg,.png"
                  onChange={handleFileChange}
                />

                <div
                  className={`dropzone-doc ${arrastrando ? "dropzone-doc--dragging border-amber-600 bg-amber-50/50" : ""} ${archivo ? "bg-amber-50/40 border-amber-300" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  {archivo ? (
                    <div className="flex items-center justify-between w-full p-2">
                      <div className="flex items-center gap-3 text-left">
                        <FileText size={28} className="text-amber-700 flex-shrink-0" />
                        <div>
                          <span className="block font-semibold text-sm text-slate-900 truncate max-w-xs md:max-w-md">
                            {archivo.name}
                          </span>
                          <span className="block text-xs text-emerald-600 font-medium">
                            {formatearTamano(archivo.size)} • Listo para enviar
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Quitar archivo"
                        onClick={handleRemoverArchivo}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud size={34} className="text-slate-400 mb-2 mx-auto" />
                      <span className="block font-semibold text-sm text-slate-800">
                        <ST>Haga clic o arrastre aquí el archivo a enviar</ST>
                      </span>
                      <span className="block text-xs text-slate-400 mt-1">
                        <ST>Formatos: PDF, Word, Excel, ZIP, Imágenes (hasta 30 MB)</ST>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pregunta 8: Datos de Contacto del Remitente */}
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <User size={14} className="inline mr-1 text-slate-500" />
                  <ST>Datos de Contacto del Remitente</ST>
                </label>
                <p className="admin-form-helper">
                  <ST>Información para el seguimiento y acreditación del archivo.</ST>
                </p>

                <div className="admin-form-row-2 mt-2">
                  <div>
                    <label htmlFor="sol-remitente-nombre" className="text-xs font-semibold text-slate-700 mb-1 block">
                      <ST>Nombre completo</ST> <span className="campo-requerido">*</span>
                    </label>
                    <input
                      id="sol-remitente-nombre"
                      type="text"
                      required
                      className="admin-form-input"
                      placeholder={tPhNombre}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="sol-remitente-correo" className="text-xs font-semibold text-slate-700 mb-1 block">
                      <ST>Correo electrónico</ST> <span className="campo-requerido">*</span>
                    </label>
                    <input
                      id="sol-remitente-correo"
                      type="email"
                      required
                      className="admin-form-input"
                      placeholder="carlos@ejemplo.com"
                      value={correo}
                      onChange={(e) => setCorreo(limpiarCorreo(e.target.value))}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label htmlFor="sol-remitente-inst" className="text-xs font-semibold text-slate-700 mb-1 block">
                    <ST>Organización o Afiliación (opcional)</ST>
                  </label>
                  <input
                    id="sol-remitente-inst"
                    type="text"
                    className="admin-form-input"
                    placeholder={tPhInstitucion}
                    value={institucion}
                    onChange={(e) => setInstitucion(e.target.value)}
                  />
                </div>
              </div>

              {/* Banner de Error */}
              {error ? (
                <div className="aviso-error-banner">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              ) : null}
            </div>

            {/* Footer con botones siempre visibles: Acción principal primero, luego secundaria */}
            <div
              className="admin-form-modal-footer"
              style={{
                flexShrink: 0,
                position: "sticky",
                bottom: 0,
                zIndex: 20,
                background: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "12px",
                padding: "14px 24px",
              }}
            >
              {/* Acción Principal Primero: Enviar */}
              <button
                type="submit"
                className="btn-primario-admin"
                disabled={enviando}
              >
                {enviando ? (
                  <>
                    <span className="spinner-sm mr-1.5" aria-hidden="true" />
                    <ST>Enviando...</ST>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <ST>Enviar Documento</ST>
                  </>
                )}
              </button>

              {/* Acción Secundaria Luego: Cancelar */}
              <button
                type="button"
                className="btn-secundario-admin"
                onClick={onClose}
                disabled={enviando}
              >
                <ST>Cancelar</ST>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
