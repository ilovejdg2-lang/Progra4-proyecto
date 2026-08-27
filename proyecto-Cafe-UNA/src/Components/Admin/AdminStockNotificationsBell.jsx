import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Package } from "lucide-react";

import { obtenerAlertasStock } from "../../services/productosService";
import { getActiveSessionUser } from "../../services/sessionService";
import { rolesDeUsuario, tienePermiso } from "../../lib/permisos";

function puedeVerAlertasStock(user) {
  const roles = rolesDeUsuario(user);
  return (
    tienePermiso(roles, "ver_inventario") ||
    tienePermiso(roles, "ver_panel_administrativo")
  );
}

export function AdminStockNotificationsBell() {
  const navigate = useNavigate();
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

  const openProducto = (productoId) => {
    setOpen(false);
    try {
      sessionStorage.setItem("cafe_una_stock_producto_id", String(productoId));
    } catch {
      /* ignore */
    }
    navigate({ to: "/admin/producto" });
  };

  return (
    <div className="relative ml-auto" ref={rootRef}>
      <button
        type="button"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100"
        aria-label="Ver alertas de stock"
        title="Alertas de stock"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) loadAlertas();
        }}
      >
        <Bell className="size-5" strokeWidth={2.2} aria-hidden="true" />
        {count > 0 ? (
          <span className="absolute right-1 top-1 grid min-w-[1.1rem] place-items-center rounded-full bg-red-600 px-1 text-[length:var(--text-body)] font-bold leading-none text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <aside
          className="absolute right-0 top-[calc(100%+0.4rem)] z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg"
          aria-label="Alertas de stock"
        >
          <header className="mb-3 flex items-center justify-between gap-3">
            <h2 className="m-0 text-[length:var(--text-subtitle)] font-bold text-slate-950">
              Stock bajo
            </h2>
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-[length:var(--text-body)] font-bold text-slate-800">
              {count}
            </span>
          </header>

          {loading ? (
            <p className="m-0 text-[length:var(--text-body)] text-slate-600">Cargando alertas...</p>
          ) : error ? (
            <p className="m-0 text-[length:var(--text-body)] text-red-700">{error}</p>
          ) : count === 0 ? (
            <p className="m-0 text-[length:var(--text-body)] text-slate-600">
              No hay productos con poco stock en los puntos de venta.
            </p>
          ) : (
            <div className="grid max-h-[22rem] gap-2 overflow-y-auto">
              {alertas.map((item) => {
                const lugares =
                  Array.isArray(item.ubicaciones) && item.ubicaciones.length > 0
                    ? item.ubicaciones
                        .map((ubi) => `${ubi.nombre}: ${ubi.stock}`)
                        .join(" · ")
                    : `Stock ${item.stockActual} (mín. ${item.stockMinimo})`;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="grid w-full gap-1 rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-slate-300 hover:bg-slate-50"
                    onClick={() => openProducto(item.id)}
                    title="Abrir inventario del producto"
                  >
                    <strong className="text-[length:var(--text-body)] text-slate-950">
                      {item.nombre}
                    </strong>
                    <span className="text-[length:var(--text-body)] text-slate-600">
                      {item.agotado ? "Agotado" : "Bajo mínimo"}
                      {" · "}
                      {lugares}
                    </span>
                    <small className="inline-flex items-center gap-1 text-[length:var(--text-body)] font-bold text-amber-800">
                      <Package className="size-3.5" aria-hidden="true" />
                      Reponer stock
                    </small>
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      ) : null}
    </div>
  );
}
