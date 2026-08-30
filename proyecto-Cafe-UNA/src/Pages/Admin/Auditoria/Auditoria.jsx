import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw, ScrollText } from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
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

const MODULOS = [
  { id: "usuario", label: "Usuario" },
  { id: "voluntariado", label: "Voluntariado" },
  { id: "inventario", label: "Inventario" },
  { id: "producto", label: "Producto" },
  { id: "informacion_general", label: "Información general" },
  { id: "compras", label: "Compras" },
];

const TABLA_A_MODULO = {
  usuarios: "usuario",
  solicitudes_voluntariado: "voluntariado",
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
  compras: "compras",
  compra_items: "compras",
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
    usuario:
      registro?.usuario?.nombre ??
      registro?.usuario?.Nombre ??
      registro?.Usuario?.Nombre ??
      "",
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
    INSERT: "border-emerald-200 bg-emerald-50 text-emerald-700",
    UPDATE: "border-blue-200 bg-blue-50 text-blue-700",
    DELETE: "border-red-200 bg-red-50 text-red-700",
    AJUSTE_STOCK: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[length:var(--text-body)] font-semibold ${
        estilos[accion] ?? "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {ETIQUETAS_ACCION[accion] ? <ST>{ETIQUETAS_ACCION[accion]}</ST> : accion}
    </span>
  );
}

