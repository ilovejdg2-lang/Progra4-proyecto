import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Search,
  SlidersHorizontal,
  User,
  Users,
  X,
} from "lucide-react";

import "./Auditoria.css";
import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPaginacion } from "../../../hooks/useAdminPaginacion";
import { obtenerAuditoria } from "../../../services/auditoriaService";
import { AuditoriaComparacion } from "./AuditoriaComparacion";
import { tienePermiso, rolesDeUsuario } from "../../../lib/permisos";
import { getActiveSessionUser } from "../../../services/sessionService";
import { ST } from "../../../Components/T/ST";
import { t } from "../../../lib/t";
import { textoUi } from "../../../lib/textoVisible";

const MODULOS = [
  { id: "usuario", label: "Usuario" },
  { id: "voluntariado", label: "Voluntariado" },
  { id: "inventario", label: "Inventario" },
  { id: "producto", label: "Producto" },
  { id: "informacion_general", label: "Información general" },
  { id: "compras", label: "Compras" },
  { id: "facturacion", label: "Facturación" },
];

const TABLA_A_MODULO = {
  usuarios: "usuario",
  solicitudes_voluntariado: "voluntariado",
  fechas_voluntariado: "voluntariado",
  solicitudes_visitas_grupales: "voluntariado",
  disponibilidades_visitas: "voluntariado",
  donacion_solicitudes: "voluntariado",
  donacion_necesidades: "voluntariado",
  donacion_materiales_aceptados: "voluntariado",
  fechas_recepcion_donaciones: "voluntariado",
  inventario_stock_ubicaciones: "inventario",
  inventario_ubicaciones: "inventario",
  activos_fijos: "inventario",
  Pedido: "inventario",
  productos: "producto",
  categorias: "producto",
  hero_principal: "informacion_general",
  textos_institucionales: "informacion_general",
  tarjetas_inicio: "informacion_general",
  informacion_navbar: "informacion_general",
  informacion_footer: "informacion_general",
  galeria_institucional: "informacion_general",
  enlaces_sitio: "informacion_general",
  faq_inicio: "informacion_general",
  compras: "compras",
  compra_items: "compras",
  facturas: "facturacion",
  factura_items: "facturacion",
};

function moduloDeTabla(tabla) {
  return TABLA_A_MODULO[tabla] || tabla || "";
}

function etiquetaModulo(tabla) {
  const id = moduloDeTabla(tabla);
  return MODULOS.find((modulo) => modulo.id === id)?.label || tabla || "";
}

const ETIQUETAS_ACCION = {
  INSERT: "Creaci\u00f3n",
  UPDATE: "Actualizaci\u00f3n",
  DELETE: "Eliminaci\u00f3n",
  AJUSTE_STOCK: "Ajuste de stock",
};

