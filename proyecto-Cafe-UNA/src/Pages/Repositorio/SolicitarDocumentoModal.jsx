import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, FileText, Lock, Upload, X } from "lucide-react";
import { obtenerCategoriasDocumentos, solicitarAccesoDocumento } from "../../services/documentosService";
import { getActiveSessionUser } from "../../services/sessionService";
import { ModalDialog } from "../../Components/ui/ModalDialog";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { limpiarCorreo } from "../../lib/correo";
import { ST } from "../../Components/T/ST";
import { useTraducir } from "../../hooks/useTraducir";
import { validarEnvio } from "./repositorioLogic";

const TAMANO_MAXIMO = 30 * 1024 * 1024;
const TIPOS_ACEPTADOS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.jpg,.png";

function formatearTamano(bytes = 0) {
  const b = Number(bytes);
  if (!b || Number.isNaN(b)) return "0 KB";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function Campo({ id, etiqueta, requerido = false, opcional = false, pista, children }) {
  return (
    <div className="pub-field">
      <label htmlFor={id} className="pub-field__label">
        <ST>{etiqueta}</ST>
        {requerido ? <span aria-hidden="true"> *</span> : null}
        {opcional ? (
          <span className="pub-field__optional">
            {" "}
            (<ST>opcional</ST>)
          </span>
        ) : null}
      </label>
      {children}
      {pista ? (
        <p className="pub-field__hint">
          <ST>{pista}</ST>
        </p>
      ) : null}
    </div>
  );
}

export function SolicitarDocumentoModal({ documento = null, onClose, onSuccess }) {
  const user = getActiveSessionUser();
  const esSolicitud = Boolean(documento && (documento.id || documento.titulo));
  const tituloId = useId();
  const fileInputRef = useRef(null);

  const tPhTitulo = useTraducir("Ej. Estudio de microcuencas y rendimiento cafetalero");
  const tPhAutor = useTraducir("Ej. Universidad Nacional / investigador");
  const tPhPalabras = useTraducir("caficultura, calidad, suelo");
  const tPhNombre = useTraducir("Ej. Carlos Rodríguez");
  const tPhInstitucion = useTraducir("Ej. cooperativa o universidad");
  const tPhMotivo = useTraducir("Cuéntanos brevemente el uso que le darás");
  const tSeleccione = useTraducir("Selecciona un tema");
  const tCerrar = useTraducir("Cerrar");
  const tQuitar = useTraducir("Quitar archivo");

  const [categorias, setCategorias] = useState([]);
  const [titulo, setTitulo] = useState(documento?.titulo || "");
  const [autor, setAutor] = useState("");
  const [palabrasClave, setPalabrasClave] = useState("");
  const [categoria, setCategoria] = useState("");
  const [motivo, setMotivo] = useState("");
  const [nombre, setNombre] = useState(user?.name || user?.username || "");
  const [correo, setCorreo] = useState(user?.email || user?.correo || "");
  const [institucion, setInstitucion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [completado, setCompletado] = useState(false);

  useBodyScrollLock(true);

  useEffect(() => {
    if (esSolicitud) return undefined;
    let cancelada = false;
    obtenerCategoriasDocumentos()
      .then((cats) => {
        if (!cancelada) setCategorias(Array.isArray(cats) ? cats : []);
      })
      .catch(() => {
        if (!cancelada) setCategorias([]);
      });
    return () => {
      cancelada = true;
    };
  }, [esSolicitud]);

  const temas = useMemo(
    () => categorias.filter((c) => !(c.padre || c.Padre) && (c.audiencia || "publica") === "publica"),
    [categorias],
  );

  const procesarArchivo = (file) => {
    if (!file) return;
    if (file.size > TAMANO_MAXIMO) {
      setError("El archivo supera el tamaño máximo permitido (30 MB).");
      return;
    }
    setArchivo(file);
    setError("");
  };

  const quitarArchivo = (e) => {
    e.stopPropagation();
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const abrirSelector = () => fileInputRef.current?.click();

  const enviar = async (e) => {
    e.preventDefault();
    setError("");

    const tituloFinal = esSolicitud ? documento?.titulo || "Documento institucional" : titulo.trim();
    const mensaje = validarEnvio(
      { titulo: tituloFinal, categoria, nombre, correo, archivo, motivo },
      { esSolicitud },
    );
    if (mensaje) {
      setError(mensaje);
      return;
    }

    try {
      setEnviando(true);
      const fd = new FormData();
      if (documento?.id) fd.append("documentoId", String(documento.id));
      fd.append("documentoTitulo", tituloFinal);
      fd.append("nombre", nombre.trim());
      fd.append("correo", correo.trim().toLowerCase());
      fd.append("institucion", institucion.trim());
      fd.append("autor", autor.trim() || nombre.trim());
      fd.append("version", "1.0");
      fd.append("categoria", categoria.trim() || documento?.categoria || "Investigaciones");
      fd.append("subcategoria", "");
      fd.append("palabrasClave", palabrasClave.trim());
      fd.append("motivo", esSolicitud ? motivo.trim() : `Envío de documento: ${tituloFinal}`);
      // Contributions always start private while the team reviews them.
      fd.append("esPrivado", "true");
      if (archivo) fd.append("archivo", archivo);

      await solicitarAccesoDocumento(fd);
      setCompletado(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error al enviar documento:", err);
      const msg = err?.message || "";
      if (msg.includes("violates not-null constraint") || msg.includes("DocumentoId")) {
        setError("Error en los datos de la solicitud. Verifica el formulario e intenta nuevamente.");
      } else {
        setError(msg || "No se pudo enviar. Intenta nuevamente.");
      }
    } finally {
      setEnviando(false);
    }
  };

  const tituloModal = esSolicitud ? "Solicitar acceso" : "Enviar un documento";
  const lead = esSolicitud
    ? "Cuéntanos quién eres y para qué lo necesitas. El equipo revisa cada solicitud."
    : "El equipo revisa cada aporte antes de publicarlo en el repositorio.";

  return createPortal(
    <ModalDialog className="pub-dialog-overlay" labelledBy={tituloId} onClose={enviando ? undefined : onClose}>
      <div className="pub-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="pub-dialog__header">
          <div>
            <h2 id={tituloId} className="pub-serif-title pub-dialog__title">
              <ST>{tituloModal}</ST>
            </h2>
            <p className="pub-dialog__lead">
              <ST>{lead}</ST>
            </p>
          </div>
          <button
            type="button"
            className="pub-dialog-close"
            onClick={onClose}
            disabled={enviando}
            aria-label={tCerrar}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {completado ? (
          <>
            <div className="pub-dialog__body">
              <div className="pub-success" role="status">
                <CheckCircle2 size={40} aria-hidden="true" />
                <h3 className="pub-serif-title pub-dialog__title">
                  <ST>{esSolicitud ? "Solicitud enviada" : "Documento enviado"}</ST>
                </h3>
                <p>
                  <ST>
                    {esSolicitud
                      ? "El equipo revisará tu solicitud y te escribirá al correo que indicaste."
                      : "Queda privado mientras el equipo lo revisa. Si se aprueba, se publica en el repositorio y te avisamos por correo."}
                  </ST>
                </p>
              </div>
            </div>
            <div className="pub-dialog__footer">
              <span />
              <button type="button" className="pub-btn pub-btn--primary" onClick={onClose}>
                <ST>Cerrar</ST>
              </button>
            </div>
          </>
        ) : (
          <form className="pub-dialog__form" onSubmit={enviar} noValidate>
            <div className="pub-dialog__body">
              <fieldset className="pub-fieldset">
                <legend>
                  <ST>El documento</ST>
                </legend>

                <Campo id="sol-doc-titulo" etiqueta="Título o tema" requerido>
                  <input
                    id="sol-doc-titulo"
                    type="text"
                    className="pub-input"
                    required
                    aria-required="true"
                    disabled={esSolicitud}
                    placeholder={tPhTitulo}
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </Campo>

                {!esSolicitud ? (
                  <>
                    <div className="pub-grid-2">
                      <Campo id="sol-doc-autor" etiqueta="Autor o entidad responsable">
                        <input
                          id="sol-doc-autor"
                          type="text"
                          className="pub-input"
                          placeholder={tPhAutor}
                          value={autor}
                          onChange={(e) => setAutor(e.target.value)}
                        />
                      </Campo>
                      <Campo id="sol-doc-tags" etiqueta="Palabras clave">
                        <input
                          id="sol-doc-tags"
                          type="text"
                          className="pub-input"
                          placeholder={tPhPalabras}
                          value={palabrasClave}
                          onChange={(e) => setPalabrasClave(e.target.value)}
                        />
                      </Campo>
                    </div>

                    <Campo id="sol-doc-tema" etiqueta="Tema" requerido>
                      <select
                        id="sol-doc-tema"
                        className="pub-select"
                        required
                        aria-required="true"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                      >
                        <option value="">{tSeleccione}</option>
                        {temas.map((c) => (
                          <option key={c.id || c.nombre} value={c.nombre}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </Campo>

                    <div className="pub-field">
                      <span className="pub-field__label" id="sol-doc-archivo-label">
                        <ST>Archivo</ST>
                        <span aria-hidden="true"> *</span>
                      </span>
                      <input
                        id="sol-doc-archivo"
                        ref={fileInputRef}
                        type="file"
                        className="pub-visually-hidden"
                        tabIndex={-1}
                        accept={TIPOS_ACEPTADOS}
                        onChange={(e) => procesarArchivo(e.target.files?.[0])}
                      />
                      {archivo ? (
                        <div className="pub-file">
                          <FileText size={24} aria-hidden="true" />
                          <div className="pub-file__text">
                            <span className="pub-file__name">{archivo.name}</span>
                            <span className="pub-file__size">{formatearTamano(archivo.size)}</span>
                          </div>
                          <button
                            type="button"
                            className="pub-dialog-close"
                            aria-label={`${tQuitar}: ${archivo.name}`}
                            onClick={quitarArchivo}
                          >
                            <X size={18} aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`pub-dropzone${arrastrando ? " pub-dropzone--dragging" : ""}`}
                          role="button"
                          tabIndex={0}
                          aria-labelledby="sol-doc-archivo-label"
                          onClick={abrirSelector}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              abrirSelector();
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setArrastrando(true);
                          }}
                          onDragLeave={() => setArrastrando(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setArrastrando(false);
                            procesarArchivo(e.dataTransfer.files?.[0]);
                          }}
                        >
                          <Upload size={24} aria-hidden="true" />
                          <span className="pub-dropzone__title">
                            <ST>Haz clic o arrastra el archivo aquí</ST>
                          </span>
                          <span>
                            <ST>PDF, Word, Excel, ZIP o imagen · hasta 30 MB</ST>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pub-note">
                      <Lock size={18} aria-hidden="true" />
                      <div>
                        <strong>
                          <ST>Visibilidad y custodia</ST>
                        </strong>
                        <p>
                          <ST>Privado mientras se revisa. Si se aprueba, se publica en el repositorio público.</ST>
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <Campo id="sol-doc-motivo" etiqueta="¿Para qué lo necesitás?" requerido>
                    <textarea
                      id="sol-doc-motivo"
                      className="pub-textarea"
                      rows={3}
                      required
                      aria-required="true"
                      placeholder={tPhMotivo}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                    />
                  </Campo>
                )}
              </fieldset>

              <fieldset className="pub-fieldset">
                <legend>
                  <ST>{esSolicitud ? "Tus datos" : "Tus datos de contacto"}</ST>
                </legend>
                <div className="pub-grid-2">
                  <Campo id="sol-remitente-nombre" etiqueta="Nombre completo" requerido>
                    <input
                      id="sol-remitente-nombre"
                      type="text"
                      className="pub-input"
                      required
                      aria-required="true"
                      autoComplete="name"
                      placeholder={tPhNombre}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </Campo>
                  <Campo id="sol-remitente-correo" etiqueta="Correo electrónico" requerido>
                    <input
                      id="sol-remitente-correo"
                      type="email"
                      className="pub-input"
                      required
                      aria-required="true"
                      autoComplete="email"
                      placeholder="carlos@ejemplo.com"
                      value={correo}
                      onChange={(e) => setCorreo(limpiarCorreo(e.target.value))}
                    />
                  </Campo>
                </div>
                <Campo
                  id="sol-remitente-inst"
                  etiqueta="Institución"
                  opcional
                  pista={
                    esSolicitud
                      ? undefined
                      : "Te escribimos a este correo cuando el documento se apruebe o si necesitamos algo más."
                  }
                >
                  <input
                    id="sol-remitente-inst"
                    type="text"
                    className="pub-input"
                    autoComplete="organization"
                    placeholder={tPhInstitucion}
                    value={institucion}
                    onChange={(e) => setInstitucion(e.target.value)}
                  />
                </Campo>
              </fieldset>
            </div>

            {error ? (
              <div className="pub-dialog__error">
                <div className="pub-alert" role="alert">
                  <ST>{error}</ST>
                </div>
              </div>
            ) : null}

            <div className="pub-dialog__footer">
              <button type="button" className="pub-btn pub-btn--secondary" onClick={onClose} disabled={enviando}>
                <ST>Cancelar</ST>
              </button>
              <button type="submit" className="pub-btn pub-btn--primary" disabled={enviando}>
                {enviando ? (
                  <>
                    <span className="pub-spinner" aria-hidden="true" />
                    <ST>Enviando...</ST>
                  </>
                ) : (
                  <ST>{esSolicitud ? "Enviar solicitud" : "Enviar documento"}</ST>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalDialog>,
    document.body,
  );
}
