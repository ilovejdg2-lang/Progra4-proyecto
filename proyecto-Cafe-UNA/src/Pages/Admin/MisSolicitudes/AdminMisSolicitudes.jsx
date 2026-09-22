import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { HistorialSolicitudesContent } from "../../HistorialSolicitudes/HistorialSolicitudesCliente";

export default function AdminMisSolicitudes() {
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/mis-solicitudes", true);

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <HistorialSolicitudesContent variant="admin" />
      </AdminLayout>
    </AdminPageGate>
  );
}
