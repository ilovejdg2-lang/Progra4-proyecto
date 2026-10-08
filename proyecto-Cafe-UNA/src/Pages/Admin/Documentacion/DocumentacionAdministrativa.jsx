import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Archive,
  BookOpen,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileArchive,
  FileCode,
  FileLock2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  FolderPlus,
  Layers,
  Lock,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { createPortal } from "react-dom";
import PageLoading from "../../../Components/PageLoading/PageLoading";
import { UiSelect } from "../../../Components/ui/Select";
import { SelectFiltro } from "../../../Components/ui/SelectFiltro";
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
import { rolesDeUsuario } from "../../../lib/permisos";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { VisualizarDocumentoModal } from "../../Repositorio/VisualizarDocumentoModal";
import "./Documentos.css";

const FORM_DOC_ADMIN_INICIAL = {
  titulo: "",
  descripcion: "",
  categoria: "",
  subcategoria: "",
  esPrivado: true, // Privado por defecto para documentación administrativa
  autor: "Administración Café-UNA",
  version: "1.0",
  palabrasClave: "administrativo, confidencial, interno",
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

export default function DocumentacionAdministrativa() {
  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const esAdmin =
    roles.some((r) =>
      ["admin", "superadmin", "administrador", "superadministrador"].includes(
        String(r || "").toLowerCase(),
      ),
    ) || String(actor?.role || "").toLowerCase() === "admin";

  // Pestaña activa: 'documentos' | 'categorias'
  const [tabActivo, setTabActivo] = useState("documentos");

  // Datos
  const [documentos, setDocumentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  // Filtros
  const [filtroBuscar, setFiltroBuscar] = useState("");
  const tPhBuscar = useTraducir("Buscar documento privado...");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("");

  // Modal Subida / Edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [documentoEditando, setDocumentoEditando] = useState(null);
  const [formDoc, setFormDoc] = useState(FORM_DOC_ADMIN_INICIAL);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const fileInputRef = useRef(null);

  // Formulario de Categoría
  const [modalCatAbierto, setModalCatAbierto] = useState(false);
  const [catNombre, setCatNombre] = useState("");
  const [catPadre, setCatPadre] = useState("");
  const [guardandoCat, setGuardandoCat] = useState(false);
  const [errorCat, setErrorCat] = useState("");

  // Descarga y visualizador
  const [descargandoId, setDescargandoId] = useState(null);
  const [docAVisualizar, setDocAVisualizar] = useState(null);

  // Bloqueo estricto del scroll de fondo al abrir modales
  useEffect(() => {
    if (modalAbierto || modalCatAbierto || docAVisualizar) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const prevBodyOverflow = document.body.style.overflow;
      const prevBodyPosition = document.body.style.position;
      const prevBodyTop = document.body.style.top;
      const prevBodyWidth = document.body.style.width;
      const prevHtmlOverflow = document.documentElement.style.overflow;

      document.documentElement.classList.add("admin-modal-open", "scroll-locked");
      document.body.classList.add("admin-modal-open", "scroll-locked");
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      const preventOuterScroll = (e) => {
        if (!e.target.closest(".admin-form-modal-body")) {
          e.preventDefault();
        }
      };

      window.addEventListener("wheel", preventOuterScroll, { passive: false });
      window.addEventListener("touchmove", preventOuterScroll, { passive: false });

      return () => {
        window.removeEventListener("wheel", preventOuterScroll);
        window.removeEventListener("touchmove", preventOuterScroll);

        document.documentElement.classList.remove("admin-modal-open", "scroll-locked");
        document.body.classList.remove("admin-modal-open", "scroll-locked");
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
        document.body.style.position = prevBodyPosition;
        document.body.style.top = prevBodyTop;
        document.body.style.width = prevBodyWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [modalAbierto, modalCatAbierto, docAVisualizar]);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      // En documentación administrativa filtramos los documentos privados (o todos los de ámbito administrativo)
      const [docs, cats, stats] = await Promise.all([
        obtenerDocumentosAdmin({
          buscar: filtroBuscar,
          categoria: filtroCategoria,
          esPrivado: "true", // Restringido a documentación privada/administrativa
          activo: filtroActivo,
        }),
        obtenerCategoriasDocumentos().catch(() => []),
        obtenerEstadisticasDocumentosAdmin().catch(() => null),
      ]);
      setDocumentos(docs);
      setCategorias(cats);
      if (stats) {
        setMetricas(stats.metricas || null);
      }
    } catch (err) {
      console.error("Error al cargar documentación administrativa:", err);
      setError("No se pudieron cargar los datos de documentación administrativa.");
    } finally {
      setCargando(false);
    }
  }, [filtroBuscar, filtroCategoria, filtroActivo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const abrirModalCrear = () => {
    setDocumentoEditando(null);
    setFormDoc(FORM_DOC_ADMIN_INICIAL);
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
      esPrivado: true, // Siempre privado
      autor: doc.autor || "Administración Café-UNA",
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
      fd.append("esPrivado", "true"); // Siempre privado en documentación administrativa
      fd.append("autor", formDoc.autor.trim());
      fd.append("version", formDoc.version.trim());
      fd.append("palabrasClave", formDoc.palabrasClave.trim());
      fd.append("activo", String(formDoc.activo));

      if (archivoSeleccionado) {
        fd.append("archivo", archivoSeleccionado);
      }

      if (documentoEditando) {
        await actualizarDocumentoAdmin(documentoEditando.id, fd);
        setMensajeExito("Documento administrativo actualizado con éxito.");
      } else {
        await crearDocumentoAdmin(fd);
        setMensajeExito("Documento administrativo registrado y resguardado con éxito.");
      }

      cerrarModal();
      await cargarDatos();
    } catch (err) {
      console.error("Error al guardar documento administrativo:", err);
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
        `Documento administrativo ${!doc.activo ? "activado" : "inactivado"} exitosamente.`,
      );
    } catch (err) {
      alert(err?.message || "No se pudo cambiar el estado del documento.");
    }
  };

  const handleEliminarDocumento = async (doc) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar permanentemente el documento administrativo "${doc.titulo}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      await eliminarDocumentoAdmin(doc.id);
      setDocumentos((prev) => prev.filter((d) => d.id !== doc.id));
      setMensajeExito("Documento administrativo eliminado correctamente.");
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
      setMensajeExito("Categoría administrativa creada con éxito.");
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

  const { showLoading, loadingMessage } = useAdminPageGate(
    "/admin/documentacion/administrativa",
    !cargando,
  );

  if (showLoading) {
    return (
      <AdminLayout>
        <PageLoading message={loadingMessage || "Cargando documentación administrativa..."} />
      </AdminLayout>
    );
  }

  if (!esAdmin) {
    return (
      <AdminLayout>
        <div className="admin-docs-container">
          <div className="admin-docs-panel text-center py-12">
            <ShieldCheck size={48} className="text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">
              <ST>Acceso Restringido</ST>
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              <ST>
                Este apartado es exclusivo para roles administrativos y superadministrativos.
              </ST>
            </p>
          </div>
        </div>
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
              <ShieldCheck size={14} className="mr-1.5 text-amber-600" />
              <ST>Área Administrativa Restringida</ST>
            </span>
            <h1 className="admin-docs-title">
              <ST>Documentación Administrativa</ST>
            </h1>
            <p className="admin-docs-subtitle">
              <ST>
                Gestión confidencial de documentos y clasificaciones privadas exclusivas para roles administrativos y superadministrativos.
              </ST>
            </p>
          </div>

          <div className="admin-docs-header__actions">
            <button
              type="button"
              className="btn-secundario-admin"
              onClick={exportarCatalogoDocumentosCsv}
              title="Descargar catálogo en CSV"
            >
              <Download size={16} />
              <span><ST>Exportar Catálogo</ST></span>
            </button>
            <button
              type="button"
              className="btn-primario-admin"
              onClick={abrirModalCrear}
            >
              <Plus size={16} />
              <span><ST>Nuevo Documento Privado</ST></span>
            </button>
          </div>
        </div>

        {/* Métricas Resumen */}
        {metricas ? (
          <div className="admin-docs-kpi-grid">
            <div className="admin-docs-kpi-card">
              <div className="kpi-icon kpi-icon--amber">
                <Lock size={20} />
              </div>
              <div>
                <span className="kpi-num">{documentos.length}</span>
                <span className="kpi-lbl"><ST>Documentos Privados</ST></span>
              </div>
            </div>
            <div className="admin-docs-kpi-card">
              <div className="kpi-icon kpi-icon--blue">
                <Layers size={20} />
              </div>
              <div>
                <span className="kpi-num">{categorias.length}</span>
                <span className="kpi-lbl"><ST>Categorías Temáticas</ST></span>
              </div>
            </div>
            <div className="admin-docs-kpi-card">
              <div className="kpi-icon kpi-icon--emerald">
                <Download size={20} />
              </div>
              <div>
                <span className="kpi-num">
                  {documentos.reduce((acc, d) => acc + (Number(d.descargasCount) || 0), 0)}
                </span>
                <span className="kpi-lbl"><ST>Descargas Totales</ST></span>
              </div>
            </div>
            <div className="admin-docs-kpi-card">
              <div className="kpi-icon kpi-icon--green">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="kpi-num">
                  {documentos.filter((d) => d.activo).length}
                </span>
                <span className="kpi-lbl"><ST>Archivos Activos</ST></span>
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
            <Lock size={16} />
            <span><ST>Documentos Privados ({documentos.length})</ST></span>
          </button>
          <button
            type="button"
            className={`admin-docs-tab ${tabActivo === "categorias" ? "admin-docs-tab--active" : ""}`}
            onClick={() => setTabActivo("categorias")}
          >
            <Layers size={16} />
            <span><ST>Categorías ({categorias.length})</ST></span>
          </button>
        </div>

        {/* ============================================================
            PESTAÑA 1: GESTIÓN DE DOCUMENTOS PRIVADOS
        ============================================================ */}
        {tabActivo === "documentos" ? (
          <div className="admin-docs-panel">
            {/* Toolbar de Filtros: alineados verticalmente a la par */}
            <div className="admin-docs-filter-bar">
              <div className="admin-docs-search">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder={tPhBuscar}
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
                ariaLabel="Estado"
                value={filtroActivo}
                onChange={setFiltroActivo}
                options={[
                  { value: "", label: "Cualquier estado" },
                  { value: "true", label: "Activos" },
                  { value: "false", label: "Inactivos" },
                ]}
              />

              {(filtroBuscar || filtroCategoria || filtroActivo) ? (
                <button
                  type="button"
                  className="btn-limpiar-filtros"
                  onClick={() => {
                    setFiltroBuscar("");
                    setFiltroCategoria("");
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
                <span>Cargando documentos administrativos...</span>
              </div>
            ) : documentos.length === 0 ? (
              <div className="admin-docs-empty">
                <FileLock2 size={48} className="text-slate-300" />
                <h4>No se encontraron documentos administrativos</h4>
                <p>Pruebe con otros filtros o registre un nuevo documento privado.</p>
                <button
                  type="button"
                  className="btn-primario-admin mt-3"
                  onClick={abrirModalCrear}
                >
                  <Plus size={16} />
                  <span>Nuevo Documento Privado</span>
                </button>
              </div>
            ) : (
              <div className="admin-docs-table-wrapper">
                <table className="admin-docs-table">
                  <thead>
                    <tr>
                      <th><ST>Documento</ST></th>
                      <th><ST>Categoría</ST></th>
                      <th><ST>Visibilidad</ST></th>
                      <th><ST>Tamaño</ST></th>
                      <th><ST>Descargas</ST></th>
                      <th><ST>Estado</ST></th>
                      <th className="text-right"><ST>Acciones</ST></th>
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
                            <span className="badge-priv-cell badge-priv-cell--priv">
                              <Lock size={12} />
                              <span>Privado / Administrativo</span>
                            </span>
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
                              <button
                                type="button"
                                className="action-btn action-btn--edit"
                                title="Editar documento"
                                onClick={() => abrirModalEditar(doc)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className={`action-btn ${doc.activo ? "action-btn--toggle-on" : "action-btn--toggle-off"}`}
                                title={doc.activo ? "Inactivar documento" : "Activar documento"}
                                onClick={() => handleToggleEstado(doc)}
                              >
                                <Power size={15} />
                              </button>
                              <button
                                type="button"
                                className="action-btn action-btn--delete"
                                title="Eliminar permanentemente"
                                onClick={() => handleEliminarDocumento(doc)}
                              >
                                <Trash2 size={15} />
                              </button>
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
            PESTAÑA 2: CATEGORÍAS ADMINISTRATIVAS
        ============================================================ */}
        {tabActivo === "categorias" ? (
          <div className="admin-docs-panel">
            <div className="admin-cat-banner">
              <div>
                <h4>Clasificación Temática de Documentación Administrativa</h4>
                <p>
                  Defina las categorías raíz y subcategorías para organizar los documentos de uso interno y confidencial.
                </p>
              </div>
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
            </div>

            <div className="admin-docs-table-wrapper">
              <table className="admin-docs-table">
                <thead>
                  <tr>
                    <th><ST>Nombre de Categoría</ST></th>
                    <th><ST>Nivel / Padre</ST></th>
                    <th><ST>Documentos Asociados</ST></th>
                    <th className="text-right"><ST>Acciones</ST></th>
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
                            <button
                              type="button"
                              className="action-btn action-btn--delete"
                              title="Eliminar categoría"
                              onClick={() => handleEliminarCategoria(cat)}
                            >
                              <Trash2 size={15} />
                            </button>
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
      </div>

      {/* ============================================================
          MODAL DE SUBIDA Y EDICIÓN DE DOCUMENTO PRIVADO
      ============================================================ */}
      {modalAbierto ? (
        createPortal(
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div
            className="admin-form-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-form-modal-header">
              <div className="admin-form-modal-header__title">
                <span className="badge--admin-docs">
                  <ShieldCheck size={14} className="text-amber-600 inline mr-1" />
                  <ST>{documentoEditando ? "Edición Administrativa" : "Nuevo Documento Privado"}</ST>
                </span>
                <h3>
                  <ST>{documentoEditando ? "Editar Documento Administrativo" : "Subir Documento al Repositorio Administrativo"}</ST>
                </h3>
              </div>
              <button
                type="button"
                className="admin-form-modal-close"
                onClick={cerrarModal}
                disabled={guardando}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-form-modal-body">
              <form id="form-doc-admin" onSubmit={handleSubmitDocumento} className="admin-form-grid">
                {/* Pregunta 1: Título */}
                <div className="admin-form-group">
                  <label htmlFor="admin-doc-titulo" className="admin-form-label">
                    <ST>¿Cuál es el título del documento?</ST> <span className="campo-requerido">*</span>
                  </label>
                  <p className="admin-form-helper"><ST>Indique un título claro y formal para el archivo institucional.</ST></p>
                  <input
                    id="admin-doc-titulo"
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="Ej. Acta de Asamblea Administrativa Ordinaria 2026"
                    value={formDoc.titulo}
                    onChange={(e) => setFormDoc({ ...formDoc, titulo: e.target.value })}
                  />
                </div>

                {/* Pregunta 2: Autor y Versión */}
                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label htmlFor="admin-doc-autor" className="admin-form-label">
                      <ST>¿Quién es el autor o entidad responsable?</ST>
                    </label>
                    <p className="admin-form-helper"><ST>Unidad administrativa responsable.</ST></p>
                    <input
                      id="admin-doc-autor"
                      type="text"
                      className="admin-form-input"
                      placeholder="Ej. Junta Directiva / Administración Café-UNA"
                      value={formDoc.autor}
                      onChange={(e) => setFormDoc({ ...formDoc, autor: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="admin-doc-version" className="admin-form-label">
                      <ST>¿Qué versión del documento corresponde?</ST>
                    </label>
                    <p className="admin-form-helper"><ST>Versión de archivo (ej. 1.0, 2.0).</ST></p>
                    <input
                      id="admin-doc-version"
                      type="text"
                      className="admin-form-input"
                      placeholder="1.0"
                      value={formDoc.version}
                      onChange={(e) => setFormDoc({ ...formDoc, version: e.target.value })}
                    />
                  </div>
                </div>

                {/* Pregunta 3: Categoría y Subcategoría */}
                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label htmlFor="admin-doc-cat" className="admin-form-label">
                      <ST>¿Cuál es la categoría temática principal?</ST> <span className="campo-requerido">*</span>
                    </label>
                    <p className="admin-form-helper"><ST>Clasificación interna.</ST></p>
                    <SelectFiltro
                      id="admin-doc-cat"
                      required
                      className="admin-form-select"
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
                    </SelectFiltro>
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="admin-doc-subcat" className="admin-form-label">
                      <ST>¿Pertenece a una subcategoría específica?</ST>
                    </label>
                    <p className="admin-form-helper"><ST>Opcional.</ST></p>
                    <SelectFiltro
                      id="admin-doc-subcat"
                      className="admin-form-select"
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
                    </SelectFiltro>
                  </div>
                </div>

                {/* Pregunta 4: Descripción */}
                <div className="admin-form-group">
                  <label htmlFor="admin-doc-desc" className="admin-form-label">
                    <ST>¿Cuál es la descripción o resumen del contenido?</ST>
                  </label>
                  <p className="admin-form-helper"><ST>Resumen de acuerdos, temas o contenido confidencial.</ST></p>
                  <textarea
                    id="admin-doc-desc"
                    rows={3}
                    className="admin-form-textarea"
                    placeholder="Breve resumen del contenido y propósito del documento..."
                    value={formDoc.descripcion}
                    onChange={(e) => setFormDoc({ ...formDoc, descripcion: e.target.value })}
                  />
                </div>

                {/* Pregunta 5: Palabras clave */}
                <div className="admin-form-group">
                  <label htmlFor="admin-doc-tags" className="admin-form-label">
                    <ST>¿Cuáles son las palabras clave para búsqueda rápida?</ST>
                  </label>
                  <p className="admin-form-helper"><ST>Términos separados por comas.</ST></p>
                  <input
                    id="admin-doc-tags"
                    type="text"
                    className="admin-form-input"
                    placeholder="actas, financiero, compras, convenios"
                    value={formDoc.palabrasClave}
                    onChange={(e) => setFormDoc({ ...formDoc, palabrasClave: e.target.value })}
                  />
                </div>

                {/* Aviso de Privacidad fija para Documentación Administrativa */}
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    <ST>Nivel de privacidad y acceso</ST>
                  </label>
                  <div className="admin-form-radio-card is-selected cursor-default">
                    <Lock size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <div className="radio-content">
                      <span className="radio-title">
                        <ST>Documento Privado y Confidencial</ST>
                      </span>
                      <span className="radio-desc">
                        <ST>
                          Este documento está reservado estrictamente para los roles administrativos y superadministrativos. No es visible ni descargable para el público general.
                        </ST>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pregunta 7: Archivo Digital */}
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    <ST>¿Qué archivo digital desea adjuntar?</ST> {!documentoEditando ? <span className="campo-requerido">*</span> : null}
                  </label>
                  <p className="admin-form-helper"><ST>Formatos admitidos: PDF, Word, Excel, PPT, TXT, ZIP (máx. 30 MB).</ST></p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                    onChange={handleFileChange}
                  />

                  {documentoEditando && !archivoSeleccionado ? (
                    <div className="archivo-actual-box mb-2.5">
                      <FileText size={20} className="text-slate-500" />
                      <div>
                        <span className="block font-medium text-xs text-slate-700">
                          Archivo actual: {documentoEditando.nombreOriginal}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {formatearTamano(documentoEditando.tamanoBytes)} • Para reemplazarlo, seleccione un nuevo archivo abajo.
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div
                    className="dropzone-doc"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud size={32} className="text-slate-400 mb-2" />
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

                {errorForm ? (
                  <div className="aviso-error-banner">
                    <AlertCircle size={16} />
                    <span>{errorForm}</span>
                  </div>
                ) : null}
              </form>
            </div>

            {/* Botones de acción alineados al costado derecho del formulario */}
            <div className="admin-form-modal-footer">
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
                form="form-doc-admin"
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
                    <ST>{documentoEditando ? "Actualizar documento" : "Guardar documento privado"}</ST>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
        )
      ) : null}

      {/* MODAL CREAR CATEGORÍA */}
      {modalCatAbierto ? (
        createPortal(
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalCatAbierto(false);
          }}
        >
          <div className="admin-form-modal-container max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="admin-form-modal-header">
              <div className="admin-form-modal-header__title">
                <h3><ST>Nueva Categoría Administrativa</ST></h3>
              </div>
              <button
                type="button"
                className="admin-form-modal-close"
                onClick={() => setModalCatAbierto(false)}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-form-modal-body">
              <form id="form-crear-cat-admin" onSubmit={handleCrearCategoria} className="admin-form-grid">
                <div className="admin-form-group">
                  <label htmlFor="cat-nombre-admin" className="admin-form-label">
                    <ST>¿Cuál es el nombre de la categoría?</ST> <span className="campo-requerido">*</span>
                  </label>
                  <p className="admin-form-helper"><ST>Ejemplo: Actas de Junta, Contratos, Auditoría Interna.</ST></p>
                  <input
                    id="cat-nombre-admin"
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="Ej. Actas de Junta Directiva"
                    value={catNombre}
                    onChange={(e) => setCatNombre(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="cat-padre-admin" className="admin-form-label">
                    <ST>¿Desea asignarle una categoría padre?</ST>
                  </label>
                  <p className="admin-form-helper"><ST>Deje en blanco si desea que sea una categoría raíz.</ST></p>
                  <SelectFiltro
                    id="cat-padre-admin"
                    className="admin-form-select"
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
                  </SelectFiltro>
                </div>

                {errorCat ? (
                  <div className="aviso-error-banner">
                    <AlertCircle size={16} />
                    <span>{errorCat}</span>
                  </div>
                ) : null}
              </form>
            </div>

            {/* Botones de acción alineados al costado derecho del formulario */}
            <div className="admin-form-modal-footer">
              <button
                type="button"
                className="btn-secundario-admin"
                onClick={() => setModalCatAbierto(false)}
              >
                <ST>Cancelar</ST>
              </button>
              <button
                type="submit"
                form="form-crear-cat-admin"
                className="btn-primario-admin"
                disabled={guardandoCat}
              >
                {guardandoCat ? <span className="spinner-sm" /> : <Plus size={16} />}
                <ST>Crear categoría</ST>
              </button>
            </div>
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
