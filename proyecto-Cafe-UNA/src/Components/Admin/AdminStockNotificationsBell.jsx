import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Gift, HandHeart, Package } from "lucide-react";

import { obtenerAlertasStock } from "../../services/productosService";
import { obtenerSolicitudes } from "../../services/voluntariadoService";
import { obtenerSolicitudesDonacionAdmin } from "../../services/donacionesService";
import { getActiveSessionUser } from "../../services/sessionService";
import { rolesDeUsuario, tienePermiso } from "../../lib/permisos";
import { requestAdminStockProduct } from "../../lib/adminStockAlert";
import { useTraducir } from "../../hooks/useTraducir";
import { ST } from "../T/ST";
import "../Navbar/Navbar.css";

function NombreNotif({ texto }) {
  return useTraducir(texto || "");
}

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

function puedeVerDonaciones(user) {
  const roles = rolesDeUsuario(user);
  return (
    tienePermiso(roles, "ver_solicitudes_donacion") ||
    tienePermiso(roles, "administrar_solicitudes_donaciones") ||
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
  const puedeDonaciones = puedeVerDonaciones(user);
  const enabled = puedeStock || puedeVoluntariado || puedeDonaciones;

  const labelNotificaciones = useTraducir("Notificaciones");
  const labelStockBajo = useTraducir("STOCK BAJO");
  const labelReponer = useTraducir("Reponer stock");
  const labelAgotado = useTraducir("Agotado");
  const labelBajoMinimo = useTraducir("Bajo mínimo");
  const labelCargando = useTraducir("Cargando notificaciones...");
  const labelVacias = useTraducir("No hay notificaciones pendientes.");
  const labelVol = useTraducir("Voluntariado");
  const labelDon = useTraducir("Donaciones");
  const labelAbrirAdmin = useTraducir("Abrir en administración");

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertas, setAlertas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesDonacion, setSolicitudesDonacion] = useState([]);
  const [panelStyle, setPanelStyle] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const loadNotificaciones = useCallback(async () => {
    if (!enabled) {
      setAlertas([]);
      setSolicitudes([]);
      setSolicitudesDonacion([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [stockData, voluntariadoData, donacionesData] = await Promise.all([
        puedeStock ? obtenerAlertasStock().catch(() => []) : Promise.resolve([]),
        puedeVoluntariado ? obtenerSolicitudes().catch(() => []) : Promise.resolve([]),
        puedeDonaciones ? obtenerSolicitudesDonacionAdmin().catch(() => []) : Promise.resolve([]),
      ]);
      setAlertas(Array.isArray(stockData) ? stockData : []);
      setSolicitudes(Array.isArray(voluntariadoData) ? voluntariadoData : []);
      setSolicitudesDonacion(Array.isArray(donacionesData) ? donacionesData : []);
    } catch (err) {
      setAlertas([]);
      setSolicitudes([]);
      setSolicitudesDonacion([]);
      setError(err?.message || "No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }, [enabled, puedeStock, puedeVoluntariado, puedeDonaciones]);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = window.setTimeout(() => {
      loadNotificaciones();
    }, 0);

    const syncVoluntariado = () => loadNotificaciones();
    window.addEventListener("voluntariado-updated", syncVoluntariado);
    window.addEventListener("donaciones-updated", syncVoluntariado);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("voluntariado-updated", syncVoluntariado);
      window.removeEventListener("donaciones-updated", syncVoluntariado);
    };
  }, [enabled, loadNotificaciones]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPanelStyle(null);
      return undefined;
    }

    const sync = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportPad = 12;
      const gap = 8;
      const width = Math.min(380, window.innerWidth - viewportPad * 2);
      let left = rect.right - width;
      if (left < viewportPad) left = viewportPad;
      if (left + width > window.innerWidth - viewportPad) {
        left = Math.max(viewportPad, window.innerWidth - width - viewportPad);
      }
      const top = rect.bottom + gap;
      const maxHeight = Math.max(160, window.innerHeight - top - viewportPad);

      setPanelStyle({
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
        right: "auto",
        zIndex: 100040,
      });
    };

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      const target = event.target;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
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
  const donacionesPendientes = solicitudesDonacion.filter(esSolicitudPendiente);
  const alertasCount = puedeStock ? alertas.length : 0;
  const voluntariadoCount = puedeVoluntariado ? solicitudesPendientes.length : 0;
  const donacionesCount = puedeDonaciones ? donacionesPendientes.length : 0;
  const count = alertasCount + voluntariadoCount + donacionesCount;

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

  const openDonaciones = () => {
    setOpen(false);
    navigate({ to: "/admin/donaciones/solicitudes" });
  };

  const panel =
    open && panelStyle
      ? createPortal(
          <aside
            ref={panelRef}
            className="dropdown dropdown--notifications dropdown--notifications-portal"
            style={panelStyle}
            aria-label={labelNotificaciones}
          >
            <header className="notifications-header">
              <h2>{labelNotificaciones}</h2>
              <span>{count}</span>
            </header>

            {loading ? (
              <p className="dropdown__empty">{labelCargando}</p>
            ) : error ? (
              <p className="dropdown__empty">
                <ST>{error}</ST>
              </p>
            ) : count === 0 ? (
              <p className="dropdown__empty">{labelVacias}</p>
            ) : (
              <div className="notifications-list">
                {alertasCount > 0 ? (
                  <section className="notifications-section" aria-label={labelStockBajo}>
                    <p className="notifications-section-label">{labelStockBajo}</p>
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
                          title={labelReponer}
                        >
                          <span className="notification-item__icon" aria-hidden="true">
                            <Package size={16} />
                          </span>
                          <div className="notification-item__main">
                            <strong>
                              <NombreNotif texto={item.nombre} />
                            </strong>
                            <span>
                              {item.agotado ? labelAgotado : labelBajoMinimo}
                              {" · "}
                              {lugares}
                            </span>
                            <small className="notification-item__stock">{labelReponer}</small>
                          </div>
                        </button>
                      );
                    })}
                  </section>
                ) : null}

                {voluntariadoCount > 0 ? (
                  <section className="notifications-section" aria-label={labelVol}>
                    {alertasCount > 0 ? (
                      <p className="notifications-section-label">{labelVol}</p>
                    ) : null}
                    {solicitudesPendientes.map((solicitud) => (
                      <button
                        key={`vol-${solicitud.id}`}
                        type="button"
                        className="notification-item notification-item--voluntariado"
                        onClick={openVoluntariado}
                        title={labelAbrirAdmin}
                      >
                        <span className="notification-item__icon" aria-hidden="true">
                          <HandHeart size={16} />
                        </span>
                        <div className="notification-item__main">
                          <strong>
                            <NombreNotif
                              texto={solicitud.tipoVoluntariado || solicitud.area || "Voluntariado"}
                            />
                          </strong>
                          <small>{labelAbrirAdmin}</small>
                        </div>
                      </button>
                    ))}
                  </section>
                ) : null}

                {donacionesCount > 0 ? (
                  <section className="notifications-section" aria-label={labelDon}>
                    <p className="notifications-section-label">{labelDon}</p>
                    {donacionesPendientes.map((solicitud) => (
                      <button
                        key={`donacion-${solicitud.id}`}
                        type="button"
                        className="notification-item notification-item--donacion"
                        onClick={openDonaciones}
                        title={labelAbrirAdmin}
                      >
                        <span className="notification-item__icon" aria-hidden="true">
                          <Gift size={16} />
                        </span>
                        <div className="notification-item__main">
                          <strong>
                            <NombreNotif
                              texto={solicitud.necesidadTitulo || solicitud.tipo || "Donación"}
                            />
                          </strong>
                          <small>{labelAbrirAdmin}</small>
                        </div>
                      </button>
                    ))}
                  </section>
                ) : null}
              </div>
            )}
          </aside>,
          document.body,
        )
      : null;

  return (
    <div className="navbar__notifications relative ml-auto" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="navbar__icon-button"
        aria-label="Ver notificaciones"
        title={labelNotificaciones}
        aria-expanded={open}
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
      {panel}
    </div>
  );
}
