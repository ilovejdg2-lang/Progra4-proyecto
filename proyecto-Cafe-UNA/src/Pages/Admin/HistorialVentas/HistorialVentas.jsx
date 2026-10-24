import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, PackageCheck, Receipt, RotateCcw, Truck, X } from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminModal, AdminModalBody, AdminModalHeader } from "../../../Components/Admin/ui/AdminModal";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import { ComprobantePago } from "../../../Components/ComprobantePago/ComprobantePago";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import {
  filtrarVentasLocales,
  filtrosInicialesHistorial,
  hayFiltrosHistorial,
  parametrosListadoVentas,
} from "../../../lib/filtrosHistorialVentas";
import {
  cambiarEstadoCompra,
  obtenerCompraPorId,
  obtenerComprasAdmin,
  obtenerOpcionesFiltroVentas,
} from "../../../services/comprasService";
import { obtenerVentas } from "../../../lib/ventasStorage";
import { tienePermiso, rolesDeUsuario } from "../../../lib/permisos";
import { getActiveSessionUser } from "../../../services/sessionService";
import { ST } from "../../../Components/T/ST";
import { t } from "../../../lib/t";
import { useTraducir } from "../../../hooks/useTraducir";

function formatCRC(value) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatFecha(fecha) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return t("Sin fecha");
  return valor.toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" });
}

function normalizarEstadoUi(estadoRaw) {
  const estado = String(estadoRaw || "Pendiente").trim();
  if (estado === "Aprobado" || estado === "Aprobada") return "Aceptado";
  if (estado === "Recibido" || estado === "Enviada" || estado === "Enviado" || estado === "Pagado") {
    return "Entregado";
  }
  if (estado === "Rechazada") return "Rechazado";
  if (estado === "Devolución" || estado === "Devoluciones" || estado === "Devuelto") return "Devolucion";
  return estado;
}

function badgeEstado(estadoRaw) {
  switch (normalizarEstadoUi(estadoRaw)) {
    case "Pendiente":
      return "text-amber-800 dark:text-amber-300";
    case "Aceptado":
      return "text-sky-800 dark:text-sky-300";
    case "Entregado":
      return "text-emerald-800 dark:text-emerald-300";
    case "Rechazado":
      return "text-rose-800 dark:text-rose-300";
    case "Devolucion":
      return "text-violet-800 dark:text-violet-300";
    default:
      return "text-slate-700 dark:text-slate-200";
  }
}

function formatFechaCorta(fecha) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return t("Sin fecha");
  return valor.toLocaleDateString("es-CR", { dateStyle: "short" });
}

function mapLocalVenta(venta) {
  const estado = normalizarEstadoUi(venta.estadoPago || "Pendiente");
  const total = venta.total;
  return {
    id: venta.id,
    numero: venta.id,
    fecha: venta.fecha,
    clienteNombre: venta.cliente,
    clienteCorreo: venta.correo || "",
    cantidadProductos: (venta.items || []).reduce((acc, item) => acc + (Number(item.units) || 1), 0),
    subtotal: venta.subtotal,
    impuestos: venta.iva,
    total,
    metodoPago: venta.metodo,
    estado,
    facturaId: null,
    editable: estado === "Pendiente" || estado === "Aceptado" || estado === "Rechazado",
    ganado: estado === "Entregado" ? total : null,
    ubicacionCodigo: venta.ubicacionCodigo || venta.puntoCodigo || null,
    ubicacionNombre: venta.puntoVenta || null,
    vendedorId: venta.vendedorId ? String(venta.vendedorId) : "",
    tieneComprobante: false,
    cliente: null,
    items: (venta.items || []).map((item) => ({
      nombre: item.nombre,
      cantidad: item.units || 1,
      precioUnitario: item.precioUnitario ?? ((item.total || 0) / (item.units || 1)),
      subtotal: item.total || 0,
      categoria: item.categoria || "",
    })),
  };
}

function BadgeEstadoCompra({ estado }) {
  const normalizado = normalizarEstadoUi(estado);
  const etiqueta = useTraducir(normalizado === "Devolucion" ? "Devolución" : normalizado);
  return (
    <span
      className={`admin-chip-estado text-[length:var(--text-body)] font-semibold ${badgeEstado(normalizado)}`}
      style={{ textDecoration: "none", textDecorationLine: "none" }}
      spellCheck={false}
    >
      {etiqueta}
    </span>
  );
}

