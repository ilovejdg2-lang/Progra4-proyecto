import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, PackageCheck, Receipt, RotateCcw, Truck, X } from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminModal, AdminModalBody, AdminModalHeader } from "../../../Components/Admin/ui/AdminModal";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import {
  cambiarEstadoCompra,
  obtenerCompraPorId,
  obtenerComprasAdmin,
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
  if (estado === "Recibido" || estado === "Enviada" || estado === "Pagado") return "Enviado";
  if (estado === "Rechazada") return "Rechazado";
  return estado;
}

function badgeEstado(estadoRaw) {
  switch (normalizarEstadoUi(estadoRaw)) {
    case "Pendiente":
      return "bg-amber-50 text-amber-800";
    case "Aceptado":
      return "bg-sky-50 text-sky-800";
    case "Enviado":
      return "bg-emerald-50 text-emerald-800";
    case "Rechazado":
      return "bg-rose-50 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
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
    ganado: estado === "Enviado" ? total : null,
    items: (venta.items || []).map((item) => ({
      nombre: item.nombre,
      cantidad: item.units || 1,
      precioUnitario: item.precioUnitario ?? ((item.total || 0) / (item.units || 1)),
      subtotal: item.total || 0,
    })),
  };
}

function BadgeEstadoCompra({ estado }) {
  const normalizado = normalizarEstadoUi(estado);
  const etiqueta = useTraducir(normalizado);
  return (
    <span
      className={`admin-chip-estado inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeEstado(normalizado)}`}
      style={{ textDecoration: "none", textDecorationLine: "none" }}
      spellCheck={false}
    >
      {etiqueta}
    </span>
  );
}

