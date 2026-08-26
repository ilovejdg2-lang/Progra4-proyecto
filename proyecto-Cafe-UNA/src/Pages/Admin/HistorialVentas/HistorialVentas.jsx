import { useCallback, useEffect, useState } from "react";
import { Banknote, Eye, Receipt, ShoppingBag, Ticket, X } from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminModal, AdminModalBody, AdminModalHeader } from "../../../Components/Admin/ui/AdminModal";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { obtenerCompraPorId, obtenerComprasAdmin } from "../../../services/comprasService";
import { obtenerVentas } from "../../../lib/ventasStorage";
import { tienePermiso, rolesDeUsuario } from "../../../lib/permisos";
import { getActiveSessionUser } from "../../../services/sessionService";

function formatCRC(value) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatFecha(fecha) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "Sin fecha";
  return valor.toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" });
}

function mapLocalVenta(venta) {
  return {
    id: venta.id,
    numero: venta.id,
    fecha: venta.fecha,
    clienteNombre: venta.cliente,
    clienteCorreo: venta.correo || "",
    cantidadProductos: (venta.items || []).reduce((acc, item) => acc + (Number(item.units) || 1), 0),
    subtotal: venta.subtotal,
    impuestos: venta.iva,
    total: venta.total,
    metodoPago: venta.metodo,
    estado: venta.estadoPago,
    facturaId: null,
    items: (venta.items || []).map((item) => ({
      nombre: item.nombre,
      cantidad: item.units || 1,
      precioUnitario: item.precioUnitario ?? ((item.total || 0) / (item.units || 1)),
      subtotal: item.total || 0,
    })),
  };
}

export default function HistorialVentas() {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const puedeVer = tienePermiso(roles, "ver_ventas") || tienePermiso(roles, "ver_historial_compras_clientes");
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/historial-ventas", true);
  const [detalle, setDetalle] = useState(null);
  const [compras, setCompras] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
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
        pageSize: 20,
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

  const abrirDetalle = async (compra) => {
    try {
      const detalleApi = await obtenerCompraPorId(compra.id);
      setDetalle(detalleApi);
    } catch {
      setDetalle(compra);
    }
  };

  if (!puedeVer) {
    return (
      <AdminPageGate showLoading={showLoading} message={loadingMessage}>
        <AdminLayout>
          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-slate-950">Acceso restringido</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">No tiene permiso para ver el historial de ventas.</p>
          </section>
        </AdminLayout>
      </AdminPageGate>
    );
  }

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Historial de ventas</h1>
              <p className="mt-1 text-sm text-slate-500">Compras registradas automáticamente al completar el checkout.</p>
              {error ? <p className="mt-2 text-xs text-amber-700">{error}</p> : null}
            </div>

            <div className="grid gap-3 border-b border-slate-100 px-4 py-4 sm:grid-cols-4 sm:px-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compras</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{total}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filtros backend</p>
                <p className="mt-1 text-sm text-slate-600">Cliente, número, fecha y estado se consultan en el servidor.</p>
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
                    { value: "Pagado", label: "Pagado" },
                    { value: "Pendiente", label: "Pendiente" },
                  ],
                },
              ]}
            />

            {status === "loading" ? (
              <div className="px-4 py-14 text-center text-sm text-slate-500">Cargando compras...</div>
            ) : compras.length === 0 ? (
              <AdminListaVacia onLimpiar={() => setFiltros({ busqueda: "", estado: "todos", desde: "", hasta: "" })} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-4">Recibo</th>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Productos</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compras.map((compra) => (
                      <tr key={compra.id || compra.numero} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-6 py-4 font-medium text-slate-900">{compra.numero}</td>
                        <td className="px-6 py-4 text-slate-600">{formatFecha(compra.fecha)}</td>
                        <td className="px-6 py-4 text-slate-700">{compra.clienteNombre}</td>
                        <td className="px-6 py-4 text-slate-700">{compra.cantidadProductos}</td>
                        <td className="px-6 py-4 text-slate-800">{formatCRC(compra.total)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            compra.estado === "Pagado" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          }`}>{compra.estado}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button type="button" onClick={() => abrirDetalle(compra)} className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700" aria-label={`Ver compra ${compra.numero}`}>
                            <Eye className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 ? (
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Anterior</button>
                <span className="text-sm text-slate-600">{page} / {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Siguiente</button>
              </div>
            ) : null}
          </section>
        </div>

        {detalle ? (
          <AdminModal open onClose={() => setDetalle(null)} maxWidth="max-w-lg" labelledBy="venta-detalle-title">
            <AdminModalHeader>
              <h2 id="venta-detalle-title" className="text-lg font-semibold text-slate-900">Compra {detalle.numero}</h2>
              <button type="button" onClick={() => setDetalle(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X className="size-5" /></button>
            </AdminModalHeader>
            <AdminModalBody>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2"><dt className="text-slate-500">Cliente</dt><dd className="font-medium text-slate-900">{detalle.clienteNombre}</dd></div>
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2"><dt className="text-slate-500">Fecha</dt><dd className="font-medium text-slate-900">{formatFecha(detalle.fecha)}</dd></div>
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2"><dt className="text-slate-500">Método</dt><dd className="font-medium text-slate-900">{detalle.metodoPago}</dd></div>
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2"><dt className="text-slate-500">Estado</dt><dd className="font-medium text-slate-900">{detalle.estado}</dd></div>
              </dl>
              <ul className="mt-4 space-y-2 text-sm">
                {(detalle.items || []).map((item, index) => (
                  <li key={`${item.nombre}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex justify-between gap-3"><span className="font-medium">{item.nombre}</span><span className="font-semibold">{formatCRC(item.subtotal)}</span></div>
                    <p className="mt-1 text-xs text-slate-500">{item.cantidad} × {formatCRC(item.precioUnitario)}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 grid gap-1 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatCRC(detalle.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Impuestos</dt><dd>{formatCRC(detalle.impuestos)}</dd></div>
                <div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatCRC(detalle.total)}</dd></div>
              </dl>
              <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Factura: {detalle.facturaId || "pendiente de integración"} · Recibo {detalle.numero}
              </p>
            </AdminModalBody>
          </AdminModal>
        ) : null}
      </AdminLayout>
    </AdminPageGate>
  );
}
