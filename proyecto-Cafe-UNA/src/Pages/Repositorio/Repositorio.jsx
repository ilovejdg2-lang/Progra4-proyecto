import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Archive,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileArchive,
  FileCode,
  FileLock2,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  HardDrive,
  Info,
  Layers,
  Lock,
  Printer,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  Unlock,
  User,
  X,
} from "lucide-react";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import PageLoading from "../../Components/PageLoading/PageLoading";
import {
  descargarArchivo,
  obtenerCategoriasDocumentos,
  obtenerDocumentosPublicos,
  obtenerUrlDescargaDocumento,
} from "../../services/documentosService";
import { getActiveSessionUser } from "../../services/sessionService";
import { SolicitarDocumentoModal } from "./SolicitarDocumentoModal";
import { VisualizarDocumentoModal } from "./VisualizarDocumentoModal";
import { usePublicPageLoadingGate } from "../../hooks/usePublicPageLoadingGate";
import { useTraducir } from "../../hooks/useTraducir";
import { ST } from "../../Components/T/ST";
import "../Voluntariado/SolicitarVoluntariado.css";
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

export default function Repositorio() {
  const user = getActiveSessionUser();
  const puedeVerPrivadosDirecto = useMemo(() => {
    if (!user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [user.role];
    return roles.some((r) =>
      ["admin", "superadmin", "vendedor"].includes(String(r || "").toLowerCase()),
    );
  }, [user]);

  const [documentos, setDocumentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [orden, setOrden] = useState("recientes");
  const [vistaCuadricula, setVistaCuadricula] = useState(true);

  // Modal de propuesta/solicitud de archivo
  const [documentoSolicitar, setDocumentoSolicitar] = useState(null);
  const [documentoVisualizar, setDocumentoVisualizar] = useState(null);
  const [descargandoId, setDescargandoId] = useState(null);
  const [alertaExito, setAlertaExito] = useState("");

  const tRepositorio = useTraducir("Repositorio Institucional");
  const tBuscarPlaceholder = useTraducir("Buscar por título, autor, palabras clave...");
  const tTodasCategorias = useTraducir("Todas las categorías");

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      const [docsData, catsData] = await Promise.all([
        obtenerDocumentosPublicos({
          categoria: categoriaSeleccionada === "todas" ? "" : categoriaSeleccionada,
          buscar: terminoBusqueda,
          orden,
        }),
        obtenerCategoriasDocumentos().catch(() => []),
      ]);
      setDocumentos(docsData);
      setCategorias(catsData);
    } catch (err) {
      console.error("Error al cargar repositorio:", err);
      setError("No se pudieron cargar los documentos del repositorio. Intente más tarde.");
    } finally {
      setCargando(false);
    }
  }, [categoriaSeleccionada, terminoBusqueda, orden]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("solicitar") === "true" || window.location.hash === "#solicitar") {
        setDocumentoSolicitar({});
      }
    }
  }, []);

  const handleDescargar = async (doc) => {
    if (doc.esPrivado && !puedeVerPrivadosDirecto) {
      setDocumentoSolicitar(doc);
      return;
    }

    try {
      setDescargandoId(doc.id);
      await descargarArchivo(doc.id, doc.nombreOriginal || `${doc.titulo}.pdf`);
      // Actualizar contador localmente
      setDocumentos((prev) =>
        prev.map((item) =>
          item.id === doc.id ? { ...item, descargasCount: (item.descargasCount || 0) + 1 } : item,
        ),
      );
    } catch (err) {
      console.error("Error al descargar:", err);
      if (doc.esPrivado) {
        setDocumentoSolicitar(doc);
      } else {
        alert(err?.message || "Ocurrió un error al descargar el archivo.");
      }
    } finally {
      setDescargandoId(null);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const limpiarFiltros = () => {
    setCategoriaSeleccionada("todas");
    setTerminoBusqueda("");
    setOrden("recientes");
  };

  // Métricas rápidas
  const totalDescargas = useMemo(
    () => documentos.reduce((acc, d) => acc + (Number(d.descargasCount) || 0), 0),
    [documentos],
  );

  const showLoadingGate = usePublicPageLoadingGate("repositorio", !cargando);
  if (showLoadingGate) {
    return <PageLoading message="Cargando repositorio..." />;
  }

  return (
    <div className="repositorio-page">
      <BackToHomeLink />

      <section className="repositorio-section">
        {/* Cabecera idéntica a Voluntariado / Donaciones */}
        <header className="voluntariado-header">
          <span className="badge--voluntariado">
            <BookOpen size={14} className="mr-1.5" />
            <ST>Repositorio Institucional</ST>
          </span>
          <h1>
            <ST>Documentación y Recursos del Proyecto</ST>
          </h1>
          <p className="voluntariado-header__lead">
            <ST>
              Consulte y descargue investigaciones agronómicas, manuales de buenas prácticas, reportes de impacto y material técnico generado por el equipo del proyecto Café-UNA.
            </ST>
          </p>

          {/* Métricas clave */}
          <div className="repositorio-metricas-strip">
            <div className="repositorio-metrica-item">
              <span className="repositorio-metrica-item__num">{documentos.length}</span>
              <span className="repositorio-metrica-item__lbl"><ST>Documentos</ST></span>
            </div>
            <div className="repositorio-metrica-item">
              <span className="repositorio-metrica-item__num">{categorias.length || 4}</span>
              <span className="repositorio-metrica-item__lbl"><ST>Categorías temáticas</ST></span>
            </div>
            <div className="repositorio-metrica-item">
              <span className="repositorio-metrica-item__num">{totalDescargas}</span>
              <span className="repositorio-metrica-item__lbl"><ST>Descargas totales</ST></span>
            </div>
          </div>
        </header>

        {alertaExito ? (
          <div className="repositorio-alerta-banner">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <span>{alertaExito}</span>
            <button
              type="button"
              className="ml-auto text-slate-400 hover:text-slate-600"
              onClick={() => setAlertaExito("")}
            >
              <X size={16} />
            </button>
          </div>
        ) : null}

        {/* Barra de Búsqueda y Filtros con estilo SectionCard */}
        <div className="section-card mb-6">
          <div className="section-card__header">
            <h4>
              <Filter size={18} className="section-card__icon-inline" />
              <ST>Explorador y Filtros de Búsqueda</ST>
            </h4>
            <div className="ml-auto flex items-center gap-2 no-print">
              <button
                type="button"
                className="btn-accion-icono btn-accion-icono--primario"
                title="Enviar archivo o proponer documentación institucional"
                onClick={() => setDocumentoSolicitar({})}
              >
                <FileLock2 size={16} />
                <span><ST>Enviar / Proponer archivo</ST></span>
              </button>
              <button
                type="button"
                className="btn-accion-icono"
                title="Imprimir catálogo"
                onClick={handleImprimir}
              >
                <Printer size={16} />
                <span className="hidden sm:inline"><ST>Imprimir</ST></span>
              </button>
            </div>
          </div>

          <div className="section-card__body">
            <div className="repositorio-filtros-grid">
              {/* Buscador de texto */}
              <div className="repositorio-buscador-wrap">
                <Search size={18} className="repositorio-buscador-icon" />
                <input
                  type="text"
                  className="repositorio-buscador-input"
                  placeholder={tBuscarPlaceholder}
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                />
                {terminoBusqueda ? (
                  <button
                    type="button"
                    className="repositorio-buscador-clear"
                    onClick={() => setTerminoBusqueda("")}
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>

              {/* Selector de Categoría */}
              <div className="repositorio-select-wrap">
                <select
                  value={categoriaSeleccionada}
                  onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                  className="repositorio-select"
                >
                  <option value="todas">{tTodasCategorias}</option>
                  {categorias.map((cat) => {
                    const nombre = cat.nombre || cat.Nombre || "";
                    const padre = cat.padre || cat.Padre || "";
                    const id = cat.id || cat.Id || nombre;
                    return (
                      <option key={id} value={nombre}>
                        {padre ? `↳ ${nombre}` : nombre}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={16} className="repositorio-select-arrow" />
              </div>

              {/* Orden */}
              <div className="repositorio-select-wrap">
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="repositorio-select"
                >
                  <option value="recientes">Más recientes primero</option>
                  <option value="antiguos">Más antiguos primero</option>
                  <option value="descargas">Más descargados</option>
                  <option value="az">Título (A - Z)</option>
                  <option value="za">Título (Z - A)</option>
                </select>
                <ChevronDown size={16} className="repositorio-select-arrow" />
              </div>
            </div>

            {/* Chips de Categorías Rápidas */}
            {categorias.length > 0 ? (
              <div className="repositorio-chips-scroll no-print">
                <button
                  type="button"
                  className={`repositorio-chip ${categoriaSeleccionada === "todas" ? "repositorio-chip--activo" : ""}`}
                  onClick={() => setCategoriaSeleccionada("todas")}
                >
                  <Layers size={14} />
                  <span><ST>Todas</ST></span>
                  <span className="repositorio-chip__count">{documentos.length}</span>
                </button>
                {categorias
                  .filter((c) => !(c.padre || c.Padre))
                  .map((cat) => {
                    const nombre = cat.nombre || cat.Nombre || "";
                    const count = cat.usos ?? cat.Usos ?? 0;
                    const id = cat.id || cat.Id || nombre;
                    const activo =
                      String(categoriaSeleccionada || "").toLowerCase() ===
                      nombre.toLowerCase();
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`repositorio-chip ${activo ? "repositorio-chip--activo" : ""}`}
                        onClick={() => setCategoriaSeleccionada(activo ? "todas" : nombre)}
                      >
                        <FolderOpen size={14} />
                        <span>{nombre}</span>
                        {count > 0 ? (
                          <span className="repositorio-chip__count">{count}</span>
                        ) : null}
                      </button>
                    );
                  })}
              </div>
            ) : null}
          </div>
        </div>

        {/* Estado de carga */}
        {cargando ? (
          <div className="repositorio-cargando">
            <PageLoading message="Cargando repositorio..." />
          </div>
        ) : error ? (
          <div className="repositorio-error-card">
            <Info size={24} className="text-rose-500" />
            <p>{error}</p>
            <button type="button" className="btn-primario" onClick={cargarDatos}>
              <ST>Reintentar</ST>
            </button>
          </div>
        ) : documentos.length === 0 ? (
          /* Estado vacío */
          <div className="repositorio-vacio-card">
            <div className="repositorio-vacio-card__icon">
              <FolderOpen size={48} />
            </div>
            <h3><ST>No se encontraron documentos</ST></h3>
            <p>
              <ST>
                No hay resultados para los filtros seleccionados o el término de búsqueda ingresado.
              </ST>
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button type="button" className="btn-secundario" onClick={limpiarFiltros}>
                <RotateCcw size={16} />
                <ST>Restablecer filtros</ST>
              </button>
              <button
                type="button"
                className="btn-primario"
                onClick={() => setDocumentoSolicitar({})}
              >
                <FileLock2 size={16} />
                <ST>Solicitar archivo</ST>
              </button>
            </div>
          </div>
        ) : (
          /* Cuadrícula de Documentos (REP-P03-T1) */
          <div className="repositorio-grid">
            {documentos.map((doc) => {
              const fileTypeInfo = resolverIconoArchivo(doc.nombreOriginal, doc.mimeType);
              const FileIcon = fileTypeInfo.icon;
              const estaDescargando = descargandoId === doc.id;
              const esPrivadoRestringido = doc.esPrivado && !puedeVerPrivadosDirecto;

              return (
                <article key={doc.id} className="repositorio-card">
                  <div className="repositorio-card__top">
                    {/* Icono de tipo */}
                    <div className={`repositorio-card__file-icon ${fileTypeInfo.colorClass}`}>
                      <FileIcon size={24} />
                      <span className="repositorio-card__file-badge">{fileTypeInfo.label}</span>
                    </div>

                    {/* Insignias de privacidad y categoría */}
                    <div className="repositorio-card__badges">
                      <span className="repositorio-badge--categoria">
                        {doc.categoria || "General"}
                        {doc.subcategoria ? ` / ${doc.subcategoria}` : ""}
                      </span>
                      {doc.esPrivado ? (
                        <span
                          className="repositorio-badge--privado"
                          title="Acceso restringido: requiere autorización institucional"
                        >
                          <Lock size={12} />
                          <ST>Privado</ST>
                        </span>
                      ) : (
                        <span className="repositorio-badge--publico" title="Documento público">
                          <Unlock size={12} />
                          <ST>Público</ST>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="repositorio-card__body">
                    <h3 className="repositorio-card__title" title={doc.titulo}>
                      {doc.titulo}
                    </h3>
                    {doc.descripcion ? (
                      <p className="repositorio-card__desc">{doc.descripcion}</p>
                    ) : null}

                    {/* Metadatos */}
                    <div className="repositorio-card__meta">
                      {doc.autor ? (
                        <div className="repositorio-card__meta-item">
                          <User size={13} />
                          <span>{doc.autor}</span>
                        </div>
                      ) : null}
                      <div className="repositorio-card__meta-item">
                        <HardDrive size={13} />
                        <span>{formatearTamano(doc.tamanoBytes)}</span>
                      </div>
                      <div className="repositorio-card__meta-item">
                        <Download size={13} />
                        <span>
                          {doc.descargasCount || 0} <ST>descargas</ST>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones: Visualizar + Descargar / Solicitar */}
                  <div className="repositorio-card__footer no-print">
                    <div className="repositorio-card__actions-grid">
                      <button
                        type="button"
                        className="btn-visualizar-archivo"
                        title="Ver y previsualizar documento en línea"
                        onClick={() => setDocumentoVisualizar(doc)}
                      >
                        <Eye size={15} />
                        <span><ST>Visualizar</ST></span>
                      </button>

                      {esPrivadoRestringido ? (
                        <button
                          type="button"
                          className="btn-solicitar-archivo"
                          onClick={() => setDocumentoSolicitar(doc)}
                          title="Documento privado: solicitar acceso formal"
                        >
                          <FileLock2 size={15} />
                          <span><ST>Solicitar</ST></span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-descargar-archivo"
                          disabled={estaDescargando}
                          onClick={() => handleDescargar(doc)}
                          title="Descargar archivo en su dispositivo"
                        >
                          {estaDescargando ? (
                            <>
                              <span className="spinner-sm" aria-hidden="true" />
                              <span><ST>Bajando...</ST></span>
                            </>
                          ) : (
                            <>
                              <Download size={15} />
                              <span><ST>Descargar</ST></span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal para previsualizar documento interactivo */}
      {documentoVisualizar ? (
        <VisualizarDocumentoModal
          documento={documentoVisualizar}
          onClose={() => setDocumentoVisualizar(null)}
        />
      ) : null}

      {/* Modal para enviar propuesta o solicitar documento privado */}
      {documentoSolicitar ? (
        <SolicitarDocumentoModal
          documento={documentoSolicitar}
          onClose={() => setDocumentoSolicitar(null)}
          onSuccess={() => {
            setAlertaExito(
              "Su archivo o solicitud fue enviada con éxito. Será revisada por el equipo administrativo.",
            );
          }}
        />
      ) : null}
    </div>
  );
}
