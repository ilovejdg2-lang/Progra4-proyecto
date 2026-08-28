import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, HandHeart, Package } from "lucide-react";

import { obtenerAlertasStock } from "../../services/productosService";
import { obtenerSolicitudes } from "../../services/voluntariadoService";
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

function puedeVerVoluntariado(user) {
  const roles = rolesDeUsuario(user);
  return (
    tienePermiso(roles, "ver_solicitudes_voluntariado") ||
    tienePermiso(roles, "administrar_solicitudes_voluntariado") ||
    tienePermiso(roles, "ver_panel_administrativo")
  );
}

function esSolicitudPendiente(solicitud) {
  return String(solicitud?.estado || "").trim().toLowerCase() === "pendiente";
}

export function AdminStockNotificationsBell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const user = getActiveSessionUser();
  const puedeStock = puedeVerAlertasStock(user);
  const puedeVoluntariado = puedeVerVoluntariado(user);
  const enabled = puedeStock || puedeVoluntariado;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertas, setAlertas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const rootRef = useRef(null);

  const loadNotificaciones = useCallback(async () => {
    if (!enabled) {
      setAlertas([]);
      setSolicitudes([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [stockData, voluntariadoData] = await Promise.all([
        puedeStock ? obtenerAlertasStock().catch(() => []) : Promise.resolve([]),
        puedeVoluntariado ? obtenerSolicitudes().catch(() => []) : Promise.resolve([]),
      ]);
      setAlertas(Array.isArray(stockData) ? stockData : []);
      setSolicitudes(Array.isArray(voluntariadoData) ? voluntariadoData : []);
    } catch (err) {
      setAlertas([]);
      setSolicitudes([]);
      setError(err?.message || "No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }, [enabled, puedeStock, puedeVoluntariado]);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = window.setTimeout(() => {
      loadNotificaciones();
    }, 0);

    const syncVoluntariado = () => loadNotificaciones();
    window.addEventListener("voluntariado-updated", syncVoluntariado);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("voluntariado-updated", syncVoluntariado);
    };
  }, [enabled, loadNotificaciones]);

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

  const solicitudesPendientes = solicitudes.filter(esSolicitudPendiente);
  const alertasCount = puedeStock ? alertas.length : 0;
  const voluntariadoCount = puedeVoluntariado ? solicitudesPendientes.length : 0;
  const count = alertasCount + voluntariadoCount;

  const openProducto = (item) => {
    setOpen(false);
    requestAdminStockProduct(item.id, { nombre: item.nombre });
    if (pathname !== "/admin/producto") {
      navigate({ to: "/admin/producto" });
    }
  };

  const openVoluntariado = () => {
    setOpen(false);
    navigate({ to: "/admin/voluntariado" });
  };

  return (
    <div className="navbar__notifications relative ml-auto" ref={rootRef}>
      <button
        type="button"
        className="navbar__icon-button"
        aria-label="Ver notificaciones"
        title="Notificaciones"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) loadNotificaciones();
        }}
      >
        <Bell size={22} strokeWidth={2.2} aria-hidden="true" />
      </button>
      {count > 0 ? (
        <span className="notifications-badge">{count > 99 ? "99+" : count}</span>
      ) : null}

      {open ? (
        <aside className="dropdown dropdown--notifications" aria-label="Notificaciones">
          <header className="notifications-header">
            <h2>Notificaciones</h2>
            <span>{count}</span>
          </header>

          {loading ? (
            <p className="dropdown__empty">Cargando notificaciones...</p>
          ) : error ? (
            <p className="dropdown__empty">{error}</p>
          ) : count === 0 ? (
            <p className="dropdown__empty">No hay notificaciones pendientes.</p>
          ) : (
            <div className="notifications-list">
              {alertasCount > 0 ? (
                <section className="notifications-section" aria-label="Stock bajo">
                  <p className="notifications-section-label">Stock bajo</p>
                  {alertas.map((item) => {
                    const lugares =
                      Array.isArray(item.ubicaciones) && item.ubicaciones.length > 0
                        ? item.ubicaciones.map((ubi) => `${ubi.nombre}: ${ubi.stock}`).join(" · ")
                        : `Stock ${item.stockActual} (mín. ${item.stockMinimo})`;

                    return (
                      <button
                        key={`stock-${item.id}`}
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
              ) : null}

              {voluntariadoCount > 0 ? (
                <section className="notifications-section" aria-label="Voluntariado">
                  {alertasCount > 0 ? (
                    <p className="notifications-section-label">Voluntariado</p>
                  ) : null}
                  {solicitudesPendientes.map((solicitud) => (
                    <button
                      key={`vol-${solicitud.id}`}
                      type="button"
                      className="notification-item notification-item--voluntariado"
                      onClick={openVoluntariado}
                      title={"Abrir administraci\u00f3n de voluntariado"}
                    >
                      <span className="notification-item__icon" aria-hidden="true">
                        <HandHeart size={16} />
                      </span>
                      <div className="notification-item__main">
                        <strong>{solicitud.tipoVoluntariado || solicitud.area || "Voluntariado"}</strong>
                        <span>{solicitud.fechaSolicitud || "Fecha no disponible"}</span>
                        <small>{"Abrir en administraci\u00f3n"}</small>
                      </div>
                    </button>
                  ))}
                </section>
              ) : null}
            </div>
          )}
        </aside>
      ) : null}
    </div>
  );
}