function FilaDetalle({ item, abierta, onToggle }) {
  const tieneCambios = item.datosAnteriores != null || item.datosNuevos != null;
  return (
    <>
      <tr className="border-b border-slate-100">
        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatearFecha(item.fecha)}</td>
        <td className="px-4 py-3">
          <BadgeAccion accion={item.accion} />
        </td>
        <td className="px-4 py-3 text-slate-700"><ST>{etiquetaModulo(item.tabla)}</ST></td>
        <td className="max-w-md px-4 py-3 text-slate-700">
          <div className="flex items-start gap-2">
            {tieneCambios ? (
              <button
                type="button"
                onClick={onToggle}
                className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50"
                aria-expanded={abierta}
                aria-label={abierta ? t("Ocultar cambios") : t("Ver datos anteriores y nuevos")}
              >
                {abierta ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>
            ) : null}
            <span>
              {item.detalle || "—"}
              {item.idRegistro ? (
                <span className="mt-1 block text-xs text-slate-400">Registro #{item.idRegistro}</span>
              ) : null}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-slate-500">{item.usuario || <ST>Sistema</ST>}</td>
      </tr>
      {abierta && tieneCambios ? (
        <tr className="bg-slate-50">
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
    return { total: totalReg, modulos };
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
      setError(err?.message || "No se pudo actualizar la auditor\u00eda.");
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
          <h1 className="text-xl font-semibold text-slate-900"><ST>{"Auditor\u00eda"}</ST></h1>
          <p className="mt-2 text-sm text-slate-600"><ST>{"No tienes permiso para ver esta secci\u00f3n."}</ST></p>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900"><ST>{"Auditor\u00eda"}</ST></h1>
              <p className="mt-1 text-sm text-slate-600">
                <ST>Registro de acciones importantes realizadas por administradores, superadministradores y vendedores.</ST>
              </p>
            </div>
            <button
              type="button"
              onClick={recargar}
              disabled={refrescando || cargando}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${refrescando ? "animate-spin" : ""}`} />
              <ST>Actualizar</ST>
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500"><ST>Registros</ST></p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{resumen.total}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500"><ST>{"M\u00f3dulos auditados"}</ST></p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{resumen.modulos}</p>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {cargando ? (
            <p className="mt-6 text-sm text-slate-500"><ST>{"Cargando auditor\u00eda..."}</ST></p>
          ) : registros.length === 0 && !hayFiltrosActivos ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-6 py-12 text-center">
              <ScrollText className="size-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700"><ST>{"No hay registros de auditor\u00eda todav\u00eda."}</ST></p>
              <p className="mt-1 text-sm text-slate-500"><ST>{"Aqu\u00ed aparecer\u00e1n cambios importantes en usuarios, productos, contenido y voluntariado."}</ST></p>
            </div>
          ) : (
            <>
              <AdminListaToolbar
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                placeholder={"Buscar por acción, módulo, detalle o usuario..."}
                total={total}
                visibles={visibles}
                hayFiltrosActivos={hayFiltrosActivos}
                onLimpiar={limpiar}
                filtros={[
                  {
                    id: "usuario",
                    label: "Usuario",
                    value: filtrosApi.usuario,
                    onChange: (valor) => setFiltroApi("usuario", valor),
                    opciones: [
                      { value: "todos", label: "Todos" },
                      ...usuariosDisponibles.map((item) => ({
                        value: item.id,
                        label: item.nombre,
                      })),
                    ],
                  },
                  {
                    id: "modulo",
                    label: "Módulo",
                    value: filtrosApi.modulo,
                    onChange: (valor) => setFiltroApi("modulo", valor),
                    opciones: [
                      { value: "todos", label: "Todos" },
                      ...MODULOS.map((modulo) => ({
                        value: modulo.id,
                        label: modulo.label,
                      })),
                    ],
                  },
                  {
                    id: "accion",
                    label: "Acción",
                    value: filtrosApi.accion,
                    onChange: (valor) => setFiltroApi("accion", valor),
                    opciones: [
                      { value: "todos", label: "Todas" },
                      { value: "INSERT", label: "Creación" },
                      { value: "UPDATE", label: "Actualización" },
                      { value: "DELETE", label: "Eliminación" },
                      { value: "AJUSTE_STOCK", label: "Ajuste de stock" },
                    ],
                  },
                  {
                    id: "desde",
                    label: "Desde",
                    tipo: "fecha",
                    value: filtrosApi.desde,
                    onChange: (valor) => setFiltroApi("desde", valor),
                  },
                  {
                    id: "hasta",
                    label: "Hasta",
                    tipo: "fecha",
                    value: filtrosApi.hasta,
                    onChange: (valor) => setFiltroApi("hasta", valor),
                  },
                ]}
              />

              {registrosFiltrados.length === 0 ? (
                <div className="mt-4">
                  <AdminListaVacia onLimpiar={limpiar} />
                </div>
              ) : (
                <>
                  <div className="admin-table-shell mt-6 hidden md:block">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-[length:var(--text-body)]">
                      <thead>
                        <tr>
                          <th><ST>Fecha</ST></th>
                          <th><ST>{"Acci\u00f3n"}</ST></th>
                          <th><ST>{"M\u00f3dulo"}</ST></th>
                          <th><ST>Detalle</ST></th>
                          <th><ST>Usuario</ST></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
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

                  <div className="mt-6 grid gap-3 md:hidden">
                    {registrosPagina.map((item) => {
                      const abierta = Boolean(abiertos[item.id]);
                      const tieneCambios = item.datosAnteriores != null || item.datosNuevos != null;
                      return (
                        <article
                          key={item.id ?? `${item.tabla}-${item.idRegistro}-${item.fecha}`}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-slate-500">{formatearFecha(item.fecha)}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {etiquetaModulo(item.tabla)}
                              </p>
                            </div>
                            <BadgeAccion accion={item.accion} />
                          </div>
                          <p className="mt-3 text-sm text-slate-700">{item.detalle || "—"}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            Usuario: {item.usuario || "Sistema"}
                            {item.idRegistro ? ` · Registro #${item.idRegistro}` : ""}
                          </p>
                          {tieneCambios ? (
                            <button
                              type="button"
                              className="mt-3 text-xs font-semibold text-slate-600 underline"
                              onClick={() => toggleAbierto(item.id)}
                            >
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
                  </div>
                  <AdminPaginacion
                    page={page}
                    totalPages={totalPages}
                    total={registrosFiltrados.length}
                    onChange={setPage}
                    label={"Paginaci\u00f3n de auditor\u00eda"}
                  />
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