const filaDetalle = "flex flex-col gap-0.5 border-b border-slate-100 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3";
const valorDetalle = "min-w-0 break-words font-medium text-slate-900 no-underline sm:text-right";

function FilaDetalle({ etiqueta, children }) {
  return (
    <div className={filaDetalle}>
      <dt className="shrink-0 text-slate-500"><ST>{etiqueta}</ST></dt>
      <dd className={valorDetalle}>{children}</dd>
    </div>
  );
}

function ClienteVenta({ detalle }) {
  const cliente = detalle?.cliente;
  if (!cliente && !detalle?.clienteCorreo) {
    return <FilaDetalle etiqueta="Cliente">{detalle?.clienteNombre}</FilaDetalle>;
  }
  const nombre = cliente?.tipo === "empresa"
    ? (cliente.razonSocial || cliente.nombreComercial || detalle.clienteNombre)
    : [cliente?.nombre, cliente?.apellidos].filter(Boolean).join(" ") || detalle.clienteNombre;
  return (
    <>
      <FilaDetalle etiqueta="Cliente">{nombre}</FilaDetalle>
      {cliente?.tipo ? (
        <FilaDetalle etiqueta="Tipo de cliente">
          <ST>{cliente.tipo === "empresa" ? "Persona jurídica" : "Persona física"}</ST>
        </FilaDetalle>
      ) : null}
      {detalle.clienteCorreo || cliente?.correo ? (
        <FilaDetalle etiqueta="Correo">{cliente?.correo || detalle.clienteCorreo}</FilaDetalle>
      ) : null}
      {cliente?.telefono ? <FilaDetalle etiqueta="Teléfono">{cliente.telefono}</FilaDetalle> : null}
      {cliente?.identificacion ? <FilaDetalle etiqueta="Identificación">{cliente.identificacion}</FilaDetalle> : null}
      {cliente?.cedulaJuridica ? <FilaDetalle etiqueta="Cédula jurídica">{cliente.cedulaJuridica}</FilaDetalle> : null}
      {cliente?.representanteLegal ? <FilaDetalle etiqueta="Representante legal">{cliente.representanteLegal}</FilaDetalle> : null}
    </>
  );
}

