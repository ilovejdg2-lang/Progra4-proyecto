import { AdminLayout } from "../../layouts/AdminLayout";
import "./Panel.css";

const AdminPanel = () => {
  const user = JSON.parse(localStorage.getItem("user"));

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
