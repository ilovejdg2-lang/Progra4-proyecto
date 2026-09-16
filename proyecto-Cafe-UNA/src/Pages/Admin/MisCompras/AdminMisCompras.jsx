import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { HistorialComprasContent } from "../../HistorialCompras/HistorialComprasCliente";

export default function AdminMisCompras() {
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/mis-compras", true);

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <HistorialComprasContent variant="admin" />
      </AdminLayout>
    </AdminPageGate>
  );
}
