import { AdminLayout } from "../layouts/AdminLayout";
import AdminRouteLoading from "../../../Components/Admin/AdminRouteLoading";
import { PerfilContent } from "../../../Components/Perfil/PerfilContent";
import { useAdminPageLoadingGate } from "../../../hooks/usePublicPageLoadingGate";

const AdminPerfil = () => {
  const showLoading = useAdminPageLoadingGate('/admin/perfil', true);

  if (showLoading) {
    return <AdminRouteLoading />;
  }

  return (
    <AdminLayout>
      <PerfilContent variant="admin" />
    </AdminLayout>
  );
};

export default AdminPerfil;
