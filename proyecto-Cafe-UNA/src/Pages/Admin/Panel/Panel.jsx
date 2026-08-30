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
import { useTraducir, useTraducirLista } from "../../../hooks/useTraducir";
import { ST } from "../../../Components/T/ST";
import "./Panel.css";

const CAMPOS_ALERTA = ["nombre"];

function AlertaMeta({ item, tPeor, tMinimo, tAgotado, tBajo }) {
  const lugares = Array.isArray(item.ubicaciones) && item.ubicaciones.length > 0
    ? item.ubicaciones.map((ubi) => `${ubi.nombre}: ${ubi.stock}`).join(", ")
    : null;

  return (
    <p className="admin-panel__alerta-meta">
      {tPeor}: <strong>{item.stockActual}</strong>
      {" · "}
      {tMinimo}: <strong>{item.stockMinimo}</strong>
      {item.agotado ? ` · ${tAgotado}` : ` · ${tBajo}`}
      {lugares ? (
        <>
          {" · "}
          {lugares}
        </>
      ) : null}
    </p>
  );
}

const AdminPanel = () => {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const puedeVerAlertas =
    tienePermiso(roles, "ver_inventario") ||
    tienePermiso(roles, "ver_panel_administrativo");
  const { showLoading, loadingMessage } = useAdminPageGate("/admin", true);

  const tPanel = useTraducir("Panel Administrativo");
  const tBienvenido = useTraducir("Bienvenido,");
  const tGestion = useTraducir("Aquí puedes gestionar la aplicación.");
  const tAlertas = useTraducir("Alertas de stock");
  const tCargando = useTraducir("Cargando alertas...");
  const tNormal = useTraducir("Todo el inventario está en niveles normales");
  const tPeor = useTraducir("Peor stock");
  const tMinimo = useTraducir("Mínimo");
  const tAgotado = useTraducir("Agotado");
  const tBajo = useTraducir("Bajo mínimo");
  const tReponer = useTraducir("Reponer stock");

  const [alertas, setAlertas] = useState([]);
  const [cargandoAlertas, setCargandoAlertas] = useState(puedeVerAlertas);
  const [errorAlertas, setErrorAlertas] = useState("");

  const alertasUi = useTraducirLista(alertas, CAMPOS_ALERTA);

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
          <h2>{tPanel}</h2>
          <p>{tBienvenido} {user?.name}!</p>
          <p>{tGestion}</p>

          {puedeVerAlertas ? (
            <section className="admin-panel__alertas" aria-label={tAlertas}>
              <div className="admin-panel__alertas-head">
                <AlertTriangle className="size-5 text-slate-950" aria-hidden="true" />
                <h3>{tAlertas}</h3>
              </div>

              {cargandoAlertas ? (
                <p className="admin-panel__alertas-msg">{tCargando}</p>
              ) : errorAlertas ? (
                <p className="admin-panel__alertas-msg admin-panel__alertas-msg--error">
                  <ST>{errorAlertas}</ST>
                </p>
              ) : alertas.length === 0 ? (
                <p className="admin-panel__alertas-msg">{tNormal}</p>
              ) : (
                <ul className="admin-panel__alertas-list">
                  {(alertasUi || alertas).map((item) => (
                    <li
                      key={item.id}
                      className={`admin-panel__alerta-item ${
                        item.agotado ? "admin-panel__alerta-item--agotado" : "admin-panel__alerta-item--bajo"
                      }`}
                    >
                      <div>
                        <p className="admin-panel__alerta-nombre">{item.nombre}</p>
                        <AlertaMeta
                          item={item}
                          tPeor={tPeor}
                          tMinimo={tMinimo}
                          tAgotado={tAgotado}
                          tBajo={tBajo}
                        />
                      </div>
                      <Link
                        to="/admin/producto"
                        className="admin-panel__alerta-btn"
                        onClick={() => requestAdminStockProduct(item.id, { nombre: item.nombre })}
                      >
                        <Package className="size-4" aria-hidden="true" />
                        {tReponer}
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
