import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { tienePermiso } from "../../../lib/permisos";
import { getActiveSessionUser } from "../../../services/sessionService";
import { EquipoEditor } from "./EquipoEditor";

function rolesActuales() {
  try {
    const actor = getActiveSessionUser();
    return Array.isArray(actor?.roles) ? actor.roles : [];
  } catch {
    return [];
  }
}

const AdminEquipo = () => {
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/equipo", true);
  const puedeEliminar = tienePermiso(rolesActuales(), "inactivar_informacion");

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <EquipoEditor puedeEliminar={puedeEliminar} />
      </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminEquipo;
