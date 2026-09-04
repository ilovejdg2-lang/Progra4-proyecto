import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Banknote,
  Calendar,
  Clock,
  Eye,
  FileText,
  Hash,
  Mail,
  MapPin,
  Package,
  Phone,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminModalLock } from "../../../hooks/useBodyScrollLock";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import {
  actualizarEstadoSolicitudDonacion,
  camposSolicitudDonacion,
  obtenerSolicitudesDonacionAdmin,
} from "../../../services/donacionesService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { ST } from "../../../Components/T/ST";
import { ImageLightbox } from "../../../Components/ImageLightbox/ImageLightbox";
import { useTraducir } from "../../../hooks/useTraducir";
import { t } from "../../../lib/t";

const accionBtnBase =
  "inline-flex items-center justify-center gap-1 rounded-full border text-[11px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

const btnCancelarGris =
  "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";

function formatFecha(valor) {
  if (!valor) return "";
  const fecha = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString("es-CR");
}

function formatValor(valor) {
  const limpio = String(valor || "").replace(/[^\d.,]/g, "").replace(",", ".");
  const numero = Number(limpio);
  if (!Number.isFinite(numero) || numero <= 0) return "";
  return `CRC ${numero.toLocaleString("es-CR")}`;
}

function claseEstado(estado) {
  if (estado === "Aceptada") return "text-emerald-700";
  if (estado === "Rechazada") return "text-rose-700";
  return "text-amber-700";
}

