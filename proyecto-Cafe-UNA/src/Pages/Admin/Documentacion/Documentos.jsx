import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Archive,
  BarChart3,
  BookOpen,
  Check,
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
  FolderPlus,
  HardDrive,
  Info,
  Layers,
  Lock,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  Unlock,
  UploadCloud,
  User,
  X,
} from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { createPortal } from "react-dom";
import PageLoading from "../../../Components/PageLoading/PageLoading";
import { UiSelect } from "../../../Components/ui/Select";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import {
  actualizarDocumentoAdmin,
  cambiarEstadoDocumentoAdmin,
  crearCategoriaDocumento,
  crearDocumentoAdmin,
  descargarArchivo,
  eliminarCategoriaDocumento,
  eliminarDocumentoAdmin,
  exportarCatalogoDocumentosCsv,
  obtenerCategoriasDocumentos,
  obtenerDocumentosAdmin,
  obtenerEstadisticasDocumentosAdmin,
} from "../../../services/documentosService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { VisualizarDocumentoModal } from "../../Repositorio/VisualizarDocumentoModal";
import "../../Voluntariado/SolicitarVoluntariado.css";
import "./Documentos.css";

const FORM_DOCUMENTO_INICIAL = {
  titulo: "",
  descripcion: "",
  categoria: "",
  subcategoria: "",
  esPrivado: false,
  autor: "Proyecto Café-UNA",
  version: "1.0",
  palabrasClave: "",
  activo: true,
};

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
  if (["zip", "rar", "7z"].includes(ext) || mime.includes("zip") || mime.includes("compressed")) {
    return { icon: FileArchive, colorClass: "icon--archive", label: "ZIP" };
  }
  return { icon: FileCode, colorClass: "icon--default", label: ext.toUpperCase() || "Doc" };
}