function mapRegistro(registro) {
  return {
    id: registro?.id ?? registro?.Id ?? null,
    accion: registro?.accion ?? registro?.Accion ?? "",
    tabla: registro?.tabla ?? registro?.Tabla ?? "",
    idRegistro: registro?.idRegistro ?? registro?.IdRegistro ?? "",
    detalle: registro?.detalle ?? registro?.Detalle ?? "",
    datosAnteriores: registro?.datosAnteriores ?? registro?.DatosAnteriores ?? null,
    datosNuevos: registro?.datosNuevos ?? registro?.DatosNuevos ?? null,
    fecha: registro?.fecha ?? registro?.Fecha ?? null,
    idUsuario: registro?.idUsuario ?? registro?.IdUsuario ?? null,
    usuario: textoUi(
      registro?.usuario?.nombre ??
        registro?.usuario?.Nombre ??
        registro?.Usuario?.Nombre ??
        "",
    ),
  };
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return String(fecha);
  return valor.toLocaleString("es-CR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function BadgeAccion({ accion }) {
  const estilos = {
    INSERT: "badge-accion--insert",
    UPDATE: "badge-accion--update",
    DELETE: "badge-accion--delete",
    AJUSTE_STOCK: "badge-accion--ajuste",
  };

  return (
    <span
      className={`badge-accion-pill ${
        estilos[accion] ?? "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {ETIQUETAS_ACCION[accion] ? <ST>{ETIQUETAS_ACCION[accion]}</ST> : <ST>{accion}</ST>}
    </span>
  );
}

function FilaDetalle({ item, abierta, onToggle }) {
  const tieneCambios = item.datosAnteriores != null || item.datosNuevos != null;
  return (
    <>
      <tr className={`border-b border-slate-100 transition-colors ${abierta ? "row-expanded bg-slate-50/70" : "hover:bg-slate-50/50"}`}>
        <td className="whitespace-nowrap px-4 py-3.5 font-medium text-slate-700">{formatearFecha(item.fecha)}</td>
        <td className="px-4 py-3.5">
          <BadgeAccion accion={item.accion} />
        </td>
        <td className="px-4 py-3.5">
          <span className="badge-modulo-pill"><ST>{etiquetaModulo(item.tabla)}</ST></span>
        </td>
        <td className="max-w-md px-4 py-3.5 text-slate-700">
          <div className="flex items-start gap-2">
            {tieneCambios ? (
              <button
                type="button"
                onClick={onToggle}
                className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
                aria-expanded={abierta}
                aria-label={abierta ? t("Ocultar cambios") : t("Ver datos anteriores y nuevos")}
              >
                {abierta ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>
            ) : null}
            <span>
              {item.detalle ? <ST>{item.detalle}</ST> : "—"}
              {item.idRegistro ? (
                <span className="mt-0.5 block text-xs text-slate-400">Registro #{item.idRegistro}</span>
              ) : null}
            </span>
          </div>
        </td>
        <td className="px-4 py-3.5 font-medium text-slate-600">{item.usuario || <ST>Sistema</ST>}</td>
      </tr>
      {abierta && tieneCambios ? (
        <tr className="bg-slate-50/80">
          <td colSpan={5} className="px-4 py-3">
            <AuditoriaComparacion item={item} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function AdminAuditoria() {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const puedeVer = tienePermiso(roles, "ver_auditoria");

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [refrescando, setRefrescando] = useState(false);
  const [abiertos, setAbiertos] = useState({});
  const [filtrosApi, setFiltrosApi] = useState({
    usuario: "todos",
    accion: "todos",
    modulo: "todos",
    desde: "",
    hasta: "",
  });

  const { showLoading, loadingMessage } = useAdminPageGate("/admin/auditoria", !cargando);

  const {
    busqueda,
    setBusqueda,
    filtrados: registrosFiltrados,
    limpiar: limpiarBusqueda,
    hayFiltrosActivos: hayBusqueda,
    total,
    visibles,
  } = useAdminListaFiltros(registros, {
    buscarEn: (item) => [
      item.accion,
      ETIQUETAS_ACCION[item.accion],
      item.tabla,
      moduloDeTabla(item.tabla),
      etiquetaModulo(item.tabla),
      item.detalle,
      item.usuario,
      item.idRegistro,
      formatearFecha(item.fecha),
    ],
    filtrosConfig: [],
  });

  const {
    page,
    setPage,
    pageItems: registrosPagina,
    totalPages,
  } = useAdminPaginacion(registrosFiltrados);

  const usuariosDisponibles = useMemo(() => {
    const mapa = new Map();
    for (const item of registros) {
      if (item.idUsuario != null && item.usuario) {
        mapa.set(String(item.idUsuario), item.usuario);
      }
    }
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [registros]);

  const cargar = async ({ force = false } = {}) => {
    const data = await obtenerAuditoria({
      force,
      usuario: filtrosApi.usuario === "todos" ? "" : filtrosApi.usuario,
      accion: filtrosApi.accion,
      modulo: filtrosApi.modulo,
      desde: filtrosApi.desde,
      hasta: filtrosApi.hasta,
    });
    setRegistros(Array.isArray(data) ? data.map(mapRegistro) : []);
  };

  useEffect(() => {
    if (!puedeVer) {
      setCargando(false);
      return undefined;
    }

    let activo = true;
    setCargando(true);
    setError("");

    cargar()
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || "No se pudo cargar la auditor\u00eda.");
        setRegistros([]);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarga al cambiar filtrosApi
  }, [puedeVer, filtrosApi]);

  const resumen = useMemo(() => {
    const totalReg = registros.length;
    const modulos = new Set(registros.map((item) => moduloDeTabla(item.tabla)).filter(Boolean)).size;
    const usuarios = new Set(registros.map((item) => item.usuario).filter(Boolean)).size;
    const hoy = registros.filter((item) => {
      if (!item.fecha) return false;
      const d = new Date(item.fecha);
      if (Number.isNaN(d.getTime())) return false;
      return d.toDateString() === new Date().toDateString();
    }).length;
    return { total: totalReg, modulos, usuarios, hoy };
  }, [registros]);

  const hayFiltrosActivos =
    hayBusqueda ||
    filtrosApi.usuario !== "todos" ||
    filtrosApi.accion !== "todos" ||
    filtrosApi.modulo !== "todos" ||
    Boolean(filtrosApi.desde) ||
    Boolean(filtrosApi.hasta);

  const limpiar = () => {
    limpiarBusqueda();
    setFiltrosApi({
      usuario: "todos",
      accion: "todos",
      modulo: "todos",
      desde: "",
      hasta: "",
    });
  };

  const recargar = async () => {
    setRefrescando(true);
    setError("");
    try {
      await cargar({ force: true });
    } catch (err) {
      setError(err?.message || "No se pudo actualizar la auditoría.");
    } finally {
      setRefrescando(false);
    }
  };

  const setFiltroApi = (campo, valor) => {
    setFiltrosApi((actual) => ({ ...actual, [campo]: valor }));
  };

  const toggleAbierto = (id) => {
    setAbiertos((actual) => ({ ...actual, [id]: !actual[id] }));
  };

  if (!puedeVer) {
    return (
      <AdminLayout>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-slate-900"><ST>{"Auditoría"}</ST></h1>
          <p className="mt-2 text-sm text-slate-600"><ST>{"No tienes permiso para ver esta sección."}</ST></p>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <section className="auditoria-container rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-7 dark:border-slate-700 dark:bg-slate-900">
          <div className="auditoria-header">
            <div>
              <h1 className="auditoria-title"><ST>{"Auditoría"}</ST></h1>
              <p className="auditoria-subtitle">
                <ST>Registro de acciones y cambios realizados por administradores, superadministradores y vendedores.</ST>
              </p>
            </div>
            <button
              type="button"
              onClick={recargar}
              disabled={refrescando || cargando}
              className="btn-auditoria-reload"
            >
              <RefreshCw className={`size-4 ${refrescando ? "animate-spin" : ""}`} />
              <ST>Actualizar</ST>
            </button>
          </div>

          {/* Tarjetas KPI de Resumen */}
          <div className="auditoria-kpis-grid">
            <div className="auditoria-kpi-card">
              <div className="kpi-icon-box kpi-icon--blue">
                <Activity className="size-5" />
              </div>
              <div className="kpi-details">
                <span className="kpi-label"><ST>Total de Registros</ST></span>
                <span className="kpi-value">{resumen.total}</span>
              </div>
            </div>

            <div className="auditoria-kpi-card">
              <div className="kpi-icon-box kpi-icon--emerald">
                <Layers className="size-5" />
              </div>
              <div className="kpi-details">
                <span className="kpi-label"><ST>Módulos Auditados</ST></span>
                <span className="kpi-value">{resumen.modulos}</span>
              </div>
            </div>

            <div className="auditoria-kpi-card">
              <div className="kpi-icon-box kpi-icon--indigo">
                <Users className="size-5" />
              </div>
              <div className="kpi-details">
                <span className="kpi-label"><ST>Usuarios Activos</ST></span>
                <span className="kpi-value">{resumen.usuarios}</span>
              </div>
            </div>

            <div className="auditoria-kpi-card">
              <div className="kpi-icon-box kpi-icon--amber">
                <Clock className="size-5" />
              </div>
              <div className="kpi-details">
                <span className="kpi-label"><ST>Eventos de Hoy</ST></span>
                <span className="kpi-value">{resumen.hoy}</span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              <ST>{error}</ST>
            </div>
          ) : null}

          {cargando ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <RefreshCw className="mx-auto mb-2 size-6 animate-spin text-slate-400" />
              <p><ST>{"Cargando auditoría..."}</ST></p>
            </div>
          ) : registros.length === 0 && !hayFiltrosActivos ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-14 text-center">
              <ScrollText className="size-12 text-slate-300" />
              <p className="mt-3 text-base font-semibold text-slate-700"><ST>{"No hay registros de auditoría todavía."}</ST></p>
              <p className="mt-1 max-w-md text-sm text-slate-500"><ST>{"Aquí aparecerán cambios importantes en usuarios, productos, compras, facturación y voluntariado."}</ST></p>
            </div>
          ) : (
            <>
              {/* Panel de Búsqueda y Filtros */}
              <div className="auditoria-filter-panel">
                {/* Fila 1: Barra de búsqueda y badge de conteo */}
                <div className="auditoria-search-row">
                  <div className="auditoria-search-wrapper">
                    <Search className="auditoria-search-icon size-4" />
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder={t("Buscar por acción, módulo, detalle o usuario...")}
                      className="auditoria-search-input"
                    />
                    {busqueda ? (
                      <button
                        type="button"
                        onClick={() => setBusqueda("")}
                        className="auditoria-search-clear"
                        aria-label={t("Limpiar búsqueda")}
                      >
                        <X className="size-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="auditoria-actions-right">
                    <span className="auditoria-count-badge">
                      <ST>Mostrando</ST> <strong>{registrosFiltrados.length}</strong> <ST>de</ST> <strong>{registros.length}</strong> <ST>registros</ST>
                    </span>
                    {hayFiltrosActivos ? (
                      <button
                        type="button"
                        onClick={limpiar}
                        className="btn-auditoria-clear"
                      >
                        <RotateCcw className="size-3.5" />
                        <ST>Limpiar filtros</ST>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Fila 2: Grid uniforme y alineado de 5 filtros */}
                <div className="auditoria-filters-grid">
                  <div className="auditoria-filter-item">
                    <label htmlFor="filtro-auditoria-usuario" className="auditoria-filter-label">
                      <User className="size-3.5 text-slate-400" />
                      <ST>Usuario</ST>
                    </label>
                    <select
                      id="filtro-auditoria-usuario"
                      value={filtrosApi.usuario}
                      onChange={(e) => setFiltroApi("usuario", e.target.value)}
                      className="auditoria-filter-control"
                    >
                      <option value="todos">{t("Todos")}</option>
                      {usuariosDisponibles.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="auditoria-filter-item">
                    <label htmlFor="filtro-auditoria-modulo" className="auditoria-filter-label">
                      <Layers className="size-3.5 text-slate-400" />
                      <ST>Módulo</ST>
                    </label>
                    <select
                      id="filtro-auditoria-modulo"
                      value={filtrosApi.modulo}
                      onChange={(e) => setFiltroApi("modulo", e.target.value)}
                      className="auditoria-filter-control"
                    >
                      <option value="todos">{t("Todos")}</option>
                      {MODULOS.map((modulo) => (
                        <option key={modulo.id} value={modulo.id}>
                          {modulo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="auditoria-filter-item">
                    <label htmlFor="filtro-auditoria-accion" className="auditoria-filter-label">
                      <SlidersHorizontal className="size-3.5 text-slate-400" />
                      <ST>Acción</ST>
                    </label>
                    <select
                      id="filtro-auditoria-accion"
                      value={filtrosApi.accion}
                      onChange={(e) => setFiltroApi("accion", e.target.value)}
                      className="auditoria-filter-control"
                    >
                      <option value="todos">{t("Todas")}</option>
                      <option value="INSERT">{t("Creación")}</option>
                      <option value="UPDATE">{t("Actualización")}</option>
                      <option value="DELETE">{t("Eliminación")}</option>
                      <option value="AJUSTE_STOCK">{t("Ajuste de stock")}</option>
                    </select>
                  </div>

                  <div className="auditoria-filter-item">
                    <label htmlFor="filtro-auditoria-desde" className="auditoria-filter-label">
                      <Calendar className="size-3.5 text-slate-400" />
                      <ST>Desde</ST>
                    </label>
                    <input
                      type="date"
                      id="filtro-auditoria-desde"
                      value={filtrosApi.desde}
                      onChange={(e) => setFiltroApi("desde", e.target.value)}
                      className="auditoria-filter-control auditoria-date-input"
                    />
                  </div>

                  <div className="auditoria-filter-item">
                    <label htmlFor="filtro-auditoria-hasta" className="auditoria-filter-label">
                      <Calendar className="size-3.5 text-slate-400" />
                      <ST>Hasta</ST>
                    </label>
                    <input
                      type="date"
                      id="filtro-auditoria-hasta"
                      value={filtrosApi.hasta}
                      onChange={(e) => setFiltroApi("hasta", e.target.value)}
                      className="auditoria-filter-control auditoria-date-input"
                    />
                  </div>
                </div>

                {/* Chips de filtros activos */}
                {hayFiltrosActivos ? (
                  <div className="auditoria-active-chips">
                    <span className="auditoria-chips-title"><ST>Filtros aplicados:</ST></span>
                    {busqueda ? (
                      <span className="auditoria-chip">
                        <ST>Texto:</ST> <strong>"{busqueda}"</strong>
                        <button type="button" onClick={() => setBusqueda("")} aria-label="Quitar texto">
                          <X className="size-3" />
                        </button>
                      </span>
                    ) : null}
                    {filtrosApi.usuario !== "todos" ? (
                      <span className="auditoria-chip">
                        <ST>Usuario:</ST> <strong>{usuariosDisponibles.find(u => String(u.id) === String(filtrosApi.usuario))?.nombre || filtrosApi.usuario}</strong>
                        <button type="button" onClick={() => setFiltroApi("usuario", "todos")} aria-label="Quitar usuario">
                          <X className="size-3" />
                        </button>
                      </span>
                    ) : null}
                    {filtrosApi.modulo !== "todos" ? (
                      <span className="auditoria-chip">
                        <ST>Módulo:</ST> <strong>{MODULOS.find(m => m.id === filtrosApi.modulo)?.label || filtrosApi.modulo}</strong>
                        <button type="button" onClick={() => setFiltroApi("modulo", "todos")} aria-label="Quitar módulo">
                          <X className="size-3" />
                        </button>
                      </span>
                    ) : null}
                    {filtrosApi.accion !== "todos" ? (
                      <span className="auditoria-chip">
                        <ST>Acción:</ST> <strong>{ETIQUETAS_ACCION[filtrosApi.accion] || filtrosApi.accion}</strong>
                        <button type="button" onClick={() => setFiltroApi("accion", "todos")} aria-label="Quitar acción">
                          <X className="size-3" />
                        </button>
                      </span>
                    ) : null}
                    {filtrosApi.desde ? (
                      <span className="auditoria-chip">
                        <ST>Desde:</ST> <strong>{filtrosApi.desde}</strong>
                        <button type="button" onClick={() => setFiltroApi("desde", "")} aria-label="Quitar desde">
                          <X className="size-3" />
                        </button>
                      </span>
                    ) : null}
                    {filtrosApi.hasta ? (
                      <span className="auditoria-chip">
                        <ST>Hasta:</ST> <strong>{filtrosApi.hasta}</strong>
                        <button type="button" onClick={() => setFiltroApi("hasta", "")} aria-label="Quitar hasta">
                          <X className="size-3" />
                        </button>
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {registrosFiltrados.length === 0 ? (
                <div className="mt-4">
                  <AdminListaVacia onLimpiar={limpiar} />
                </div>
              ) : (
                <>
                  <div className="auditoria-table-card mt-6 hidden md:block">
                    <div className="auditoria-table-wrapper">
                      <table className="auditoria-table">
                        <thead>
                          <tr>
                            <th><ST>Fecha y Hora</ST></th>
                            <th><ST>Acción</ST></th>
                            <th><ST>Módulo</ST></th>
                            <th><ST>Detalle</ST></th>
                            <th><ST>Usuario</ST></th>
                          </tr>
                        </thead>
                        <tbody>
                          {registrosPagina.map((item) => (
                            <FilaDetalle
                              key={item.id ?? `${item.tabla}-${item.idRegistro}-${item.fecha}`}
                              item={item}
                              abierta={Boolean(abiertos[item.id])}
                              onToggle={() => toggleAbierto(item.id)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <AdminPaginacion
                      page={page}
                      totalPages={totalPages}
                      total={registrosFiltrados.length}
                      onChange={setPage}
                      label={"Paginación de auditoría"}
                    />
                  </div>

                  <div className="mt-6 grid gap-3 md:hidden">
                    {registrosPagina.map((item) => {
                      const abierta = Boolean(abiertos[item.id]);
                      const tieneCambios = item.datosAnteriores != null || item.datosNuevos != null;
                      return (
                        <article
                          key={item.id ?? `${item.tabla}-${item.idRegistro}-${item.fecha}`}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-500">{formatearFecha(item.fecha)}</p>
                              <div className="mt-1.5">
                                <span className="badge-modulo-pill">
                                  {etiquetaModulo(item.tabla)}
                                </span>
                              </div>
                            </div>
                            <BadgeAccion accion={item.accion} />
                          </div>
                          <p className="mt-3 text-sm text-slate-800">{item.detalle ? <ST>{item.detalle}</ST> : "—"}</p>
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                            <span>Usuario: <strong className="text-slate-700">{item.usuario || "Sistema"}</strong></span>
                            {item.idRegistro ? <span>ID #{item.idRegistro}</span> : null}
                          </div>
                          {tieneCambios ? (
                            <button
                              type="button"
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                              onClick={() => toggleAbierto(item.id)}
                            >
                              {abierta ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                              {abierta ? "Ocultar cambios" : "Ver datos anteriores y nuevos"}
                            </button>
                          ) : null}
                          {abierta && tieneCambios ? (
                            <div className="mt-3">
                              <AuditoriaComparacion item={item} />
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                    <AdminPaginacion
                      page={page}
                      totalPages={totalPages}
                      total={registrosFiltrados.length}
                      onChange={setPage}
                      label={"Paginación de auditoría"}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </AdminLayout>
    </AdminPageGate>
  );
}

export default AdminAuditoria;
