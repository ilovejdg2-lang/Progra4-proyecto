<<<<<<< HEAD:proyecto-Cafe-UNA/src/Pages/Admin/Panel/Panel.jsx
import { AdminLayout } from "../layouts/AdminLayout";
=======
import { AdminLayout } from "../../layouts/AdminLayout";
>>>>>>> e9713895f8ce68616e520010142169c33dd96a6a:proyecto-Cafe-UNA/src/Pages/Admin/Panel.jsx
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
