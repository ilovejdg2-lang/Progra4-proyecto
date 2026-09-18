import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ST } from "../../../../Components/T/ST";

const COLORES = {
  activos: "#7a1f2b",
  inactivos: "#e7d0d3",
};

export function UserStatusChart({ total, activos, inactivos, loading, puedeVerTodos }) {
  const data = [
    { name: "Activos", value: Math.max(0, activos), key: "activos" },
    { name: "Inactivos", value: Math.max(0, inactivos), key: "inactivos" },
  ];
  const pctActivos = total > 0 ? Math.round((activos / total) * 100) : 0;
  const pctInactivos = total > 0 ? 100 - pctActivos : 0;
  const vacio = total <= 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-[#7a1f2b]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            <ST>Estado de usuarios</ST>
          </h2>
        </div>
        {puedeVerTodos ? (
          <Link to="/admin/usuarios" className="text-xs font-semibold text-slate-500 hover:text-[#7a1f2b]">
            <ST>Ver todos</ST>
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
      ) : vacio ? (
        <p className="mt-8 text-center text-sm text-slate-500">
          <ST>No hay usuarios para mostrar.</ST>
        </p>
      ) : (
        <div className="mt-4 flex items-center gap-5">
          <div className="relative h-[148px] w-[148px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={1}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {data.map((item) => (
                    <Cell key={item.key} fill={COLORES[item.key]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-[1.65rem] font-semibold leading-none tabular-nums text-slate-900 dark:text-slate-50">
                {total}
              </p>
              <p className="mt-1 max-w-[4.8rem] text-[10px] leading-tight text-slate-400">
                <ST>Usuarios totales</ST>
              </p>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-3">
            <li className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="size-2.5 rounded-full bg-[#7a1f2b]" />
                <ST>Activos</ST>
              </span>
              <span className="flex items-baseline gap-2 tabular-nums">
                <span className="font-semibold text-slate-900 dark:text-slate-50">{activos}</span>
                <span className="text-xs text-slate-400">{pctActivos}%</span>
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="size-2.5 rounded-full bg-[#e7d0d3]" />
                <ST>Inactivos</ST>
              </span>
              <span className="flex items-baseline gap-2 tabular-nums">
                <span className="font-semibold text-slate-900 dark:text-slate-50">{inactivos}</span>
                <span className="text-xs text-slate-400">{pctInactivos}%</span>
              </span>
            </li>
          </ul>
        </div>
      )}
    </section>
  );
}
