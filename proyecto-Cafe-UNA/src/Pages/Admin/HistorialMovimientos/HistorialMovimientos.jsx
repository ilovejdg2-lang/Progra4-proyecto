import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, History } from "lucide-react";

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
  return fecha.toLocaleString("es-CR");
}

function claseBadgeTipo(tipo) {
  if (tipo === "entrada") return "bg-emerald-50 text-emerald-800";
  if (tipo === "transferencia") return "bg-sky-50 text-sky-800";
  if (tipo === "venta_presencial" || tipo === "venta_web") return "bg-rose-50 text-rose-800";
  return "bg-slate-100 text-slate-700";
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
      ...ubicaciones.map((ubi) => ({
        value: String(ubi.id ?? ubi.Id ?? ""),
        label: t(ubi.name || ubi.nombre || ubi.code || ""),
      })).filter((op) => op.value),
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
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="inline-flex items-center gap-2 text-[length:var(--text-title)] font-semibold text-slate-900">
            <History className="size-5" aria-hidden="true" />
            <ST>Historial de movimientos</ST>
          </h1>
          <p className="mt-1 text-[length:var(--text-body)] text-slate-500">
            <ST>Consulta de entradas, transferencias y ventas. Solo lectura.</ST>
          </p>
        </header>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={Boolean(exportando)}
                  onClick={() => exportar("csv")}
                  className="inline-flex h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="size-4" aria-hidden="true" />
                  <ST>{exportando === "csv" ? "Generando archivo..." : "Exportar CSV"}</ST>
                </button>
                <button
                  type="button"
                  disabled={Boolean(exportando)}
                  onClick={() => exportar("pdf")}
                  className="inline-flex h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <Download className="size-4" aria-hidden="true" />
                  <ST>{exportando === "pdf" ? "Generando archivo..." : "Exportar PDF"}</ST>
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
            <p className="px-6 py-3 text-[length:var(--text-body)] text-rose-700">{error}</p>
          ) : null}

          {exportando ? (
            <p className="px-6 py-2 text-[length:var(--text-body)] text-slate-500" role="status">
              <ST>Generando archivo...</ST>
            </p>
          ) : null}

          {status === "loading" ? (
            <div className="px-4 py-14 text-center text-[length:var(--text-body)] text-slate-500">
              <ST>Cargando historial...</ST>
            </div>
          ) : items.length === 0 ? (
            <AdminListaVacia onLimpiar={limpiarFiltros} />
          ) : (
            <div className="admin-table-shell">
              <table className="w-full min-w-[960px] text-left text-[length:var(--text-body)]">
                <thead>
                  <tr>
                    <th><ST>Fecha</ST></th>
                    <th><ST>Tipo de movimiento</ST></th>
                    <th><ST>Producto</ST></th>
                    <th><ST>Cantidad</ST></th>
                    <th><ST>Origen</ST></th>
                    <th><ST>Destino</ST></th>
                    <th><ST>Responsable</ST></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatFechaHora(row.fecha)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex h-[var(--control-height)] items-center rounded-full px-3 font-semibold ${claseBadgeTipo(row.tipo)}`}
                        >
                          <ST>{etiquetaTipo(row.tipo)}</ST>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {row.productoNombre ? <ST>{row.productoNombre}</ST> : row.productoId}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{row.cantidad}</td>
                      <td className="px-6 py-4 text-slate-700">
                        {row.origenNombre ? <ST>{row.origenNombre}</ST> : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {row.destinoNombre ? <ST>{row.destinoNombre}</ST> : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {row.responsableNombre || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 0 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-6">
              <p className="text-[length:var(--text-body)] text-slate-600">
                <ST>Página</ST> {page} <ST>de</ST> {totalPages} · {total} <ST>registros</ST>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((actual) => Math.max(1, actual - 1))}
                  className="h-[var(--control-height)] rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <ST>Anterior</ST>
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((actual) => actual + 1)}
                  className="h-[var(--control-height)] rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
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