function BadgeEstado({ estado }) {
  const etiqueta = useTraducir(estado || "Pendiente");
  return (
    <span className={`admin-chip-estado text-[length:var(--text-body)] font-semibold ${claseEstado(estado)}`}>
      {etiqueta}
    </span>
  );
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DN";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function partirNombreCompleto(completo = "") {
  const parts = String(completo || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { nombre: "", primerApellido: "", segundoApellido: "" };
  if (parts.length === 1) return { nombre: parts[0], primerApellido: "", segundoApellido: "" };
  if (parts.length === 2) return { nombre: parts[0], primerApellido: parts[1], segundoApellido: "" };
  return {
    nombre: parts.slice(0, -2).join(" "),
    primerApellido: parts[parts.length - 2],
    segundoApellido: parts[parts.length - 1],
  };
}

function DetailField({ icon: Icon, label, value, className = "", traducirValor = false }) {
  const tVacio = useTraducir("No indicado");
  const mostrar = value
    ? traducirValor
      ? <ST>{value}</ST>
      : value
    : tVacio;
  return (
    <div className={`grid gap-2 ${className}`}>
      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="size-4 text-slate-500" />
        <ST>{label}</ST>
      </span>
      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
        {mostrar}
      </p>
    </div>
  );
}

function ModalDetalle({ solicitud, puedeResolver, onResolver, onCerrar }) {
  useAdminModalLock(true);
  const campos = camposSolicitudDonacion(solicitud);
  const partes = partirNombreCompleto(campos.donanteNombre);
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const [fotoVista, setFotoVista] = useState(null);
  const urlsFotos = campos.fotos
    .map((foto) => String(foto.url || foto.Url || "").trim())
    .filter(Boolean);

  const btnEstadoBase = `${accionBtnBase} px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50`;
  const btnAprobar = `${btnEstadoBase} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300`;
  const btnRechazar = `${btnEstadoBase} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300`;

  async function cambiarEstado(estado) {
    setGuardando(true);
    setErrorAccion("");
    try {
      await onResolver(solicitud.id, estado);
      onCerrar();
    } catch (accionError) {
      setErrorAccion(
        accionError instanceof Error ? accionError.message : t("No se pudo actualizar el estado."),
      );
    } finally {
      setGuardando(false);
    }
  }

  return createPortal(
    <>
    <div className="admin-modal-root">
      <div
        className="admin-modal-backdrop"
        aria-hidden="true"
        onClick={onCerrar}
        onWheel={(event) => event.preventDefault()}
        onTouchMove={(event) => event.preventDefault()}
      />
      <div className="relative z-10 max-h-[92dvh] w-full max-w-xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950"><ST>Ver solicitud</ST></h2>
            <p className="text-sm text-slate-500">
              <ST>Solicitud</ST> #{solicitud.id} · <ST>Fecha de la solicitud</ST>{" "}
              {formatFecha(campos.fechaSolicitud) || t("sin fecha")}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={t("Cerrar")}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
          <header className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-slate-950 text-base font-bold text-white">
              {getInitials(campos.donanteNombre)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-slate-950">{campos.donanteNombre || t("Sin nombre")}</h3>
              <div className="mt-2">
                <BadgeEstado estado={campos.estado} />
              </div>
            </div>
          </header>

          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              <ST>Información del donante</ST>
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField icon={UserRound} label="¿Quién realizará la donación?" value={campos.tipoDonante} traducirValor />
              {campos.esOrganizacion ? (
                <DetailField icon={UserRound} label="Razón social" value={campos.donanteNombre} />
              ) : (
                <>
                  <DetailField icon={UserRound} label="Nombre" value={campos.nombre || partes.nombre} />
                  <DetailField icon={UserRound} label="Primer apellido" value={campos.primerApellido || partes.primerApellido} />
                  <DetailField icon={UserRound} label="Segundo apellido" value={campos.segundoApellido || partes.segundoApellido} />
                </>
              )}
              <DetailField icon={Hash} label="Tipo de identificación" value={campos.tipoIdentificacion} traducirValor />
              <DetailField icon={Hash} label="Identificación" value={campos.numeroIdentificacion} />
              <DetailField icon={Mail} label="Correo electrónico" value={campos.correo} />
              <DetailField icon={Phone} label="Teléfono" value={campos.telefono} />
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              <ST>Detalles de la donación</ST>
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField icon={Package} label="Categoría de la donación" value={campos.categoria} traducirValor />
              <DetailField icon={Package} label="Cantidad o volumen estimado" value={campos.cantidadEstimada} />
              <DetailField icon={FileText} label="Estado de los artículos" value={campos.estadoArticulos} traducirValor />
              <DetailField
                icon={FileText}
                label="Descripción detallada de los artículos"
                value={campos.descripcion}
                className="md:col-span-2"
                traducirValor
              />
              <div className="grid gap-2 md:col-span-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Package className="size-4 text-slate-500" />
                  <ST>Fotografías de los artículos</ST>
                </span>
                {campos.fotos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {campos.fotos.map((foto, index) => (
                      <button
                        key={`${foto.nombre || "foto"}-${index}`}
                        type="button"
                        className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 p-0"
                        onClick={() => setFotoVista(index)}
                        aria-label="Ver imagen más grande"
                      >
                        <img
                          src={foto.url || foto.Url}
                          alt=""
                          className="h-full w-full cursor-zoom-in object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                    <ST>No indicado</ST>
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              <ST>Logística de entrega</ST>
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField icon={Truck} label="Método de entrega preferido" value={campos.metodoEntrega} traducirValor />
              <DetailField
                icon={Calendar}
                label="Día de entrega o recolección"
                value={formatFecha(campos.fechaEntrega)}
              />
              <DetailField
                icon={Clock}
                label="Hora de entrega o recolección"
                value={campos.horaEntrega}
              />
              <DetailField
                icon={MapPin}
                label="Dirección de recolección"
                value={campos.direccionRecoleccion}
                className="md:col-span-2"
              />
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              <ST>Declaración y confirmación</ST>
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField icon={Banknote} label="Valor estimado de la donación" value={formatValor(campos.valorEstimado)} />
              <DetailField icon={Calendar} label="Fecha de la solicitud" value={formatFecha(campos.fechaSolicitud)} />
            </div>
          </section>

          {errorAccion ? <p className="mt-4 text-sm text-rose-700">{errorAccion}</p> : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {puedeResolver && campos.estado === "Pendiente" ? (
              <>
                <button type="button" disabled={guardando} onClick={() => cambiarEstado("Aceptada")} className={btnAprobar}>
                  <ST>Aceptar</ST>
                </button>
                <button type="button" disabled={guardando} onClick={() => cambiarEstado("Rechazada")} className={btnRechazar}>
                  <ST>Rechazar</ST>
                </button>
              </>
            ) : null}
          </div>
          <button type="button" onClick={onCerrar} className={btnCancelarGris}>
            <ST>Cerrar</ST>
          </button>
        </div>
      </div>
    </div>
    <ImageLightbox
      images={urlsFotos}
      index={fotoVista}
      onClose={() => setFotoVista(null)}
      onIndexChange={setFotoVista}
      alt="Fotografía de la donación"
    />
    </>,
    document.body,
  );
}

export default function AdminSolicitudesDonacion() {
  const roles = rolesDeUsuario(getActiveSessionUser());
  const puedeVer =
    tienePermiso(roles, "ver_solicitudes_donacion") ||
    tienePermiso(roles, "administrar_solicitudes_donaciones");
  const puedeResolver =
    tienePermiso(roles, "administrar_solicitudes_donaciones") ||
    tienePermiso(roles, "actualizar_solicitud_donaciones");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [viendo, setViendo] = useState(null);

  const load = useCallback(async () => {
    if (!puedeVer) return;
    setStatus("loading");
    try {
      setItems(await obtenerSolicitudesDonacionAdmin());
      setStatus("success");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las solicitudes.");
      setStatus("error");
    }
  }, [puedeVer]);

  useEffect(() => {
    load();
  }, [load]);

  const { showLoading, loadingMessage } = useAdminPageGate(
    "/admin/donaciones/solicitudes",
    status !== "idle",
  );

  async function resolverSolicitud(id, estado) {
    const actualizada = await actualizarEstadoSolicitudDonacion(id, estado);
    setItems((prev) =>
      prev.map((row) => (row.id === actualizada.id ? { ...row, ...actualizada } : row)),
    );
    window.dispatchEvent(new Event("donaciones-updated"));
  }

  if (showLoading) {
    return (
      <AdminLayout>
        <AdminPageGate showLoading message={loadingMessage} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl">
        <h1 className="text-[length:var(--text-title)] font-semibold text-slate-900">
          <ST>Solicitudes de donación</ST>
        </h1>
        <p className="mt-1 mb-4 text-[length:var(--text-body)] text-slate-500">
          <ST>Gestioná el estado y revisá los datos de cada solicitud de donación recibida.</ST>
        </p>
        {!puedeVer ? (
          <p className="text-[length:var(--text-body)]"><ST>No tiene permiso para ver solicitudes de donación.</ST></p>
        ) : error ? (
          <p className="text-rose-700">{error}</p>
        ) : items.length === 0 ? (
          <AdminListaVacia />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="admin-table-shell">
              <table className="w-full min-w-[720px] table-fixed border-collapse text-center text-[length:var(--text-body)]">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[26%]" />
                  <col className="w-[14%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th><ST>Nombre</ST></th>
                    <th><ST>Tipo de donación</ST></th>
                    <th><ST>Fecha</ST></th>
                    <th><ST>Estado</ST></th>
                    <th><ST>Acciones</ST></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row) => {
                    const campos = camposSolicitudDonacion(row);
                    return (
                      <tr key={row.id} className="transition hover:bg-slate-50/60">
                        <td className="px-4 py-4 text-center">
                          <div className="font-semibold text-slate-950">{campos.donanteNombre || t("Sin nombre")}</div>
                          <div className="mt-1 text-slate-500">{campos.correo || t("Sin correo")}</div>
                        </td>
                        <td className="px-4 py-4 text-center text-slate-700">
                          {campos.categoria ? <ST>{campos.categoria}</ST> : t("No indicado")}
                        </td>
                        <td className="px-4 py-4 text-center text-slate-700">
                          {formatFecha(campos.fechaSolicitud) || t("No indicada")}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center">
                            <BadgeEstado estado={row.estado} />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => setViendo(row)}
                              className={`${accionBtnBase} h-7 border-slate-300 bg-white px-2 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300`}
                              title={t("Ver solicitud")}
                            >
                              <Eye className="size-3 shrink-0" aria-hidden="true" />
                              <span><ST>Ver</ST></span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {viendo ? (
        <ModalDetalle
          solicitud={viendo}
          puedeResolver={puedeResolver}
          onResolver={resolverSolicitud}
          onCerrar={() => setViendo(null)}
        />
      ) : null}
    </AdminLayout>
  );
}
