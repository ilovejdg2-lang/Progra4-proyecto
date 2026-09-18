import { Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import { ST } from "../../../../Components/T/ST";
import { moduloActividad, tiempoRelativo, tituloActividad } from "../dashboardUtils";

export function RecentActivity({ registros, loading, puedeVer }) {
  if (!puedeVer) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="size-4 text-[#7a1f2b]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            <ST>Actividad reciente</ST>
          </h2>
        </div>
        <Link to="/admin/auditoria" className="text-xs font-semibold text-slate-500 hover:text-[#7a1f2b]">
          <ST>Ver todas</ST>
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : registros.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          <ST>No hay actividad reciente.</ST>
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {registros.map((item) => (
            <li key={item.id} className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                <ST>{tituloActividad(item)}</ST>
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                <ST>{moduloActividad(item.tabla)}</ST>
                {item.usuario ? ` · ${item.usuario}` : ""}
                {item.fecha ? ` · ${tiempoRelativo(item.fecha)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