export default function HistorialVentas({
  modo = "historial",
  locationCode = "",
  locationName = "",
} = {}) {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const esAdmin = roles.includes("SuperAdmin") || roles.includes("Admin");
  const puedeVer = tienePermiso(roles, "ver_ventas") || tienePermiso(roles, "ver_historial_compras_clientes");
  const puedeGestionar =
    tienePermiso(roles, "actualizar_ventas") || tienePermiso(roles, "registrar_ventas");
  const esPendientes = modo === "pendientes";
  const gatePath = esPendientes
    ? "/admin/ventas-pendientes"
    : locationCode
      ? `/admin/puntos-venta/${locationCode}/ventas`
      : "/admin/historial-ventas";
  const { showLoading, loadingMessage } = useAdminPageGate(gatePath, true);
  const [detalle, setDetalle] = useState(null);
  const [compras, setCompras] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [opcionesFiltro, setOpcionesFiltro] = useState({ puntos: [], categorias: [], vendedores: [] });
  const [filtros, setFiltros] = useState(() => filtrosInicialesHistorial(esPendientes));

  const load = useCallback(async () => {
    if (!puedeVer) return;
    setStatus("loading");
    setError("");
    try {
      const result = await obtenerComprasAdmin(
        parametrosListadoVentas({
          page,
          pageSize: 10,
          filtros,
          esPendientes,
          locationCode,
        }),
      );
      setCompras(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setStatus("success");
    } catch (loadError) {
      const local = filtrarVentasLocales(obtenerVentas().map(mapLocalVenta), {
        esPendientes,
        locationCode,
        filtros,
      });
      setCompras(local);
      setTotal(local.length);
      setTotalPages(1);
      setStatus("success");
      setError(loadError instanceof Error ? loadError.message : "Usando historial local.");
    }
  }, [puedeVer, page, filtros, esPendientes, locationCode]);

  const limpiarFiltros = () => {
    setPage(1);
    setFiltros(filtrosInicialesHistorial(esPendientes));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de datos al cambiar filtros
    load();
  }, [load]);

  useEffect(() => {
    if (!puedeVer) return undefined;
    let activo = true;
    obtenerOpcionesFiltroVentas()
      .then((opciones) => {
        if (activo) setOpcionesFiltro(opciones);
      })
      .catch(() => {
        if (activo) setOpcionesFiltro({ puntos: [], categorias: [], vendedores: [] });
      });
    return () => {
      activo = false;
    };
  }, [puedeVer]);

  const ganadoTotal = useMemo(
    () =>
      compras.reduce((acc, compra) => {
        if (compra.ganado == null) return acc;
        return acc + Number(compra.ganado || 0);
      }, 0),
    [compras],
  );

  const abrirDetalle = async (compra) => {
    setActionError("");
    try {
      const detalleApi = await obtenerCompraPorId(compra.id);
      setDetalle(detalleApi);
    } catch {
      setDetalle(compra);
    }
  };

  const actualizarEstado = async (compra, estado) => {
    if (!puedeGestionar || !compra?.id) return;
    setActionLoading(`${compra.id}:${estado}`);
    setActionError("");
    try {
      const actualizada = await cambiarEstadoCompra(compra.id, estado);
      setCompras((prev) =>
        prev.map((row) => (String(row.id) === String(actualizada.id) ? actualizada : row)),
      );
      setDetalle(actualizada);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar el estado.");
    } finally {
      setActionLoading("");
    }
  };

  if (!puedeVer) {
    return (
      <AdminPageGate showLoading={showLoading} message={loadingMessage}>
        <AdminLayout>
          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
            <h1 className="text-[length:var(--text-title)] font-semibold text-slate-950"><ST>Acceso restringido</ST></h1>
            <p className="mx-auto mt-2 max-w-md text-[length:var(--text-body)] text-slate-500">
              <ST>No tiene permiso para ver el historial de ventas.</ST>
            </p>
          </section>
        </AdminLayout>
      </AdminPageGate>
    );
  }

  const estadoDetalle = normalizarEstadoUi(detalle?.estado);
  const nombrePunto = locationName || compras.find((compra) => compra.ubicacionNombre)?.ubicacionNombre || locationCode;
  const editableDetalle =
    detalle?.editable ??
    (estadoDetalle === "Pendiente" || estadoDetalle === "Aceptado" || estadoDetalle === "Rechazado");

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-[length:var(--text-title)] font-semibold text-slate-900">
                    <ST>
                      {esPendientes
                        ? "Ventas pendientes de confirmar"
                        : locationCode
                          ? `Historial de ventas · ${nombrePunto}`
                          : esAdmin
                            ? "Historial de ventas (Todos los vendedores)"
                            : "Historial de tus puntos de venta"}
                    </ST>
                  </h1>
                  <p className="mt-1 text-[length:var(--text-body)] text-slate-500">
                    <ST>
                      {esPendientes
                        ? "Revisá cada solicitud web, el cliente que la envió y el comprobante de pago antes de aceptar o rechazar."
                        : locationCode
                          ? "Ventas asociadas a este punto de venta, incluyendo compras web y presenciales."
                          : esAdmin
                            ? "Supervisión y control de ventas realizadas por todos los vendedores en puntos físicos y web."
                            : "Ventas de tus puntos asignados y las que registraste personalmente."}
                    </ST>
                  </p>
                </div>
                {!esAdmin ? (
                  <span className="inline-flex max-w-full items-center gap-1.5 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                    <span className="break-all">{user?.nombre || user?.correo || "Vendedor"}</span>
                  </span>
                ) : null}
              </div>
              {error ? <p className="mt-2 text-[length:var(--text-body)] text-amber-700 no-underline"><ST>{error}</ST></p> : null}
            </div>

            <div className="grid gap-3 border-b border-slate-100 px-4 py-4 sm:grid-cols-3 sm:px-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="break-words text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-500"><ST>Pedidos</ST></p>
                <p className="mt-1 text-[length:var(--text-subtitle)] font-semibold text-slate-950">{total}</p>
              </div>
              <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 sm:col-span-2">
                <p className="break-words text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-700">
                  <ST>Ganado (enviados en esta página)</ST>
                </p>
                <p className="mt-1 text-[length:var(--text-subtitle)] font-semibold text-slate-900">
                  {formatCRC(ganadoTotal)}
                </p>
              </div>
            </div>

            <AdminListaToolbar
              busqueda={filtros.busqueda}
              onBusquedaChange={(valor) => {
                setPage(1);
                setFiltros((current) => ({ ...current, busqueda: valor }));
              }}
              placeholder="Buscar por cliente o número de compra..."
              total={total}
              visibles={compras.length}
              hayFiltrosActivos={hayFiltrosHistorial(filtros, { esPendientes, locationCode })}
              onLimpiar={limpiarFiltros}
              filaClassName="mx-auto flex w-full min-w-0 flex-col gap-4"
              filtrosContenedorClassName="grid w-full min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3"
              filtros={[
                { id: "desde", label: "Desde", tipo: "fecha", value: filtros.desde, onChange: (valor) => { setPage(1); setFiltros((c) => ({ ...c, desde: valor })); } },
                { id: "hasta", label: "Hasta", tipo: "fecha", value: filtros.hasta, onChange: (valor) => { setPage(1); setFiltros((c) => ({ ...c, hasta: valor })); } },
                ...(esPendientes
                  ? []
                  : [{
                      id: "estado",
                      label: "Estado",
                      value: filtros.estado,
                      onChange: (valor) => { setPage(1); setFiltros((c) => ({ ...c, estado: valor })); },
                      opciones: [
                        { value: "todos", label: "Todos" },
                        { value: "Pendiente", label: "Pendiente" },
                        { value: "Aceptado", label: "Aceptado" },
                        { value: "Entregado", label: "Entregado" },
                        { value: "Rechazado", label: "Rechazado" },
                        { value: "Devolucion", label: "Devolución" },
                      ],
                    }]),
                ...(locationCode
                  ? []
                  : [{
                      id: "punto",
                      label: "Punto de venta",
                      value: filtros.punto || "todos",
                      onChange: (valor) => { setPage(1); setFiltros((c) => ({ ...c, punto: valor === "todos" ? "" : valor })); },
                      opciones: [
                        { value: "todos", label: "Todos" },
                        ...opcionesFiltro.puntos.map((punto) => ({ value: punto.codigo, label: punto.nombre })),
                      ],
                    }]),
                {
                  id: "categoria",
                  label: "Categoría",
                  value: filtros.categoria || "todos",
                  onChange: (valor) => { setPage(1); setFiltros((c) => ({ ...c, categoria: valor === "todos" ? "" : valor })); },
                  opciones: [
                    { value: "todos", label: "Todas" },
                    ...opcionesFiltro.categorias.map((categoria) => ({ value: categoria, label: categoria })),
                  ],
                },
                {
                  id: "vendedor",
                  label: "Vendedor",
                  value: filtros.vendedorId || "todos",
                  onChange: (valor) => { setPage(1); setFiltros((c) => ({ ...c, vendedorId: valor === "todos" ? "" : valor })); },
                  opciones: [
                    { value: "todos", label: "Todos" },
                    ...opcionesFiltro.vendedores.map((vendedor) => ({ value: vendedor.id, label: vendedor.nombre })),
                  ],
                },
              ]}
            />

            {status === "loading" ? (
              <div className="px-4 py-14 text-center text-[length:var(--text-body)] text-slate-500"><ST>Cargando compras...</ST></div>
            ) : compras.length === 0 ? (
              <AdminListaVacia onLimpiar={limpiarFiltros} />
            ) : (
              <>
              <ul className="divide-y divide-slate-100 md:hidden">
                {compras.map((compra) => (
                  <li key={compra.id || compra.numero} className="space-y-2 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all font-medium text-slate-900">{compra.numero || "—"}</p>
                        <p className="mt-0.5 text-slate-500"><ST>{formatFechaCorta(compra.fecha)}</ST></p>
                      </div>
                      <BadgeEstadoCompra estado={compra.estado} />
                    </div>
                    <p className="break-words text-slate-700">{compra.clienteNombre || "—"}</p>
                    {compra.ubicacionNombre ? (
                      <p className="break-words text-slate-500">
                        <ST>Punto de venta</ST>: {compra.ubicacionNombre}
                      </p>
                    ) : null}
                    {compra.vendedorNombre || compra.vendedorCorreo ? (
                      <p className="break-words text-slate-500">
                        <ST>Vendedor</ST>: {compra.vendedorNombre || compra.vendedorCorreo}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-slate-600">{compra.cantidadProductos} <ST>productos</ST></p>
                      <p className="font-semibold text-slate-900">{formatCRC(compra.total)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => abrirDetalle(compra)}
                      className="inline-flex h-[var(--control-height)] w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[length:var(--text-body)] font-semibold text-slate-700"
                      aria-label={`${t("Ver compra")} ${compra.numero}`}
                    >
                      <Eye className="size-4" /> <ST>Ver</ST>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="admin-table-shell hidden md:block">
                <table className="w-full text-left text-[length:var(--text-body)]">
                  <thead>
                    <tr>
                      <th><ST>Recibo</ST></th>
                      <th><ST>Fecha</ST></th>
                      <th><ST>Cliente</ST></th>
                      <th><ST>Productos</ST></th>
                      <th><ST>Total</ST></th>
                      <th><ST>Estado</ST></th>
                      <th><ST>Acciones</ST></th>
                    </tr>
                  </thead>
                  <tbody>
                    {compras.map((compra) => (
                      <tr key={compra.id || compra.numero} className="border-b border-slate-100 last:border-b-0">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                          {compra.numero || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          <ST>{formatFechaCorta(compra.fecha)}</ST>
                        </td>
                        <td className="max-w-[16rem] px-4 py-3 text-slate-700">
                          <p className="truncate" title={compra.clienteNombre}>{compra.clienteNombre}</p>
                          {compra.ubicacionNombre ? (
                            <p className="truncate text-slate-500" title={compra.ubicacionNombre}>{compra.ubicacionNombre}</p>
                          ) : null}
                          {compra.vendedorNombre || compra.vendedorCorreo ? (
                            <p className="truncate text-slate-500" title={compra.vendedorNombre || compra.vendedorCorreo}>
                              {compra.vendedorNombre || compra.vendedorCorreo}
                            </p>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{compra.cantidadProductos}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-800">{formatCRC(compra.total)}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <BadgeEstadoCompra estado={compra.estado} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button
                            type="button"
                            onClick={() => abrirDetalle(compra)}
                            className="inline-flex h-[var(--control-height)] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[length:var(--text-body)] font-semibold text-slate-700"
                            aria-label={`${t("Ver compra")} ${compra.numero}`}
                          >
                            <Eye className="size-4" /> <ST>Ver</ST>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}

            <AdminPaginacion
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={10}
              onChange={setPage}
              label="Paginación de ventas"
            />
          </section>
        </div>

        {detalle ? (
          <AdminModal open onClose={() => setDetalle(null)} maxWidth="max-w-xl" labelledBy="venta-detalle-title">
            <AdminModalHeader>
              <h2 id="venta-detalle-title" className="break-all text-[length:var(--text-subtitle)] font-semibold text-slate-900">
                <ST>Compra</ST> {detalle.numero}
              </h2>
              <button type="button" onClick={() => setDetalle(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100" aria-label={t("Cerrar")}>
                <X className="size-5" />
              </button>
            </AdminModalHeader>
            <AdminModalBody>
              {actionError ? (
                <p className="mb-3 text-[length:var(--text-body)] text-rose-700 no-underline" role="alert"><ST>{actionError}</ST></p>
              ) : null}
              <dl className="grid text-[length:var(--text-body)]">
                <FilaDetalle etiqueta="Vendedor">
                  {detalle.vendedorNombre || detalle.vendedorCorreo || <ST>Sin registrar</ST>}
                </FilaDetalle>
                <ClienteVenta detalle={detalle} />
                {detalle.ubicacionNombre ? (
                  <FilaDetalle etiqueta="Punto de venta">{detalle.ubicacionNombre}</FilaDetalle>
                ) : null}
                <FilaDetalle etiqueta="Fecha"><ST>{formatFecha(detalle.fecha)}</ST></FilaDetalle>
                <FilaDetalle etiqueta="Método"><ST>{detalle.metodoPago}</ST></FilaDetalle>
                <div className={filaDetalle}>
                  <dt className="shrink-0 text-slate-500"><ST>Estado</ST></dt>
                  <dd><BadgeEstadoCompra estado={detalle.estado} /></dd>
                </div>
              </dl>
              <ul className="mt-4 space-y-2 text-[length:var(--text-body)]">
                {(detalle.items || []).map((item, index) => (
                  <li key={`${item.nombre}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 break-words font-medium no-underline"><ST>{item.nombre}</ST></span>
                      <span className="shrink-0 font-semibold">{formatCRC(item.subtotal)}</span>
                    </div>
                    <p className="mt-1 text-[length:var(--text-body)] text-slate-500">{item.cantidad} × {formatCRC(item.precioUnitario)}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 grid gap-1 text-[length:var(--text-body)]">
                <div className="flex justify-between"><dt className="text-slate-500"><ST>Subtotal</ST></dt><dd>{formatCRC(detalle.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500"><ST>Impuestos</ST></dt><dd>{formatCRC(detalle.impuestos)}</dd></div>
                <div className="flex justify-between font-bold"><dt><ST>Total</ST></dt><dd>{formatCRC(detalle.total)}</dd></div>
              </dl>

              {detalle.ganado != null ? (
                <p className="mt-4 inline-flex w-full items-center gap-2 rounded-2xl border border-slate-300 bg-slate-100 px-3 py-3 text-[length:var(--text-body)] font-semibold text-slate-900">
                  <Receipt className="size-4" /> <ST>Ganado</ST>: {formatCRC(detalle.ganado)}
                </p>
              ) : null}

              <ComprobantePago compraId={detalle.id} tieneComprobante={detalle.tieneComprobante} />

              {!editableDetalle ? (
                <p className="mt-3 inline-flex items-center gap-2 text-[length:var(--text-body)] text-slate-500">
                  <PackageCheck className="size-4" /> <ST>Pedido cerrado: ya no se puede editar.</ST>
                </p>
              ) : null}

              {puedeGestionar && estadoDetalle === "Pendiente" ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => actualizarEstado(detalle, "Aceptado")}
                    className="inline-flex h-[var(--control-height)] w-full items-center justify-center gap-2 rounded-full bg-slate-800 px-4 text-[length:var(--text-body)] font-semibold text-white disabled:opacity-50 sm:w-auto"
                  >
                    <Check className="size-4" /> <ST>Aceptado</ST>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => actualizarEstado(detalle, "Rechazado")}
                    className="inline-flex h-[var(--control-height)] w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 disabled:opacity-50 sm:w-auto"
                  >
                    <X className="size-4" /> <ST>Rechazado</ST>
                  </button>
                </div>
              ) : null}

              {puedeGestionar && estadoDetalle === "Aceptado" ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => actualizarEstado(detalle, "Entregado")}
                    className="inline-flex h-[var(--control-height)] w-full items-center justify-center gap-2 rounded-full bg-slate-800 px-4 text-[length:var(--text-body)] font-semibold text-white disabled:opacity-50 sm:w-auto"
                  >
                    <Truck className="size-4" /> <ST>Entregado</ST>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => actualizarEstado(detalle, "Pendiente")}
                    className="inline-flex h-[var(--control-height)] w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 disabled:opacity-50 sm:w-auto"
                  >
                    <RotateCcw className="size-4" /> <ST>Marcar como pendiente</ST>
                  </button>
                </div>
              ) : null}

              {puedeGestionar && estadoDetalle === "Rechazado" ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => actualizarEstado(detalle, "Pendiente")}
                    className="inline-flex h-[var(--control-height)] w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 disabled:opacity-50 sm:w-auto"
                  >
                    <RotateCcw className="size-4" /> <ST>Reabrir como pendiente</ST>
                  </button>
                </div>
              ) : null}

              {puedeGestionar && estadoDetalle === "Entregado" ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => actualizarEstado(detalle, "Devolucion")}
                    className="inline-flex h-[var(--control-height)] w-full items-center justify-center gap-2 rounded-full border border-violet-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-violet-800 disabled:opacity-50 sm:w-auto"
                  >
                    <RotateCcw className="size-4" /> <ST>Marcar devolución</ST>
                  </button>
                </div>
              ) : null}
            </AdminModalBody>
          </AdminModal>
        ) : null}
      </AdminLayout>
    </AdminPageGate>
  );
}
