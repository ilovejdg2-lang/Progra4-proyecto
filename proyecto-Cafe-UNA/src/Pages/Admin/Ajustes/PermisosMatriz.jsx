import { useMemo, useState } from "react";
import { Check, Shield, X } from "lucide-react";
import {
  AdminListaToolbar,
  AdminListaVacia,
} from "../../../Components/Admin/ui/AdminListaToolbar";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { t } from "../../../lib/t";
import { useIdioma } from "../../../lib/useIdioma";
import { moduloDePermiso } from "./permisosModulos";

const btnPrimario =
  "inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-[length:var(--text-body)] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

function TogglePermiso({ activo, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      aria-label={label}
      title={activo ? t("Permitido — clic para quitar") : t("Sin permiso — clic para permitir")}
      className={`mx-auto inline-flex size-[var(--control-height)] items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 ${
        activo
          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
          : "border-slate-200 bg-white text-slate-300 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-400"
      }`}
    >
      {activo ? (
        <Check className="size-5 stroke-[2.5]" aria-hidden />
      ) : (
        <X className="size-4 stroke-[2.5]" aria-hidden />
      )}
    </button>
  );
}

/**
 * Matriz de permisos con íconos y barra de filtros (módulo + búsqueda).
 */
export function PermisosMatriz({
  roles,
  matrizLocal,
  filtroModulo,
  onFiltroModulo,
  onToggle,
  onGuardar,
  guardando,
  modulos,
  permisos,
}) {
  const [busqueda, setBusqueda] = useState("");
  const { idioma } = useIdioma();

  const opcionesModulo = useMemo(
    () => [
      { value: "todos", label: t("Todos los módulos") },
      ...(modulos || []).map((m) => ({ value: m.id, label: t(m.label) })),
    ],
    [modulos, idioma],
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (permisos || []).filter((p) => {
      const meta = p.modulo || moduloDePermiso(p);
      if (!meta) return false;
      if (filtroModulo !== "todos" && meta.id !== filtroModulo) return false;
      if (!q) return true;
      return (
        String(p.nombre || "").toLowerCase().includes(q) ||
        String(p.codigo || "").toLowerCase().includes(q) ||
        String(meta.label || "").toLowerCase().includes(q)
      );
    });
  }, [permisos, filtroModulo, busqueda]);

  const hayFiltrosActivos = filtroModulo !== "todos" || busqueda.trim() !== "";
  const tGuardando = useTraducir("Guardando…");
  const tGuardarMatriz = useTraducir("Guardar matriz");

  const limpiar = () => {
    setBusqueda("");
    onFiltroModulo("todos");
  };

  return (
    <section className="overflow-visible rounded-3xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <Shield className="size-5" />
          </span>
          <div>
            <h2 className="text-[length:var(--text-subtitle)] font-bold text-slate-950">
              <ST>Permisos por rol</ST>
            </h2>
            <p className="text-[length:var(--text-body)] text-slate-500">
              <ST>Tocá el círculo para dar o quitar el permiso.</ST>
            </p>
          </div>
        </div>
        <button type="button" className={btnPrimario} onClick={onGuardar} disabled={guardando}>
          {guardando ? tGuardando : tGuardarMatriz}
        </button>
      </div>

      <AdminListaToolbar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        placeholder="Buscar permiso o módulo…"
        total={(permisos || []).length}
        visibles={filtrados.length}
        hayFiltrosActivos={hayFiltrosActivos}
        onLimpiar={limpiar}
        compacto
        filtros={[
          {
            id: "modulo",
            label: "Módulo",
            value: filtroModulo,
            onChange: onFiltroModulo,
            opciones: opcionesModulo,
          },
        ]}
      />

      <div className="flex flex-wrap gap-5 border-b border-slate-100 px-4 py-3 text-[length:var(--text-body)] text-slate-600 sm:px-6">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex size-[var(--control-height)] items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="size-5" />
          </span>
          <ST>Permitido</ST>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex size-[var(--control-height)] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-300">
            <X className="size-4" />
          </span>
          <ST>Sin permiso</ST>
        </span>
      </div>

      {filtrados.length === 0 ? (
        <AdminListaVacia
          mensaje="No hay permisos con los filtros actuales."
          onLimpiar={hayFiltrosActivos ? limpiar : undefined}
        />
      ) : (
        <div className="overflow-x-auto px-2 pb-4 sm:px-4">
          <table className="min-w-full border-collapse text-left text-[length:var(--text-body)]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className="sticky left-0 z-10 bg-slate-50 px-3 py-3 font-semibold text-slate-500">
                  <ST>Acción</ST>
                </th>
                    {(roles || []).map((rol) => (
                  <th
                    key={rol}
                    className="min-w-[5.5rem] px-2 py-3 text-center font-semibold text-slate-600"
                  >
                    <ST>{rol}</ST>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const meta = p.modulo || moduloDePermiso(p);
                if (!meta) return null;
                const Icon = meta.Icon;
                return (
                  <tr
                    key={p.codigo}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="sticky left-0 z-10 bg-white px-3 py-2.5">
                      <div className="flex min-w-[14rem] items-start gap-3">
                        <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                          <Icon className="size-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900"><ST>{p.nombre}</ST></p>
                          <p className="text-slate-400"><ST>{meta.label}</ST></p>
                        </div>
                      </div>
                    </td>
                    {(roles || []).map((rol) => {
                      const activo = (matrizLocal[p.codigo] || []).includes(rol);
                      return (
                        <td
                          key={`${p.codigo}-${rol}`}
                          className="px-2 py-2 text-center align-middle"
                        >
                          <TogglePermiso
                            activo={activo}
                            onClick={() => onToggle(p.codigo, rol)}
                            label={`${p.nombre} — ${rol}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
