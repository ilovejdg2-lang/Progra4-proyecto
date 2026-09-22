import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, X } from "lucide-react";

import { AdminModal, AdminModalBody, AdminModalHeader } from "../../Components/Admin/ui/AdminModal";
import { AdminPaginacion } from "../../Components/Admin/ui/AdminPaginacion";
import { NumericInput } from "../../Components/NumericInput/NumericInput";
import { PerfilClienteLayout } from "../../Components/Perfil/PerfilClienteLayout";
import { PublicPageGate } from "../../Components/PublicPageGate/PublicPageGate";
import { ST } from "../../Components/T/ST";
import { usePublicPageLoadingGate } from "../../hooks/usePublicPageLoadingGate";
import { useTraducir } from "../../hooks/useTraducir";
import { rolesDeUsuario, tienePermiso } from "../../lib/permisos";
import { t } from "../../lib/t";
import { obtenerCompraPorId, obtenerMisCompras } from "../../services/comprasService";
import { obtenerFooter } from "../../services/informacionService";
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
    case "Devolucion":
      return "text-violet-800";
    default:
      return "text-slate-700";
  }
}

function EstadoTexto({ estado, className = "" }) {
  return (
    <span className={`text-[var(--text-body)] font-semibold ${colorEstado(estado)} ${className}`.trim()}>
      <ST>{etiquetaEstado(estado)}</ST>
    </span>
  );
}

function etiquetaEstado(estadoRaw) {
  switch (String(estadoRaw || "Pendiente").trim()) {
    case "Pendiente":
      return "Procesando";
    case "Aceptado":
      return "Enviado";
    case "Entregado":
      return "Entregado";
    case "Rechazado":
      return "Rechazado";
    case "Devolucion":
      return "Devoluciones";
    default:
      return estadoRaw || "Procesando";
  }
}

const TABS_ESTADO = [
  { value: "todos", label: "Todos" },
  { value: "Pendiente", label: "Procesando" },
  { value: "Aceptado", label: "Enviado" },
  { value: "Entregado", label: "Entregado" },
  { value: "Rechazado", label: "Rechazado" },
  { value: "Devolucion", label: "Devoluciones" },
];

const PASOS_PEDIDO = [
  { key: "Pendiente", label: "Procesando" },
  { key: "Aceptado", label: "Enviado" },
  { key: "Entregado", label: "Entregado" },
];

function mensajeRastreo(estadoRaw) {
  switch (String(estadoRaw || "Pendiente").trim()) {
    case "Aceptado":
      return "Tu pedido fue enviado y va en camino.";
    case "Entregado":
      return "Tu pedido ya fue entregado.";
    case "Rechazado":
      return "Tu pedido fue rechazado.";
    case "Devolucion":
      return "Tu pedido tiene una devolución por un problema.";
    default:
      return "Tu pedido está en procesamiento.";
  }
}