function formatearTamano(bytes = 0) {
  const b = Number(bytes);
  if (!b || isNaN(b)) return "0 KB";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDocumentos() {
  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const esAdmin =
    roles.some((r) =>
      ["admin", "superadmin", "administrador", "superadministrador"].includes(
        String(r || "").toLowerCase(),
      ),
    ) || String(actor?.role || "").toLowerCase() === "admin";
  const puedeCrear = esAdmin || tienePermiso(roles, "crear_documentacion");
  const puedeEditar = esAdmin || tienePermiso(roles, "actualizar_documentacion");
  const puedeInactivar = esAdmin || tienePermiso(roles, "inactivar_documentacion");

  // Pestaña activa: 'documentos' | 'categorias' | 'metricas'
  const [tabActivo, setTabActivo] = useState("documentos");

  // Datos
  const [documentos, setDocumentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [ultimasDescargas, setUltimasDescargas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  // Filtros de Documentos
  const [filtroBuscar, setFiltroBuscar] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroPrivacidad, setFiltroPrivacidad] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("");

  // Modal Subida / Edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [documentoEditando, setDocumentoEditando] = useState(null);
  const [formDoc, setFormDoc] = useState(FORM_DOCUMENTO_INICIAL);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const fileInputRef = useRef(null);

  // Formulario de Nueva Categoría (REP-P01-T2)
  const [modalCatAbierto, setModalCatAbierto] = useState(false);
  const [catNombre, setCatNombre] = useState("");
  const [catPadre, setCatPadre] = useState("");
  const [guardandoCat, setGuardandoCat] = useState(false);
  const [errorCat, setErrorCat] = useState("");

  // Descarga en curso y visualizador
  const [descargandoId, setDescargandoId] = useState(null);
  const [docAVisualizar, setDocAVisualizar] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      const [docs, cats, stats] = await Promise.all([
        obtenerDocumentosAdmin({
          buscar: filtroBuscar,
          categoria: filtroCategoria,
          esPrivado: filtroPrivacidad,
          activo: filtroActivo,
        }),
        obtenerCategoriasDocumentos().catch(() => []),
        obtenerEstadisticasDocumentosAdmin().catch(() => null),
      ]);
      setDocumentos(docs);
      setCategorias(cats);
      if (stats) {
        setMetricas(stats.metricas || null);
        setUltimasDescargas(stats.ultimasDescargas || []);
      }
    } catch (err) {
      console.error("Error al cargar administración de documentos:", err);
      setError("No se pudieron cargar los datos de documentación.");
    } finally {
      setCargando(false);
    }
  }, [filtroBuscar, filtroCategoria, filtroPrivacidad, filtroActivo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const abrirModalCrear = () => {
    setDocumentoEditando(null);
    setFormDoc(FORM_DOCUMENTO_INICIAL);
    setArchivoSeleccionado(null);
    setErrorForm("");
    setModalAbierto(true);
  };

  const abrirModalEditar = (doc) => {
    setDocumentoEditando(doc);
    setFormDoc({
      titulo: doc.titulo || "",
      descripcion: doc.descripcion || "",
      categoria: doc.categoria || "",
      subcategoria: doc.subcategoria || "",
      esPrivado: Boolean(doc.esPrivado),
      autor: doc.autor || "",
      version: doc.version || "1.0",
      palabrasClave: doc.palabrasClave || "",
      activo: Boolean(doc.activo),
    });
    setArchivoSeleccionado(null);
    setErrorForm("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setDocumentoEditando(null);
    setArchivoSeleccionado(null);
    setErrorForm("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        setErrorForm("El archivo supera el tamaño máximo permitido (30 MB).");
        return;
      }
      setArchivoSeleccionado(file);
      setErrorForm("");
    }
  };

  const handleSubmitDocumento = async (e) => {
    e.preventDefault();
    setErrorForm("");

    if (!formDoc.titulo.trim()) {
      setErrorForm("El título del documento es obligatorio.");
      return;
    }
    if (!formDoc.categoria.trim()) {
      setErrorForm("Debe seleccionar una categoría.");
      return;
    }
    if (!documentoEditando && !archivoSeleccionado) {
      setErrorForm("Debe seleccionar un archivo para subir.");
      return;
    }

    try {
      setGuardando(true);
      const fd = new FormData();
      fd.append("titulo", formDoc.titulo.trim());
      fd.append("descripcion", formDoc.descripcion.trim());
      fd.append("categoria", formDoc.categoria.trim());
      fd.append("subcategoria", formDoc.subcategoria.trim());
      fd.append("esPrivado", String(formDoc.esPrivado));
      fd.append("autor", formDoc.autor.trim());
      fd.append("version", formDoc.version.trim());
      fd.append("palabrasClave", formDoc.palabrasClave.trim());
      fd.append("activo", String(formDoc.activo));

      if (archivoSeleccionado) {
        fd.append("archivo", archivoSeleccionado);
      }

      if (documentoEditando) {
        await actualizarDocumentoAdmin(documentoEditando.id, fd);
        setMensajeExito("Documento actualizado con éxito.");
      } else {
        await crearDocumentoAdmin(fd);
        setMensajeExito("Documento registrado y subido con éxito.");
      }

      cerrarModal();
      await cargarDatos();
    } catch (err) {
      console.error("Error al guardar documento:", err);
      setErrorForm(err?.message || "No se pudo guardar el documento.");
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (doc) => {
    try {
      await cambiarEstadoDocumentoAdmin(doc.id, !doc.activo);
      setDocumentos((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, activo: !d.activo } : d)),
      );
      setMensajeExito(
        `Documento ${!doc.activo ? "activado" : "inactivado"} exitosamente.`,
      );
    } catch (err) {
      alert(err?.message || "No se pudo cambiar el estado del documento.");
    }
  };

  const handleEliminarDocumento = async (doc) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar permanentemente el documento "${doc.titulo}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      await eliminarDocumentoAdmin(doc.id);
      setDocumentos((prev) => prev.filter((d) => d.id !== doc.id));
      setMensajeExito("Documento eliminado correctamente.");
    } catch (err) {
      alert(err?.message || "No se pudo eliminar el documento.");
    }
  };

  const handleDescargarAdmin = async (doc) => {
    try {
      setDescargandoId(doc.id);
      await descargarArchivo(doc.id, doc.nombreOriginal || `${doc.titulo}.pdf`);
    } catch (err) {
      alert(err?.message || "Error al descargar el archivo.");
    } finally {
      setDescargandoId(null);
    }
  };

  // Categorías
  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    setErrorCat("");

    if (!catNombre.trim()) {
      setErrorCat("El nombre de la categoría es obligatorio.");
      return;
    }

    try {
      setGuardandoCat(true);
      await crearCategoriaDocumento({
        nombre: catNombre.trim(),
        padre: catPadre.trim(),
      });
      setCatNombre("");
      setCatPadre("");
      setModalCatAbierto(false);
      setMensajeExito("Categoría creada con éxito.");
      await cargarDatos();
    } catch (err) {
      console.error("Error al crear categoría:", err);
      setErrorCat(err?.message || "No se pudo crear la categoría.");
    } finally {
      setGuardandoCat(false);
    }
  };

  const handleEliminarCategoria = async (cat) => {
    const id = cat.id || cat.Id;
    const nombre = cat.nombre || cat.Nombre || "";
    if (
      !window.confirm(
        `¿Eliminar la categoría "${nombre}"? (No debe tener documentos ni subcategorías asociadas).`,
      )
    ) {
      return;
    }

    try {
      await eliminarCategoriaDocumento(id);
      setMensajeExito("Categoría eliminada con éxito.");
      await cargarDatos();
    } catch (err) {
      alert(err?.message || "No se pudo eliminar la categoría.");
    }
  };

  const subcategoriasDisponibles = useMemo(() => {
    if (!formDoc.categoria) return [];
    const catSelec = formDoc.categoria.toLowerCase();
    return categorias.filter((c) => {
      const padre = (c.padre || c.Padre || "").toLowerCase();
      return padre && padre === catSelec;
    });
  }, [formDoc.categoria, categorias]);

  const totalEspacioBytes = useMemo(
    () => documentos.reduce((acc, d) => acc + (Number(d.tamanoBytes) || 0), 0),
    [documentos],
  );

  const { showLoading, loadingMessage } = useAdminPageGate("/admin/documentacion", !cargando);
  if (showLoading) {
    return (
      <AdminLayout>
        <PageLoading message={loadingMessage || "Cargando documentación..."} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-docs-container">
        {/* Encabezado y Acciones */}
        <div className="admin-docs-header">
          <div>
            <span className="badge--admin-docs">
              <BookOpen size={14} className="mr-1.5" />
              <ST>Repositorio Institucional</ST>
            </span>
            <h1 className="admin-docs-title">
              <ST>Gestión de Documentos y Categorías</ST>
            </h1>
            <p className="admin-docs-subtitle">
              <ST>
                Administre los archivos, clasificaciones temáticas, permisos de privacidad y registro de descargas del repositorio.
              </ST>
            </p>
          </div>

          <div className="admin-docs-header__actions">
            <button
              type="button"
              className="btn-secundario-admin"
              onClick={exportarCatalogoDocumentosCsv}
              title="Descargar catálogo completo en CSV"
            >
              <Download size={16} />
              <span><ST>Exportar Catálogo</ST></span>
            </button>
            {puedeCrear ? (
              <button
                type="button"
                className="btn-primario-admin"
                onClick={abrirModalCrear}
              >
                <Plus size={16} />
                <span><ST>Nuevo Documento</ST></span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Métricas Resumen */}
        {metricas ? (
          <div className="admin-docs-kpi-grid">
            <div className="admin-docs-kpi-card">
              <div className="kpi-icon kpi-icon--blue">
                <BookOpen size={20} />
              </div>
              <div>
                <span className="kpi-num">{metricas.totalDocs}</span>
                <span className="kpi-lbl"><ST>Total Documentos</ST></span>
              </div>
            </div>
            <div className="admin-docs-kpi-card">
              <div className="kpi-icon kpi-icon--emerald">
                <Download size={20} />
              </div>
              <div>
                <span className="kpi-num">{metricas.totalDescargas}</span>
                <span className="kpi-lbl"><ST>Descargas Totales</ST></span>
              </div>
            </div>
            <div className="admin-docs-kpi-card">
              <div className="kpi-icon kpi-icon--green">
                <Unlock size={20} />
              </div>
              <div>
                <span className="kpi-num">{metricas.publicos}</span>
                <span className="kpi-lbl"><ST>Públicos</ST></span>
              </div>
            </div>
            <div className="admin-docs-kpi-card">
              <div className="kpi-icon kpi-icon--amber">
                <Lock size={20} />
              </div>
              <div>
                <span className="kpi-num">{metricas.privados}</span>
                <span className="kpi-lbl"><ST>Privados / Restringidos</ST></span>
              </div>
            </div>
          </div>
        ) : null}

        {mensajeExito ? (
          <div className="admin-docs-alert--success">
            <CheckCircle2 size={18} />
            <span>{mensajeExito}</span>
            <button
              type="button"
              className="ml-auto text-emerald-700 hover:text-emerald-900"
              onClick={() => setMensajeExito("")}
            >
              <X size={16} />
            </button>
          </div>
        ) : null}

        {/* Pestañas de Navegación */}
        <div className="admin-docs-tabs">
          <button
            type="button"
            className={`admin-docs-tab ${tabActivo === "documentos" ? "admin-docs-tab--active" : ""}`}
            onClick={() => setTabActivo("documentos")}
          >
            <BookOpen size={16} />
            <span><ST>Documentos ({documentos.length})</ST></span>
          </button>
          <button
            type="button"
            className={`admin-docs-tab ${tabActivo === "categorias" ? "admin-docs-tab--active" : ""}`}
            onClick={() => setTabActivo("categorias")}
          >
            <Layers size={16} />
            <span><ST>Categorías ({categorias.length})</ST></span>
          </button>
          <button
            type="button"
            className={`admin-docs-tab ${tabActivo === "metricas" ? "admin-docs-tab--active" : ""}`}
            onClick={() => setTabActivo("metricas")}
          >
            <BarChart3 size={16} />
            <span><ST>Historial de Descargas</ST></span>
          </button>
        </div>

        {/* ============================================================
            PESTAÑA 1: GESTIÓN DE DOCUMENTOS (REP-P02-T2)
        ============================================================ */}
        {tabActivo === "documentos" ? (
          <div className="admin-docs-panel">
            {/* Toolbar de Filtros */}
            <div className="admin-docs-filter-bar">
              <div className="admin-docs-search">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar documento..."
                  value={filtroBuscar}
                  onChange={(e) => setFiltroBuscar(e.target.value)}
                />
                {filtroBuscar ? (
                  <button type="button" onClick={() => setFiltroBuscar("")}>
                    <X size={14} />
                  </button>
                ) : null}
              </div>

              <UiSelect
                ariaLabel="Categoría"
                value={filtroCategoria}
                onChange={setFiltroCategoria}
                options={[
                  { value: "", label: "Todas las categorías" },
                  ...categorias.map((c) => {
                    const nombre = c.nombre || c.Nombre || "";
                    const padre = c.padre || c.Padre || "";
                    return {
                      value: nombre,
                      label: padre ? `↳ ${nombre}` : nombre,
                    };
                  }),
                ]}
              />

              <UiSelect
                ariaLabel="Visibilidad"
                value={filtroPrivacidad}
                onChange={setFiltroPrivacidad}
                options={[
                  { value: "", label: "Cualquier visibilidad" },
                  { value: "false", label: "Solo Públicos" },
                  { value: "true", label: "Solo Privados" },
                ]}
              />

              <UiSelect
                ariaLabel="Estado"
                value={filtroActivo}
                onChange={setFiltroActivo}
                options={[
                  { value: "", label: "Cualquier estado" },
                  { value: "true", label: "Activos" },
                  { value: "false", label: "Inactivos" },
                ]}
              />

              {(filtroBuscar || filtroCategoria || filtroPrivacidad || filtroActivo) ? (
                <button
                  type="button"
                  className="btn-limpiar-filtros"
                  onClick={() => {
                    setFiltroBuscar("");
                    setFiltroCategoria("");
                    setFiltroPrivacidad("");
                    setFiltroActivo("");
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Limpiar</span>
                </button>
              ) : null}
            </div>

            {/* Tabla de Documentos */}
            {cargando ? (
              <div className="admin-docs-loading">
                <span className="spinner-sm" />
                <span>Cargando documentos...</span>
              </div>
            ) : documentos.length === 0 ? (
              <div className="admin-docs-empty">
                <FolderOpen size={48} className="text-slate-300" />
                <h4>No se encontraron documentos</h4>
                <p>Pruebe con otros filtros o registre un nuevo archivo en el repositorio.</p>
                {puedeCrear ? (
                  <button
                    type="button"
                    className="btn-primario-admin mt-3"
                    onClick={abrirModalCrear}
                  >
                    <Plus size={16} />
                    <span>Nuevo Documento</span>
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="admin-docs-table-wrapper">
                <table className="admin-docs-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Categoría</th>
                      <th>Visibilidad</th>
                      <th>Tamaño</th>
                      <th>Descargas</th>
                      <th>Estado</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map((doc) => {
                      const iconInfo = resolverIconoArchivo(doc.nombreOriginal, doc.mimeType);
                      const IconDoc = iconInfo.icon;
                      const estaDescargando = descargandoId === doc.id;

                      return (
                        <tr key={doc.id} className={!doc.activo ? "fila-inactiva" : ""}>
                          <td>
                            <div className="doc-cell-main">
                              <div className={`doc-cell-icon ${iconInfo.colorClass}`}>
                                <IconDoc size={18} />
                              </div>
                              <div className="doc-cell-copy">
                                <span className="doc-cell-title" title={doc.titulo}>
                                  {doc.titulo}
                                </span>
                                <span className="doc-cell-sub">
                                  {doc.nombreOriginal} • v{doc.version || "1.0"}
                                  {doc.autor ? ` • ${doc.autor}` : ""}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge-categoria-cell">
                              {doc.categoria}
                              {doc.subcategoria ? ` / ${doc.subcategoria}` : ""}
                            </span>
                          </td>
                          <td>
                            {doc.esPrivado ? (
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
                          </td>
                          <td>
                            <span className="doc-size-text">
                              {formatearTamano(doc.tamanoBytes)}
                            </span>
                          </td>
                          <td>
                            <span className="doc-downloads-num">
                              {doc.descargasCount || 0}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge-estado-pill ${doc.activo ? "badge-estado--activo" : "badge-estado--inactivo"}`}
                            >
                              {doc.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td>
                            <div className="admin-actions-cell">
                              <button
                                type="button"
                                className="action-btn action-btn--view"
                                title="Visualizar documento en línea"
                                onClick={() => setDocAVisualizar(doc)}
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                className="action-btn action-btn--download"
                                title="Descargar archivo"
                                disabled={estaDescargando}
                                onClick={() => handleDescargarAdmin(doc)}
                              >
                                <Download size={15} />
                              </button>
                              {puedeEditar ? (
                                <button
                                  type="button"
                                  className="action-btn action-btn--edit"
                                  title="Editar documento"
                                  onClick={() => abrirModalEditar(doc)}
                                >
                                  <Pencil size={15} />
                                </button>
                              ) : null}
                              {puedeInactivar ? (
                                <button
                                  type="button"
                                  className={`action-btn ${doc.activo ? "action-btn--toggle-on" : "action-btn--toggle-off"}`}
                                  title={doc.activo ? "Inactivar documento" : "Activar documento"}
                                  onClick={() => handleToggleEstado(doc)}
                                >
                                  <Power size={15} />
                                </button>
                              ) : null}
                              {puedeInactivar ? (
                                <button
                                  type="button"
                                  className="action-btn action-btn--delete"
                                  title="Eliminar permanentemente"
                                  onClick={() => handleEliminarDocumento(doc)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {/* ============================================================
            PESTAÑA 2: CATEGORÍAS DE DOCUMENTOS (REP-P01-T2)
        ============================================================ */}
        {tabActivo === "categorias" ? (
          <div className="admin-docs-panel">
            <div className="admin-cat-banner">
              <div>
                <h4>Clasificación Temática del Repositorio</h4>
                <p>
                  Defina las categorías raíz y subcategorías para organizar los documentos y estructurar los filtros en la vista pública.
                </p>
              </div>
              {puedeCrear ? (
                <button
                  type="button"
                  className="btn-primario-admin"
                  onClick={() => {
                    setErrorCat("");
                    setCatNombre("");
                    setCatPadre("");
                    setModalCatAbierto(true);
                  }}
                >
                  <FolderPlus size={16} />
                  <span>Nueva Categoría</span>
                </button>
              ) : null}
            </div>

            <div className="admin-docs-table-wrapper">
              <table className="admin-docs-table">
                <thead>
                  <tr>
                    <th>Nombre de Categoría</th>
                    <th>Nivel / Padre</th>
                    <th>Documentos Asociados</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((cat) => {
                    const nombre = cat.nombre || cat.Nombre || "";
                    const padre = cat.padre || cat.Padre || "";
                    const id = cat.id || cat.Id || nombre;
                    const usos = cat.usos ?? cat.Usos ?? 0;
                    return (
                      <tr key={id}>
                        <td>
                          <div className="cat-cell-name">
                            <FolderOpen size={16} className={padre ? "text-slate-400 ml-4" : "text-amber-600"} />
                            <span className={padre ? "text-slate-700" : "font-semibold text-slate-900"}>
                              {nombre}
                            </span>
                          </div>
                        </td>
                        <td>
                          {padre ? (
                            <span className="badge-subcat-parent">Subcategoría de: {padre}</span>
                          ) : (
                            <span className="badge-cat-root">Categoría Raíz</span>
                          )}
                        </td>
                        <td>
                          <span className="font-semibold text-slate-700">
                            {usos}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions-cell">
                            {puedeInactivar ? (
                              <button
                                type="button"
                                className="action-btn action-btn--delete"
                                title="Eliminar categoría"
                                onClick={() => handleEliminarCategoria(cat)}
                              >
                                <Trash2 size={15} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* ============================================================
            PESTAÑA 3: HISTORIAL DE DESCARGAS (REP-P02-T3)
        ============================================================ */}
        {tabActivo === "metricas" ? (
          <div className="admin-docs-panel">
            <div className="mb-4">
              <h4 className="text-base font-semibold text-slate-900">
                Auditoría y Registro de Descargas Recientes
              </h4>
              <p className="text-xs text-slate-500">
                Detalle de las últimas descargas realizadas tanto por visitantes como por usuarios autenticados.
              </p>
            </div>

            {ultimasDescargas.length === 0 ? (
              <div className="admin-docs-empty">
                <BarChart3 size={40} className="text-slate-300" />
                <h4>No hay registros de descargas todavía</h4>
                <p>Las descargas de documentos públicos y aprobados se registrarán automáticamente aquí.</p>
              </div>
            ) : (
              <div className="admin-docs-table-wrapper">
                <table className="admin-docs-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Usuario / Solicitante</th>
                      <th>Dirección IP</th>
                      <th>Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimasDescargas.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium text-slate-900">
                          {item.documentoTitulo}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <User size={14} className="text-slate-400" />
                            <span>{item.usuarioNombre || "Visitante"}</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono text-xs text-slate-500">
                            {item.ip || "—"}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-500">
                            {item.fechaDescarga
                              ? new Date(item.fechaDescarga).toLocaleString("es-CR")
                              : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ============================================================
          MODAL DE SUBIDA Y EDICIÓN DE DOCUMENTO (REP-P02-T1)
          Siguiendo la estructura y estilos de SectionCard
      ============================================================ */}
      {modalAbierto ? (
        createPortal(
        <div className="repositorio-modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}>
          <div className="repositorio-modal-container max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="repositorio-modal-header">
              <div className="repositorio-modal-header__title-group">
                <span className="badge--admin-docs">
                  <BookOpen size={14} />
                  <ST>{documentoEditando ? "Edición de Documento" : "Subida de Documento"}</ST>
                </span>
                <h3>
                  <ST>{documentoEditando ? "Editar Metadatos del Documento" : "Subir Nuevo Documento al Repositorio"}</ST>
                </h3>
              </div>
              <button
                type="button"
                className="repositorio-modal-close"
                onClick={cerrarModal}
                disabled={guardando}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitDocumento} className="repositorio-modal-form">
              {/* Paso 1: Información Básica */}
              <div className="section-card">
                <div className="section-card__header">
                  <span className="section-card__paso" aria-hidden="true">1</span>
                  <h4><ST>Información Básica</ST></h4>
                </div>
                <div className="section-card__body grid-dos-columnas">
                  <div className="campo-grupo columna-completa">
                    <label htmlFor="doc-form-titulo">
                      <ST>Título del documento</ST> <span className="campo-requerido">*</span>
                    </label>
                    <input
                      id="doc-form-titulo"
                      type="text"
                      required
                      placeholder="Ej. Estudio de Calidad de Taza y Procesamiento 2026"
                      value={formDoc.titulo}
                      onChange={(e) => setFormDoc({ ...formDoc, titulo: e.target.value })}
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="doc-form-autor">
                      <ST>Autor / Institución</ST>
                    </label>
                    <input
                      id="doc-form-autor"
                      type="text"
                      placeholder="Ej. Universidad Nacional / Proyecto Café-UNA"
                      value={formDoc.autor}
                      onChange={(e) => setFormDoc({ ...formDoc, autor: e.target.value })}
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="doc-form-version">
                      <ST>Versión</ST>
                    </label>
                    <input
                      id="doc-form-version"
                      type="text"
                      placeholder="1.0"
                      value={formDoc.version}
                      onChange={(e) => setFormDoc({ ...formDoc, version: e.target.value })}
                    />
                  </div>

                  <div className="campo-grupo columna-completa">
                    <label htmlFor="doc-form-desc">
                      <ST>Descripción o Resumen</ST>
                    </label>
                    <textarea
                      id="doc-form-desc"
                      rows={3}
                      placeholder="Breve resumen de los contenidos, hallazgos o propósito del documento..."
                      value={formDoc.descripcion}
                      onChange={(e) => setFormDoc({ ...formDoc, descripcion: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Paso 2: Categorización y Visibilidad */}
              <div className="section-card">
                <div className="section-card__header">
                  <span className="section-card__paso" aria-hidden="true">2</span>
                  <h4><ST>Categorización y Control de Acceso</ST></h4>
                </div>
                <div className="section-card__body grid-dos-columnas">
                  <div className="campo-grupo">
                    <label htmlFor="doc-form-cat">
                      <ST>Categoría principal</ST> <span className="campo-requerido">*</span>
                    </label>
                    <select
                      id="doc-form-cat"
                      required
                      value={formDoc.categoria}
                      onChange={(e) =>
                        setFormDoc({
                          ...formDoc,
                          categoria: e.target.value,
                          subcategoria: "",
                        })
                      }
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
                    </select>
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="doc-form-subcat">
                      <ST>Subcategoría (opcional)</ST>
                    </label>
                    <select
                      id="doc-form-subcat"
                      value={formDoc.subcategoria}
                      disabled={!subcategoriasDisponibles.length}
                      onChange={(e) => setFormDoc({ ...formDoc, subcategoria: e.target.value })}
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
                    </select>
                  </div>

                  <div className="campo-grupo columna-completa">
                    <label htmlFor="doc-form-tags">
                      <ST>Palabras clave (separadas por coma)</ST>
                    </label>
                    <input
                      id="doc-form-tags"
                      type="text"
                      placeholder="agronomía, cosecha, beneficio, catación"
                      value={formDoc.palabrasClave}
                      onChange={(e) => setFormDoc({ ...formDoc, palabrasClave: e.target.value })}
                    />
                  </div>

                  {/* Toggle Privado / Público */}
                  <div className="columna-completa doc-privacidad-box">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="doc-form-privado"
                        className="size-5 rounded border-slate-300 accent-slate-900 cursor-pointer"
                        checked={formDoc.esPrivado}
                        onChange={(e) => setFormDoc({ ...formDoc, esPrivado: e.target.checked })}
                      />
                      <label htmlFor="doc-form-privado" className="cursor-pointer">
                        <span className="block font-semibold text-sm text-slate-900">
                          {formDoc.esPrivado ? "Documento Privado (Restringido)" : "Documento Público"}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {formDoc.esPrivado
                            ? "Los visitantes deberán solicitar autorización formal para descargar el archivo."
                            : "Cualquier visitante podrá descargar el archivo directamente."}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 3: Archivo Adjunto */}
              <div className="section-card">
                <div className="section-card__header">
                  <span className="section-card__paso" aria-hidden="true">3</span>
                  <h4><ST>Archivo Digital</ST></h4>
                </div>
                <div className="section-card__body">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                    onChange={handleFileChange}
                  />

                  {documentoEditando && !archivoSeleccionado ? (
                    <div className="archivo-actual-box mb-3">
                      <FileText size={20} className="text-slate-500" />
                      <div>
                        <span className="block font-medium text-xs text-slate-700">
                          Archivo actual: {documentoEditando.nombreOriginal}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {formatearTamano(documentoEditando.tamanoBytes)} • Si desea reemplazarlo, seleccione uno nuevo a continuación.
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div
                    className="dropzone-doc"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud size={36} className="text-slate-400 mb-2" />
                    {archivoSeleccionado ? (
                      <div>
                        <span className="block font-semibold text-sm text-slate-900">
                          {archivoSeleccionado.name}
                        </span>
                        <span className="block text-xs text-emerald-600 mt-0.5">
                          {formatearTamano(archivoSeleccionado.size)} • Listo para subir
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="block font-semibold text-sm text-slate-800">
                          Haga clic o arrastre el archivo aquí
                        </span>
                        <span className="block text-xs text-slate-400 mt-1">
                          Formatos admitidos: PDF, Word, Excel, PPT, TXT, ZIP (máx. 30 MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {errorForm ? (
                <div className="aviso-error-banner">
                  <AlertCircle size={16} />
                  <span>{errorForm}</span>
                </div>
              ) : null}

              <div className="repositorio-modal-actions">
                <button
                  type="button"
                  className="btn-secundario-admin"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  <ST>Cancelar</ST>
                </button>
                <button
                  type="submit"
                  className="btn-primario-admin"
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <span className="spinner-sm" aria-hidden="true" />
                      <ST>Guardando documento...</ST>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <ST>{documentoEditando ? "Actualizar documento" : "Guardar y publicar"}</ST>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
        )
      ) : null}

      {/* MODAL CREAR CATEGORÍA (REP-P01-T2) */}
      {modalCatAbierto ? (
        createPortal(
        <div className="repositorio-modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setModalCatAbierto(false); }}>
          <div className="repositorio-modal-container max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="repositorio-modal-header">
              <h3><ST>Nueva Categoría de Documentos</ST></h3>
              <button
                type="button"
                className="repositorio-modal-close"
                onClick={() => setModalCatAbierto(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearCategoria} className="repositorio-modal-form">
              <div className="campo-grupo">
                <label htmlFor="cat-nombre">
                  <ST>Nombre de la categoría</ST> <span className="campo-requerido">*</span>
                </label>
                <input
                  id="cat-nombre"
                  type="text"
                  required
                  placeholder="Ej. Tesis de Grado"
                  value={catNombre}
                  onChange={(e) => setCatNombre(e.target.value)}
                />
              </div>

              <div className="campo-grupo">
                <label htmlFor="cat-padre">
                  <ST>Categoría Padre (dejar vacío para raíz)</ST>
                </label>
                <select
                  id="cat-padre"
                  value={catPadre}
                  onChange={(e) => setCatPadre(e.target.value)}
                >
                  <option value="">Categoría Raíz (sin padre)</option>
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
                </select>
              </div>

              {errorCat ? (
                <div className="aviso-error-banner">
                  <AlertCircle size={16} />
                  <span>{errorCat}</span>
                </div>
              ) : null}

              <div className="repositorio-modal-actions">
                <button
                  type="button"
                  className="btn-secundario-admin"
                  onClick={() => setModalCatAbierto(false)}
                >
                  <ST>Cancelar</ST>
                </button>
                <button
                  type="submit"
                  className="btn-primario-admin"
                  disabled={guardandoCat}
                >
                  {guardandoCat ? <span className="spinner-sm" /> : <Plus size={16} />}
                  <ST>Crear categoría</ST>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
        )
      ) : null}

      {/* MODAL DE VISUALIZACIÓN EN LÍNEA */}
      {docAVisualizar ? (
        <VisualizarDocumentoModal
          documento={docAVisualizar}
          onClose={() => setDocAVisualizar(null)}
        />
      ) : null}
    </AdminLayout>
  );
}