export default function HistorialVentas() {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const puedeVer = tienePermiso(roles, "ver_ventas") || tienePermiso(roles, "ver_historial_compras_clientes");
  const puedeGestionar =
    tienePermiso(roles, "actualizar_ventas") || tienePermiso(roles, "registrar_ventas");
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/historial-ventas", true);
  const [detalle, setDetalle] = useState(null);
  const [compras, setCompras] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState({
    busqueda: "",
    estado: "todos",
    desde: "",
    hasta: "",
  });

  const load = useCallback(async () => {
    if (!puedeVer) return;
    setStatus("loading");
    setError("");
    try {
      const result = await obtenerComprasAdmin({
        page,
        pageSize: 10,
        q: filtros.busqueda,
        estado: filtros.estado,
        desde: filtros.desde,
        hasta: filtros.hasta,
      });
      setCompras(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setStatus("success");
    } catch (loadError) {
      const local = obtenerVentas().map(mapLocalVenta);
      setCompras(local);
      setTotal(local.length);
      setTotalPages(1);
      setStatus("success");
      setError(loadError instanceof Error ? loadError.message : "Usando historial local.");
    }
  }, [puedeVer, page, filtros]);

  useEffect(() => {
    load();
  }, [load]);

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
  const editableDetalle =
    detalle?.editable ??
    (estadoDetalle === "Pendiente" || estadoDetalle === "Aceptado" || estadoDetalle === "Rechazado");

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
              <h1 className="text-[length:var(--text-title)] font-semibold text-slate-900"><ST>Historial de ventas</ST></h1>
              <p className="mt-1 text-[length:var(--text-body)] text-slate-500">
                <ST>
                  Pendiente: aceptá o rechazá. Aceptado: enviá o volvé a pendiente (se restaura el stock). Enviado ya no se edita.
                </ST>
              </p>
              {error ? <p className="mt-2 text-[length:var(--text-body)] text-amber-700 no-underline"><ST>{error}</ST></p> : null}
            </div>

            <div className="grid gap-3 border-b border-slate-100 px-4 py-4 sm:grid-cols-3 sm:px-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-500"><ST>Pedidos</ST></p>
                <p className="mt-1 text-[length:var(--text-subtitle)] font-semibold text-slate-950">{total}</p>
              </div>
              <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 sm:col-span-2">
                <p className="text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-700">
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
              hayFiltrosActivos={Boolean(filtros.busqueda || filtros.desde || filtros.hasta || (filtros.estado && filtros.estado !== "todos"))}
              onLimpiar={() => {
                setPage(1);
                setFiltros({ busqueda: "", estado: "todos", desde: "", hasta: "" });
              }}
              filtros={[
                { id: "desde", label: "Desde", tipo: "fecha", value: filtros.desde, onChange: (valor) => { setPage(1); setFiltros((c) => ({ ...c, desde: valor })); } },
                { id: "hasta", label: "Hasta", tipo: "fecha", value: filtros.hasta, onChange: (valor) => { setPage(1); setFiltros((c) => ({ ...c, hasta: valor })); } },
                {
                  id: "estado",
                  label: "Estado",
                  value: filtros.estado,
                  onChange: (valor) => { setPage(1); setFiltros((c) => ({ ...c, estado: valor })); },
                  opciones: [
                    { value: "todos", label: "Todos" },
                    { value: "Pendiente", label: "Pendiente" },
                    { value: "Aceptado", label: "Aceptado" },
                    { value: "Enviado", label: "Enviado" },
                    { value: "Rechazado", label: "Rechazado" },
                  ],
                },
              ]}
            />

            {status === "loading" ? (
              <div className="px-4 py-14 text-center text-[length:var(--text-body)] text-slate-500"><ST>Cargando compras...</ST></div>
            ) : compras.length === 0 ? (
              <AdminListaVacia onLimpiar={() => setFiltros({ busqueda: "", estado: "todos", desde: "", hasta: "" })} />
            ) : (
              <div className="admin-table-shell">
                <table className="w-full min-w-[860px] text-left text-[length:var(--text-body)]">
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
                        <td className="px-6 py-4 font-medium text-slate-900">{compra.numero}</td>
                        <td className="px-6 py-4 text-slate-600"><ST>{formatFecha(compra.fecha)}</ST></td>
                        <td className="px-6 py-4 text-slate-700">{compra.clienteNombre}</td>
                        <td className="px-6 py-4 text-slate-700">{compra.cantidadProductos}</td>
                        <td className="px-6 py-4 text-slate-800">{formatCRC(compra.total)}</td>
                        <td className="px-6 py-4">
                          <BadgeEstadoCompra estado={compra.estado} />
                        </td>
                        <td className="px-6 py-4">
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
            )}

            {total > 10 && totalPages > 1 ? (
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-[var(--control-height)] rounded-full border border-slate-300 px-3 text-[length:var(--text-body)] disabled:opacity-50"><ST>Anterior</ST></button>
                <span className="text-[length:var(--text-body)] text-slate-600">{page} / {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-[var(--control-height)] rounded-full border border-slate-300 px-3 text-[length:var(--text-body)] disabled:opacity-50"><ST>Siguiente</ST></button>
              </div>
            ) : null}
          </section>
        </div>

        {detalle ? (
          <AdminModal open onClose={() => setDetalle(null)} maxWidth="max-w-xl" labelledBy="venta-detalle-title">
            <AdminModalHeader>
              <h2 id="venta-detalle-title" className="text-[length:var(--text-subtitle)] font-semibold text-slate-900">
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
              <dl className="grid gap-2 text-[length:var(--text-body)]">
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Cliente</ST></dt>
                  <dd className="font-medium text-slate-900 no-underline">{detalle.clienteNombre}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Fecha</ST></dt>
                  <dd className="font-medium text-slate-900 no-underline"><ST>{formatFecha(detalle.fecha)}</ST></dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Método</ST></dt>
                  <dd className="font-medium text-slate-900 no-underline"><ST>{detalle.metodoPago}</ST></dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Estado</ST></dt>
                  <dd><BadgeEstadoCompra estado={detalle.estado} /></dd>
                </div>
              </dl>
              <ul className="mt-4 space-y-2 text-[length:var(--text-body)]">
                {(detalle.items || []).map((item, index) => (
                  <li key={`${item.nombre}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium no-underline"><ST>{item.nombre}</ST></span>
                      <span className="font-semibold">{formatCRC(item.subtotal)}</span>
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

              {!editableDetalle ? (
                <p className="mt-3 inline-flex items-center gap-2 text-[length:var(--text-body)] text-slate-500">
                  <PackageCheck className="size-4" /> <ST>Pedido cerrado: ya no se puede editar.</ST>
                </p>
              ) : null}

              {puedeGestionar && estadoDetalle === "Pendiente" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => actualizarEstado(detalle, "Aceptado")}
                    className="inline-flex h-[var(--control-height)] items-center gap-2 rounded-full bg-slate-800 px-4 text-[length:var(--text-body)] font-semibold text-white disabled:opacity-50"
                  >
                    <Check className="size-4" /> <ST>Aceptado</ST>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => actualizarEstado(detalle, "Rechazado")}
                    className="inline-flex h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 disabled:opacity-50"
                  >
                    <X className="size-4" /> <ST>Rechazado</ST>
                  </button>
                </div>
              ) : null}

              {puedeGestionar && estadoDetalle === "Aceptado" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => actualizarEstado(detalle, "Enviado")}
                    className="inline-flex h-[var(--control-height)] items-center gap-2 rounded-full bg-slate-800 px-4 text-[length:var(--text-body)] font-semibold text-white disabled:opacity-50"
                  >
                    <Truck className="size-4" /> <ST>Enviado</ST>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => actualizarEstado(detalle, "Pendiente")}
                    className="inline-flex h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 disabled:opacity-50"
                  >
                    <RotateCcw className="size-4" /> <ST>Marcar como pendiente</ST>
                  </button>
                </div>
              ) : null}

              {puedeGestionar && estadoDetalle === "Rechazado" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => actualizarEstado(detalle, "Pendiente")}
                    className="inline-flex h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 disabled:opacity-50"
                  >
                    <RotateCcw className="size-4" /> <ST>Reabrir como pendiente</ST>
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