/** Stepper visual solo en el detalle: Procesando → Enviado → Entregado (X si Rechazado/Devolución). */
function RastreoPedido({ estado, correoContacto = "", telefonoContacto = "" }) {
  const actual = String(estado || "Pendiente").trim();
  const rechazado = actual === "Rechazado";
  const devolucion = actual === "Devolucion";
  const conProblema = rechazado || devolucion;
  const indiceActual = Math.max(
    0,
    PASOS_PEDIDO.findIndex((p) => p.key === (rechazado ? "Pendiente" : devolucion ? "Entregado" : actual)),
  );
  const pasos = rechazado
    ? [
        { key: "Pendiente", label: "Procesando" },
        { key: "Rechazado", label: "Rechazado" },
      ]
    : devolucion
      ? [...PASOS_PEDIDO, { key: "Devolucion", label: "Devoluciones" }]
      : PASOS_PEDIDO;
  const correo = String(correoContacto || "").trim();
  const telefono = String(telefonoContacto || "").trim();

  return (
    <div
      className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
      aria-label="Rastreo del pedido"
    >
      <p className="mb-3 text-[var(--text-body)] font-semibold text-slate-800">
        <ST>Rastreo del pedido</ST>
      </p>
      <ol className="flex w-full items-start gap-0">
        {pasos.map((paso, index) => {
          const esUltimo = index === pasos.length - 1;
          const esProblema = paso.key === "Rechazado" || paso.key === "Devolucion";
          const completado = rechazado
            ? paso.key === "Pendiente"
            : devolucion
              ? !esProblema
              : actual === "Entregado"
                ? index <= indiceActual
                : index < indiceActual;
          const activo = rechazado
            ? paso.key === "Rechazado" || paso.key === "Pendiente"
            : devolucion
              ? true
              : index <= indiceActual;
          const esActual = conProblema
            ? esProblema
            : index === indiceActual;
          const colorPaso = esProblema
            ? "bg-rose-600 border-rose-600 text-white"
            : activo
              ? "bg-slate-950 border-slate-950 text-white"
              : "bg-white border-slate-300 text-slate-400";
          const colorLinea =
            conProblema && index === pasos.length - 2
              ? "bg-rose-300"
              : conProblema || index < indiceActual
                ? "bg-slate-950"
                : "bg-slate-200";

          return (
            <li key={paso.key} className={`flex min-w-0 ${esUltimo ? "flex-none" : "flex-1"} items-start`}>
              <div className="flex w-full flex-col items-center text-center">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[var(--text-body)] font-bold ${colorPaso} ${esActual ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
                  aria-current={esActual ? "step" : undefined}
                >
                  {esProblema ? "×" : completado ? "✓" : index + 1}
                </span>
                <span
                  className={`mt-1.5 max-w-[5.5rem] text-[var(--text-body)] leading-tight ${esActual ? `font-semibold ${colorEstado(paso.key)}` : activo ? "font-medium text-slate-700" : "text-slate-400"}`}
                >
                  <ST>{paso.label}</ST>
                </span>
              </div>
              {!esUltimo ? (
                <span
                  className={`mt-3.5 mx-1 h-0.5 min-w-[1.25rem] flex-1 rounded-full ${colorLinea}`}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className={`mt-3 text-center text-[var(--text-body)] ${colorEstado(actual)}`}>
        <ST>{mensajeRastreo(actual)}</ST>
      </p>
      {correo || telefono ? (
        <p className="mt-2 text-center text-[var(--text-body)] text-slate-600">
          <ST>Si es incorrecto, comunicate con</ST>{" "}
          {correo ? (
            <a href={`mailto:${correo}`} className="font-semibold text-slate-900 underline-offset-2 hover:underline">
              {correo}
            </a>
          ) : null}
          {correo && telefono ? <span> · </span> : null}
          {telefono ? (
            <a
              href={`tel:${telefono.replace(/\D/g, "")}`}
              className="font-semibold text-slate-900 underline-offset-2 hover:underline"
            >
              {telefono}
            </a>
          ) : null}
          .
        </p>
      ) : null}
    </div>
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
  const [compras, setCompras] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompras, setTotalCompras] = useState(0);
  const [filtros, setFiltros] = useState(INITIAL_FILTERS);
  const [correoContacto, setCorreoContacto] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");

  useEffect(() => {
    let cancelado = false;
    obtenerFooter()
      .then((footer) => {
        if (cancelado || !footer) return;
        setCorreoContacto(String(footer.correo ?? footer.Correo ?? "").trim());
        setTelefonoContacto(String(footer.telefono ?? footer.Telefono ?? "").trim());
      })
      .catch(() => {
        if (cancelado) return;
        setCorreoContacto("");
        setTelefonoContacto("");
      });
    return () => {
      cancelado = true;
    };
  }, []);

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
        setTotalCompras(0);
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
      setTotalCompras(Number(result.total) || 0);
      setStatus("success");
    } catch (loadError) {
      if (requestId !== historyRequestRef.current) return;
      setCompras([]);
      setTotalCompras(0);
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
        </header>

        <nav
          className="flex gap-5 overflow-x-auto border-b border-slate-200"
          aria-label="Tipo de pedido"
        >
          {TABS_ESTADO.map((tab) => {
            const activo = filtros.estado === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setPage(1);
                  setFiltros((c) => ({ ...c, estado: tab.value }));
                }}
                className={`relative shrink-0 pb-2.5 text-[var(--text-body)] transition-colors ${
                  activo
                    ? "font-bold text-slate-950"
                    : "font-medium text-slate-400 hover:text-slate-600"
                }`}
                aria-current={activo ? "page" : undefined}
              >
                <ST>{tab.label}</ST>
                {activo ? (
                  <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-slate-950" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </nav>

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
          <div className="grid gap-1 text-[var(--text-body)]">
            <span className="invisible font-medium" aria-hidden="true"><ST>Restablecer filtros</ST></span>
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
                      className="mt-2 inline-flex min-h-[var(--control-height)] items-center gap-1 rounded-full border border-slate-950 bg-slate-950 px-3 text-[var(--text-body)] font-semibold text-white"
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
          esAdmin ? (
            <AdminPaginacion
              page={page}
              totalPages={totalPages}
              total={totalCompras}
              pageSize={10}
              onChange={setPage}
              label="Paginación de mis compras"
            />
          ) : (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="min-h-[var(--control-height)] rounded-full border border-slate-300 px-3 text-[var(--text-body)] disabled:opacity-50"
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
                className="min-h-[var(--control-height)] rounded-full border border-slate-300 px-3 text-[var(--text-body)] disabled:opacity-50"
              >
                <ST>Siguiente</ST>
              </button>
            </div>
          )
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
              <RastreoPedido
                estado={detalle.estado}
                correoContacto={correoContacto}
                telefonoContacto={telefonoContacto}
              />
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

  return (
    <PerfilClienteLayout>
      <HistorialComprasContent variant="standalone" />
    </PerfilClienteLayout>
  );
}
