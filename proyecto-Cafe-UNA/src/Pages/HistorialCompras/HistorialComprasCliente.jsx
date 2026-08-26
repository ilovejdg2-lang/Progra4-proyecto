import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, X } from "lucide-react";

import { AdminModal, AdminModalBody, AdminModalHeader } from "../../Components/Admin/ui/AdminModal";
import { PublicPageGate } from "../../Components/PublicPageGate/PublicPageGate";
import { usePublicPageLoadingGate } from "../../hooks/usePublicPageLoadingGate";
import { rolesDeUsuario, tienePermiso } from "../../lib/permisos";
import { obtenerCompraPorId, obtenerMisCompras } from "../../services/comprasService";
import { getActiveSessionUser } from "../../services/sessionService";

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

export default function HistorialComprasCliente() {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const puedeVer = tienePermiso(roles, "ver_historial_compras_propio");
  const showLoading = usePublicPageLoadingGate("historial-compras", true);

  const [compras, setCompras] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtros, setFiltros] = useState({
    numero: "",
    estado: "todos",
    desde: "",
    hasta: "",
    montoMin: "",
    montoMax: "",
  });

  const load = useCallback(async () => {
    if (!user || !puedeVer) return;
    setStatus("loading");
    setError("");
    try {
      const result = await obtenerMisCompras({
        page,
        pageSize: 10,
        ...filtros,
      });
      setCompras(result.data);
      setTotalPages(result.totalPages);
      setStatus("success");
    } catch (loadError) {
      setCompras([]);
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el historial.");
    }
  }, [user, puedeVer, page, filtros]);

  useEffect(() => {
    load();
  }, [load]);

  const abrirDetalle = async (compra) => {
    try {
      setDetalle(await obtenerCompraPorId(compra.id));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "No se pudo abrir el detalle.");
    }
  };

  if (!user) {
    return (
      <PublicPageGate showLoading={showLoading}>
        <main className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm text-slate-600">Iniciá sesión para ver tu historial de compras.</p>
          <Link to="/login" className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Ir a login</Link>
        </main>
      </PublicPageGate>
    );
  }

  if (!puedeVer) {
    return (
      <PublicPageGate showLoading={showLoading}>
        <main className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm text-slate-600">Tu rol no tiene acceso al historial de compras.</p>
        </main>
      </PublicPageGate>
    );
  }

  return (
    <PublicPageGate showLoading={showLoading}>
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8">
        <Link to="/perfil" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <ArrowLeft className="size-4" /> Volver al perfil
        </Link>
        <header>
          <h1 className="text-2xl font-semibold text-slate-950">Mis compras</h1>
          <p className="mt-1 text-sm text-slate-500">Consultá tus pedidos, totales y detalle de cada compra.</p>
        </header>

        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Número</span>
            <input className="min-h-11 rounded-full border border-slate-200 px-3" value={filtros.numero} onChange={(e) => { setPage(1); setFiltros((c) => ({ ...c, numero: e.target.value })); }} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Estado</span>
            <select className="min-h-11 rounded-full border border-slate-200 px-3" value={filtros.estado} onChange={(e) => { setPage(1); setFiltros((c) => ({ ...c, estado: e.target.value })); }}>
              <option value="todos">Todos</option>
              <option value="Pagado">Pagado</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Desde</span>
            <input type="date" className="min-h-11 rounded-full border border-slate-200 px-3" value={filtros.desde} onChange={(e) => { setPage(1); setFiltros((c) => ({ ...c, desde: e.target.value })); }} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Hasta</span>
            <input type="date" className="min-h-11 rounded-full border border-slate-200 px-3" value={filtros.hasta} onChange={(e) => { setPage(1); setFiltros((c) => ({ ...c, hasta: e.target.value })); }} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Monto mínimo</span>
            <input type="number" min="0" className="min-h-11 rounded-full border border-slate-200 px-3" value={filtros.montoMin} onChange={(e) => { setPage(1); setFiltros((c) => ({ ...c, montoMin: e.target.value })); }} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Monto máximo</span>
            <input type="number" min="0" className="min-h-11 rounded-full border border-slate-200 px-3" value={filtros.montoMax} onChange={(e) => { setPage(1); setFiltros((c) => ({ ...c, montoMax: e.target.value })); }} />
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="button" onClick={() => { setPage(1); setFiltros({ numero: "", estado: "todos", desde: "", hasta: "", montoMin: "", montoMax: "" }); }} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Restablecer filtros
            </button>
          </div>
        </section>

        {status === "loading" ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">Cargando historial...</p>
        ) : status === "error" ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button type="button" onClick={load} className="mt-3 rounded-full border border-red-700 px-4 py-2 text-sm font-semibold text-red-700">Reintentar</button>
          </div>
        ) : compras.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">Todavía no tenés compras registradas.</p>
        ) : (
          <div className="space-y-3">
            {compras.map((compra) => (
              <article key={compra.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{compra.numero}</p>
                    <p className="text-sm text-slate-500">{formatFecha(compra.fecha)}</p>
                    <p className="mt-1 text-sm text-slate-600">{compra.cantidadProductos} productos · {compra.estado}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-950">{formatCRC(compra.total)}</p>
                    <button type="button" onClick={() => abrirDetalle(compra)} className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-950 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
                      <Eye className="size-3.5" /> Ver detalle
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-end gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Anterior</button>
            <span className="text-sm text-slate-600">{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Siguiente</button>
          </div>
        ) : null}

        {detalle ? (
          <AdminModal open onClose={() => setDetalle(null)} maxWidth="max-w-lg" labelledBy="compra-cliente-detalle">
            <AdminModalHeader>
              <h2 id="compra-cliente-detalle" className="text-lg font-semibold">Compra {detalle.numero}</h2>
              <button type="button" onClick={() => setDetalle(null)} aria-label="Cerrar" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
            </AdminModalHeader>
            <AdminModalBody>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between border-b border-slate-100 py-2"><dt className="text-slate-500">Fecha</dt><dd>{formatFecha(detalle.fecha)}</dd></div>
                <div className="flex justify-between border-b border-slate-100 py-2"><dt className="text-slate-500">Método</dt><dd>{detalle.metodoPago}</dd></div>
                <div className="flex justify-between border-b border-slate-100 py-2"><dt className="text-slate-500">Estado</dt><dd>{detalle.estado}</dd></div>
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
            </AdminModalBody>
          </AdminModal>
        ) : null}
      </main>
    </PublicPageGate>
  );
}
