import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useRouterState } from "@tanstack/react-router";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { aplicarMatrizPermisos, rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { sanitizeUserFacingError } from "../../../lib/formLimits";
import { t } from "../../../lib/t";
import {
  guardarMatrizPermisos,
  obtenerMatrizPermisos,
} from "../../../services/ajustesService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { CatalogosSistema } from "./CatalogosSistema";
import { HorariosCalendario } from "./HorariosCalendario";
import { PermisosMatriz } from "./PermisosMatriz";
import { moduloDePermiso } from "./permisosModulos";

function seccionDesdePath(pathname) {
  if (pathname.includes("/permisos")) return "permisos";
  if (pathname.includes("/catalogos")) return "catalogos";
  return "horarios";
}

const TITULOS = {
  horarios: {
    title: "Horarios",
    lead: "Días y horas en que se puede llegar a comprar productos.",
  },
  permisos: {
    title: "Permisos",
    lead: "Qué puede hacer cada rol. Filtrá por módulo y tocá el ícono para activar o quitar.",
  },
  catalogos: {
    title: "Catálogos",
    lead: "Listas que se usan en formularios y en la tienda: categorías e íconos, presentaciones en gramos, estados de artículos y métodos de pago.",
  },
};

export default function AdminAjustes() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const seccion = seccionDesdePath(pathname);
  const meta = TITULOS[seccion] || TITULOS.horarios;
  const tEyebrow = useTraducir("Ajustes del sistema");
  const tTitle = useTraducir(meta.title);
  const tLead = useTraducir(meta.lead);
  const redirigirRaiz =
    pathname === "/admin/ajustes" ||
    pathname === "/admin/ajustes/" ||
    pathname.includes("/ajustes/idioma");

  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const puede = tienePermiso(roles, "administrar_roles_permisos");

  const [listo, setListo] = useState(false);
  const [matrizData, setMatrizData] = useState({ roles: [], permisos: [], matriz: {} });
  const [matrizLocal, setMatrizLocal] = useState({});
  const [filtroModulo, setFiltroModulo] = useState("todos");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [tonoMsg, setTonoMsg] = useState("ok");
  const [guardandoMatriz, setGuardandoMatriz] = useState(false);

  const mostrarMensaje = useCallback((msg, tono = "ok") => {
    setOkMsg(msg || "");
    setTonoMsg(tono);
    setError("");
  }, []);
  const mostrarError = useCallback((msg) => {
    setError(msg || "");
    if (msg) setOkMsg("");
  }, []);

  const { showLoading, loadingMessage } = useAdminPageGate(
    redirigirRaiz ? "/admin/ajustes/horarios" : pathname,
    listo && puede,
  );

  const cargar = useCallback(async () => {
    setError("");
    try {
      if (seccion === "permisos") {
        const matriz = await obtenerMatrizPermisos();
        setMatrizData(matriz);
        setMatrizLocal(matriz.matriz || {});
        aplicarMatrizPermisos(matriz.matriz || {});
      }
    } catch (err) {
      setError(sanitizeUserFacingError(err?.message || "No se pudieron cargar los ajustes."));
    } finally {
      setListo(true);
    }
  }, [seccion]);

  useEffect(() => {
    setListo(false);
    setOkMsg("");
    setError("");
    setFiltroModulo("todos");
  }, [seccion]);

  useEffect(() => {
    if (!puede) {
      setListo(true);
      return;
    }
    void cargar();
  }, [puede, cargar]);

  const permisosConModulo = useMemo(() => {
    return (matrizData.permisos || [])
      .map((p) => ({
        ...p,
        modulo: moduloDePermiso(p),
      }))
      .filter((p) => Boolean(p.modulo));
  }, [matrizData.permisos]);

  const modulosDisponibles = useMemo(() => {
    const map = new Map();
    for (const p of permisosConModulo) {
      if (!p.modulo?.id) continue;
      if (!map.has(p.modulo.id)) map.set(p.modulo.id, p.modulo);
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [permisosConModulo]);

  if (redirigirRaiz) {
    return <Navigate to="/admin/ajustes/horarios" replace />;
  }

  const togglePermiso = (codigo, rol) => {
    setMatrizLocal((prev) => {
      const actual = new Set(prev[codigo] || []);
      if (actual.has(rol)) actual.delete(rol);
      else actual.add(rol);
      return { ...prev, [codigo]: [...actual] };
    });
    setOkMsg("");
  };

  const guardarMatriz = async () => {
    if (!window.confirm(t("¿Guardar la matriz de permisos? Los cambios aplican de inmediato."))) return;
    setGuardandoMatriz(true);
    setError("");
    try {
      const actualizado = await guardarMatrizPermisos(matrizLocal);
      setMatrizData(actualizado);
      setMatrizLocal(actualizado.matriz || {});
      aplicarMatrizPermisos(actualizado.matriz || {});
      mostrarMensaje("Matriz de permisos guardada.");
    } catch (err) {
      setError(sanitizeUserFacingError(err?.message || "No se pudo guardar la matriz."));
    } finally {
      setGuardandoMatriz(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageGate showLoading={showLoading} loadingMessage={loadingMessage} allowed={puede}>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 sm:p-6">
          <header>
            <p className="text-[length:var(--text-body)] font-semibold text-slate-500">{tEyebrow}</p>
            <h1 className="text-[length:var(--text-title)] font-bold text-slate-950">{tTitle}</h1>
            <p className="mt-1 text-[length:var(--text-body)] text-slate-600">{tLead}</p>
          </header>

          {error ? (
            <p className="text-[length:var(--text-body)] font-semibold text-red-600" role="alert">
              <ST>{error}</ST>
            </p>
          ) : null}
          {okMsg ? (
            <p
              className={`text-[length:var(--text-body)] font-semibold ${tonoMsg === "eliminado" ? "text-red-600" : "text-emerald-700"}`}
              role="status"
            >
              <ST>{okMsg}</ST>
            </p>
          ) : null}

          {seccion === "horarios" ? (
            <HorariosCalendario
              onMessage={(msg) => {
                setOkMsg(msg || "");
                setError("");
              }}
              onError={(msg) => {
                setError(msg || "");
                if (msg) setOkMsg("");
              }}
            />
          ) : null}

          {seccion === "catalogos" ? (
            <CatalogosSistema onMessage={mostrarMensaje} onError={mostrarError} />
          ) : null}

          {seccion === "permisos" ? (
            <PermisosMatriz
              roles={matrizData.roles}
              matrizLocal={matrizLocal}
              filtroModulo={filtroModulo}
              onFiltroModulo={setFiltroModulo}
              onToggle={togglePermiso}
              onGuardar={guardarMatriz}
              guardando={guardandoMatriz}
              modulos={modulosDisponibles}
              permisos={permisosConModulo}
            />
          ) : null}
        </div>
      </AdminPageGate>
    </AdminLayout>
  );
}
