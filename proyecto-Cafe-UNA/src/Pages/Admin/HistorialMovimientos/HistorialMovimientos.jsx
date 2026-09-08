import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { obtenerUbicaciones } from "../../../services/productosService";
import { obtenerHistorialMovimientos } from "../../../services/movimientosService";
import {
  construirCsvMovimientos,
  construirPdfMovimientos,
  descargarArchivo,
  etiquetaTipo,
} from "../../../lib/exportarHistorialMovimientos";
import { getActiveSessionUser } from "../../../services/sessionService";
import { ST } from "../../../Components/T/ST";
import { t } from "../../../lib/t";
import { useIdioma } from "../../../lib/useIdioma";

const PAGE_SIZE = 25;

function formatFechaHora(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString("es-CR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderBadgeTipo(tipo) {
  if (tipo === "entrada") {
    return (
      <span className="inline-flex rounded-full border border-emerald-300 bg-transparent px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
        <ST>{etiquetaTipo(tipo)}</ST>
      </span>
    );
  }
  if (tipo === "transferencia") {
    return (
      <span className="inline-flex rounded-full border border-indigo-300 bg-transparent px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
        <ST>{etiquetaTipo(tipo)}</ST>
      </span>
    );
  }
  if (tipo === "venta_presencial") {
    return (
      <span className="inline-flex rounded-full border border-amber-300 bg-transparent px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
        <ST>{etiquetaTipo(tipo)}</ST>
      </span>
    );
  }
  if (tipo === "venta_web") {
    return (
      <span className="inline-flex rounded-full border border-purple-300 bg-transparent px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
        <ST>{etiquetaTipo(tipo)}</ST>
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-slate-300 bg-transparent px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
      <ST>{etiquetaTipo(tipo)}</ST>
    </span>
  );
}

export default function AdminHistorialMovimientos() {
  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const puedeVer = tienePermiso(roles, "ver_inventario");
  const { idioma } = useIdioma();

  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [ubicacionId, setUbicacionId] = useState("todas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [ubicaciones, setUbicaciones] = useState([]);
  const [exportando, setExportando] = useState("");

  const filtrosActivos =
    Boolean(busquedaAplicada.trim()) ||
    tipo !== "todos" ||
    ubicacionId !== "todas" ||
    Boolean(fechaDesde) ||
    Boolean(fechaHasta);

  const queryFiltros = useMemo(
    () => ({
      producto: busquedaAplicada.trim() || undefined,
      tipo: tipo === "todos" ? undefined : tipo,
      ubicacionId: ubicacionId === "todas" ? undefined : ubicacionId,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
    }),
    [busquedaAplicada, tipo, ubicacionId, fechaDesde, fechaHasta],
  );

  const load = useCallback(
    async (pagina = 1) => {
      if (!puedeVer) return;
      setStatus("loading");
      setError("");
      try {
        const data = await obtenerHistorialMovimientos({
          ...queryFiltros,
          page: pagina,
          limit: PAGE_SIZE,
        });
        setItems(data.items);
        setTotal(data.total);
        setStatus("success");
      } catch (loadError) {
        setItems([]);
        setTotal(0);
        setStatus("error");
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el historial de movimientos.",
        );
      }
    },
    [puedeVer, queryFiltros],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaAplicada(busqueda);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  useEffect(() => {
    if (!puedeVer) return;
    obtenerUbicaciones()
      .then((rows) => setUbicaciones(Array.isArray(rows) ? rows : []))
      .catch(() => setUbicaciones([]));
  }, [puedeVer]);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const ready = status !== "idle";
  const { showLoading, loadingMessage } = useAdminPageGate(
    "/admin/historial-movimientos",
    ready,
  );

  const statsConteo = useMemo(() => {
    let entradas = 0;
    let transferencias = 0;
    let ventas = 0;
    for (const item of items) {
      if (item.tipo === "entrada") entradas += 1;
      else if (item.tipo === "transferencia") transferencias += 1;
      else if (item.tipo === "venta_presencial" || item.tipo === "venta_web") ventas += 1;
    }
    return { entradas, transferencias, ventas };
  }, [items]);

  const opcionesTipo = useMemo(
    () => [
      { value: "todos", label: t("Todos los tipos") },
      { value: "entrada", label: t("Entrada") },
      { value: "transferencia", label: t("Transferencia") },
      { value: "venta_presencial", label: t("Venta presencial") },
      { value: "venta_web", label: t("Venta web") },
    ],
    [idioma],
  );

  const opcionesUbicacion = useMemo(
    () => [
      { value: "todas", label: t("Todas las ubicaciones") },
      ...ubicaciones
        .map((ubi) => ({
          value: String(ubi.id ?? ubi.Id ?? ""),
          label: t(ubi.name || ubi.nombre || ubi.code || ""),
        }))
        .filter((op) => op.value),
    ],
    [ubicaciones, idioma],
  );

  function limpiarFiltros() {
    setBusqueda("");
    setBusquedaAplicada("");
    setTipo("todos");
    setUbicacionId("todas");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
  }

  function textoFiltrosExport() {
    const partes = [];
    if (busquedaAplicada.trim()) partes.push(`producto: ${busquedaAplicada.trim()}`);
    if (tipo !== "todos") partes.push(`tipo: ${etiquetaTipo(tipo)}`);
    if (ubicacionId !== "todas") {
      const ubi = opcionesUbicacion.find((op) => op.value === ubicacionId);
      partes.push(`ubicación: ${ubi?.label || ubicacionId}`);
    }
    if (fechaDesde) partes.push(`desde: ${fechaDesde}`);
    if (fechaHasta) partes.push(`hasta: ${fechaHasta}`);
    return partes.join("; ") || "ninguno";
  }

  async function exportar(formato) {
    if (exportando) return;
    setExportando(formato);
    try {
      const data = await obtenerHistorialMovimientos({
        ...queryFiltros,
        page: 1,
        limit: 5000,
      });
      const filas = data.items.map((row) => ({
        ...row,
        fechaTexto: formatFechaHora(row.fecha),
      }));
      const stamp = new Date().toISOString().slice(0, 10);
      if (formato === "csv") {
        descargarArchivo(
          `historial-movimientos-${stamp}.csv`,
          construirCsvMovimientos(filas),
          "text/csv;charset=utf-8",
        );
      } else {
        const pdf = construirPdfMovimientos({
          filas,
          adminNombre: actor?.name || actor?.username || "",
          fechaGeneracion: formatFechaHora(new Date().toISOString()),
          filtrosTexto: textoFiltrosExport(),
        });
        descargarArchivo(
          `historial-movimientos-${stamp}.pdf`,
          pdf,
          "application/pdf",
          { binario: true },
        );
      }
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "No se pudo generar el archivo.",
      );
    } finally {
      setExportando("");
    }
  }

  if (showLoading) {
    return (
      <AdminLayout>
        <AdminPageGate message={loadingMessage} />
      </AdminLayout>
    );
  }

  if (!puedeVer) {
    return (
      <AdminLayout>
        <p className="mx-auto mt-10 max-w-md text-center text-[length:var(--text-body)] text-slate-600">
          <ST>No tiene permiso para ver el historial de movimientos.</ST>
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Encabezado principal */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[length:var(--text-title)] font-bold tracking-tight text-slate-900">
              <ST>Historial de Movimientos</ST>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              <ST>Trazabilidad inmutable de entradas, transferencias y ventas de stock.</ST>
            </p>
          </div>
        </header>

        {/* Tarjetas resumen de KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-medium text-slate-500">
              <ST>Total Registros</ST>
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{total}</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-medium text-emerald-800">
              <ST>Entradas en página</ST>
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-950">{statsConteo.entradas}</p>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-medium text-indigo-800">
              <ST>Transferencias en página</ST>
            </p>
            <p className="mt-1 text-2xl font-bold text-indigo-950">{statsConteo.transferencias}</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-medium text-amber-800">
              <ST>Ventas en página</ST>
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-950">{statsConteo.ventas}</p>
          </div>
        </div>

        {/* Panel Principal */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <AdminListaToolbar
            busqueda={busqueda}
            onBusquedaChange={(valor) => {
              setBusqueda(valor);
            }}
            placeholder="Buscar producto..."
            hayFiltrosActivos={filtrosActivos}
            total={total}
            visibles={items.length}
            onLimpiar={limpiarFiltros}
            extra={
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={Boolean(exportando)}
                  onClick={() => exportar("csv")}
                  className="inline-flex h-[var(--control-height)] items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <ST>{exportando === "csv" ? "Generando CSV..." : "Exportar CSV"}</ST>
                </button>
                <button
                  type="button"
                  disabled={Boolean(exportando)}
                  onClick={() => exportar("pdf")}
                  className="inline-flex h-[var(--control-height)] items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <ST>{exportando === "pdf" ? "Generando PDF..." : "Exportar PDF"}</ST>
                </button>
              </div>
            }
            filtros={[
              {
                id: "tipo",
                label: "Tipo de movimiento",
                value: tipo,
                onChange: (valor) => {
                  setTipo(valor);
                  setPage(1);
                },
                opciones: opcionesTipo,
              },
              {
                id: "ubicacion",
                label: "Ubicación",
                value: ubicacionId,
                onChange: (valor) => {
                  setUbicacionId(valor);
                  setPage(1);
                },
                opciones: opcionesUbicacion,
              },
              {
                id: "desde",
                label: "Desde",
                tipo: "fecha",
                value: fechaDesde,
                onChange: (valor) => {
                  setFechaDesde(valor);
                  setPage(1);
                },
              },
              {
                id: "hasta",
                label: "Hasta",
                tipo: "fecha",
                value: fechaHasta,
                onChange: (valor) => {
                  setFechaHasta(valor);
                  setPage(1);
                },
              },
            ]}
          />

          {error ? (
            <div className="mx-6 my-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {exportando ? (
            <div className="flex items-center gap-2 px-6 py-3 text-xs font-semibold text-slate-600 bg-slate-50 border-b border-slate-100" role="status">
              <ST>Generando reporte en formato {exportando.toUpperCase()}...</ST>
            </div>
          ) : null}

          {status === "loading" ? (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <p className="text-sm font-medium text-slate-600">
                <ST>Cargando historial de movimientos...</ST>
              </p>
            </div>
          ) : items.length === 0 ? (
            <AdminListaVacia onLimpiar={limpiarFiltros} />
          ) : (
            <div className="admin-table-shell overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-3.5 py-2.5"><ST>Fecha y Hora</ST></th>
                    <th className="px-3.5 py-2.5"><ST>Tipo de movimiento</ST></th>
                    <th className="px-3.5 py-2.5"><ST>Producto</ST></th>
                    <th className="px-3.5 py-2.5"><ST>Cantidad</ST></th>
                    <th className="px-3.5 py-2.5"><ST>Origen</ST></th>
                    <th className="px-3.5 py-2.5"><ST>Destino</ST></th>
                    <th className="px-3.5 py-2.5"><ST>Responsable</ST></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[11px] text-slate-600">
                        {formatFechaHora(row.fecha)}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {renderBadgeTipo(row.tipo)}
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                        {row.productoNombre ? <ST>{row.productoNombre}</ST> : row.productoId}
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                        {row.cantidad}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {row.origenNombre ? (
                          <ST>{row.origenNombre}</ST>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {row.destinoNombre ? (
                          <ST>{row.destinoNombre}</ST>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-[11px] text-slate-600">
                        {row.responsableNombre || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 0 ? (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs font-medium text-slate-600">
                <ST>Mostrando página</ST> <span className="font-bold text-slate-900">{page}</span> <ST>de</ST>{" "}
                <span className="font-bold text-slate-900">{totalPages}</span> · <ST>Total</ST>:{" "}
                <span className="font-bold text-slate-900">{total}</span> <ST>registros</ST>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((actual) => Math.max(1, actual - 1))}
                  className="h-[var(--control-height)] rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <ST>Anterior</ST>
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((actual) => actual + 1)}
                  className="h-[var(--control-height)] rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <ST>Siguiente</ST>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AdminLayout>
  );
}
