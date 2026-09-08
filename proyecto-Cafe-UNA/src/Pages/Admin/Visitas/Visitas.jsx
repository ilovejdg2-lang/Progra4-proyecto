import { useCallback, useEffect, useState } from "react";
import { CalendarDays, RefreshCw, Search, Trash2, Users } from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { AdminLayout } from "../layouts/AdminLayout";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { getActiveSessionUser } from "../../../services/sessionService";
import {
  actualizarSolicitudVisita,
  eliminarSolicitudVisita,
  obtenerSolicitudesVisitas,
} from "../../../services/visitasService";
import { DisponibilidadVisitas } from "./DisponibilidadVisitas";

const STATES = ["Pendiente", "En revisión", "Aprobada", "Rechazada", "Inactiva"];

function StatusBadge({ value }) {
  const colors = {
    Pendiente: "bg-amber-100 text-amber-800",
    "En revisión": "bg-blue-100 text-blue-800",
    Aprobada: "bg-emerald-100 text-emerald-800",
    Rechazada: "bg-rose-100 text-rose-800",
    Inactiva: "bg-slate-200 text-slate-700",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${colors[value] || colors.Pendiente}`}>{value}</span>;
}

export default function AdminVisitas() {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const canManage = tienePermiso(roles, "administrar_solicitudes_visitantes");
  const [items, setItems] = useState([]);
  const [draftStates, setDraftStates] = useState({});
  const [filters, setFilters] = useState({ estado: "", busqueda: "" });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/visitas", !loading);

  const load = useCallback(async (activeFilters = {}) => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await obtenerSolicitudesVisitas(activeFilters);
      setItems(data);
      setDraftStates(Object.fromEntries(data.map((item) => [item.id, item.estado])));
    } catch (requestError) {
      setError(requestError?.message || "No se pudieron cargar las solicitudes de visita.");
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    if (!canManage) return undefined;

    let active = true;
    obtenerSolicitudesVisitas()
      .then((data) => {
        if (!active) return;
        setItems(data);
        setDraftStates(Object.fromEntries(data.map((item) => [item.id, item.estado])));
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError?.message || "No se pudieron cargar las solicitudes de visita.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canManage]);

  const applyFilters = (event) => {
    event.preventDefault();
    setMessage("");
    void load(filters);
  };

  const updateState = async (item) => {
    const nextState = draftStates[item.id] || item.estado;
    setBusyId(item.id);
    setError("");
    setMessage("");
    try {
      const updated = await actualizarSolicitudVisita(item.id, { Estado: nextState });
      setItems((current) => current.map((row) => (row.id === item.id ? updated : row)));
      setMessage(`Solicitud #${item.id} actualizada correctamente.`);
    } catch (requestError) {
      setError(requestError?.message || "No se pudo actualizar la solicitud.");
    } finally {
      setBusyId("");
    }
  };

  const deactivate = async (item) => {
    if (!window.confirm(`¿Deseás inactivar la solicitud #${item.id}?`)) return;
    setBusyId(item.id);
    setError("");
    setMessage("");
    try {
      await eliminarSolicitudVisita(item.id);
      setItems((current) => current.filter((row) => row.id !== item.id));
      setMessage(`Solicitud #${item.id} inactivada correctamente.`);
    } catch (requestError) {
      setError(requestError?.message || "No se pudo inactivar la solicitud.");
    } finally {
      setBusyId("");
    }
  };

  if (showLoading) {
    return (
      <AdminLayout>
        <AdminPageGate showLoading message={loadingMessage} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Formularios</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Visitas grupales</h1>
            <p className="mt-2 text-slate-600">Revisá solicitudes y mantené informado al encargado del grupo.</p>
          </div>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => load(filters)}
            type="button"
          >
            <RefreshCw size={16} aria-hidden="true" /> Actualizar
          </button>
        </header>

        {!canManage ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900" role="alert">
            No tenés permiso para administrar solicitudes de visitas.
          </p>
        ) : (
          <>
            <DisponibilidadVisitas />
            <form className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px_auto]" onSubmit={applyFilters}>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Buscar
                <span className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                  <input className="min-h-10 w-full rounded-xl border border-slate-300 pl-10 pr-3" name="busqueda" value={filters.busqueda} onChange={(event) => setFilters((current) => ({ ...current, busqueda: event.target.value }))} placeholder="Nombre, correo o identificación" />
                </span>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Estado
                <select className="min-h-10 rounded-xl border border-slate-300 px-3" value={filters.estado} onChange={(event) => setFilters((current) => ({ ...current, estado: event.target.value }))}>
                  <option value="">Todos</option>
                  {STATES.map((state) => <option key={state}>{state}</option>)}
                </select>
              </label>
              <button className="min-h-10 self-end rounded-xl bg-slate-950 px-5 font-bold text-white hover:bg-slate-800" type="submit">Filtrar</button>
            </form>

            {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800" role="alert">{error}</p> : null}
            {message ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900" role="status">{message}</p> : null}

            {loading ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Cargando solicitudes…</p>
            ) : items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No hay solicitudes con estos filtros.</p>
            ) : (
              <div className="grid gap-4">
                {items.map((item) => (
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={item.id}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg font-bold text-slate-950">{item.encargadoNombre || "Sin nombre"}</h2>
                          <StatusBadge value={item.estado} />
                        </div>
                        <p className="mt-1 break-all text-sm text-slate-600">{item.encargadoEmail}</p>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
                          <span className="inline-flex items-center gap-2"><CalendarDays size={16} aria-hidden="true" /> {item.fechaVisita || "Sin fecha"}</span>
                          <span className="inline-flex items-center gap-2"><Users size={16} aria-hidden="true" /> {item.cantidadVisitantes} personas</span>
                          <span>{item.tipoGrupo || "Grupo sin clasificar"} · {item.ciudadProvincia || "Sin ubicación"}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label className="sr-only" htmlFor={`estado-visita-${item.id}`}>Estado de solicitud {item.id}</label>
                        <select
                          aria-label={`Estado de solicitud ${item.id}`}
                          className="min-h-10 rounded-xl border border-slate-300 px-3"
                          id={`estado-visita-${item.id}`}
                          value={draftStates[item.id] || item.estado}
                          onChange={(event) => setDraftStates((current) => ({ ...current, [item.id]: event.target.value }))}
                        >
                          {STATES.filter((state) => state !== "Inactiva").map((state) => <option key={state}>{state}</option>)}
                        </select>
                        <button
                          aria-label={`Guardar estado de solicitud ${item.id}`}
                          className="min-h-10 rounded-xl bg-emerald-700 px-4 font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                          disabled={busyId === item.id}
                          onClick={() => updateState(item)}
                          type="button"
                        >
                          Guardar
                        </button>
                        <button
                          aria-label={`Inactivar solicitud ${item.id}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-200 px-3 text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                          disabled={busyId === item.id}
                          onClick={() => deactivate(item)}
                          type="button"
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
