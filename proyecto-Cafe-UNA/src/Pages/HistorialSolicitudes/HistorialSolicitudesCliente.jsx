import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye } from "lucide-react";

import { AdminModal, AdminModalBody, AdminModalHeader } from "../../Components/Admin/ui/AdminModal";
import { PerfilClienteLayout } from "../../Components/Perfil/PerfilClienteLayout";
import { PublicPageGate } from "../../Components/PublicPageGate/PublicPageGate";
import { ST } from "../../Components/T/ST";
import { UiSelect } from "../../Components/ui/Select";
import { usePublicPageLoadingGate } from "../../hooks/usePublicPageLoadingGate";
import { useTraducir } from "../../hooks/useTraducir";
import { rolesDeUsuario, tienePermiso } from "../../lib/permisos";
import { t } from "../../lib/t";
import {
  obtenerDetalleSolicitudPropia,
  obtenerMisSolicitudes,
} from "../../services/solicitudesService";
import { getActiveSessionUser, SESSION_UPDATED_EVENT } from "../../services/sessionService";

export const RUTA_SOLICITUDES_CLIENTE = "/perfil/solicitudes";
export const RUTA_SOLICITUDES_ADMIN = "/admin/mis-solicitudes";

export function rutaMisSolicitudes(user) {
  return user?.role === "admin" ? RUTA_SOLICITUDES_ADMIN : RUTA_SOLICITUDES_CLIENTE;
}

function formatFecha(fecha) {
  if (!fecha) return null;
  const valor = new Date(fecha);
  if (!Number.isNaN(valor.getTime())) {
    return valor.toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" });
  }
  return String(fecha);
}

function colorEstado(estadoRaw) {
  const estado = String(estadoRaw || "Pendiente")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (estado.includes("pendiente") || estado.includes("revision") || estado.includes("en revision")) {
    return "text-amber-800";
  }
  if (estado.includes("acept") || estado.includes("aprob")) {
    return "text-emerald-800";
  }
  if (estado.includes("rechaz") || estado.includes("inactiv")) {
    return "text-rose-800";
  }
  return "text-slate-700";
}

function EstadoTexto({ estado, className = "" }) {
  return (
    <span className={`text-[var(--text-body)] font-semibold ${colorEstado(estado)} ${className}`.trim()}>
      <ST>{estado || "Pendiente"}</ST>
    </span>
  );
}

const INITIAL_FILTERS = {
  tipo: "todos",
  estado: "todos",
};

const OPCIONES_TIPO = [
  { value: "todos", label: "Todos" },
  { value: "voluntariado", label: "Voluntariado" },
  { value: "donacion", label: "Donación" },
  { value: "visita", label: "Visita grupal" },
];

const OPCIONES_ESTADO = [
  { value: "todos", label: "Todos" },
  { value: "Pendiente", label: "Pendiente" },
  { value: "En revisión", label: "En revisión" },
  { value: "Aceptada", label: "Aceptada" },
  { value: "Rechazada", label: "Rechazada" },
];

const CAMPOS_DETALLE = [
  ["titulo", "Resumen"],
  ["tipoEtiqueta", "Tipo"],
  ["identificador", "Identificador"],
  ["fechaEnvio", "Fecha de envío"],
  ["estado", "Estado"],
  ["necesidadTitulo", "Necesidad"],
  ["materialNombre", "Material"],
  ["descripcion", "Descripción"],
  ["fechaPropuesta", "Fecha propuesta"],
  ["tipoVoluntariado", "Tipo de voluntariado"],
  ["nombre", "Nombre"],
  ["email", "Correo"],
  ["telefono", "Teléfono"],
  ["institucion", "Institución"],
  ["modalidad", "Modalidad"],
  ["area", "Área"],
  ["motivacion", "Motivación"],
  ["observacionesAdmin", "Observaciones del equipo"],
  ["encargadoNombre", "Encargado"],
  ["encargadoEmail", "Correo del encargado"],
  ["encargadoTelefono", "Teléfono del encargado"],
  ["tipoVisitante", "Tipo de visitante"],
  ["tipoGrupo", "Tipo de grupo"],
  ["cantidadVisitantes", "Cantidad de visitantes"],
  ["fechaVisita", "Fecha de visita"],
  ["horaPreferida", "Hora preferida"],
  ["motivoVisita", "Motivo"],
  ["motivoOtro", "Motivo (otro)"],
];

