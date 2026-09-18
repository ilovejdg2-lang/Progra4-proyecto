import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { ST } from "../../../../Components/T/ST";
import { formatCRC, PUNTOS_INGRESOS } from "../dashboardUtils";

function abrirSelectorMes(event) {
  const input = event.currentTarget;
  if (typeof input.showPicker !== "function") return;
  try {
    input.showPicker();
  } catch {
    /* el navegador ya abrió el selector o no lo permite */
  }
}

function formatoEjeY(valor) {
  return `₡${new Intl.NumberFormat("es-CR", { maximumFractionDigits: 0 }).format(Number(valor) || 0)}`;
}

function TooltipIngresos({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const fila = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        <ST>Día</ST> {label}
      </p>
      <p className="mt-0.5 text-[#7a1f2b]">{formatCRC(fila?.total)}</p>
    </div>
  );
}

export function MonthlyRevenueChart({
  titulo,
  subtitulo,
  mesValor,
  onMesChange,
  filtro,
  onFiltroChange,
  series,
  pico,
  picoEtiqueta,
  loading,
  vacio,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-[#7a1f2b]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              <ST>{titulo}</ST>
            </h2>
          </div>
          {subtitulo ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              <ST>{subtitulo}</ST>
            </p>
          ) : null}
        </div>
        <label className="sr-only" htmlFor="dashboard-mes">
          <ST>Mes</ST>
        </label>
        <input
          id="dashboard-mes"
          type="month"
          value={mesValor}
          onChange={(event) => onMesChange(event.target.value)}
          onClick={abrirSelectorMes}
          className="h-9 min-w-[12.5rem] cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {PUNTOS_INGRESOS.map((punto) => (
          <button
            key={punto.id}
            type="button"
            onClick={() => onFiltroChange(punto.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              filtro === punto.id
                ? "bg-[#7a1f2b] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <ST>{punto.label}</ST>
          </button>
        ))}
      </div>

      {pico && picoEtiqueta ? (
        <p className="mt-3 inline-flex rounded-lg bg-[#7a1f2b] px-2.5 py-1 text-[11px] font-semibold text-white">
          {picoEtiqueta} · {formatCRC(pico.total)}
        </p>
      ) : null}

      <div className="mt-3 h-56 w-full min-w-0">
        {loading ? (
          <div className="h-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : vacio ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-700">
            <ST>No hay ventas registradas para este período.</ST>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="dia" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={78}
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={formatoEjeY}
              />
              <Tooltip content={<TooltipIngresos />} cursor={{ fill: "rgba(122,31,43,0.06)" }} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={18}>
                {series.map((fila) => (
                  <Cell
                    key={fila.dia}
                    fill={pico && fila.dia === pico.dia ? "#5e1822" : "#7a1f2b"}
                    fillOpacity={fila.total > 0 ? 1 : 0.18}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="mt-1 text-center text-[11px] text-slate-400">
        <ST>Día del mes</ST>
      </p>
    </section>
  );
}
