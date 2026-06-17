import { AdminLayout } from "../layouts/AdminLayout";
import AdminRouteLoading from "../../../Components/Admin/AdminRouteLoading";
import { useAdminPageLoadingGate } from "../../../hooks/usePublicPageLoadingGate";
import { getActiveSessionUser } from "../../../services/sessionService";
import "./Panel.css";

const AdminPanel = () => {
  const user = getActiveSessionUser();
  const showLoading = useAdminPageLoadingGate('/admin', true);

  if (showLoading) {
    return <AdminRouteLoading />;
  }

  return (
    <AdminLayout>
      <div className="admin-panel">
        <h2>Panel Administrativo</h2>
        <p>Bienvenido, {user?.name}!</p>
        <p>{"Aqui puedes gestionar la aplicaci\u00f3n."}</p>
      </div>
    </AdminLayout>
  );
};

export default AdminPanel;
