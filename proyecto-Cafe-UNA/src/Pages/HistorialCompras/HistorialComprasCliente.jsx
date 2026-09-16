import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, X } from "lucide-react";

import { AdminModal, AdminModalBody, AdminModalHeader } from "../../Components/Admin/ui/AdminModal";
import { NumericInput } from "../../Components/NumericInput/NumericInput";
import { PublicPageGate } from "../../Components/PublicPageGate/PublicPageGate";
import { ST } from "../../Components/T/ST";
import { usePublicPageLoadingGate } from "../../hooks/usePublicPageLoadingGate";
import { useTraducir } from "../../hooks/useTraducir";
import { rolesDeUsuario, tienePermiso } from "../../lib/permisos";
import { t } from "../../lib/t";
import { obtenerCompraPorId, obtenerMisCompras } from "../../services/comprasService";
import { getActiveSessionUser, SESSION_UPDATED_EVENT } from "../../services/sessionService";

export const RUTA_COMPRAS_CLIENTE = "/perfil/compras";
export const RUTA_COMPRAS_ADMIN = "/admin/mis-compras";

export function rutaMisCompras(user) {
  return user?.role === "admin" ? RUTA_COMPRAS_ADMIN : RUTA_COMPRAS_CLIENTE;
}

function formatCRC(value) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatFecha(fecha) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return null;
  return valor.toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" });
}

function colorEstado(estadoRaw) {
  switch (String(estadoRaw || "Pendiente").trim()) {
    case "Pendiente":
      return "text-amber-800";
    case "Aceptado":
      return "text-sky-800";
    case "Entregado":
      return "text-emerald-800";
    case "Rechazado":
      return "text-rose-800";
    default:
      return "text-slate-700";
  }
}

function EstadoTexto({ estado, className = "" }) {
  return (
    <span className={`text-[var(--text-body)] font-semibold ${colorEstado(estado)} ${className}`.trim()}>
      <ST>{estado || "Pendiente"}</ST>
    </span>
  );
}

const INITIAL_FILTERS = {
  numero: "",
  estado: "todos",
  desde: "",
  hasta: "",
  montoMin: "",
  montoMax: "",
};

/**
 * @param {{ variant?: "standalone" | "admin" }} props
 * standalone = cliente con navbar del sitio; admin = dentro de AdminLayout
 */
