import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Package } from "lucide-react";

import { obtenerAlertasStock } from "../../services/productosService";
import { getActiveSessionUser } from "../../services/sessionService";
import { rolesDeUsuario, tienePermiso } from "../../lib/permisos";
import { requestAdminStockProduct } from "../../lib/adminStockAlert";
import "../Navbar/Navbar.css";

function puedeVerAlertasStock(user) {
  const roles = rolesDeUsuario(user);
  return (
    tienePermiso(roles, "ver_inventario") ||
    tienePermiso(roles, "ver_panel_administrativo")
  );
}

export function AdminStockNotificationsBell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const user = getActiveSessionUser();
  const enabled = puedeVerAlertasStock(user);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertas, setAlertas] = useState([]);
  const rootRef = useRef(null);

  const loadAlertas = useCallback(async () => {
    if (!enabled) {
      setAlertas([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await obtenerAlertasStock();
      setAlertas(Array.isArray(data) ? data : []);
    } catch (err) {
      setAlertas([]);
      setError(err?.message || "No se pudieron cargar las alertas de stock.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = window.setTimeout(() => {
      loadAlertas();
    }, 0);
    return () => window.clearTimeout(id);
  }, [enabled, loadAlertas]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  if (!enabled) return null;

  const count = alertas.length;

  const openProducto = (item) => {
    setOpen(false);
    requestAdminStockProduct(item.id, { nombre: item.nombre });
    if (pathname !== "/admin/producto") {
      navigate({ to: "/admin/producto" });
    }
  };

  return (
    <div className="navbar__notifications relative ml-auto" ref={rootRef}>
      <button
        type="button"
        className="navbar__icon-button"
        aria-label="Ver alertas de stock"
        title="Alertas de stock"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) loadAlertas();
        }}
      >
        <Bell size={22} strokeWidth={2.2} aria-hidden="true" />
      </button>
      {count > 0 ? (
        <span className="notifications-badge">{count > 99 ? "99+" : count}</span>
      ) : null}

      {open ? (
        <aside className="dropdown dropdown--notifications" aria-label="Alertas de stock">
          <header className="notifications-header">
            <h2>Notificaciones</h2>
            <span>{count}</span>
          </header>

          {loading ? (
            <p className="dropdown__empty">Cargando alertas...</p>
          ) : error ? (
            <p className="dropdown__empty">{error}</p>
          ) : count === 0 ? (
            <p className="dropdown__empty">No hay productos con poco stock en los puntos de venta.</p>
          ) : (
            <div className="notifications-list">
              <section className="notifications-section" aria-label="Stock bajo">
                <p className="notifications-section-label">Stock bajo</p>
                {alertas.map((item) => {
                  const lugares =
                    Array.isArray(item.ubicaciones) && item.ubicaciones.length > 0
                      ? item.ubicaciones.map((ubi) => `${ubi.nombre}: ${ubi.stock}`).join(" · ")
                      : `Stock ${item.stockActual} (mín. ${item.stockMinimo})`;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`notification-item ${item.agotado ? "notification-item--agotado" : "notification-item--bajo"}`}
                      onClick={() => openProducto(item)}
                      title="Abrir inventario del producto"
                    >
                      <span className="notification-item__icon" aria-hidden="true">
                        <Package size={16} />
                      </span>
                      <div className="notification-item__main">
                        <strong>{item.nombre}</strong>
                        <span>
                          {item.agotado ? "Agotado" : "Bajo mínimo"}
                          {" · "}
                          {lugares}
                        </span>
                        <small className="notification-item__stock">Reponer stock</small>
                      </div>
                    </button>
                  );
                })}
              </section>
            </div>
          )}
        </aside>
      ) : null}
    </div>
  );
}
