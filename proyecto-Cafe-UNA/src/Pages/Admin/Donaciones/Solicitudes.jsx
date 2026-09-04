import { useCallback, useEffect, useState } from "react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { obtenerSolicitudesDonacionAdmin } from "../../../services/donacionesService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { ST } from "../../../Components/T/ST";

function formatFecha(valor) {
  if (!valor) return "—";
  const fecha = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString("es-CR");
}

export default function AdminSolicitudesDonacion() {
  const roles = rolesDeUsuario(getActiveSessionUser());
  const puedeVer =
    tienePermiso(roles, "ver_solicitudes_donacion") ||
    tienePermiso(roles, "administrar_solicitudes_donaciones");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

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
          <ST>Las solicitudes nuevas quedan en Pendiente.</ST>
        </p>
        {!puedeVer ? (
          <p className="text-[length:var(--text-body)]"><ST>No tiene permiso para ver solicitudes de donación.</ST></p>
        ) : error ? (
          <p className="text-rose-700">{error}</p>
        ) : items.length === 0 ? (
          <AdminListaVacia />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white admin-table-shell">
            <table className="w-full min-w-[800px] text-left text-[length:var(--text-body)]">
              <thead>
                <tr>
                  <th><ST>Fecha propuesta</ST></th>
                  <th><ST>Tipo</ST></th>
                  <th><ST>Persona</ST></th>
                  <th><ST>Estado</ST></th>
                  <th><ST>Descripción</ST></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-6 py-4">{formatFecha(row.fechaPropuesta)}</td>
                    <td className="px-6 py-4"><ST>{row.necesidadTitulo || row.tipo}</ST></td>
                    <td className="px-6 py-4">{row.usuarioNombre || "—"}</td>
                    <td className="px-6 py-4"><ST>{row.estado}</ST></td>
                    <td className="px-6 py-4"><ST>{row.descripcion}</ST></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
