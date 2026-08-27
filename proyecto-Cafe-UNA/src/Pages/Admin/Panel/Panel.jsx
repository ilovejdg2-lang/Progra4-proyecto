import { useEffect, useState } from "react";
import { AlertTriangle, Package } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { getActiveSessionUser } from "../../../services/sessionService";
import { obtenerAlertasStock } from "../../../services/productosService";
import { tienePermiso, rolesDeUsuario } from "../../../lib/permisos";
import { requestAdminStockProduct } from "../../../lib/adminStockAlert";
import "./Panel.css";

const AdminPanel = () => {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const puedeVerAlertas =
    tienePermiso(roles, "ver_inventario") ||
    tienePermiso(roles, "ver_panel_administrativo");
  const { showLoading, loadingMessage } = useAdminPageGate("/admin", true);

  const [alertas, setAlertas] = useState([]);
  const [cargandoAlertas, setCargandoAlertas] = useState(puedeVerAlertas);
  const [errorAlertas, setErrorAlertas] = useState("");

  useEffect(() => {
    if (!puedeVerAlertas) {
      setCargandoAlertas(false);
      return undefined;
    }
    let activo = true;
    setCargandoAlertas(true);
    obtenerAlertasStock()
      .then((data) => {
        if (!activo) return;
        setAlertas(Array.isArray(data) ? data : []);
        setErrorAlertas("");
      })
      .catch((err) => {
        if (!activo) return;
        setAlertas([]);
        setErrorAlertas(err?.message || "No se pudieron cargar las alertas de stock.");
      })
      .finally(() => {
        if (activo) setCargandoAlertas(false);
      });
    return () => {
      activo = false;
    };
  }, [puedeVerAlertas]);

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <div className="admin-panel">
          <h2>Panel Administrativo</h2>
          <p>Bienvenido, {user?.name}!</p>
          <p>{"Aqu\u00ed puedes gestionar la aplicaci\u00f3n."}</p>

          {puedeVerAlertas ? (
            <section className="admin-panel__alertas" aria-label="Alertas de stock">
              <div className="admin-panel__alertas-head">
                <AlertTriangle className="size-5 text-slate-950" aria-hidden="true" />
                <h3>Alertas de stock</h3>
              </div>

              {cargandoAlertas ? (
                <p className="admin-panel__alertas-msg">Cargando alertas...</p>
              ) : errorAlertas ? (
                <p className="admin-panel__alertas-msg admin-panel__alertas-msg--error">{errorAlertas}</p>
              ) : alertas.length === 0 ? (
                <p className="admin-panel__alertas-msg">
                  Todo el inventario está en niveles normales
                </p>
              ) : (
                <ul className="admin-panel__alertas-list">
                  {alertas.map((item) => (
                    <li
                      key={item.id}
                      className={`admin-panel__alerta-item ${
                        item.agotado ? "admin-panel__alerta-item--agotado" : "admin-panel__alerta-item--bajo"
                      }`}
                    >
                      <div>
                        <p className="admin-panel__alerta-nombre">{item.nombre}</p>
                        <p className="admin-panel__alerta-meta">
                          Peor stock: <strong>{item.stockActual}</strong>
                          {" · "}
                          Mínimo: <strong>{item.stockMinimo}</strong>
                          {item.agotado ? " · Agotado" : " · Bajo mínimo"}
                          {Array.isArray(item.ubicaciones) && item.ubicaciones.length > 0 ? (
                            <>
                              {" · "}
                              {item.ubicaciones
                                .map((ubi) => `${ubi.nombre}: ${ubi.stock}`)
                                .join(", ")}
                            </>
                          ) : null}
                        </p>
                      </div>
                      <Link
                        to="/admin/producto"
                        className="admin-panel__alerta-btn"
                        onClick={() => requestAdminStockProduct(item.id, { nombre: item.nombre })}
                      >
                        <Package className="size-4" aria-hidden="true" />
                        Reponer stock
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminPanel;