/**
 * @param {{ variant?: "standalone" | "admin" }} props
 */
export function HistorialSolicitudesContent({ variant = "standalone" }) {
  const navigate = useNavigate();
  const esAdmin = variant === "admin";
  const perfilVolver = esAdmin ? "/admin/perfil" : "/perfil";
  const loginRedirect = esAdmin ? RUTA_SOLICITUDES_ADMIN : RUTA_SOLICITUDES_CLIENTE;

  const [user, setUser] = useState(() => getActiveSessionUser());
  const userRef = useRef(user);
  const listRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const userId = user?.id ?? null;
  const roles = rolesDeUsuario(user);
  const puedeVer =
    tienePermiso(roles, "ver_solicitudes_propias") ||
    tienePermiso(roles, "hacer_solicitud_donacion") ||
    tienePermiso(roles, "ingresar_solicitud_voluntariado") ||
    tienePermiso(roles, "crear_solicitud_visitante");
  const showLoading = usePublicPageLoadingGate(
    esAdmin ? "admin:mis-solicitudes" : "historial-solicitudes",
    true,
  );
  const tSinFecha = useTraducir("Sin fecha");

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
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
        listRequestRef.current += 1;
        detailRequestRef.current += 1;
        setItems([]);
        setDetalle(null);
        setError("");
        setStatus("idle");
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
    const requestId = ++listRequestRef.current;
    setStatus("loading");
    setError("");
    try {
      const result = await obtenerMisSolicitudes(filtros);
      if (requestId !== listRequestRef.current) return;
      setItems(Array.isArray(result?.data) ? result.data : []);
      setStatus("success");
    } catch (loadError) {
      if (requestId !== listRequestRef.current) return;
      setItems([]);
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el historial.");
    }
  }, [userId, puedeVer, filtros]);

  useEffect(() => {
    load();
  }, [load]);

  const abrirDetalle = async (item) => {
    const requestId = ++detailRequestRef.current;
    try {
      const next = await obtenerDetalleSolicitudPropia(item.tipo, item.identificador);
      if (requestId !== detailRequestRef.current) return;
      setDetalle({
        ...next?.resumen,
        ...(next?.detalle && typeof next.detalle === "object" ? next.detalle : {}),
      });
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
            <ST>Iniciá sesión para ver tus solicitudes.</ST>
          </p>
          <Link
            to="/login"
            className="mt-4 inline-flex min-h-[var(--control-height)] items-center rounded-full bg-slate-950 px-4 text-[var(--text-body)] font-semibold text-white"
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
            <ST>Tu rol no tiene acceso al seguimiento de solicitudes.</ST>
          </p>
          <Link
            to={perfilVolver}
            className="mt-4 inline-flex min-h-[var(--control-height)] items-center gap-2 text-[var(--text-body)] font-semibold text-slate-700"
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
          className="inline-flex min-h-[var(--control-height)] items-center gap-2 text-[var(--text-body)] font-semibold text-slate-700"
        >
          <ArrowLeft className="size-4" /> <ST>Volver al perfil</ST>
        </Link>
        <header>
          <h1 className="text-[var(--text-title)] font-semibold text-slate-950">
            <ST>Mis solicitudes</ST>
          </h1>
          <p className="mt-1 text-[var(--text-body)] text-slate-500">
            <ST>Consultá el estado de tus formularios: voluntariado, donaciones y visitas.</ST>
          </p>
        </header>

        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <label className="grid gap-1 text-[var(--text-body)]">
            <span className="font-medium text-slate-700"><ST>Tipo</ST></span>
            <UiSelect
              ariaLabel={t("Tipo")}
              value={filtros.tipo}
              onChange={(tipo) => setFiltros((c) => ({ ...c, tipo }))}
              options={OPCIONES_TIPO}
            />
          </label>
          <label className="grid gap-1 text-[var(--text-body)]">
            <span className="font-medium text-slate-700"><ST>Estado</ST></span>
            <UiSelect
              ariaLabel={t("Estado")}
              value={filtros.estado}
              onChange={(estado) => setFiltros((c) => ({ ...c, estado }))}
              options={OPCIONES_ESTADO}
            />
          </label>
        </section>

        {error ? (
          <p className="text-[var(--text-body)] text-rose-700"><ST>{error}</ST></p>
        ) : null}

        {status === "loading" ? (
          <p className="text-[var(--text-body)] text-slate-500"><ST>Cargando solicitudes...</ST></p>
        ) : null}

        {status === "success" && items.length === 0 ? (
          <p className="text-[var(--text-body)] text-slate-500">
            <ST>Todavía no tenés solicitudes registradas.</ST>
          </p>
        ) : null}

        <ul className="grid gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[var(--text-subtitle)] font-semibold text-slate-950">
                    <ST>{item.titulo}</ST>
                  </p>
                  <p className="text-[var(--text-body)] text-slate-600">
                    <ST>{item.tipoEtiqueta}</ST>
                    {" · #"}
                    {item.identificador}
                    {" · "}
                    {formatFecha(item.fechaEnvio) || tSinFecha}
                  </p>
                  <EstadoTexto estado={item.estado} />
                </div>
                <button
                  type="button"
                  onClick={() => abrirDetalle(item)}
                  className="inline-flex min-h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-200 px-4 text-[var(--text-body)] font-semibold text-slate-800"
                >
                  <Eye className="size-4" />
                  <ST>Ver detalle</ST>
                </button>
              </div>
            </li>
          ))}
        </ul>

        {detalle ? (
          <AdminModal open onClose={() => setDetalle(null)}>
            <AdminModalHeader onClose={() => setDetalle(null)}>
              <ST>Detalle de la solicitud</ST>
            </AdminModalHeader>
            <AdminModalBody>
              <dl className="grid gap-3 sm:grid-cols-2">
                {CAMPOS_DETALLE.map(([clave, etiqueta]) => {
                  const valor = detalle[clave];
                  if (valor == null || valor === "") return null;
                  const texto =
                    clave === "fechaEnvio" || clave.includes("fecha") || clave.includes("Fecha")
                      ? formatFecha(valor) || String(valor)
                      : String(valor);
                  return (
                    <div key={clave} className="min-w-0">
                      <dt className="text-[var(--text-body)] font-medium text-slate-500">
                        <ST>{etiqueta}</ST>
                      </dt>
                      <dd className="mt-1 text-[var(--text-body)] text-slate-900">
                        {clave === "estado" ? <EstadoTexto estado={texto} /> : <ST>{texto}</ST>}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </AdminModalBody>
          </AdminModal>
        ) : null}
      </main>
    );
  })();

  if (esAdmin) return cuerpo;
  return <PublicPageGate showLoading={showLoading}>{cuerpo}</PublicPageGate>;
}

export default function HistorialSolicitudesCliente() {
  const navigate = useNavigate();
  const user = getActiveSessionUser();

  useEffect(() => {
    if (user?.role === "admin") {
      navigate({ to: RUTA_SOLICITUDES_ADMIN, replace: true });
    }
  }, [navigate, user?.role]);

  if (user?.role === "admin") return null;
  return (
    <PerfilClienteLayout>
      <HistorialSolicitudesContent variant="standalone" />
    </PerfilClienteLayout>
  );
}
