import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { PerfilContent } from "../../../Components/Perfil/PerfilContent";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";

const AdminPerfil = () => {
  const { showLoading, loadingMessage } = useAdminPageGate('/admin/perfil', true);

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <PerfilContent variant="admin" />
      </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminPerfil;