export function HistorialComprasContent({ variant = "standalone" }) {
  const navigate = useNavigate();
  const esAdmin = variant === "admin";
  const perfilVolver = esAdmin ? "/admin/perfil" : "/perfil";
  const loginRedirect = esAdmin ? RUTA_COMPRAS_ADMIN : RUTA_COMPRAS_CLIENTE;

  const [user, setUser] = useState(() => getActiveSessionUser());
  const userRef = useRef(user);
  const historyRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const userId = user?.id ?? null;
  const roles = rolesDeUsuario(user);
  const puedeVer = tienePermiso(roles, "ver_historial_compras_propio");
  const showLoading = usePublicPageLoadingGate(
    esAdmin ? "admin:mis-compras" : "historial-compras",
    true,
  );
  const tSinFecha = useTraducir("Sin fecha");
  const tTodos = useTraducir("Todos");

  const [compras, setCompras] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtros, setFiltros] = useState(INITIAL_FILTERS);

  useEffect(() => {
    if (!user && !esAdmin) {
      sessionStorage.setItem("postLoginRedirect", loginRedirect);
      navigate({ to: "/login", replace: true });
    }
  }, [navigate, user, esAdmin, loginRedirect]);

  useEffect(() => {
    const syncUser = (event) => {
      if (event.type === "storage" && event.key && event.key !== "user") return;

      const nextUser = getActiveSessionUser();
      const accountChanged = userRef.current?.id !== nextUser?.id;
      userRef.current = nextUser;

      if (accountChanged) {
        historyRequestRef.current += 1;
        detailRequestRef.current += 1;
        setCompras([]);
        setDetalle(null);
        setError("");
        setStatus("idle");
        setPage(1);
        setTotalPages(1);
        setFiltros(INITIAL_FILTERS);
      }

      setUser(nextUser);
    };
    window.addEventListener("storage", syncUser);
    window.addEventListener(SESSION_UPDATED_EVENT, syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(SESSION_UPDATED_EVENT, syncUser);
    };
  }, []);

  const load = useCallback(async () => {
    if (!userId || !puedeVer) return;
    const requestId = ++historyRequestRef.current;
    setStatus("loading");
    setError("");
    try {
      const result = await obtenerMisCompras({
        page,
        pageSize: 10,
        ...filtros,
      });
      if (requestId !== historyRequestRef.current) return;
      setCompras(result.data);
      setTotalPages(result.totalPages);
      setStatus("success");
    } catch (loadError) {
      if (requestId !== historyRequestRef.current) return;
      setCompras([]);
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el historial.");
    }
  }, [userId, puedeVer, page, filtros]);

  useEffect(() => {
    load();
  }, [load]);

  const abrirDetalle = async (compra) => {
    const requestId = ++detailRequestRef.current;
    try {
      const nextDetalle = await obtenerCompraPorId(compra.id);
      if (requestId !== detailRequestRef.current) return;
      setDetalle(nextDetalle);
    } catch (detailError) {
      if (requestId !== detailRequestRef.current) return;
      setError(detailError instanceof Error ? detailError.message : "No se pudo abrir el detalle.");
    }
  };

  const cuerpo = (() => {
    if (!user) {
      return (
        <main className={esAdmin ? "space-y-5" : "mx-auto max-w-3xl px-4 py-10"}>
          <p className="text-[var(--text-body)] text-slate-600">
            <ST>Iniciá sesión para ver tu historial de compras.</ST>
          </p>
          <Link
            to="/login"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-4 text-[var(--text-body)] font-semibold text-white"
            onClick={() => sessionStorage.setItem("postLoginRedirect", loginRedirect)}
          >
            <ST>Ir a login</ST>
          </Link>
        </main>
      );
    }

    if (!puedeVer) {
      return (
        <main className={esAdmin ? "space-y-5" : "mx-auto max-w-3xl px-4 py-10"}>
          <p className="text-[var(--text-body)] text-slate-600">
            <ST>Tu rol no tiene acceso al historial de compras.</ST>
          </p>
          <Link
            to={perfilVolver}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-[var(--text-body)] font-semibold text-slate-700"
          >
            <ArrowLeft className="size-4" /> <ST>Volver al perfil</ST>
          </Link>
        </main>
      );
    }

    return (
      <main className={esAdmin ? "mx-auto max-w-4xl space-y-5" : "mx-auto max-w-4xl space-y-5 px-4 py-8"}>
        <Link
          to={perfilVolver}
          className="inline-flex min-h-11 items-center gap-2 text-[var(--text-body)] font-semibold text-slate-700"
        >
          <ArrowLeft className="size-4" /> <ST>Volver al perfil</ST>
        </Link>
        <header>
          <h1 className="text-[var(--text-title)] font-semibold text-slate-950">
            <ST>Mis compras</ST>
          </h1>
          <p className="mt-1 text-[var(--text-body)] text-slate-500">
            <ST>Consultá el estado de tus pedidos: pendiente, aceptado, entregado o rechazado.</ST>
          </p>
        </header>

        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1 text-[var(--text-body)]">
            <span className="font-medium text-slate-700"><ST>Número</ST></span>
            <input
              className="min-h-11 rounded-full border border-slate-200 px-3 text-[var(--text-body)]"
              value={filtros.numero}
              onChange={(e) => {
                setPage(1);
                setFiltros((c) => ({ ...c, numero: e.target.value }));
              }}
            />
          </label>
          <label className="grid gap-1 text-[var(--text-body)]">
            <span className="font-medium text-slate-700"><ST>Estado</ST></span>
            <select
              className="min-h-11 rounded-full border border-slate-200 px-3 text-[var(--text-body)]"
              value={filtros.estado}
              onChange={(e) => {
                setPage(1);
                setFiltros((c) => ({ ...c, estado: e.target.value }));
              }}
            >
              <option value="todos">{tTodos}</option>
              <option value="Pendiente">{t("Pendiente")}</option>
              <option value="Aceptado">{t("Aceptado")}</option>
              <option value="Entregado">{t("Entregado")}</option>
              <option value="Rechazado">{t("Rechazado")}</option>
            </select>
          </label>
          <label className="grid gap-1 text-[var(--text-body)]">
            <span className="font-medium text-slate-700"><ST>Desde</ST></span>
            <input
              type="date"
              className="min-h-11 rounded-full border border-slate-200 px-3 text-[var(--text-body)]"
              value={filtros.desde}
              onChange={(e) => {
                setPage(1);
                setFiltros((c) => ({ ...c, desde: e.target.value }));
              }}
            />
          </label>
          <label className="grid gap-1 text-[var(--text-body)]">
            <span className="font-medium text-slate-700"><ST>Hasta</ST></span>
            <input
              type="date"
              className="min-h-11 rounded-full border border-slate-200 px-3 text-[var(--text-body)]"
              value={filtros.hasta}
              onChange={(e) => {
                setPage(1);
                setFiltros((c) => ({ ...c, hasta: e.target.value }));
              }}
            />
          </label>
          <label className="grid gap-1 text-[var(--text-body)]">
            <span className="font-medium text-slate-700"><ST>Monto mínimo</ST></span>
            <NumericInput
              decimal
              className="min-h-11 rounded-full border border-slate-200 px-3 text-[var(--text-body)]"
              value={filtros.montoMin}
              onChange={(e) => {
                setPage(1);
                setFiltros((c) => ({ ...c, montoMin: e.target.value }));
              }}
            />
          </label>
          <label className="grid gap-1 text-[var(--text-body)]">
            <span className="font-medium text-slate-700"><ST>Monto máximo</ST></span>
            <NumericInput
              decimal
              className="min-h-11 rounded-full border border-slate-200 px-3 text-[var(--text-body)]"
              value={filtros.montoMax}
              onChange={(e) => {
                setPage(1);
                setFiltros((c) => ({ ...c, montoMax: e.target.value }));
              }}
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setFiltros({ ...INITIAL_FILTERS });
              }}
              className="min-h-11 rounded-full border border-slate-300 px-4 text-[var(--text-body)] font-semibold text-slate-700"
            >
              <ST>Restablecer filtros</ST>
            </button>
          </div>
        </section>

        {status === "loading" ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-[var(--text-body)] text-slate-500">
            <ST>Cargando historial...</ST>
          </p>
        ) : status === "error" ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center">
            <p className="text-[var(--text-body)] font-semibold text-red-700"><ST>{error}</ST></p>
            <button
              type="button"
              onClick={load}
              className="mt-3 min-h-11 rounded-full border border-red-700 px-4 text-[var(--text-body)] font-semibold text-red-700"
            >
              <ST>Reintentar</ST>
            </button>
          </div>
        ) : compras.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-[var(--text-body)] text-slate-500">
            <ST>Todavía no tenés compras registradas.</ST>
          </p>
        ) : (
          <div className="space-y-3">
            {compras.map((compra) => (
              <article key={compra.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{compra.numero}</p>
                    <p className="mt-1 text-[var(--text-body)] text-slate-500">
                      {formatFecha(compra.fecha) || tSinFecha}
                    </p>
                    <p className="mt-1 text-[var(--text-body)] text-slate-600">
                      {compra.cantidadProductos} <ST>productos</ST>
                    </p>
                    <p className="mt-1">
                      <EstadoTexto estado={compra.estado} />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--text-subtitle)] font-bold text-slate-950">
                      {formatCRC(compra.total)}
                    </p>
                    <button
                      type="button"
                      onClick={() => abrirDetalle(compra)}
                      className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-full border border-slate-950 bg-slate-950 px-3 text-[var(--text-body)] font-semibold text-white"
                    >
                      <Eye className="size-3.5" /> <ST>Ver detalle</ST>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="min-h-11 rounded-full border border-slate-300 px-3 text-[var(--text-body)] disabled:opacity-50"
            >
              <ST>Anterior</ST>
            </button>
            <span className="text-[var(--text-body)] text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="min-h-11 rounded-full border border-slate-300 px-3 text-[var(--text-body)] disabled:opacity-50"
            >
              <ST>Siguiente</ST>
            </button>
          </div>
        ) : null}

        {detalle ? (
          <AdminModal open onClose={() => setDetalle(null)} maxWidth="max-w-xl" labelledBy="compra-cliente-detalle">
            <AdminModalHeader>
              <h2 id="compra-cliente-detalle" className="text-[var(--text-subtitle)] font-semibold">
                <ST>Compra</ST> {detalle.numero}
              </h2>
              <button
                type="button"
                onClick={() => setDetalle(null)}
                aria-label={t("Cerrar")}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </AdminModalHeader>
            <AdminModalBody>
              <dl className="grid gap-2 text-[var(--text-body)]">
                <div className="flex justify-between border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Fecha</ST></dt>
                  <dd>{formatFecha(detalle.fecha) || tSinFecha}</dd>
                </div>
                {detalle.ubicacionNombre ? (
                  <div className="flex justify-between border-b border-slate-100 py-2">
                    <dt className="text-slate-500"><ST>Punto de venta</ST></dt>
                    <dd>{detalle.ubicacionNombre}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Método</ST></dt>
                  <dd>{detalle.metodoPago}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Estado</ST></dt>
                  <dd>
                    <EstadoTexto estado={detalle.estado} />
                  </dd>
                </div>
              </dl>
              <ul className="mt-4 space-y-2 text-[var(--text-body)]">
                {(detalle.items || []).map((item, index) => (
                  <li key={`${item.nombre}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{item.nombre}</span>
                      <span className="font-semibold">{formatCRC(item.subtotal)}</span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      {item.cantidad} × {formatCRC(item.precioUnitario)}
                    </p>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 grid gap-1 text-[var(--text-body)]">
                <div className="flex justify-between">
                  <dt className="text-slate-500"><ST>Subtotal</ST></dt>
                  <dd>{formatCRC(detalle.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500"><ST>Impuestos</ST></dt>
                  <dd>{formatCRC(detalle.impuestos)}</dd>
                </div>
                <div className="flex justify-between font-bold">
                  <dt><ST>Total</ST></dt>
                  <dd>{formatCRC(detalle.total)}</dd>
                </div>
              </dl>
            </AdminModalBody>
          </AdminModal>
        ) : null}
      </main>
    );
  })();

  if (esAdmin) {
    return cuerpo;
  }

  return <PublicPageGate showLoading={showLoading}>{cuerpo}</PublicPageGate>;
}

/** Ruta pública /perfil/compras — redirige staff al panel admin. */
export default function HistorialComprasCliente() {
  const navigate = useNavigate();
  const user = getActiveSessionUser();

  useEffect(() => {
    if (user?.role === "admin") {
      navigate({ to: RUTA_COMPRAS_ADMIN, replace: true });
    }
  }, [navigate, user?.role]);

  if (user?.role === "admin") {
    return null;
  }

  return <HistorialComprasContent variant="standalone" />;
}
