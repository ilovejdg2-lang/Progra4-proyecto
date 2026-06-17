import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { getActiveSessionUser } from "../../../services/sessionService";
import "./Panel.css";

const AdminPanel = () => {
  const user = getActiveSessionUser();
  const { showLoading, loadingMessage } = useAdminPageGate('/admin', true);

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <div className="admin-panel">
          <h2>Panel Administrativo</h2>
          <p>Bienvenido, {user?.name}!</p>
          <p>{"Aqui puedes gestionar la aplicaci\u00f3n."}</p>
        </div>
      </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminPanel;
