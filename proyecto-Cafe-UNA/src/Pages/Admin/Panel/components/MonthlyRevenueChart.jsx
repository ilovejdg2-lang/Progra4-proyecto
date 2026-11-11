import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
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

const FORMATO_EJE_Y = new Intl.NumberFormat("es-CR", { maximumFractionDigits: 0 });

function formatoEjeY(valor) {
  return `₡${FORMATO_EJE_Y.format(Number(valor) || 0)}`;
}

function TooltipIngresos({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const fila = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[length:var(--text-body)] shadow-md dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        <ST>Día</ST> {label}
      </p>
      <p className="mt-0.5 font-semibold text-[#7a1f2b]">{formatCRC(fila?.total)}</p>
    </div>
  );
}

function anchoBarra(series) {
  const conVenta = (series || []).filter((fila) => Number(fila?.total) > 0).length;
  if (conVenta <= 4) return 44;
  if (conVenta <= 10) return 30;
  if (conVenta <= 18) return 22;
  return 16;
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
  const totalMes = (series || []).reduce((suma, fila) => suma + (Number(fila?.total) || 0), 0);
  const diasConVenta = (series || []).filter((fila) => Number(fila?.total) > 0).length;
  const maxBarSize = anchoBarra(series);

  return (
    <section className="flex min-w-0 flex-col gap-4 overflow-x-clip rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 sm:gap-5 sm:p-5">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-2">
            <BarChart3 className="mt-1 size-4 shrink-0 text-[#7a1f2b]" aria-hidden="true" />
            <h2 className="min-w-0 break-words text-[length:var(--text-subtitle)] font-semibold text-slate-900 dark:text-slate-50">
              <ST>{titulo}</ST>
            </h2>
          </div>
          {subtitulo ? (
            <p className="mt-1 max-w-2xl break-words text-[length:var(--text-body)] text-slate-500 dark:text-slate-400">
              <ST>{subtitulo}</ST>
            </p>
          ) : null}
        </div>
        <div className="w-full min-w-0 shrink-0 lg:w-56">
          <label className="sr-only" htmlFor="dashboard-mes">
            <ST>Mes</ST>
          </label>
          <input
            id="dashboard-mes"
            type="month"
            value={mesValor}
            onChange={(event) => onMesChange(event.target.value)}
            onClick={abrirSelectorMes}
            className="box-border block h-[var(--control-height)] w-full min-w-0 max-w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-[length:var(--text-body)] text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
        </div>
      </div>

      <div
        className="flex min-w-0 flex-wrap items-center gap-2.5"
        role="group"
        aria-label="Filtro por punto de venta"
      >
        {PUNTOS_INGRESOS.map((punto) => (
          <button
            key={punto.id}
            type="button"
            onClick={() => onFiltroChange(punto.id)}
            className={`inline-flex h-[var(--control-height)] items-center justify-center rounded-xl px-4 text-[length:var(--text-body)] font-semibold transition ${
              filtro === punto.id
                ? "bg-[#7a1f2b] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <ST>{punto.label}</ST>
          </button>
        ))}
      </div>

      {!loading && !vacio ? (
        <div className="grid min-w-0 gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-slate-700 dark:bg-slate-950/60">
            <p className="text-[length:var(--text-body)] text-slate-500 dark:text-slate-400">
              <ST>Total del mes</ST>
            </p>
            <p className="mt-1 text-[length:var(--text-subtitle)] font-semibold text-slate-900 dark:text-slate-50">
              {formatCRC(totalMes)}
            </p>
            <p className="mt-0.5 text-[length:var(--text-body)] text-slate-500 dark:text-slate-400">
              {diasConVenta}{" "}
              {diasConVenta === 1 ? <ST>día con ventas</ST> : <ST>días con ventas</ST>}
            </p>
          </div>
          {pico && picoEtiqueta ? (
            <div className="rounded-xl border border-[#7a1f2b]/25 bg-[#7a1f2b]/[0.06] px-3.5 py-3 dark:border-[#7a1f2b]/40 dark:bg-[#7a1f2b]/15">
              <p className="flex items-center gap-1.5 text-[length:var(--text-body)] text-[#7a1f2b]">
                <TrendingUp className="size-4 shrink-0" aria-hidden="true" />
                <ST>Día con más ingresos</ST>
              </p>
              <p className="mt-1 text-[length:var(--text-subtitle)] font-semibold text-[#7a1f2b]">
                {formatCRC(pico.total)}
              </p>
              <p className="mt-0.5 break-words text-[length:var(--text-body)] text-slate-600 dark:text-slate-300">
                {picoEtiqueta}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-3.5 py-3 text-[length:var(--text-body)] text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <ST>Sin pico destacado en este período.</ST>
            </div>
          )}
        </div>
      ) : null}

      <div className="h-64 w-full min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 px-1 py-2 dark:border-slate-800 dark:bg-slate-950/40 sm:h-60 sm:px-2">
        {loading ? (
          <div className="h-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : vacio ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-[length:var(--text-body)] text-slate-500 dark:text-slate-400">
            <ST>No hay ventas registradas para este período.</ST>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
              margin={{ top: 12, right: 8, left: 4, bottom: 4 }}
              barCategoryGap="18%"
            >
              <CartesianGrid vertical={false} stroke="#cbd5e1" strokeDasharray="3 3" />
              <XAxis
                dataKey="dia"
                tickLine={false}
                axisLine={false}
                minTickGap={10}
                interval="equidistantPreserveStart"
                tick={{ fontSize: 12, fill: "#475569" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fontSize: 12, fill: "#475569" }}
                tickFormatter={formatoEjeY}
              />
              <Tooltip content={<TooltipIngresos />} cursor={{ fill: "rgba(122,31,43,0.08)" }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={maxBarSize}>
                {series.map((fila) => (
                  <Cell
                    key={fila.dia}
                    fill={pico && fila.dia === pico.dia ? "#5e1822" : "#7a1f2b"}
                    fillOpacity={fila.total > 0 ? 1 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="text-center text-[length:var(--text-body)] text-slate-500 dark:text-slate-400">
        <ST>Día del mes</ST>
      </p>
    </section>
  );
}
